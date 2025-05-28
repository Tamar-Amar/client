import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Backdrop, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import * as XLSX from 'xlsx';
import { useAddWorker, useDeleteWorker } from '../../queries/workerQueries';
import { useFetchClasses } from '../../queries/classQueries';
import { useFetchWorkers } from '../../queries/workerQueries';
import { Worker, Class, WeeklySchedule } from '../../types';

interface ExcelRow {
  __EMPTY: string; // סמל מוסד
  __EMPTY_1: string; // קוד מוסד
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

interface ExcelImportProps {
  onSuccess?: () => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess }) => {
  const [previewData, setPreviewData] = useState<PreviewWorker[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [symbolErrors, setSymbolErrors] = useState<{ [key: string]: string }>({});
  const addWorkerMutation = useAddWorker();
  const deleteWorkerMutation = useDeleteWorker();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();
  const { data: existingWorkers = [] } = useFetchWorkers();

  const findClassIdBySymbol = (symbol: string): string | null => {
    if (isLoadingClasses) return null;
    
    // נקה רווחים מהסמל
    const trimmedSymbol = symbol.trim();
    
    // נסה למצוא התאמה מדויקת
    const exactMatch = classes.find((c: Class) => c.uniqueSymbol === trimmedSymbol);
    if (exactMatch) return exactMatch._id;
    
    // אם יש מקף, נסה למצוא התאמה לפי החלק הראשון של הסמל
    if (trimmedSymbol.includes('-')) {
      const baseSymbol = trimmedSymbol.split('-')[0].trim();
      const baseMatch = classes.find((c: Class) => c.uniqueSymbol === baseSymbol);
      if (baseMatch) return baseMatch._id;
    }
    
    return null;
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
    if (!dateStr || typeof dateStr !== 'string' || dateStr === '??' || dateStr === '45565') return '';
    try {
      // מנקה רווחים ותווים מיוחדים
      const cleanDateStr = dateStr.trim().replace(/[^0-9./]/g, '');
      if (!cleanDateStr) return '';
      
      // מנסה לפרסר תאריך בפורמט DD.MM.YY או DD/MM/YY
      const parts = cleanDateStr.split(/[./]/).map(num => num.trim());
      if (parts.length !== 3) {
        throw new Error('Invalid date format');
      }
      const [day, month, year] = parts;
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
    
    // בדיקת סמל מוסד - משתמש בסמל המלא מ-__EMPTY
    const symbol = row.__EMPTY?.toString().trim();
    let workingSymbols: string[] = [];
    
    if (symbol) {
      const classId = findClassIdBySymbol(symbol);
      if (classId) {
        workingSymbols = [classId];
      }
      // אם לא נמצא סמל, נמשיך בלעדיו
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
      birthDate: new Date('2000-01-01').toISOString(),
      bankDetails: {
        bankName: 'לא נבחר',
        branchNumber: 'לא נבחר',
        accountNumber: 'לא נבחר',
        accountOwner: 'לא נבחר'
      },
      weeklySchedule: defaultWeeklySchedule
    };
  };

  // פונקציה לבדיקת תקינות אימייל
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // פונקציה לבדיקת תקינות מספר טלפון
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^0\d{8,9}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
  };

  // פונקציה לחישוב ציון איכות לשורת נתונים
  const calculateRowQualityScore = (worker: PreviewWorker): number => {
    let score = 0;

    // בדיקת שדות בסיסיים
    if (worker.firstName?.trim()) score += 1;
    if (worker.lastName?.trim()) score += 1;
    if (worker.id?.trim()) score += 1;

    // בדיקת אימייל תקין
    if (worker.email && isValidEmail(worker.email)) score += 2;
    
    // בדיקת טלפון תקין
    if (worker.phone && isValidPhone(worker.phone)) score += 2;

    // בדיקת תאריכים
    if (worker.startDate) score += 2;
    if (worker.endDate) score += 1;

    // בדיקת פרטי תפקיד
    if (worker.jobType && worker.jobType !== 'לא נבחר') score += 1;
    if (worker.jobTitle && worker.jobTitle !== 'לא נבחר') score += 1;

    // בדיקת סמלי מוסד
    if (worker.workingSymbols && worker.workingSymbols.length > 0) score += 2;

    // בדיקת סטטוס וחשב שכר
    if (worker.status && worker.status !== 'לא נבחר') score += 1;
    if (worker.accountant && worker.accountant !== 'לא נבחר') score += 1;

    return score;
  };

  // פונקציה לטיפול בכפילויות
  const handleDuplicates = (workers: PreviewWorker[]): PreviewWorker[] => {
    const workersByID = new Map<string, PreviewWorker[]>();
    
    // קיבוץ עובדים לפי תעודת זהות
    workers.forEach(worker => {
      if (!workersByID.has(worker.id)) {
        workersByID.set(worker.id, []);
      }
      workersByID.get(worker.id)?.push(worker);
    });

    // בחירת השורה הטובה ביותר עבור כל תעודת זהות
    const uniqueWorkers: PreviewWorker[] = [];
    workersByID.forEach((duplicates, id) => {
      if (duplicates.length === 1) {
        uniqueWorkers.push(duplicates[0]);
      } else {
        // מיון הכפילויות לפי ציון האיכות
        const sortedDuplicates = duplicates.sort(
          (a, b) => calculateRowQualityScore(b) - calculateRowQualityScore(a)
        );
        // בחירת השורה עם הציון הגבוה ביותר
        uniqueWorkers.push(sortedDuplicates[0]);
      }
    });

    return uniqueWorkers;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];
        
        // מיפוי סמלי מוסד חסרים
        const missingSymbols = new Set<string>();
        
        // בדיקת סמלים חסרים
        jsonData.forEach(row => {
          const symbol = row.__EMPTY?.toString().trim();
          if (symbol && !findClassIdBySymbol(symbol)) {
            missingSymbols.add(symbol);
          }
        });

        // הצגת אזהרה על סמלים חסרים
        if (missingSymbols.size > 0) {
          const symbolsList = Array.from(missingSymbols).join('\n');
          console.log('Available symbols in system:', classes.map((c: Class) => c.uniqueSymbol));
          console.log('Missing symbols from Excel:', Array.from(missingSymbols));
          const shouldContinue = window.confirm(
            `שים לב: נמצאו סמלי מוסד שלא קיימים במערכת:\n${symbolsList}\n\nהאם ברצונך להמשיך בייבוא העובדים ללא הכיתות החסרות?`
          );
          if (!shouldContinue) {
            return;
          }
        }
        
        // המרת הנתונים לעובדים
        const workers = jsonData
          .map(row => {
            try {
              return convertExcelRowToWorker(row);
            } catch (error) {
              console.error('Error converting row:', row, error);
              return null;
            }
          })
          .filter((worker): worker is PreviewWorker => worker !== null);

        // טיפול בכפילויות וקבלת רשימה נקייה
        const uniqueWorkers = handleDuplicates(workers);
        
        setPreviewData(uniqueWorkers);

        // הצגת סיכום למשתמש
        if (workers.length > uniqueWorkers.length) {
          alert(`נמצאו ${workers.length - uniqueWorkers.length} כפילויות של עובדים.\nהמערכת בחרה אוטומטית את השורות עם הנתונים המלאים ביותר.`);
        }
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
      } finally {
        setIsUploading(false);
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
      setIsImporting(true);
      // בדיקת עובדים קיימים
      const existingIds = new Set(existingWorkers.map(w => w.id));
      const duplicateWorkers = previewData.filter(worker => existingIds.has(worker.id));

      if (duplicateWorkers.length > 0) {
        const duplicatesList = duplicateWorkers
          .map(w => `${w.firstName} ${w.lastName} (${w.id})`)
          .join('\n');

        const shouldContinue = window.confirm(
          `שים לב: נמצאו ${duplicateWorkers.length} עובדים שכבר קיימים במערכת:\n` +
          `${duplicatesList}\n\n` +
          `האם ברצונך להמשיך בייבוא שאר העובדים?`
        );

        if (!shouldContinue) {
          setIsImporting(false);
          return;
        }

        // ייבוא רק של עובדים שלא קיימים במערכת
        const uniqueWorkers = previewData.filter(worker => !existingIds.has(worker.id));
        for (const worker of uniqueWorkers) {
          await addWorkerMutation.mutateAsync(worker);
        }

        alert(
          `הייבוא הושלם בהצלחה!\n` +
          `יובאו ${uniqueWorkers.length} עובדים חדשים.\n` +
          `${duplicateWorkers.length} עובדים לא יובאו כי הם כבר קיימים במערכת.`
        );
      } else {
        // אם אין כפילויות, מייבא את כל העובדים
        for (const worker of previewData) {
          await addWorkerMutation.mutateAsync(worker);
        }
        alert('הייבוא הושלם בהצלחה!');
      }

      setPreviewData([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error importing workers:', error);
      alert('שגיאה בייבוא העובדים');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isUploading || isImporting || isLoadingClasses}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography>
            {isUploading ? 'מעבד קובץ...' : 
             isImporting ? 'מייבא עובדים...' : 
             isLoadingClasses ? 'טוען נתונים...' : ''}
          </Typography>
        </Box>
      </Backdrop>

      <Box sx={{ mb: 2 }}>
        <Tooltip title="העלה קובץ אקסל עם רשימת העובדים. הקובץ צריך להכיל את הפרטים הבאים: תעודת זהות, שם פרטי, שם משפחה, טלפון, אימייל, סמל מוסד">
          <Button
            variant="contained"
            component="label"
            disabled={isUploading || isImporting}
            startIcon={<UploadFileIcon />}
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
            {isUploading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <span>מעבד קובץ...</span>
              </Box>
            ) : (
              'בחר קובץ אקסל'
            )}
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading || isImporting}
            />
          </Button>
        </Tooltip>
      </Box>

      {previewData.length > 0 ? (
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
            disabled={isImporting}
            color="primary"
          >
            {isImporting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>מייבא עובדים...</span>
              </Box>
            ) : (
              'ייבא עובדים'
            )}
          </Button>
        </>
      ) : null}
    </Box>
  );
};

export default ExcelImport; 