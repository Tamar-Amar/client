import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { useAddWorker } from '../../queries/workerQueries';
import { useFetchClasses } from '../../queries/classQueries';
import { Worker, Class, WeeklySchedule } from '../../types';

interface ExcelRow {
  __EMPTY_1: string; // סמל מוסד
  __EMPTY_5: string; // סוג חינוך
  __EMPTY_11: string; // סוג תפקיד
  __EMPTY_12: string; // שם תפקיד
  __EMPTY_13: string; // תעודת זהות
  __EMPTY_14: string; // שם משפחה
  __EMPTY_15: string; // שם פרטי
  __EMPTY_16: string; // טלפון
  __EMPTY_17: string; // אימייל
  __EMPTY_18: string; // תאריך התחלה
  __EMPTY_19: string; // תאריך סיום
  __EMPTY_8: string; // סטטוס
  __EMPTY_9: string; // חשב שכר
}

interface PreviewWorker extends Omit<Worker, '_id'> {
  _id?: string;
  isDuplicate?: boolean;
}

const ExcelImport: React.FC = () => {
  const [previewData, setPreviewData] = useState<PreviewWorker[]>([]);
  const [symbolErrors, setSymbolErrors] = useState<{ [key: string]: string }>({});
  const addWorkerMutation = useAddWorker();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();

  const findClassIdBySymbol = (symbol: string): string | null => {
    if (isLoadingClasses) return null;
    const classFound = classes.find((c: Class) => c.uniqueSymbol === symbol);
    return classFound?._id || null;
  };

  const validateIsraeliID = (id: string): boolean => {
    // מסיר תווים לא חוקיים
    id = id.trim();
    if (id.length > 9) return false;
    // משלים ל-9 ספרות עם אפסים מובילים
    id = id.padStart(9, '0');
    
    // בדיקת ספרת ביקורת
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = Number(id.charAt(i));
      if (i % 2 === 0) {
        digit *= 1;
      } else {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + Math.floor(digit / 10);
        }
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      // מנסה לפרסר תאריך בפורמט DD/MM/YY
      const [day, month, year] = dateStr.split('/').map(num => num.trim());
      // מוסיף 20 לשנה אם היא דו ספרתית
      const fullYear = year.length === 2 ? `20${year}` : year;
      const date = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toISOString();
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return '';
    }
  };

  const getJobType = (jobTypeStr: string): Worker['jobType'] => {
    const jobTypes = {
      'מוביל': 'מוביל',
      'מוביל משלים': 'מוביל משלים',
      'סייע': 'סייע',
      'סייע משלים': 'סייע משלים'
    } as const;

    return jobTypes[jobTypeStr as keyof typeof jobTypes] || 'לא נבחר';
  };

  const convertExcelRowToWorker = (row: any): PreviewWorker => {
    const id = row.__EMPTY_13?.toString() || '';
    if (!validateIsraeliID(id)) {
      throw new Error(`תעודת זהות ${id} אינה תקינה`);
    }
    
    const now = new Date().toISOString();
    const startDate = parseDate(row.__EMPTY_18);
    const endDate = parseDate(row.__EMPTY_19);
    const defaultDate = new Date('2000-01-01').toISOString();

    // בדיקת סמל מוסד
    const symbol = row.__EMPTY_1?.toString();
    let workingSymbols: string[] = [];
    
    if (symbol) {
      const classId = findClassIdBySymbol(symbol);
      if (classId) {
        workingSymbols = [classId];
      } else {
        throw new Error(`לא נמצאה כיתה עם סמל מוסד ${symbol}`);
      }
    }

    const defaultWeeklySchedule: WeeklySchedule[] = [
      { day: 'ראשון', classes: [] },
      { day: 'שני', classes: [] },
      { day: 'שלישי', classes: [] },
      { day: 'רביעי', classes: [] },
      { day: 'חמישי', classes: [] }
    ];
    
    return {
      firstName: row.__EMPTY_15 || '',
      lastName: row.__EMPTY_14 || '',
      id: id,
      phone: row.__EMPTY_16?.toString() || '',
      email: row.__EMPTY_17?.toString() || '',
      city: 'לא נבחר',
      street: 'לא נבחר',
      buildingNumber: 'לא נבחר',
      apartmentNumber: 'לא נבחר',
      paymentMethod: 'תלוש',
      isActive: true,
      registrationDate: now,
      startDate: startDate || now,
      endDate: endDate || '',
      lastUpdateDate: now,
      workingSymbols,
      documents: [],
      tags: [],
      status: row.__EMPTY_8 || 'לא נבחר',
      accountant: row.__EMPTY_9 || 'לא נבחר',
      jobType: getJobType(row.__EMPTY_11),
      jobTitle: row.__EMPTY_12 || 'לא נבחר',
      birthDate: defaultDate,
      bankDetails: {
        bankName: 'לא נבחר',
        branchNumber: 'לא נבחר',
        accountNumber: 'לא נבחר',
        accountOwner: 'לא נבחר'
      },
      weeklySchedule: defaultWeeklySchedule
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];
        
        console.log('Excel Data:', jsonData);
        
        // מיפוי תעודות זהות וסמלי מוסד לזיהוי כפילויות ושגיאות
        const idCounts = new Map<string, number>();
        const newSymbolErrors: { [key: string]: string } = {};
        
        const workers = jsonData
          .map(row => {
            try {
              const worker = convertExcelRowToWorker(row);
              idCounts.set(worker.id, (idCounts.get(worker.id) || 0) + 1);
              return worker;
            } catch (error) {
              if (error instanceof Error && error.message.includes('סמל מוסד')) {
                const symbol = row.__EMPTY_1?.toString();
                if (symbol) {
                  newSymbolErrors[symbol] = error.message;
                }
              }
              console.error('Error converting row:', row, error);
              return null;
            }
          })
          .filter((worker): worker is PreviewWorker => worker !== null);
        
        setSymbolErrors(newSymbolErrors);
        
        const workersWithDuplicates = workers.map(worker => ({
          ...worker,
          isDuplicate: (idCounts.get(worker.id) || 0) > 1
        }));
        
        setPreviewData(workersWithDuplicates);

        // הצגת שגיאות סמלי מוסד
        if (Object.keys(newSymbolErrors).length > 0) {
          const errorMessages = Object.entries(newSymbolErrors)
            .map(([symbol, error]) => error)
            .join('\n');
          alert(`נמצאו שגיאות בסמלי מוסד:\n${errorMessages}`);
        }
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveWorker = (index: number) => {
    setPreviewData(prev => {
      const newData = prev.filter((_, i) => i !== index);
      // עדכון סטטוס הכפילות לאחר הסרת שורה
      const idCounts = new Map<string, number>();
      newData.forEach(worker => {
        idCounts.set(worker.id, (idCounts.get(worker.id) || 0) + 1);
      });
      return newData.map(worker => ({
        ...worker,
        isDuplicate: (idCounts.get(worker.id) || 0) > 1
      }));
    });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL');
    } catch (error) {
      return '';
    }
  };

  const handleImport = async () => {
    try {
      // מסנן החוצה שורות כפולות לפני הייבוא
      const uniqueWorkers = previewData.filter(worker => !worker.isDuplicate);
      for (const worker of uniqueWorkers) {
        const { isDuplicate, ...workerData } = worker;
        await addWorkerMutation.mutateAsync(workerData);
      }
      setPreviewData([]);
      alert('הייבוא הושלם בהצלחה');
    } catch (error) {
      console.error('Error importing workers:', error);
      alert('שגיאה בייבוא העובדים');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          component="label"
          sx={{
            color: '#2e7d32',
            borderColor: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              color: '#1b5e20',
              backgroundColor: 'transparent'
            },
          }}
        >
          בחר קובץ אקסל
          <input
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
        </Button>
      </Box>

      {previewData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            נמצאו {previewData.length} עובדים. האם להמשיך בייבוא?
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>פעולות</TableCell>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>שם פרטי</TableCell>
                  <TableCell>שם משפחה</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>אימייל</TableCell>
                  <TableCell>תאריך התחלה</TableCell>
                  <TableCell>תאריך סיום</TableCell>
                  <TableCell>סוג תפקיד</TableCell>
                  <TableCell>שם תפקיד</TableCell>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>חשב שכר</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((worker, index) => (
                  <TableRow 
                    key={index}
                    sx={worker.isDuplicate ? {
                      backgroundColor: '#ffebee',
                      '&:hover': {
                        backgroundColor: '#ffcdd2'
                      }
                    } : {}}
                  >
                    <TableCell>
                      {worker.isDuplicate && (
                        <IconButton 
                          onClick={() => handleRemoveWorker(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{worker.id}</TableCell>
                    <TableCell>{worker.firstName}</TableCell>
                    <TableCell>{worker.lastName}</TableCell>
                    <TableCell>{worker.phone}</TableCell>
                    <TableCell>{worker.email}</TableCell>
                    <TableCell>{formatDate(worker.startDate)}</TableCell>
                    <TableCell>{formatDate(worker.endDate)}</TableCell>
                    <TableCell>{worker.jobType}</TableCell>
                    <TableCell>{worker.jobTitle}</TableCell>
                    <TableCell>{worker.status}</TableCell>
                    <TableCell>{worker.accountant}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            onClick={handleImport}
            color="primary"
          >
            ייבא עובדים
          </Button>
        </>
      )}
      {Object.keys(symbolErrors).length > 0 && (
        <Typography color="error" sx={{ mt: 2, mb: 2 }}>
          שים לב: ישנם סמלי מוסד שלא נמצאו במערכת. אנא בדוק את הנתונים.
        </Typography>
      )}
    </Box>
  );
};

export default ExcelImport; 