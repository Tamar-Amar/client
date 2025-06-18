import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Autocomplete,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { DocumentStatus } from '../../types/Document';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { useAttendance } from '../../queries/useAttendance';
import { useFetchClasses } from '../../queries/classQueries';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { Class } from '../../types';
import WorkerPersonalDocuments from '../../components/workers/documents/WorkerPersonalDocuments';
import WorkerAttendanceDocuments from '../../components/workers/documents/WorkerAttendanceDocuments';
import { he } from 'date-fns/locale';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { DOCUMENT_TYPES } from '../WorkerProfilePage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WorkerPersonalDetails from '../../components/workers/WorkerPersonalDetails';


interface AttendanceRecord {
  _id: string;
  workerId: string;
  classId: string | { _id: string; name?: string; uniqueSymbol?: string };
  month: string;
  studentAttendanceDoc: {
    _id: string;
    tag: string;
    fileName: string;
    fileType: string;
    url: string;
    status: string;
  } | null;
  studentAttendanceStatus: string | null;
  studentAttendanceUrl: string | null;
  workerAttendanceDoc: {
    _id: string;
    tag: string;
    fileName: string;
    fileType: string;
    url: string;
    status: string;
  } | null;
  workerAttendanceStatus: string | null;
  workerAttendanceUrl: string | null;
  controlDoc: {
    _id: string;
    tag: string;
    fileName: string;
    fileType: string;
    url: string;
    status: string;
  } | null;
  controlStatus: string | null;
  controlUrl: string | null;
  class: {
    _id: string;
    name: string;
    uniqueSymbol: string;
  };
}


const WorkerDocumentsApprovalPage: React.FC = () => {
  const { id: workerId } = useParams<{ id: string }>();
  const {
    documents,
    isLoading,
    isError,
    error,
    updateStatus,
    uploadDocument,
    isUploading,
    deleteDocument
  } = useWorkerDocuments(workerId || '');
  const { data: workerData } = useFetchWorkerAfterNoon(workerId as string);
  const { 
    workerAttendance: attendanceData, 
    isLoading: isAttendanceLoading,
    submitAttendance,
  } = useAttendance(workerId || '');

  const { data: allClasses } = useFetchClasses();
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentAttendanceFile, setStudentAttendanceFile] = useState<File | null>(null);
  const [workerAttendanceFile, setWorkerAttendanceFile] = useState<File | null>(null);
  const [controlFile, setControlFile] = useState<File | null>(null);
  const [isPersonalDocDialogOpen, setIsPersonalDocDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | "NULL">("NULL");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState<'documents' | 'personal'>('documents');
  const [drawerOpen, setDrawerOpen] = useState(true);


  const handleStatusUpdate = (docId: string, newStatus: DocumentStatus) => {
    updateStatus({ documentId: docId, status: newStatus });
  };

  const handleOpenAttendanceDialog = () => {
    setIsAttendanceDialogOpen(true);
  };

  const handleCloseAttendanceDialog = () => {
    setIsAttendanceDialogOpen(false);
    setSelectedMonth(null);
    setSelectedClass('');
    setStudentAttendanceFile(null);
    setWorkerAttendanceFile(null);
    setControlFile(null);
  };

  const handleSubmitAttendance = async () => {
    if (selectedMonth && selectedClass) {
      try {
        const formattedMonth = format(selectedMonth, 'yyyy-MM');
        
        // Check if attendance record already exists
        const existingRecord = attendanceData?.find((record: AttendanceRecord) => {
          const recordMonth = format(new Date(record.month), 'yyyy-MM');
          const recordClassId = typeof record.classId === 'string' ? record.classId : record.classId._id;
          return recordMonth === formattedMonth && recordClassId === selectedClass;
        });

        if (existingRecord) {
          const workerName = workerData ? `${workerData.firstName} ${workerData.lastName}` : 'עובד';
          if (!window.confirm(`קיים כבר דיווח נוכחות לחודש ${format(selectedMonth, 'MMMM yyyy', { locale: he })} לכיתה זו עבור ${workerName}. האם ברצונך להחליף את הדיווח הקיים?`)) {
            return;
          }
        }
        
        // Upload each file separately
        let studentAttendanceDoc: string | undefined = undefined;
        let workerAttendanceDoc: string | undefined = undefined;
        let controlDoc: string | undefined = undefined;

        if (studentAttendanceFile) {
          const studentFormData = new FormData();
          studentFormData.append('file', studentAttendanceFile);
          studentFormData.append('workerId', workerId || '');
          studentFormData.append('tag', 'נוכחות תלמידים');
          studentFormData.append('documentType', 'נוכחות תלמידים');
          studentFormData.append('tz', workerData?.id as string);
          
          await new Promise<void>((resolve, reject) => {
            uploadDocument(studentFormData, {
              onSuccess: (response) => {
                studentAttendanceDoc = response._id;
                resolve();
              },
              onError: (error) => {
                console.error('Error uploading student attendance:', error);
                reject(error);
              }
            });
          });
        }

        if (workerAttendanceFile) {
          const workerFormData = new FormData();
          workerFormData.append('file', workerAttendanceFile);
          workerFormData.append('workerId', workerId || '');
          workerFormData.append('tag', 'נוכחות עובדים');
          workerFormData.append('documentType', 'נוכחות עובדים');
          
          await new Promise<void>((resolve, reject) => {
            uploadDocument(workerFormData, {
              onSuccess: (response) => {
                workerAttendanceDoc = response._id;
                resolve();
              },
              onError: (error) => {
                console.error('Error uploading worker attendance:', error);
                reject(error);
              }
            });
          });
        }

        if (controlFile) {
          const controlFormData = new FormData();
          controlFormData.append('file', controlFile);
          controlFormData.append('workerId', workerId || '');
          controlFormData.append('tag', 'מסמך בקרה');
          controlFormData.append('documentType', 'מסמך בקרה');
          
          await new Promise<void>((resolve, reject) => {
            uploadDocument(controlFormData, {
              onSuccess: (response) => {
                controlDoc = response._id;
                resolve();
              },
              onError: (error) => {
                console.error('Error uploading control document:', error);
                reject(error);
              }
            });
          });
        }

        // Submit attendance record
        submitAttendance({
          workerId: workerId || '',
          classId: selectedClass,
          month: formattedMonth,
          studentAttendanceDoc,
          workerAttendanceDoc,
          controlDoc,
        });

        handleCloseAttendanceDialog();
      } catch (error) {
        console.error('Error submitting attendance:', error);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !workerId) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', workerId);
    formData.append('documentType', documentType as string);
    if (expirationDate) {
      formData.append('expiryDate', expirationDate.toISOString());
    }
    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType("NULL");
        setExpirationDate(null);
        setIsPersonalDocDialogOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDelete = (docId: string) => {
    deleteDocument(docId);
  };

  return (
    <Box p={4} >

      {/* Monthly Attendance Dialog */}
      <Dialog 
        open={isAttendanceDialogOpen} 
        onClose={handleCloseAttendanceDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>דיווח נוכחות חודשית</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="בחר חודש"
                  value={selectedMonth}
                  onChange={(newValue) => setSelectedMonth(newValue)}
                  views={['month', 'year']}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete<Class>
                options={allClasses || []}
                getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                value={allClasses?.find((cls: Class) => cls._id === selectedClass) || null}
                onChange={(_, newValue) => setSelectedClass(newValue?._id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="בחר כיתה"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                מסמכי נוכחות
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type="file"
                label="נוכחות תלמידים"
                fullWidth
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setStudentAttendanceFile(file);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type="file"
                label="נוכחות עובד"
                fullWidth
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setWorkerAttendanceFile(file);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                type="file"
                label="מסמך בקרה (אופציונלי)"
                fullWidth
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setControlFile(file);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAttendanceDialog}>ביטול</Button>
          <Button 
            onClick={handleSubmitAttendance}
            variant="contained"
            disabled={!selectedMonth || !selectedClass || !studentAttendanceFile || !workerAttendanceFile}
          >
            שלח דיווח
          </Button>
        </DialogActions>
      </Dialog>

      {/* Personal Document Dialog */}
      <Dialog open={isPersonalDocDialogOpen} onClose={() => setIsPersonalDocDialogOpen(false)}>
        <DialogTitle>העלאת מסמך אישי לעובד</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              size="small"
              label="סוג מסמך"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as unknown as DocumentType)}
              sx={{ minWidth: 150 }}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value} disabled={type.value === "NULL"}>{type.label}</MenuItem>
              ))}
            </TextField>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<CloudUploadIcon />}
            >
              {selectedFile ? selectedFile.name : 'בחר קובץ'}
            </Button>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="  תוקף (אופציונלי)"
                value={expirationDate}
                onChange={(newValue) => setExpirationDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPersonalDocDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || documentType === "NULL"}
          >
            העלה
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ marginLeft: drawerOpen ? '180px' : 0,  transition: 'margin 0.3s' }}>

        {selectedTab === 'documents' ? (
          // Documents Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              ניהול מסמכים לעובד
            </Typography>

            {workerData && (
              <Box mb={3}>
                <Typography variant="subtitle1">
                  <strong>שם מלא:</strong> {workerData.lastName} {workerData.firstName}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>תעודת זהות:</strong> {workerData.id}
                </Typography>
              </Box>
            )}
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}

            {documents && (
              <>
              <Box>
                <Typography variant="h6" gutterBottom>
                  מסמכים חסרים:
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                {[{ tag: 'אישור משטרה', label: 'אישור משטרה' },
                  { tag: 'תעודת הוראה', label: 'תעודת הוראה' },
                ].map(({ tag, label }) => {
                  const hasDoc = documents.some(doc => doc.tag === tag && doc.status === 'מאושר');
                  return !hasDoc ? (
                    <Tooltip title={`חסר ${label}`}>
                      <Typography key={tag} variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarningAmberIcon fontSize="small" />
                        {label}
                      </Typography>
                    </Tooltip>
                  ) : null;
                })}
              </Stack>
              </>
            )}
            <Stack spacing={2} mt={3}>
              <Box m={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsPersonalDocDialogOpen(true)}
                >
                  העלאת מסמכים אישיים
                </Button>
              </Box>
              <WorkerPersonalDocuments
                documents={documents}
                handleStatusUpdate={handleStatusUpdate}
                handleDelete={handleDelete}
              />
              <Box m={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenAttendanceDialog}
                >
                  דיווח נוכחות חודשית
                </Button>
              </Box>
              <WorkerAttendanceDocuments
                attendanceData={attendanceData}
                isAttendanceLoading={isAttendanceLoading}
                workerClasses={allClasses}
              />
            </Stack>
          </Box>
        ) : (
          // Personal Tab
          <Box>
            <WorkerPersonalDetails workerData={workerData} classes={allClasses} />
          </Box>          
        )}
      </Box>

      {/* Drawer for switching between tabs */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: 150,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 150,
            top: '115px',
          },
        }}
      >
        <Divider />
        <List>          
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'personal'} onClick={() => setSelectedTab('personal')}>
              <ListItemText primary="פרטים אישיים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'documents'} onClick={() => setSelectedTab('documents')}>
              <ListItemText primary="מסמכים" />
            </ListItemButton>
          </ListItem>

        </List>
      </Drawer>
    </Box>
  );
};

export default WorkerDocumentsApprovalPage;