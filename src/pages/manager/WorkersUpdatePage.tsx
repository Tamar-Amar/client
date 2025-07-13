import React, { useState } from 'react';
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
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as BackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

// שדות אפשריים לעדכון
const UPDATEABLE_FIELDS = [
  { value: 'firstName', label: 'שם פרטי' },
  { value: 'lastName', label: 'שם משפחה' },
  { value: 'phone', label: 'טלפון' },
  { value: 'email', label: 'אימייל' },
  { value: 'accountantCode', label: 'חשב שכר' },
  { value: 'roleType', label: 'סוג תפקיד' },
  { value: 'roleName', label: 'שם תפקיד' },
  { value: 'is101', label: 'סטטוס 101' },
];

const WorkersUpdatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: Array<{ id: string; oldValue: any; newValue: any }>;
    failed: Array<{ id: string; error: string }>;
  }>({ success: [], failed: [] });
  const [previewData, setPreviewData] = useState<Array<{ id: string; newValue: any; status?: string }>>([]);
  const [validationResults, setValidationResults] = useState<Array<{ id: string; newValue: any; status: string; row: number; oldValue?: any }>>([]);
  const [updatePreview, setUpdatePreview] = useState<Array<{ id: string; oldValue: any; newValue: any; needsUpdate: boolean }>>([]);
  const [showUpdateDetails, setShowUpdateDetails] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      processExcelFile(file);
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

        // בדיקה שיש לפחות 2 עמודות
        if (jsonData.length < 2 || (jsonData[0] as any[]).length < 2) {
          alert('הקובץ חייב להכיל לפחות 2 עמודות: תעודת זהות וערך חדש');
          return;
        }

        // המרה לפורמט הנדרש - רק שורות עם תז תקין (מעל 7 ספרות)
        const processedData = jsonData.slice(1)
          .map((row: any, index: number) => ({
            id: String(row[0]),
            newValue: row[1],
            row: index + 2 // מספר שורה בקובץ המקורי (החל מ-2 כי שורה 1 היא כותרות)
          }))
          .filter(item => {
            // בדוק שהתז תקין (מעל 7 ספרות) ולא ריק
            const id = String(item.id).trim();
            return id.length >= 7 && id !== '' && id !== 'undefined' && id !== 'null';
          });

        setPreviewData(processedData);
        // בדיקת קיום תעודות זהות במערכת
        if (processedData.length > 0) {
          validateWorkersExist(processedData);
        } else {
          alert('לא נמצאו תעודות זהות תקינות בקובץ (נדרש מעל 7 ספרות)');
        }
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert('שגיאה בעיבוד קובץ האקסל');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpdateWorkers = async () => {
    if (!selectedField || !uploadedFile || previewData.length === 0) {
      alert('נא לבחור שדה ולהעלות קובץ אקסל');
      return;
    }

    // בדיקה שהשדה נתמך
    if (selectedField === 'projectCodes') {
      alert('עדכון קודי פרויקט לא נתמך במערכת זו');
      return;
    }

    // updatePreview כבר מכיל רק עובדים שצריכים עדכון
    if (updatePreview.length === 0) {
      alert('אין עובדים שצריכים עדכון (כל הערכים כבר מעודכנים)');
      return;
    }

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
          updates: updatePreview
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
      
      // יצירת תוצאות עם סטטוס וערכים קיימים
      const validationResults = workersData.map(worker => {
        const existingWorker = result.existingWorkers.find((w: any) => w.id === worker.id);
        const exists = !!existingWorker;
        return {
          ...worker,
          status: exists ? 'קיים במערכת' : 'עובד חסר',
          oldValue: existingWorker ? existingWorker[selectedField] : undefined
        };
      });

      setValidationResults(validationResults);
      
              // יצירת תצוגה מקדימה לעדכון
        if (selectedField) {
          const updatePreview = validationResults
            .filter(w => w.status === 'קיים במערכת')
            .map(worker => {
              const oldValue = worker.oldValue;
              const newValue = worker.newValue;
              
              // ניקוי רווחים והשוואה מדויקת
              let cleanOldValue = String(oldValue || '').trim();
              let cleanNewValue = String(newValue || '').trim();
              
              // טיפול מיוחד בשדות בוליאניים
              if (selectedField === 'is101' || selectedField === 'isActive') {
                
                // המרת ערכים בוליאניים לטקסט אחיד
                const oldBool = Boolean(oldValue);
                const newBool = ['יש', 'true', 'כן', '1'].includes(cleanNewValue.toLowerCase());
                
                cleanOldValue = oldBool ? 'true' : 'false';
                cleanNewValue = newBool ? 'true' : 'false';
              }
              
              const needsUpdate = cleanOldValue !== cleanNewValue;
              
              return {
                id: worker.id,
                oldValue,
                newValue,
                needsUpdate
              };
            })
            .filter(worker => worker.needsUpdate); // רק עובדים שצריכים עדכון
          
          setUpdatePreview(updatePreview);
        }
      
      // הצגת התראה על עובדים חסרים
      const missingWorkers = validationResults.filter(w => w.status === 'עובד חסר');
      if (missingWorkers.length > 0) {
        alert(`נמצאו ${missingWorkers.length} עובדים חסרים במערכת. תוכל להוריד קובץ אקסל עם התוצאות המלאות.`);
      }
    } catch (error) {
      console.error('Error validating workers:', error);
      alert('שגיאה בבדיקת קיום עובדים');
    }
  };

  const downloadValidationResults = () => {
    if (validationResults.length === 0) return;

    // יצירת קובץ אקסל עם התוצאות
    const workbook = XLSX.utils.book_new();
    
    // הוספת כותרות
    const headers = ['תעודת זהות', 'ערך חדש', 'סטטוס', 'מספר שורה בקובץ המקורי'];
    const data = [headers, ...validationResults.map(w => [w.id, w.newValue, w.status, w.row])];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'תוצאות בדיקה');
    
    // הורדת הקובץ
    XLSX.writeFile(workbook, `תוצאות_בדיקה_עובדים_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getFieldLabel = (fieldValue: string) => {
    return UPDATEABLE_FIELDS.find(field => field.value === fieldValue)?.label || fieldValue;
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

        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            הוראות לעדכון עובדים:
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
            5. המערכת תבדוק אוטומטית את קיום תעודות הזהות במערכת
          </Typography>
          <Typography variant="body2">
            6. תוכל להוריד קובץ אקסל עם תוצאות הבדיקה (כולל עובדים חסרים)
          </Typography>
          <Typography variant="body2">
            7. רק עובדים קיימים יועדכנו במערכת
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left Column - Selection */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                בחירת שדה לעדכון
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>שדה לעדכון</InputLabel>
                <Select
                  value={selectedField}
                  label="שדה לעדכון"
                  onChange={(e) => setSelectedField(e.target.value)}
                >
                  {UPDATEABLE_FIELDS.map((field) => (
                    <MenuItem key={field.value} value={field.value}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                העלאת קובץ אקסל
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                בחר קובץ אקסל
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>

              {uploadedFile && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  הקובץ הועלה בהצלחה: {uploadedFile.name}
                </Alert>
              )}

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
                    {isProcessing ? 'מעדכן...' : 'עדכן עובדים'}
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
          </Box>

          {/* Right Column - Preview */}
          <Box sx={{ flex: 1 }}>
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
                           סה"כ עובדים קיימים לעדכון: {updatePreview.filter(w => w.needsUpdate).length}
                         </Typography>
                       </Box>
                       
                       {updatePreview.filter(w => w.needsUpdate).length > 0 && (
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
                   
                                      <Alert severity="info" sx={{ mb: 2 }}>
                     <Typography variant="body2">
                       הקובץ מכיל {previewData.length} עובדים. לחץ על "פירוט עובדים לעדכון" כדי לראות את העובדים שיעודכנו.
                     </Typography>
                   </Alert>
                   
                  
                 </>
               )}

              {/* Results */}
              {(results.success.length > 0 || results.failed.length > 0) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    תוצאות העדכון
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
          </Box>
        </Box>
      </Box>

      {/* Dialog for update details */}
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
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>ערך קודם</TableCell>
                  <TableCell>ערך חדש</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updatePreview.filter(w => w.needsUpdate).map((worker, index) => (
                  <TableRow key={index}>
                    <TableCell>{worker.id}</TableCell>
                    <TableCell>
                      {selectedField === 'is101' ? 
                        (worker.oldValue ? 'קיים טופס' : 'לא קיים טופס') : 
                        String(worker.oldValue || '')}
                    </TableCell>
                    <TableCell>
                      {selectedField === 'is101' ? 
                        (String(worker.newValue).toLowerCase() === 'יש' || String(worker.newValue).toLowerCase() === 'true' || String(worker.newValue).toLowerCase() === 'כן' || String(worker.newValue).toLowerCase() === '1' ? 
                          'קיים טופס' : 'לא קיים טופס') : 
                        String(worker.newValue)}
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
    </Container>
  );
};

export default WorkersUpdatePage;