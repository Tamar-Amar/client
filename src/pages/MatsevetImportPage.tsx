import React, { useState } from 'react';
import { Container, Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, Stepper, Step, StepLabel, Paper, TextField, CircularProgress, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseMatsevetExcel } from '../utils/parseMatsevetExcel';
import { useFetchClasses, useAddClass, useAddMultipleClasses, useUpdateClass, useUpdateMultipleClasses } from '../queries/classQueries';

const years = [2025, 2026];
const projectTypes = [
  { label: 'צהרון שוטף', value: 'afternoon', code: { 2025: 1, 2026: 5 } },
  { label: 'קייטנת קיץ', value: 'summer', code: { 2025: 4, 2026: 8 } },
  { label: 'קייטנת חנוכה', value: 'hanuka', code: { 2025: 2, 2026: 6 } },
  { label: 'קייטנת פסח', value: 'passover', code: { 2025: 3, 2026: 7 } },
];

const MatsevetImportPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState<number | ''>('');
  const [projectType, setProjectType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedNew, setSelectedNew] = useState<Set<number>>(new Set());
  const [selectedUpdates, setSelectedUpdates] = useState<{[symbol: string]: Set<string>}>({});
  const [importSummary, setImportSummary] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const { data: classes = [] } = useFetchClasses();
  const addClassMutation = useAddClass();
  const addMultipleClassesMutation = useAddMultipleClasses();
  const updateClassMutation = useUpdateClass();
  const updateMultipleClassesMutation = useUpdateMultipleClasses();

  const existingSymbols: string[] = classes.map((c: any) => c.uniqueSymbol);

  const excelToClassMap: Record<string, string> = {
    'סמל מאוחד': 'uniqueSymbol',
    'שם מוסד': 'institutionName',
    'קוד מוסד': 'institutionCode',
    'סוג': 'type',
    'אישור פתיחה': 'approvalOpen', 
    'מין': 'gender',
    'חינוך': 'education',
    'רחוב': 'address',
    'מס רחוב': 'streetNumber',
    'שם': 'name',
    'projectCodes': 'projectCodes', 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file || !year || !projectType) return;
    setLoading(true);
    const projectCode = projectTypes.find(pt => pt.value === projectType)?.code[String(year) as '2025' | '2026'] || 0;
    const result = await parseMatsevetExcel(file, existingSymbols, projectCode) as any;
    setImportResult(result);
    setSelectedNew(new Set((result.newClasses as any[]).map((_: any, idx: number) => idx)));
    const updates: {[symbol: string]: Set<string>} = {};
    for (const ex of (result.existingClasses as any[])) {
      const fields = new Set(Object.keys(ex.excelData)); 
      if (ex.excelData['אישור פתיחה'] === 'כן') {
        fields.add('projectCodes');
      }
      updates[ex.symbol] = fields;
    }
    setSelectedUpdates(updates);
    setLoading(false);
    setStep(2);
  };

  const handleSelectNew = (idx: number) => {
    setSelectedNew(prev => {
      const copy = new Set(prev);
      copy.has(idx) ? copy.delete(idx) : copy.add(idx);
      return copy;
    });
  };

  const handleSelectAllNew = (checked: boolean) => {
    setSelectedNew(checked ? new Set(importResult.newClasses.map((_: any, idx: number) => idx)) : new Set());
  };

  const handleSelectUpdate = (symbol: string, field: string) => {
    setSelectedUpdates(prev => {
      const copy = { ...prev };
      if (!copy[symbol]) copy[symbol] = new Set();
      copy[symbol].has(field) ? copy[symbol].delete(field) : copy[symbol].add(field);
      return copy;
    });
  };

  const handleSelectAllUpdate = (symbol: string, checked: boolean) => {
    setSelectedUpdates(prev => {
      const copy = { ...prev };
      copy[symbol] = checked ? new Set(Object.keys(importResult.existingClasses.find((ex: any) => ex.symbol === symbol).excelData)) : new Set();
      return copy;
    });
  };

  const handleImport = async () => {
    setImportSummary('');
    setImportError('');
    setLoading(true);
    let created = 0, updated = 0;
    try {
      const selectedClasses = Array.from(selectedNew).map(idx => importResult.newClasses[idx]);
      
      let bulkResult: any = null;
      let bulkUpdateResult: any = null;
      
      if (selectedClasses.length > 5) {
        bulkResult = await addMultipleClassesMutation.mutateAsync(selectedClasses);
        created = bulkResult.results.created.length;
      } else {  
        for (const toSend of selectedClasses) {
          await addClassMutation.mutateAsync(toSend);
          created++;
        }
      }
      
      
      const updatesToSend: { id: string; updatedClass: any }[] = [];
      
      for (const ex of importResult.existingClasses) {
        const fields = Array.from(selectedUpdates[ex.symbol] || []);
        if (fields.length === 0) continue;
        const classObj = classes.find((c: any) => c.uniqueSymbol === ex.symbol);
        if (!classObj) continue;
        const updatedClass: any = {};
        
        
        if (ex.excelData['אישור פתיחה'] === 'כן') {
          const currentProjectCode = projectTypes.find(pt => pt.value === projectType)?.code[String(year) as '2025' | '2026'] || 0;
          const existingProjectCodes = classObj.projectCodes || [];

          
          
          if (!existingProjectCodes.includes(currentProjectCode)) {
            updatedClass.projectCodes = [...existingProjectCodes, currentProjectCode];
          }
        }
        
        for (const field of fields) {
          const classField = excelToClassMap[field] || field;
          const value = ex.excelData[field];
          if (value && value !== '') {
            updatedClass[classField] = value;
          }
        }
        if (Object.keys(updatedClass).length > 0) {
          updatesToSend.push({ id: classObj._id, updatedClass });
        }
      }
      
      
      if (updatesToSend.length > 5) {
        bulkUpdateResult = await updateMultipleClassesMutation.mutateAsync(updatesToSend);
        updated = bulkUpdateResult.results.updated.length;
      } else {
        
        for (const update of updatesToSend) {
          await updateClassMutation.mutateAsync(update);
          updated++;
        }
      }
      
      let summaryMessage = `ייבוא הסתיים: ${created} מסגרות חדשות, ${updated} עדכונים.`;
      
      
      if (bulkResult && bulkResult.results.errors.length > 0) {
        summaryMessage += `\nשגיאות יצירה: ${bulkResult.results.errors.length}`;
      }
      
      
      if (updatesToSend.length > 5 && bulkUpdateResult && bulkUpdateResult.results.errors.length > 0) {
        summaryMessage += `\nשגיאות עדכון: ${bulkUpdateResult.results.errors.length}`;
      }
      
      setImportSummary(summaryMessage);
    } catch (err: any) {
      setImportError('אירעה שגיאה בתהליך הייבוא: ' + (err?.message || err));
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>העלאת מצבת והשוואה</Typography>
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step><StepLabel>בחירת פרויקט</StepLabel></Step>
          <Step><StepLabel>העלאת קובץ</StepLabel></Step>
          <Step><StepLabel>סיכום והשוואה</StepLabel></Step>
        </Stepper>
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>שנה</InputLabel>
              <Select value={year} label="שנה" onChange={e => setYear(Number(e.target.value))}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!year}>
              <InputLabel>סוג פרויקט</InputLabel>
              <Select value={projectType} label="סוג פרויקט" onChange={e => setProjectType(e.target.value)}>
                {projectTypes.map(pt => <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!year || !projectType} onClick={() => setStep(1)}>המשך</Button>
          </Box>
        )}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
            >
              בחר קובץ אקסל
              <input type="file" accept=".xlsx,.xls" hidden onChange={handleFileChange} />
            </Button>
            {file && <Typography>הקובץ שנבחר: {file.name}</Typography>}
            <Button variant="contained" disabled={!file} onClick={handleProcess}>עבד והשווה</Button>
            <Button variant="text" onClick={() => setStep(0)}>חזור</Button>
            {loading && <CircularProgress />}
          </Box>
        )}
        {step === 2 && importResult && (
          <Box>
            <Typography variant="h6" gutterBottom>סיכום ראשוני</Typography>
            <Typography>מסגרות חדשות: {importResult.newClasses.length}</Typography>
            <Typography>מסגרות קיימות: {importResult.existingClasses.length}</Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">מסגרות חדשות</Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedNew.size === importResult.newClasses.length}
                          indeterminate={selectedNew.size > 0 && selectedNew.size < importResult.newClasses.length}
                          onChange={e => handleSelectAllNew(e.target.checked)}
                        />
                      </TableCell>
                      {Object.keys(importResult.newClasses[0] || {}).map((key) => (
                        <TableCell key={key}>
                          {key === 'projectCodes' ? 'קודי פרויקט' : key}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.newClasses.map((cls: any, idx: number) => (
                      <TableRow key={idx} selected={selectedNew.has(idx)}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedNew.has(idx)} onChange={() => handleSelectNew(idx)} />
                        </TableCell>
                        {Object.keys(cls).map((key) => (
                          <TableCell key={key}>
                            {key === 'projectCodes' && Array.isArray(cls[key]) 
                              ? cls[key].join(', ') 
                              : cls[key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="subtitle1">מסגרות קיימות (השוואת שדות)</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>סמל</TableCell>
                      <TableCell>שדה</TableCell>
                      <TableCell>ערך נוכחי</TableCell>
                      <TableCell>ערך מהאקסל</TableCell>
                      <TableCell padding="checkbox">עדכן</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.existingClasses.map((ex: any) => {
                      const classObj = classes.find((c: any) => c.uniqueSymbol === ex.symbol) || {};
                      const currentProjectCode = projectTypes.find(pt => pt.value === projectType)?.code[String(year) as '2025' | '2026'] || 0;
                      
                      return Object.keys(ex.excelData)
                        .filter((field: string) => field !== 'אישור פתיחה')
                        .filter((field: string) => {
                          const classField = excelToClassMap[field] || field;
                          const current = classObj[classField];
                          const excelVal = ex.excelData[field];
                          return current !== excelVal;
                        })
                        .concat(
                            
                          ex.excelData['אישור פתיחה'] === 'כן' && !(classObj.projectCodes || []).includes(currentProjectCode)
                            ? ['projectCodes'] 
                            : []
                        )
                        .map((field: string, i: number) => {
                          const classField = excelToClassMap[field] || field;
                          let current, excelVal;
                          
                          if (field === 'projectCodes') {
                            current = (classObj.projectCodes || []).join(', ');
                            excelVal = currentProjectCode;
                          } else {
                            current = classObj[classField];
                            excelVal = ex.excelData[field];
                          }
                          
                          const isDiff = current !== excelVal;
                          return (
                            <TableRow key={ex.symbol + field} selected={isDiff && selectedUpdates[ex.symbol]?.has(field)}>
                              <TableCell>{ex.symbol}</TableCell>
                              <TableCell>{field === 'projectCodes' ? 'קודי פרויקט' : field}</TableCell>
                              <TableCell style={{ background: isDiff ? '#ffe0e0' : undefined }}>{current ?? ''}</TableCell>
                              <TableCell style={{ background: isDiff ? '#e0ffe0' : undefined }}>{excelVal ?? ''}</TableCell>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedUpdates[ex.symbol]?.has(field) || false}
                                  disabled={!isDiff}
                                  onChange={() => handleSelectUpdate(ex.symbol, field)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        });
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="success" disabled={loading || (selectedNew.size === 0 && Object.values(selectedUpdates).every(set => set.size === 0))} onClick={handleImport}>
                ייבוא
              </Button>
              <Button variant="text" onClick={() => setStep(1)}>חזור</Button>
            </Box>
            {loading && <CircularProgress sx={{ mt: 2 }} />}
            {importSummary && <Alert severity="success" sx={{ mt: 2 }}>{importSummary}</Alert>}
            {importError && <Alert severity="error" sx={{ mt: 2 }}>{importError}</Alert>}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MatsevetImportPage; 