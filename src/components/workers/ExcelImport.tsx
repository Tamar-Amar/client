import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Backdrop, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import { useFetchClasses } from '../../queries/classQueries';
import { useAddWorkerAfterNoon, useDeleteWorkerAfterNoon, useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon, Class, WeeklySchedule } from '../../types';


interface ExcelRow {
  __EMPTY: string; // סמל מוסד
  __EMPTY_1: string; // קוד מוסד
  __EMPTY_5: string; // סוג חינוך
  __EMPTY_9: string; // חשב שכר
  __EMPTY_11: string; // סוג תפקיד
  __EMPTY_12: string; // שם תפקיד
  __EMPTY_13: string; // תעודת זהות
  __EMPTY_14: string; // שם משפחה
  __EMPTY_15: string; // שם פרטי
  __EMPTY_16: string; // טלפון
  __EMPTY_17: string; // אימייל
  __EMPTY_18: string; // תאריך התחלה
  __EMPTY_19: string; // תאריך סיום
  __EMPTY_20: string; // סטטוס
 
}

interface PreviewWorker extends Omit<WorkerAfterNoon, '_id'> {
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
  const addWorkerMutation = useAddWorkerAfterNoon();
  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();
  const { data: existingWorkers = [] } = useFetchAllWorkersAfterNoon();

  // סטייטים חדשים
  const [invalidWorkers, setInvalidWorkers] = useState<PreviewWorker[]>([]);
  const [duplicateWorkers, setDuplicateWorkers] = useState<PreviewWorker[]>([]);
  const [alreadyInSystemWorkers, setAlreadyInSystemWorkers] = useState<PreviewWorker[]>([]);
  const [validForImportWorkers, setValidForImportWorkers] = useState<PreviewWorker[]>([]);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [importInvalidId, setImportInvalidId] = useState(false);
  const [importInvalidPhone, setImportInvalidPhone] = useState(false);
  const [importMissingPhone, setImportMissingPhone] = useState(false);
  const [invalidByReason, setInvalidByReason] = useState<{
    invalidId: PreviewWorker[];
    invalidPhone: PreviewWorker[];
    missingPhone: PreviewWorker[];
  }>({ invalidId: [], invalidPhone: [], missingPhone: [] });

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
    if (!dateStr || typeof dateStr !== 'string') return '';
    // מסיר רווחים ותווים לא רלוונטיים
    const cleanDateStr = dateStr.trim().replace(/[^0-9./-]/g, '');
    if (!cleanDateStr) return '';

    // תאריכים בפורמט אקסל (מספר סידורי)
    if (!isNaN(Number(cleanDateStr)) && cleanDateStr.length <= 5) {
      // המרה ממספר אקסל לתאריך
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setDate(excelEpoch.getDate() + Number(cleanDateStr));
      return excelEpoch.toISOString();
    }

    // DD/MM/YYYY או DD.MM.YYYY או DD-MM-YYYY
    const parts = cleanDateStr.split(/[./-]/).map(num => num.trim());
    if (parts.length === 3) {
      let [day, month, year] = parts;
      // אם השנה דו-ספרתית, הוסף 20
      if (year.length === 2) year = `20${year}`;
      // אם היום והחודש בסדר הפוך (YYYY-MM-DD)
      if (year.length === 4 && day.length === 4) {
        [year, month, day] = parts;
      }
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // נסה לפרסר תאריך רגיל
    const date = new Date(cleanDateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    return '';
  };


  const convertExcelRowToWorker = (row: any): PreviewWorker => {
    const id = row.__EMPTY_13?.toString() || '';
    if (!validateIsraeliID(id)) {
      throw new Error(`תעודת זהות ${id} אינה תקינה`);
    }
    
    const now = new Date().toISOString();
    const startDate = new Date(parseDate(row.__EMPTY_18));
    const endDate = new Date(parseDate(row.__EMPTY_19));
    
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

    
    return {
      firstName: row.__EMPTY_15 || '',
      lastName: row.__EMPTY_14 || '',
      id: id,
      phone: row.__EMPTY_16?.toString() || '',
      email: row.__EMPTY_17?.toString() || '',
      isActive: true,
      createDate: new Date(now),
      startDate: startDate || new Date(now),
      endDate: endDate || new Date(now),
      updateDate: new Date(now),
      updateBy: 'מערכת',
      status: row.__EMPTY_20 || 'לא נבחר',
      roleType: row.__EMPTY_11 || 'לא נבחר',
      roleName: row.__EMPTY_12 || 'לא נבחר',
      accountantCode: row.__EMPTY_9 || 'לא נבחר',
      project: 'צהרון',
      notes:'לא נבחר',
    };
  };

  // פונקציה לבדיקת תקינות אימייל
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // פונקציה לבדיקת תקינות מספר טלפון
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^0\\d{8,9}$/;
    return phoneRegex.test((phone || '').replace(/[-\\s]/g, ''));
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
    if (worker.roleType && worker.roleType !== 'לא נבחר') score += 1;
    if (worker.roleName && worker.roleName !== 'לא נבחר') score += 1;

    // בדיקת סמלי מוסד
    if (worker.project && worker.project !== 'לא נבחר') score += 2;

    // בדיקת סטטוס וחשב שכר
    if (worker.status && worker.status !== 'לא נבחר') score += 1;
    if (worker.accountantCode && worker.accountantCode !== 'לא נבחר') score += 1;

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
        jsonData.forEach(row => {
          const symbol = row.__EMPTY?.toString().trim();
          if (symbol && !findClassIdBySymbol(symbol)) {
            missingSymbols.add(symbol);
          }
        });
        if (missingSymbols.size > 0) {
          const symbolsList = Array.from(missingSymbols).join('\n');
          const shouldContinue = window.confirm(
            `שים לב: נמצאו סמלי מוסד שלא קיימים במערכת:\n${symbolsList}\n\nהאם ברצונך להמשיך בייבוא העובדים ללא הכיתות החסרות?`
          );
          if (!shouldContinue) {
            setIsUploading(false);
            return;
          }
        }

        // המרת הנתונים לעובדים
        const allWorkers: PreviewWorker[] = jsonData.map(row => {
          try {
            return convertExcelRowToWorker(row);
          } catch (error) {
            return { id: row.__EMPTY_13?.toString() || '', firstName: row.__EMPTY_15 || '', lastName: row.__EMPTY_14 || '', isActive: false } as PreviewWorker;
          }
        });

        // קיימים במערכת
        const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));
        const alreadyInSystem = allWorkers.filter(w => existingIds.has(w.id));

        // לא קיימים במערכת
        const notInSystem = allWorkers.filter(w => !existingIds.has(w.id));

        // כפולים בקובץ (רק מתוך notInSystem)
        const idCount: Record<string, number> = {};
        notInSystem.forEach(w => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
        const dups = notInSystem.filter(w => idCount[w.id] > 1);

        // לא כפולים (רק מתוך notInSystem)
        const notDuplicate = notInSystem.filter(w => idCount[w.id] === 1);

        // לא תקינים (רק מתוך notDuplicate)
        const invalidId = notDuplicate.filter(w => !validateIsraeliID(w.id));
        const invalidPhone = notDuplicate.filter(w => w.phone && !isValidPhone(w.phone));
        const missingPhone = notDuplicate.filter(w => !w.phone);
        const invalids = Array.from(new Set([...invalidId, ...invalidPhone, ...missingPhone]));
        setInvalidWorkers(invalids);
        setInvalidByReason({ invalidId, invalidPhone, missingPhone });

        setShowSummaryDialog(true);
        setPreviewData(validForImportWorkers); 
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

  const formatDate = (dateInput?: string | Date): string => {
    if (!dateInput) return '';
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('he-IL');
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      // ייבוא עובדים תקינים + לא תקינים לפי בחירת המשתמש
      let toImport = [...validForImportWorkers];
      if (importInvalidId) toImport = toImport.concat(invalidByReason.invalidId);
      if (importInvalidPhone) toImport = toImport.concat(invalidByReason.invalidPhone);
      if (importMissingPhone) toImport = toImport.concat(invalidByReason.missingPhone);
      // הסר כפילויות
      const seen = new Set();
      toImport = toImport.filter(w => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
      for (const worker of toImport) {
        await addWorkerMutation.mutateAsync(worker);
      }
      alert('הייבוא הושלם בהצלחה!');
      setPreviewData([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error importing workers:', error);
      alert('שגיאה בייבוא העובדים');
    } finally {
      setIsImporting(false);
    }
  };

  // פונקציה חדשה לחישוב סך העובדים לייבוא
  const calculateTotalWorkersToImport = () => {
    let total = validForImportWorkers.length;
    if (importInvalidId) total += invalidByReason.invalidId.length;
    if (importInvalidPhone) total += invalidByReason.invalidPhone.length;
    if (importMissingPhone) total += invalidByReason.missingPhone.length;
    return total;
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
                  <TableCell>פרויקט</TableCell>
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
                    <TableCell>{worker.roleType}</TableCell>
                    <TableCell>{worker.roleName}</TableCell>
                    <TableCell>{worker.status}</TableCell>
                    <TableCell>{worker.accountantCode}</TableCell>
                    <TableCell>{worker.project}</TableCell>
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

      {/* דיאלוג סיכום */}
      <Dialog open={showSummaryDialog} onClose={() => setShowSummaryDialog(false)}>
        <DialogTitle>סיכום נתוני קובץ</DialogTitle>
        <DialogContent>
          <Typography>סה"כ עובדים בקובץ: {invalidWorkers.length + duplicateWorkers.length + alreadyInSystemWorkers.length + validForImportWorkers.length}</Typography>
          <Typography color="error">סה"כ עובדים לא תקינים: {invalidWorkers.length}</Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={importInvalidId} onChange={e => setImportInvalidId(e.target.checked)} />}
              label={`ת"ז לא תקינה: ${invalidByReason.invalidId.length}`}
            />
            <FormControlLabel
              control={<Checkbox checked={importInvalidPhone} onChange={e => setImportInvalidPhone(e.target.checked)} />}
              label={`טלפון לא תקין: ${invalidByReason.invalidPhone.length}`}
            />
            <FormControlLabel
              control={<Checkbox checked={importMissingPhone} onChange={e => setImportMissingPhone(e.target.checked)} />}
              label={`טלפון חסר: ${invalidByReason.missingPhone.length}`}
            />
          </FormGroup>
          <Typography color="warning.main">סה"כ עובדים כפולים בקובץ: {duplicateWorkers.length}</Typography>
          <Typography color="info.main">סה"כ עובדים שכבר קיימים במערכת: {alreadyInSystemWorkers.length}</Typography>
          <Typography color="success.main">סה"כ עובדים לייבוא: {calculateTotalWorkersToImport()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummaryDialog(false)} color="secondary">ביטול</Button>
          <Button 
            onClick={() => {
              setShowSummaryDialog(false);
              handleImport();
            }} 
            color="primary" 
            autoFocus
          >
            אישור וייבוא
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExcelImport; 