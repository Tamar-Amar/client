import React, { useState } from 'react';
import { Button, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Backdrop, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import { useFetchClasses, updateClassWithWorker } from '../../queries/classQueries';
import { useAddWorkerAfterNoon, useFetchAllWorkersAfterNoon, useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon, Class } from '../../types';
import { normalizePhone, isValidPhone, formatDate, validateIsraeliID, parseDate } from './excelImportUtils';


interface ExcelRow {
  __EMPTY: string; // סמל מוסד
  __EMPTY_1: string; // חשב שכר
  __EMPTY_2: string; // מודל
  __EMPTY_3: string; // סוג תפקיד
  __EMPTY_4: string; // שם תפקיד
  __EMPTY_5: string; // תעודת זהות
  __EMPTY_6: string; // שם משפחה
  __EMPTY_7: string; // שם פרטי
  __EMPTY_8: string; // טלפון
  __EMPTY_9: string; // אימייל
  __EMPTY_10: string; // תאריך התחלה
  __EMPTY_11: string; // תאריך סיום
  __EMPTY_12: string; // סטטוס
  __EMPTY_13: string; // טופס 101
}

interface PreviewWorker extends Omit<WorkerAfterNoon, '_id'> {
  _id?: string;
  isDuplicate?: boolean;
  workingSymbol?: string;
  projectCodes?: number[];
}

interface ExcelImportProps {
  onSuccess?: () => void;
}

// רשימת הפרויקטים
const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
  { label: 'צהרון שוטף 2026', value: 5 },
  { label: 'קייטנת חנוכה 2026', value: 6 },
  { label: 'קייטנת פסח 2026', value: 7 },
  { label: 'קייטנת קיץ 2026', value: 8 },
];

interface ProjectSelection {
  selectedProjects: number[];
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess }) => {
  const [previewData, setPreviewData] = useState<PreviewWorker[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const addWorkerMutation = useAddWorkerAfterNoon();
  const updateWorkerMutation = useUpdateWorkerAfterNoon();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();
  const { data: existingWorkers = [] } = useFetchAllWorkersAfterNoon();
  const queryClient = useQueryClient();

  const [invalidWorkers, setInvalidWorkers] = useState<PreviewWorker[]>([]);
  const [validForImportWorkers, setValidForImportWorkers] = useState<PreviewWorker[]>([]);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showProjectSelectionDialog, setShowProjectSelectionDialog] = useState(false);
  const [importInvalidId, setImportInvalidId] = useState(false);
  const [importInvalidPhone, setImportInvalidPhone] = useState(false);
  const [importMissingPhone, setImportMissingPhone] = useState(false);
  const [invalidByReason, setInvalidByReason] = useState<{
    invalidId: PreviewWorker[];
    invalidPhone: PreviewWorker[];
    missingPhone: PreviewWorker[];
  }>({ invalidId: [], invalidPhone: [], missingPhone: [] });
  const [allWorkers, setAllWorkers] = useState<PreviewWorker[]>([]);
  const [missingSymbols, setMissingSymbols] = useState<string[]>([]);
  const [projectSelection, setProjectSelection] = useState<ProjectSelection>({
    selectedProjects: []
  });

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
    let id = row[5]?.toString()?.trim() || '';
    if (id.includes('E') || id.includes('e')) {
      const originalValue = row[5];
      id = Number(originalValue).toString();
    }
    
    const firstName = row[7]?.toString()?.trim() || '';
    const lastName = row[6]?.toString()?.trim() || '';
    
    if (!id || !firstName || !lastName) {
      throw new Error(`נתונים חסרים: תעודת זהות: ${id}, שם פרטי: ${firstName}, שם משפחה: ${lastName}`);
    }
    
    if (!validateIsraeliID(id)) {
      throw new Error(`תעודת זהות ${id} אינה תקינה`);
    }
    
    const now = new Date().toISOString();
    const startDate = new Date(parseDate(row[10]));
    const endDate = new Date(parseDate(row[11]));
    
    const symbol = row[0]?.toString().trim();
    const is101 = row[13]?.toString()?.trim() ? true : false;

    return {
      firstName: firstName,
      lastName: lastName,
      id: id,
      phone: row[8]?.toString() || '',
      email: row[9]?.toString() || '',
      isActive: true,
      createDate: new Date(now),
      startDate: startDate || new Date(now),
      endDate: endDate || new Date(now),
      updateDate: new Date(now),
      updateBy: 'מערכת',
      status: row[12] || 'לא נבחר',
      roleType: row[3] || 'לא נבחר',
      roleName: row[4] || 'לא נבחר',
      accountantCode: row[1] || 'לא נבחר',
      notes:'לא נבחר',     
      workingSymbol: symbol || '',
      is101: is101,
      projectCodes: [],
      isAfterNoon: false,
      isBaseWorker: false,
      isHanukaCamp: false,
      isPassoverCamp: false,
      isSummerCamp: false
    };
  };

  const handleProjectSelectionChange = (projectValue: number) => {
    setProjectSelection(prev => {
      const newSelection = { ...prev };
      if (newSelection.selectedProjects.includes(projectValue)) {
        newSelection.selectedProjects = newSelection.selectedProjects.filter(p => p !== projectValue);
      } else {
        newSelection.selectedProjects = [...newSelection.selectedProjects, projectValue];
      }
      return newSelection;
    });
  };

  const getProjectDisplayName = (selection: ProjectSelection): string => {
    if (selection.selectedProjects.length === 0) return 'לא נבחר';
    
    const projectNames = selection.selectedProjects.map(projectValue => {
      const project = projectTypes.find(p => p.value === projectValue);
      return project ? project.label : `פרויקט ${projectValue}`;
    });
    
    return projectNames.join(', ');
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // שמור את הקובץ והצג את דיאלוג בחירת הפרויקטים
    setSelectedFile(file);
    setShowProjectSelectionDialog(true);
  };

  const processFile = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: 1 }) as any[];

        const dataRows = jsonData.slice(1);

        const filteredData = dataRows.filter(row => {
          const id = row[5]?.toString()?.trim(); 
          const firstName = row[7]?.toString()?.trim(); 
          const lastName = row[6]?.toString()?.trim(); 
          
          
          return id && firstName && lastName && id !== '' && firstName !== '' && lastName !== '';
        });

        const workers: PreviewWorker[] = filteredData.map(row => {
          try {
            return convertExcelRowToWorker(row);
          } catch (error) {
            return { id: row[5]?.toString() || '', firstName: row[7] || '', lastName: row[6] || '', isActive: false } as PreviewWorker;
          }
        });

        setAllWorkers(workers);

        const foundMissingSymbols = new Set<string>();
        workers.forEach(w => {
          const symbol = w.workingSymbol;
          if (symbol && !findClassIdBySymbol(symbol)) {
            foundMissingSymbols.add(symbol);
          }
        });
        setMissingSymbols(Array.from(foundMissingSymbols));

        const existingIds = new Set(existingWorkers.map((w: WorkerAfterNoon) => w.id));

        const notInSystem = workers.filter(w => !existingIds.has(w.id));

        const idCount: Record<string, number> = {};
        notInSystem.forEach(w => { idCount[w.id] = (idCount[w.id] || 0) + 1; });

        const notDuplicate = notInSystem.filter(w => idCount[w.id] === 1);

        const invalidId = notDuplicate.filter(w => !validateIsraeliID(w.id));
        const invalidPhone = notDuplicate.filter(w => w.phone && !isValidPhone(w.phone));
        const missingPhone = notDuplicate.filter(w => !w.phone);
        const invalids = Array.from(new Set([...invalidId, ...invalidPhone, ...missingPhone]));
        setInvalidWorkers(invalids);
        setInvalidByReason({ invalidId, invalidPhone, missingPhone });

        if (jsonData.length !== filteredData.length + 1) { 
          alert(`נסרקו ${jsonData.length - 1} שורות נתונים בקובץ (לא כולל כותרת), ${filteredData.length} שורות עברו את הסינון (שורות ריקות הוסרו)`);
        }

        setShowSummaryDialog(true);
        setPreviewData(workers); 
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
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

      const existingWorkersToCheck = allWorkers.filter((w: PreviewWorker) =>
        existingIds.has(w.id) &&
        idCount[w.id] === 1 &&
        validateIsraeliID(w.id) &&
        (!w.phone || isValidPhone(w.phone))
      );

      let toImport = [...validNewWorkers];
      if (importInvalidId) toImport = toImport.concat(invalidByReason.invalidId);
      if (importInvalidPhone) toImport = toImport.concat(invalidByReason.invalidPhone);
      if (importMissingPhone) toImport = toImport.concat(invalidByReason.missingPhone);


      for (const worker of validNewWorkers) {
        try {
          const normalizedWorker = {
            ...worker,
            phone: normalizePhone(worker.phone),
            projectCodes: projectSelection.selectedProjects
          };
          const savedWorker = await addWorkerMutation.mutateAsync(normalizedWorker);

          const classSymbol = worker.workingSymbol;
          const classObj = classes.find((c: Class) => c.uniqueSymbol === classSymbol);
          if (classObj && savedWorker) {
            // הוספת העובד למסגרת עם קודי הפרויקטים
            for (const projectCode of projectSelection.selectedProjects) {
              const workerAssignment = {
                workerId: savedWorker._id,
                roleType: worker.roleType,
                project: projectCode
              };
              await updateClassWithWorker(classObj._id, {
                $push: { workers: workerAssignment }
              });
            }
          }
        } catch (err) {
          console.error('שגיאה ביצירת עובד חדש:', err, worker);
        }
      }

      for (const worker of existingWorkersToCheck) {
        const existingWorker = existingWorkers.find((w: WorkerAfterNoon) => w.id === worker.id);
        if (!existingWorker) continue;

        const updateFields: Partial<WorkerAfterNoon> = {};
        let shouldUpdate = false;
        // עדכון projectCodes
        if (projectSelection.selectedProjects.length > 0) {
          const existingProjectCodes = existingWorker.projectCodes || [];
          const newProjectCodes = [...new Set([...existingProjectCodes, ...projectSelection.selectedProjects])];
          if (JSON.stringify(existingProjectCodes) !== JSON.stringify(newProjectCodes)) {
            updateFields.projectCodes = newProjectCodes;
            shouldUpdate = true;
          }
        }
        if (shouldUpdate) {
          await updateWorkerMutation.mutateAsync({
            id: existingWorker._id,
            data: {
              ...updateFields,
              phone: normalizePhone(worker.phone)
            }
          });
        }
        const savedWorker = { ...existingWorker, ...updateFields };

        const classSymbol = worker.workingSymbol;
        const classObj = classes.find((c: Class) => c.uniqueSymbol === classSymbol);
        if (classObj && savedWorker) {
          // הוספת העובד למסגרת עם קודי הפרויקטים
          for (const projectCode of projectSelection.selectedProjects) {
            const workerAssignment = {
              workerId: savedWorker._id,
              roleType: worker.roleType,
              project: projectCode
            };
            const isAlreadyAssigned = classObj.workers?.some((w: any) =>
              w.workerId === savedWorker._id && w.project === projectCode
            );
            if (!isAlreadyAssigned) {
              await updateClassWithWorker(classObj._id, {
                $push: { workers: workerAssignment }
              });
            }
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      
      alert('הייבוא הושלם בהצלחה!');
      setPreviewData([]);
      setShowProjectSelectionDialog(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error importing workers:', error); 
      alert('שגיאה בייבוא העובדים');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    setShowSummaryDialog(false);
    handleImport();
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

    const existingWorkersToUpdate = allWorkers.filter((w: PreviewWorker) =>
      existingIds.has(w.id) &&
      idCount[w.id] === 1 &&
      validateIsraeliID(w.id) &&
      (!w.phone || isValidPhone(w.phone))
    ).filter((w: PreviewWorker) => {
      const existingWorker = existingWorkers.find((ew: WorkerAfterNoon) => ew.id === w.id);
      if (!existingWorker) return false;

      // בדיקה אם יש פרויקטים חדשים להוסיף
      const existingProjectCodes = existingWorker.projectCodes || [];
      const newProjectCodes = projectSelection.selectedProjects.filter(
        code => !existingProjectCodes.includes(code)
      );
      return newProjectCodes.length > 0;
    }).length;

    let invalidToImport = 0;
    if (importInvalidId) invalidToImport += invalidByReason.invalidId.length;
    if (importInvalidPhone) invalidToImport += invalidByReason.invalidPhone.length;
    if (importMissingPhone) invalidToImport += invalidByReason.missingPhone.length;

    return validNewWorkers + existingWorkersToUpdate + invalidToImport;
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
    const newWorkers = notInSystem.filter((w: PreviewWorker) => idCount[w.id] === 1).length;
    
    const existingWorkersToUpdate = allWorkers.filter((w: PreviewWorker) =>
      existingIds.has(w.id) &&
      idCount[w.id] === 1 &&
      validateIsraeliID(w.id) &&
      (!w.phone || isValidPhone(w.phone))
    ).filter((w: PreviewWorker) => {
      const existingWorker = existingWorkers.find((ew: WorkerAfterNoon) => ew.id === w.id);
      if (!existingWorker) return false;
      
      // בדיקה אם יש פרויקטים חדשים להוסיף
      const existingProjectCodes = existingWorker.projectCodes || [];
      const newProjectCodes = projectSelection.selectedProjects.filter(
        code => !existingProjectCodes.includes(code)
      );
      return newProjectCodes.length > 0;
    }).length;
    
    return newWorkers + existingWorkersToUpdate;
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

      <Dialog open={showProjectSelectionDialog} onClose={() => setShowProjectSelectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>בחירת פרויקט לעובדים</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" gutterBottom>
              בחר את סוג הפרויקט עבור העובדים שייובאו:
            </Typography>
            
            <FormGroup sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                בחר פרויקטים לעובדים:
              </Typography>
              
              {projectTypes.map((project) => (
                <FormControlLabel
                  key={project.value}
                  control={
                    <Checkbox
                      checked={projectSelection.selectedProjects.includes(project.value)}
                      onChange={() => handleProjectSelectionChange(project.value)}
                    />
                  }
                  label={project.label}
                />
              ))}
            </FormGroup>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                פרויקטים נבחרים:
              </Typography>
              <Typography variant="body2" color="primary">
                {getProjectDisplayName(projectSelection)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectSelectionDialog(false)} color="secondary">
            ביטול
          </Button>
          <Button 
            onClick={() => {
              setShowProjectSelectionDialog(false);
              // עכשיו עבד את הקובץ עם הפרויקטים שנבחרו
              processFile();
            }}
            color="primary" 
            autoFocus
            disabled={projectSelection.selectedProjects.length === 0}
          >
            המשך לעיבוד הקובץ
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            disabled={isUploading || isImporting || showProjectSelectionDialog}
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
              disabled={isUploading || isImporting || showProjectSelectionDialog}
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
                    <TableCell>
                      {worker.projectCodes && worker.projectCodes.length > 0 
                        ? worker.projectCodes.map(code => {
                            const project = projectTypes.find(p => p.value === code);
                            return project ? project.label : `פרויקט ${code}`;
                          }).join(', ')
                        : 'לא נבחר'
                      }
                    </TableCell>
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

      <Dialog open={showSummaryDialog} onClose={() => setShowSummaryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>סיכום נתוני קובץ</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            {missingSymbols.length > 0 && (
                <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, bgcolor: '#fff3e0' }}>
                    <Typography variant="h6" color="warning.dark" gutterBottom>סמלי מוסד חסרים</Typography>
                    <Typography variant="body2" color="warning.dark">
                        נמצאו סמלי מוסד שלא קיימים במערכת (בדר"כ מסגרות שלא נפתחו). עובדים המשויכים לסמלים אלו ייוצאו ללא קישור לכיתה.
                    </Typography>
                    <List dense sx={{ maxHeight: 150, overflow: 'auto', mt: 1 }}>
                        {missingSymbols.map(s => <ListItem key={s}><ListItemText primary={s} /></ListItem>)}
                    </List>
                </Box>
            )}
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
            onClick={handleConfirmImport}
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