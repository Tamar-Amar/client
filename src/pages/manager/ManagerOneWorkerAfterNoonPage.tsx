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
  const [selectedTab, setSelectedTab] = useState<'documents' | 'personal' | 'afternoon-documents' | 'hanukah-camp' | 'passover-camp' | 'summer-camp'>('personal');
  const [drawerOpen, setDrawerOpen] = useState(true);

  // בדיקה אם העובד שייך לפרויקט צהרון
  const isAfterNoonWorker = workerData?.isAfterNoon;

  // אם העובד לא שייך לפרויקט צהרון, נחזור לטאב פרטים אישיים
  React.useEffect(() => {
    if (!isAfterNoonWorker && selectedTab === 'afternoon-documents') {
      setSelectedTab('personal');
    }
  }, [isAfterNoonWorker, selectedTab]);

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

      <Box sx={{ marginLeft:'180px',  transition: 'margin 0.3s' }}>

        {selectedTab === 'documents' ? (
          // Personal Documents Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              ניהול מסמכים אישיים לעובד
            </Typography>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}

            <Stack spacing={2} mt={3} >
              <WorkerPersonalDocuments
                documents={documents}
                handleStatusUpdate={handleStatusUpdate}
                handleDelete={handleDelete}
                is101={workerData?.is101 || false}
                workerId={workerId || ''}
                workerTz={workerData?.id || ''}
              />
            </Stack>
          </Box>
        ) : selectedTab === 'personal' ? (
          // Personal Tab

            <WorkerPersonalDetails workerData={workerData} classes={allClasses} />     
        ) : selectedTab === 'hanukah-camp' ? (
          // Hanukah Camp Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              קייטנת חנוכה
            </Typography>
            <Typography variant="body1" color="text.secondary">
              תוכן קייטנת חנוכה יוצג כאן
            </Typography>
          </Box>
        ) : selectedTab === 'passover-camp' ? (
          // Passover Camp Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              קייטנת פסח
            </Typography>
            <Typography variant="body1" color="text.secondary">
              תוכן קייטנת פסח יוצג כאן
            </Typography>
          </Box>
        ) : selectedTab === 'summer-camp' ? (
          // Summer Camp Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              קייטנת קיץ
            </Typography>
            <Typography variant="body1" color="text.secondary">
              תוכן קייטנת קיץ יוצג כאן
            </Typography>
          </Box>
        ) : (
          // Afternoon Documents Tab
          <Box>
            <Typography variant="h5" gutterBottom>
              ניהול מסמכי צהרון
            </Typography>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}

            <Stack spacing={2} mt={3} >
              <Box m={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenAttendanceDialog}
                >
                  דיווח נוכחות חודשי
                </Button>
              </Box>
              <WorkerAttendanceDocuments
                attendanceData={attendanceData}
                isAttendanceLoading={isAttendanceLoading}
                workerClasses={allClasses}
              />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Drawer for switching between tabs */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: '10%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '10%',
            top: '65px',
          },
        }}
      >
        <List> 
          <ListItem>
            <ListItemText 
              primary={`${workerData?.firstName} ${workerData?.lastName}`}
              secondary={`תעודת זהות: ${workerData?.id}`}
            />
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'personal'} onClick={() => setSelectedTab('personal')}>
              <ListItemText primary="פרטים אישיים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={selectedTab === 'documents'} onClick={() => setSelectedTab('documents')}>
              <ListItemText primary="מסמכים אישיים" />
            </ListItemButton>
          </ListItem>
          {workerData?.isAfterNoon && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'afternoon-documents'} onClick={() => setSelectedTab('afternoon-documents')}>
                <ListItemText primary="מסמכי צהרון" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isHanukaCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'hanukah-camp'} onClick={() => setSelectedTab('hanukah-camp')}>
                <ListItemText primary="קייטנת חנוכה" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isPassoverCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'passover-camp'} onClick={() => setSelectedTab('passover-camp')}>
                <ListItemText primary="קייטנת פסח" />
              </ListItemButton>
            </ListItem>
          )}
          {workerData?.isSummerCamp && (
            <ListItem disablePadding>
              <ListItemButton selected={selectedTab === 'summer-camp'} onClick={() => setSelectedTab('summer-camp')}>
                <ListItemText primary="קייטנת קיץ" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>
    </Box>
  );
};

export default WorkerDocumentsApprovalPage;