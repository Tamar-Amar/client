import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const UPDATEABLE_FIELDS = [
  { value: 'firstName', label: 'שם פרטי' },
  { value: 'lastName', label: 'שם משפחה' },
  { value: 'phone', label: 'טלפון' },
  { value: 'email', label: 'אימייל' },
  { value: 'accountantCode', label: 'חשב שכר' },
  { value: 'roleName', label: 'שם תפקיד' },
  { value: 'is101', label: 'סטטוס 101' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`update-tabpanel-${index}`}
      aria-labelledby={`update-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WorkersUpdatePage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedField, setSelectedField] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: Array<{ id: string; oldValue?: any; newValue?: any; changes?: string[] }>;
    failed: Array<{ id: string; error: string }>;
  }>({ success: [], failed: [] });
  const [previewData, setPreviewData] = useState<Array<{ id: string; newValue: any; status?: string }>>([]);
  const [validationResults, setValidationResults] = useState<Array<{ id: string; newValue: any; status: string; row: number; oldValue?: any }>>([]);
  const [updatePreview, setUpdatePreview] = useState<Array<{ id: string; oldValue: any; newValue: any; needsUpdate: boolean }>>([]);
  const [showUpdateDetails, setShowUpdateDetails] = useState(false);
  const [selectedToUpdate, setSelectedToUpdate] = useState<string[]>([]);

  const [generalUpdateData, setGeneralUpdateData] = useState<Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    roleName?: string;
    classSymbol?: string;
    oldClassSymbol?: string;
    changes: string[];
    existingData?: any; // שדה חדש לאחסון נתונים קיימים
  }>>([]);
  const [showGeneralUpdatePreview, setShowGeneralUpdatePreview] = useState(false);

  useEffect(() => {
    if (updatePreview.length > 0) {
      const workersToUpdate = updatePreview.filter(w => w.needsUpdate).map(w => w.id);
      setSelectedToUpdate(workersToUpdate);
    }
  }, [updatePreview]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setUploadedFile(null);
    setPreviewData([]);
    setValidationResults([]);
    setUpdatePreview([]);
    setGeneralUpdateData([]);
    setSelectedField('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (tabValue === 0) {
        processExcelFile(file);
      } else {
        processGeneralUpdateFile(file);
      }
    }
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2 || (jsonData[0] as any[]).length < 2) {
          alert('הקובץ חייב להכיל לפחות 2 עמודות: תעודת זהות וערך חדש');
          return;
        }

        const processedData = jsonData.slice(1)
          .map((row: any, index: number) => {
            let newValue = row[1];
            if (selectedField === 'roleName' && typeof newValue === 'string') {
              newValue = newValue.trim().replace(/\s+/g, ' ');
            }
            return {
              id: String(row[0]).trim(),
              newValue: newValue,
              row: index + 2
            };
          })
          .filter((item: any) => item.id && item.id.length >= 7);

        setPreviewData(processedData);
        
        if (processedData.length > 0) {
          validateWorkersExist(processedData);
        }
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert('שגיאה בעיבוד קובץ האקסל');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processGeneralUpdateFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2 || (jsonData[0] as any[]).length < 14) {
          alert('הקובץ חייב להכיל את כל העמודות הנדרשות כמו בייבוא מתקדם');
          return;
        }

        const processedData = jsonData.slice(1)
          .map((row: any, index: number) => {
            let id = row[5]?.toString()?.trim() || '';
            if (id.includes('E') || id.includes('e')) {
              const originalValue = row[5];
              id = Number(originalValue).toString();
            }
            
            if (!id || id.length < 7) return null;

            const changes: string[] = [];
            const workerData: any = { id, changes };

            
            if (row[4] && row[4] !== '') {
              workerData.roleName = row[4].trim().replace(/\s+/g, ' ');
            }
            
            if (row[6] && row[6] !== '') {
              workerData.lastName = row[6].trim();
            }
            
            if (row[7] && row[7] !== '') {
              workerData.firstName = row[7].trim();
            }
            
            if (row[8] && row[8] !== '') {
              workerData.phone = row[8].toString();
            }
            
            if (row[9] && row[9] !== '') {
              workerData.email = row[9].toString();
            }

            if (row[0] && row[0] !== '') {
              workerData.classSymbol = row[0].toString().trim();
              }

            return workerData;
          })
          .filter(Boolean);

        const workerIds = processedData.map((w: any) => w.id);
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/get-for-general-update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workerIds: workerIds
            }),
          });

          if (response.ok) {
            const result = await response.json();
            
            const enrichedData = processedData.map((worker: any) => {
              const existingWorker = result.workers.find((w: any) => w.id === worker.id);
              
              
              if (existingWorker) {
                const realChanges: string[] = [];
                
                if (worker.firstName && worker.firstName !== existingWorker.firstName) {
                  realChanges.push('שם פרטי');
                }
                if (worker.lastName && worker.lastName !== existingWorker.lastName) {
                  realChanges.push('שם משפחה');
                }
                if (worker.phone && worker.phone !== existingWorker.phone) {
                  realChanges.push('טלפון');
                }
                if (worker.email && worker.email !== existingWorker.email) {
                  realChanges.push('אימייל');
                }
                if (worker.roleName && worker.roleName !== existingWorker.roleName) {
                  realChanges.push('תפקיד');
                }
                
                if (worker.classSymbol && existingWorker.classSymbol && worker.classSymbol !== existingWorker.classSymbol) {
                  realChanges.push('סמל כיתה');
                }
                
                if (worker.classSymbol && !existingWorker.classSymbol) {
                  realChanges.push('סמל כיתה');
                }
                
                if (!worker.classSymbol && existingWorker.classSymbol) {
                  realChanges.push('סמל כיתה');
                }
                
                return {
                  ...worker,
                  oldClassSymbol: existingWorker.classSymbol,
                  existingData: existingWorker,
                  changes: realChanges
                };
              } else {  
              }
              return worker;
            });

            setGeneralUpdateData(enrichedData);
          } else {
            setGeneralUpdateData(processedData);
          }
        } catch (error) {
          console.error('Error fetching existing data:', error);
          setGeneralUpdateData(processedData);
        }
      } catch (error) {
        console.error('Error processing general update file:', error);
        alert('שגיאה בעיבוד קובץ האקסל');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const workersWithRealChanges = generalUpdateData.filter(worker => 
    worker.changes && worker.changes.length > 0
  );

  const handleUpdateWorkers = async () => {
    if (!selectedField || !uploadedFile || previewData.length === 0) {
      alert('נא לבחור שדה ולהעלות קובץ אקסל');
      return;
    }

    if (selectedField === 'projectCodes') {
      alert('עדכון קודי פרויקט לא נתמך במערכת זו');
      return;
    }

    const filteredUpdatePreview = updatePreview.filter(w => selectedToUpdate.includes(w.id));
    if (filteredUpdatePreview.length === 0) {
      alert('לא נבחרו עובדים לעדכון');
      return;
    }
    const processedUpdates = filteredUpdatePreview.map(worker => {
      let processedNewValue = worker.newValue;
      if (selectedField === 'is101' || selectedField === 'isActive') {
        const trueValues = ['יש', 'true', 'כן', '1', 'תקין'];
        processedNewValue = trueValues.includes(String(worker.newValue).toLowerCase());
      }
      if (selectedField === 'roleName' && typeof processedNewValue === 'string') {
        processedNewValue = processedNewValue.trim().replace(/\s+/g, ' ');
      }
      return {
        ...worker,
        newValue: processedNewValue
      };
    });

    setIsProcessing(true);
    setResults({ success: [], failed: [] });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/update-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: selectedField,
          updates: processedUpdates
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון העובדים');
      }

      const result = await response.json();
      setResults(result);
      
      if (result.success.length > 0) {
        alert(`עודכנו בהצלחה ${result.success.length} עובדים`);
      }
      
      if (result.failed.length > 0) {
        alert(`נכשלו ${result.failed.length} עדכונים`);
      }

    } catch (error) {
      console.error('Error updating workers:', error);
      alert('שגיאה בעדכון העובדים');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneralUpdate = async () => {
    if (!uploadedFile || generalUpdateData.length === 0) {
      alert('נא להעלות קובץ אקסל');
      return;
    }

    setIsProcessing(true);
    setResults({ success: [], failed: [] });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/update-general`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectCode: 4, // קייטנת קיץ
          updates: generalUpdateData
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון הכללי');
      }

      const result = await response.json();
      setResults(result);
      
      if (result.success.length > 0) {
        alert(`עודכנו בהצלחה ${result.success.length} עובדים`);
      }
      
      if (result.failed.length > 0) {
        alert(`נכשלו ${result.failed.length} עדכונים`);
      }

    } catch (error) {
      console.error('Error in general update:', error);
      alert('שגיאה בעדכון הכללי');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateWorkersExist = async (workersData: Array<{ id: string; newValue: any; row: number }>) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/validate-exist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerIds: workersData.map(w => w.id)
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בבדיקת קיום עובדים');
      }

      const result = await response.json();
      
      const validationResults = workersData.map(worker => {
        const existingWorker = result.existingWorkers.find((w: any) => w.id === worker.id);
        const exists = !!existingWorker;
        let oldValue = existingWorker ? existingWorker[selectedField] : undefined;
        
        if (selectedField === 'roleName' && typeof oldValue === 'string') {
          oldValue = oldValue.trim().replace(/\s+/g, ' ');
        }
        
        return {
          ...worker,
          status: exists ? 'קיים במערכת' : 'עובד חסר',
          oldValue: oldValue
        };
      });

      setValidationResults(validationResults);
      
      const updatePreview = validationResults
        .filter(w => w.status === 'קיים במערכת')
        .map(worker => {
          const needsUpdate = worker.oldValue !== worker.newValue;
          return {
            id: worker.id,
            oldValue: worker.oldValue,
            newValue: worker.newValue,
            needsUpdate
          };
        });
      
      setUpdatePreview(updatePreview);
      
    } catch (error) {
      console.error('Error validating workers:', error);
      alert('שגיאה בבדיקת קיום עובדים');
    }
  };

  const downloadValidationResults = () => {
    if (validationResults.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(validationResults.map(w => ({
      'תעודת זהות': w.id,
      'ערך חדש': w.newValue,
      'סטטוס': w.status,
      'שורה בקובץ': w.row,
      'ערך קיים': w.oldValue || 'לא קיים'
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תוצאות בדיקה');
    XLSX.writeFile(wb, 'תוצאות_בדיקת_עובדים.xlsx');
  };

  const downloadGeneralUpdateResults = () => {
    if (results.success.length === 0 && results.failed.length === 0) return;

    const ws = XLSX.utils.json_to_sheet([
      ...results.success.map(w => ({
        'תעודת זהות': w.id,
        'סטטוס': 'הצלחה',
        'שדות שעודכנו': Array.isArray(w.changes) ? w.changes.join(', ') : w.changes
      })),
      ...results.failed.map(w => ({
        'תעודת זהות': w.id,
        'סטטוס': 'כישלון',
        'שגיאה': w.error
      }))
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תוצאות עדכון כללי');
    XLSX.writeFile(wb, 'תוצאות_עדכון_כללי.xlsx');
  };

  const downloadGeneralUpdateTemplate = () => {
    const template = [
      {
        'סמל מוסד': '',
        'חשב שכר': '',
        'מודל': '',
        'סוג תפקיד': '',
        'שם תפקיד': '',
        'תעודת זהות': '',
        'שם משפחה': '',
        'שם פרטי': '',
        'טלפון': '',
        'אימייל': '',
        'תאריך התחלה': '',
        'תאריך סיום': '',
        'סטטוס': '',
        'טופס 101': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תבנית עדכון כללי');
    XLSX.writeFile(wb, 'תבנית_עדכון_כללי.xlsx');
  };

  const getFieldLabel = (fieldValue: string) => {
    const field = UPDATEABLE_FIELDS.find(f => f.value === fieldValue);
    return field ? field.label : fieldValue;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/workers')}
            sx={{ mr: 2 }}
          >
            חזור
          </Button>
          <Typography variant="h4" fontWeight="bold">
            עדכון עובדים קיימים
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="עדכון עובדים">
            <Tab 
              icon={<EditIcon />} 
              label="עדכון שדה בודד" 
              iconPosition="start"
            />
            <Tab 
              icon={<UpdateIcon />} 
              label="עדכון כללי" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              הוראות לעדכון שדה בודד:
            </Typography>
            <Typography variant="body2">
              1. בחר את השדה שברצונך לעדכן
            </Typography>
            <Typography variant="body2">
              2. העלה קובץ אקסל עם 2 עמודות: תעודת זהות (מינימום 7 ספרות) וערך חדש
            </Typography>
            <Typography variant="body2">
              3. שורות עם תעודת זהות קצרה מ-7 ספרות או ריקות יועברו
            </Typography>
            <Typography variant="body2">
              4. שמות תפקידים ינורמלו אוטומטית (רווחים מיותרים יוסרו)
            </Typography>
            <Typography variant="body2">
              5. המערכת תבדוק אוטומטית את קיום תעודות הזהות במערכת
            </Typography>
            <Typography variant="body2">
              6. תוכל להוריד קובץ אקסל עם תוצאות הבדיקה (כולל עובדים חסרים)
            </Typography>
            <Typography variant="body2">
              7. רק עובדים קיימים יועדכנו במערכת
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Left Column - Controls */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  הגדרות עדכון
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>בחר שדה לעדכון</InputLabel>
                  <Select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    label="בחר שדה לעדכון"
                  >
                    {UPDATEABLE_FIELDS.map((field) => (
                      <MenuItem key={field.value} value={field.value}>
                        {field.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ mb: 3 }}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    id="excel-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="excel-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<UploadIcon />}
                      disabled={!selectedField}
                    >
                      העלה קובץ אקסל
                    </Button>
                  </label>
                  {uploadedFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      קובץ נבחר: {uploadedFile.name}
                    </Typography>
                  )}
                </Box>

                {selectedField && uploadedFile && previewData.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleUpdateWorkers}
                      disabled={isProcessing}
                      startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckIcon />}
                      sx={{ mb: 2 }}
                    >
                      {isProcessing ? 'מעדכן...' : `עדכן עובדים${selectedField === 'roleName' ? ' (שמות תפקידים ינורמלו)' : ''}`}
                    </Button>
                    
                    {validationResults.length > 0 && (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={downloadValidationResults}
                        startIcon={<DownloadIcon />}
                        color="error"
                      >
                        הורד תוצאות בדיקה
                      </Button>
                    )}
                  </>
                )}
              </Paper>
            </Grid>

            {/* Right Column - Preview */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  תצוגה מקדימה
                </Typography>
                
                {previewData.length > 0 && selectedField && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      עומדים לעדכן {previewData.length} עובדים בשדה "{getFieldLabel(selectedField)}"
                    </Typography>
                    
                    {validationResults.length > 0 && (
                      <>
                        <Alert 
                          severity={validationResults.some(w => w.status === 'עובד חסר') ? 'warning' : 'success'} 
                          sx={{ mb: 2 }}
                        >
                          {validationResults.filter(w => w.status === 'עובד חסר').length} עובדים חסרים במערכת
                        </Alert>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">
                            סה"כ עובדים קיימים לעדכון: {selectedToUpdate.length}
                          </Typography>
                        </Box>
                        
                        {selectedToUpdate.length > 0 && (
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setShowUpdateDetails(true)}
                            sx={{ mb: 2 }}
                          >
                            פירוט עובדים לעדכון
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              הוראות לעדכון כללי (קייטנת קיץ):
            </Typography>
            <Typography variant="body2">
              1. העלה קובץ אקסל באותו פורמט בדיוק כמו ייבוא מתקדם
            </Typography>
            <Typography variant="body2">
              2. העמודות הנדרשות: סמל מוסד, חשב שכר, מודל, סוג תפקיד, שם תפקיד, תעודת זהות, שם משפחה, שם פרטי, טלפון, אימייל, תאריך התחלה, תאריך סיום, סטטוס, טופס 101
            </Typography>
            <Typography variant="body2">
              3. המערכת תעדכן רק עובדים שמופיעים בפרויקט קייטנת קיץ (קוד 4)
            </Typography>
            <Typography variant="body2">
              4. רק שדות עם ערכים יועדכנו (שדות ריקים יישמרו כפי שהם)
            </Typography>
            <Typography variant="body2">
              5. שינויים בסמלי כיתה יוצגו בטבלת השוואה
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠️ חשוב: עדכון כללי זמין רק לפרויקט קייטנת קיץ (קוד 4)
            </Typography>
            <Typography variant="body2">
              עובדים שלא מופיעים בפרויקט קייטנת קיץ לא יועדכנו
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Left Column - Controls */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  העלאת קובץ עדכון כללי
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={downloadGeneralUpdateTemplate}
                    startIcon={<DownloadIcon />}
                    sx={{ mb: 2 }}
                  >
                    הורד תבנית אקסל
                  </Button>
                  
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    id="general-excel-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="general-excel-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<UploadIcon />}
                    >
                      העלה קובץ אקסל
                    </Button>
                  </label>
                  {uploadedFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      קובץ נבחר: {uploadedFile.name}
                    </Typography>
                  )}
                </Box>

                {uploadedFile && generalUpdateData.length > 0 && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setShowGeneralUpdatePreview(true)}
                    startIcon={<CheckIcon />}
                    sx={{ mb: 2 }}
                  >
                    הצג תצוגה מקדימה
                  </Button>
                )}

                {uploadedFile && generalUpdateData.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleGeneralUpdate}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : <UpdateIcon />}
                    sx={{ mb: 2 }}
                  >
                    {isProcessing ? 'מעדכן...' : 'בצע עדכון כללי'}
                  </Button>
                )}

                {(results.success.length > 0 || results.failed.length > 0) && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={downloadGeneralUpdateResults}
                    startIcon={<DownloadIcon />}
                    color="info"
                  >
                    הורד תוצאות עדכון
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* Right Column - Summary */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  סיכום עדכון כללי
                </Typography>
                
                {generalUpdateData.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      נמצאו {generalUpdateData.length} עובדים בקובץ
                    </Typography>
                    
                    <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                      עובדים עם שינויים אמיתיים: {workersWithRealChanges.length}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        סוגי שינויים:
                      </Typography>
                      {['שם פרטי', 'שם משפחה', 'טלפון', 'אימייל', 'תפקיד', 'סמל כיתה'].map(field => {
                        const count = workersWithRealChanges.filter(w => w.changes.includes(field)).length;
                        return count > 0 ? (
                          <Chip 
                            key={field} 
                            label={`${field}: ${count}`} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }} 
                          />
                        ) : null;
                      })}
                    </Box>
                  </>
                )}

                {(results.success.length > 0 || results.failed.length > 0) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      תוצאות עדכון
                    </Typography>
                    
                    {results.success.length > 0 && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        עודכנו בהצלחה {results.success.length} עובדים
                      </Alert>
                    )}
                    
                    {results.failed.length > 0 && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        נכשלו {results.failed.length} עדכונים
                      </Alert>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Dialog for single field update details */}
      <Dialog
        open={showUpdateDetails}
        onClose={() => setShowUpdateDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          פירוט עובדים לעדכון - {getFieldLabel(selectedField)}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedToUpdate.length > 0 && selectedToUpdate.length < updatePreview.filter(w => w.needsUpdate).length}
                      checked={selectedToUpdate.length === updatePreview.filter(w => w.needsUpdate).length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedToUpdate(updatePreview.filter(w => w.needsUpdate).map(w => w.id));
                        } else {
                          setSelectedToUpdate([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>ערך קודם</TableCell>
                  <TableCell>ערך חדש</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updatePreview.filter(w => w.needsUpdate).map((worker, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedToUpdate.includes(worker.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedToUpdate(prev => [...prev, worker.id]);
                          } else {
                            setSelectedToUpdate(prev => prev.filter(id => id !== worker.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{worker.id}</TableCell>
                    <TableCell>
                      {selectedField === 'is101' ? 
                        (worker.oldValue ? 'קיים טופס' : 'לא קיים טופס') : 
                        (selectedField === 'roleName' ? 
                          (worker.oldValue?.trim().replace(/\s+/g, ' ') || '') : 
                          String(worker.oldValue || ''))}
                    </TableCell>
                    <TableCell>
                      {selectedField === 'is101' ? 
                        (["יש", "true", "כן", "1", "תקין"].includes(String(worker.newValue).toLowerCase()) ? 
                          'קיים טופס' : 'לא קיים טופס') : 
                        (selectedField === 'roleName' ? 
                          (worker.newValue?.trim().replace(/\s+/g, ' ') || '') : 
                          String(worker.newValue))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDetails(false)}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for general update preview */}
      <Dialog
        open={showGeneralUpdatePreview}
        onClose={() => setShowGeneralUpdatePreview(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          תצוגה מקדימה - עדכון כללי (קייטנת קיץ)
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>שם פרטי</TableCell>
                  <TableCell>שם משפחה</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>אימייל</TableCell>
                  <TableCell>תפקיד</TableCell>
                  <TableCell>סמל כיתה</TableCell>
                  <TableCell>שינויים</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workersWithRealChanges.map((worker, index) => (
                  <TableRow key={index}>
                    <TableCell>{worker.id}</TableCell>
                    <TableCell>
                      {worker.firstName && worker.existingData && worker.firstName !== worker.existingData.firstName ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.firstName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.existingData.firstName || 'לא מוגדר'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.existingData && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.existingData.firstName || 'לא מוגדר'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.lastName && worker.existingData && worker.lastName !== worker.existingData.lastName ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.existingData.lastName || 'לא מוגדר'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.existingData && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.existingData.lastName || 'לא מוגדר'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.phone && worker.existingData && worker.phone !== worker.existingData.phone ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.phone}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.existingData.phone || 'לא מוגדר'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.existingData && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.existingData.phone || 'לא מוגדר'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.email && worker.existingData && worker.email !== worker.existingData.email ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.existingData.email || 'לא מוגדר'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.existingData && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.existingData.email || 'לא מוגדר'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.roleName && worker.existingData && worker.roleName !== worker.existingData.roleName ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.roleName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.existingData.roleName || 'לא מוגדר'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.existingData && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.existingData.roleName || 'לא מוגדר'}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {worker.classSymbol && worker.oldClassSymbol && worker.classSymbol !== worker.oldClassSymbol ? (
                        <Box>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {worker.classSymbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            היה: {worker.oldClassSymbol}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            לא משתנה
                          </Typography>
                          {worker.oldClassSymbol && (
                            <Typography variant="caption" color="text.secondary">
                              נוכחי: {worker.oldClassSymbol}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {worker.changes.map((change, idx) => (
                          <Chip key={idx} label={change} size="small" color="primary" />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGeneralUpdatePreview(false)}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkersUpdatePage;