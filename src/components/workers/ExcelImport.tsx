import React, { useState } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Backdrop, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import { useFetchClasses, updateClassWithWorker } from '../../queries/classQueries';
import { useAddWorkerAfterNoon, useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon, Class } from '../../types';
import { normalizePhone, isValidPhone, formatDate, validateIsraeliID, parseDate } from './excelImportUtils';


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
  workingSymbol?: string;
}

interface ExcelImportProps {
  onSuccess?: () => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess }) => {
  const [previewData, setPreviewData] = useState<PreviewWorker[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const addWorkerMutation = useAddWorkerAfterNoon();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();
  const { data: existingWorkers = [] } = useFetchAllWorkersAfterNoon();

  const [invalidWorkers, setInvalidWorkers] = useState<PreviewWorker[]>([]);
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
  const [allWorkers, setAllWorkers] = useState<PreviewWorker[]>([]);

  const findClassIdBySymbol = (symbol: string): string | null => {
    if (isLoadingClasses) return null;
    
    const trimmedSymbol = symbol.trim();
    
    const exactMatch = classes.find((c: Class) => c.uniqueSymbol === trimmedSymbol);
    if (exactMatch) return exactMatch._id;
    

    if (trimmedSymbol.includes('-')) {
      const baseSymbol = trimmedSymbol.split('-')[0].trim();
      const baseMatch = classes.find((c: Class) => c.uniqueSymbol === baseSymbol);
      if (baseMatch) return baseMatch._id;
    }
    
    return null;
  };


  const convertExcelRowToWorker = (row: any): PreviewWorker => {
    const id = row.__EMPTY_13?.toString() || '';
    if (!validateIsraeliID(id)) {
      throw new Error(`תעודת זהות ${id} אינה תקינה`);
    }
    
    const now = new Date().toISOString();
    const startDate = new Date(parseDate(row.__EMPTY_18));
    const endDate = new Date(parseDate(row.__EMPTY_19));
    
    const symbol = row.__EMPTY?.toString().trim();


    
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
      workingSymbol: symbol || ''  
    };
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

        const workers: PreviewWorker[] = jsonData.map(row => {
          try {
            return convertExcelRowToWorker(row);
          } catch (error) {
            return { id: row.__EMPTY_13?.toString() || '', firstName: row.__EMPTY_15 || '', lastName: row.__EMPTY_14 || '', isActive: false } as PreviewWorker;
          }
        });

        setAllWorkers(workers);

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

        const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));

        const notInSystem = workers.filter(w => !existingIds.has(w.id));

        const idCount: Record<string, number> = {};
        notInSystem.forEach(w => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
        const dups = notInSystem.filter(w => idCount[w.id] > 1);

        const notDuplicate = notInSystem.filter(w => idCount[w.id] === 1);

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

  const handleImport = async () => {
    try {
      setIsImporting(true);

      const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));
      const idCount: Record<string, number> = {};
      allWorkers.forEach((w: PreviewWorker) => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
      const validNewWorkers = allWorkers.filter((w: PreviewWorker) =>
        !existingIds.has(w.id) &&
        idCount[w.id] === 1 &&
        validateIsraeliID(w.id) &&
        (!w.phone || isValidPhone(w.phone))
      );

      let toImport = [...validNewWorkers];
      if (importInvalidId) toImport = toImport.concat(invalidByReason.invalidId);
      if (importInvalidPhone) toImport = toImport.concat(invalidByReason.invalidPhone);
      if (importMissingPhone) toImport = toImport.concat(invalidByReason.missingPhone);

      const seen = new Set();
      toImport = toImport.filter(w => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
      for (const worker of toImport) {
        const normalizedWorker = { ...worker, phone: normalizePhone(worker.phone) };
        const savedWorker = await addWorkerMutation.mutateAsync(normalizedWorker);
        const classSymbol = worker.workingSymbol;
        const classObj = classes.find((c: Class) => c.uniqueSymbol === classSymbol);
        if (classObj) {
          if (!classObj.workerAfterNoonId1) {
            await updateClassWithWorker(classObj._id, { workerAfterNoonId1: savedWorker._id });
          } else if (!classObj.workerAfterNoonId2) {
            await updateClassWithWorker(classObj._id, { workerAfterNoonId2: savedWorker._id });
          }
        }
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

  const calculateTotalWorkersToImport = () => {
    const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));
    const notInSystem = allWorkers.filter((w: PreviewWorker) => !existingIds.has(w.id));
    const idCount: Record<string, number> = {};
    notInSystem.forEach((w: PreviewWorker) => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
    const validNewWorkers = notInSystem.filter((w: PreviewWorker) => 
      idCount[w.id] === 1 && 
      validateIsraeliID(w.id) && 
      (!w.phone || isValidPhone(w.phone))
    ).length;

    let invalidToImport = 0;
    if (importInvalidId) invalidToImport += invalidByReason.invalidId.length;
    if (importInvalidPhone) invalidToImport += invalidByReason.invalidPhone.length;
    if (importMissingPhone) invalidToImport += invalidByReason.missingPhone.length;

    return validNewWorkers + invalidToImport;
  };

  const calculateTotalInvalidWorkers = () => {
    return invalidByReason.invalidId.length + 
           invalidByReason.invalidPhone.length + 
           invalidByReason.missingPhone.length;
  };


  const calculateTotalDuplicateWorkers = () => {
    const idCount: Record<string, number> = {};
    allWorkers.forEach((w: PreviewWorker) => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
    return Object.values(idCount).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
  };


  const calculateTotalNewWorkers = () => {
    const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));
    const notInSystem = allWorkers.filter((w: PreviewWorker) => !existingIds.has(w.id));
    const idCount: Record<string, number> = {};
    notInSystem.forEach((w: PreviewWorker) => { idCount[w.id] = (idCount[w.id] || 0) + 1; });
    return notInSystem.filter((w: PreviewWorker) => idCount[w.id] === 1).length;
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


      <Dialog open={showSummaryDialog} onClose={() => setShowSummaryDialog(false)}>
        <DialogTitle>סיכום נתוני קובץ</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              סטטיסטיקות ייבוא
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="סך הכל עובדים בקובץ" 
                  secondary={allWorkers.length}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="סך הכל כפולים בקובץ" 
                  secondary={calculateTotalDuplicateWorkers()}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="סך הכל עובדים קיימים במערכת" 
                  secondary={existingWorkers.length}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="סך הכל עובדים חדשים בקובץ" 
                  secondary={calculateTotalNewWorkers()}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="סך הכל לא תקינים" 
                  secondary={calculateTotalInvalidWorkers()}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="סך הכל עובדים תקינים לייבוא" 
                  secondary={calculateTotalWorkersToImport()}
                />
              </ListItem>
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              עובדים לא תקינים
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={importInvalidId}
                    onChange={(e) => setImportInvalidId(e.target.checked)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="תעודת זהות לא תקינה" 
                  secondary={`${invalidByReason.invalidId.length} עובדים`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={importInvalidPhone}
                    onChange={(e) => setImportInvalidPhone(e.target.checked)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="טלפון לא תקין" 
                  secondary={`${invalidByReason.invalidPhone.length} עובדים`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={importMissingPhone}
                    onChange={(e) => setImportMissingPhone(e.target.checked)}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="טלפון חסר" 
                  secondary={`${invalidByReason.missingPhone.length} עובדים`}
                />
              </ListItem>
            </List>
          </Box>
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