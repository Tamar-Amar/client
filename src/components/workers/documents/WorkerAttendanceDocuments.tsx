import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  Tooltip, 
  IconButton, 
  CircularProgress, 
  Card,
  CardContent,
  Grid,
  Chip,
  Container,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import UploadIcon from '@mui/icons-material/Upload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Class } from '../../../types';
import { useWorkerDocuments } from '../../../queries/useDocuments';
import { useAttendance } from '../../../queries/useAttendance';
import { attendanceService } from '../../../services/attendanceService';
import { useFetchWorkerAfterNoon } from '../../../queries/workerAfterNoonQueries';
import { userRoleState } from '../../../recoil/storeAtom';
import { DocumentStatus } from '../../../types/Document';
import ConfirmationDialog from '../../other/ConfirmationDialog';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { format } from 'date-fns';
import Autocomplete from '@mui/material/Autocomplete';

interface AttendanceDocument {
  _id: string;
  url: string;
  status: DocumentStatus;
  fileName: string;
}

interface AttendanceRecord {
  _id: string;
  workerId: string;
  classId: string | { _id: string; name?: string; uniqueSymbol?: string };
  month: string;
  studentAttendanceDoc: AttendanceDocument | null;
  workerAttendanceDoc: AttendanceDocument | null;
  controlDoc: AttendanceDocument | null;
}

interface WorkerAttendanceDocumentsProps {
  attendanceData: AttendanceRecord[];
  isAttendanceLoading: boolean;
  workerClasses: Class[];
  workerId: string;
}

const statusMap: Record<DocumentStatus, { label: string; color: 'warning' | 'success' | 'error' | 'primary' | 'info'; icon: JSX.Element; }> = {
  [DocumentStatus.PENDING]: { label: 'ממתין', color: 'warning', icon: <HourglassEmptyIcon /> },
  [DocumentStatus.APPROVED]: { label: 'מאושר', color: 'success', icon: <CheckCircleIcon /> },
  [DocumentStatus.REJECTED]: { label: 'נדחה', color: 'error', icon: <CancelIcon /> },
  [DocumentStatus.EXPIRED]: { label: 'פג תוקף', color: 'error', icon: <CancelIcon /> },
};

const getCombinedStatus = (record: AttendanceRecord) => {
  const docs = [record.studentAttendanceDoc, record.workerAttendanceDoc];
  
  if (!record.studentAttendanceDoc || !record.workerAttendanceDoc) {
    return { text: 'דיווח חסר', color: 'warning' as const, icon: <WarningIcon /> };
  }
  
  if (docs.some(doc => doc?.status === DocumentStatus.REJECTED || doc?.status === DocumentStatus.EXPIRED)) {
    return { text: 'דיווח נדחה', color: 'error' as const, icon: <HighlightOffIcon /> };
  }

  if (docs.every(doc => doc?.status === DocumentStatus.APPROVED)) {
    return { text: 'דיווח מאושר', color: 'success' as const, icon: <VerifiedIcon /> };
  }

  return { text: 'ממתין לאישור', color: 'primary' as const, icon: <HourglassEmptyIcon /> };
};

const DocumentActions = ({ doc, onUpdateStatus, onDelete, userRole }: { doc: AttendanceDocument, onUpdateStatus: (id: string, status: DocumentStatus) => void, onDelete: () => void, userRole: string | null }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (userRole === 'worker') return null;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (status: DocumentStatus) => {
    onUpdateStatus(doc._id, status);
    handleClose();
  };
  
  const isApproved = doc.status === DocumentStatus.APPROVED;

  return (
    <>
      <IconButton size="small" onClick={handleMenu} disabled={isApproved}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleAction(DocumentStatus.APPROVED)} disabled={isApproved}>
          <CheckCircleIcon color="success" sx={{ mr: 1 }} /> אישור
        </MenuItem>
        <MenuItem onClick={() => handleAction(DocumentStatus.REJECTED)} disabled={isApproved}>
          <CancelIcon color="error" sx={{ mr: 1 }} /> דחייה
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); handleClose(); }} disabled={isApproved}>
          <DeleteIcon color="action" sx={{ mr: 1 }} /> מחיקה
        </MenuItem>
      </Menu>
    </>
  );
};

const WorkerAttendanceDocuments: React.FC<WorkerAttendanceDocumentsProps> = ({ 
  attendanceData, 
  isAttendanceLoading, 
  workerClasses,
  workerId
}) => {
  const userRole = useRecoilValue(userRoleState);
  const [deletingDocIds, setDeletingDocIds] = useState<Set<string>>(new Set());
  const [deletingMonths, setDeletingMonths] = useState<Set<string>>(new Set());
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: () => {},
  });
  const { deleteDocument, uploadDocument, updateStatus } = useWorkerDocuments(workerId);
  const { data: workerData } = useFetchWorkerAfterNoon(workerId);
  const { deleteAttendance, submitAttendance } = useAttendance(workerId);

  // State for the new dialog
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentAttendanceFile, setStudentAttendanceFile] = useState<File | null>(null);
  const [workerAttendanceFile, setWorkerAttendanceFile] = useState<File | null>(null);
  const [controlFile, setControlFile] = useState<File | null>(null);

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
        
        const existingRecord = attendanceData?.find((record: AttendanceRecord) => {
          const recordMonth = format(new Date(record.month), 'yyyy-MM');
          const recordClassId = typeof record.classId === 'string' ? record.classId : record.classId._id;
          return recordMonth === formattedMonth && recordClassId === selectedClass;
        });

        if (existingRecord) {
          if (!window.confirm(`קיים כבר דיווח נוכחות...`)) {
            return;
          }
        }
        
        let studentAttendanceDocId: string | undefined;
        let workerAttendanceDocId: string | undefined;
        let controlDocId: string | undefined;

        if (studentAttendanceFile) {
          studentAttendanceDocId = await handleFileUpload(studentAttendanceFile, 'נוכחות תלמידים');
        }
        if (workerAttendanceFile) {
            workerAttendanceDocId = await handleFileUpload(workerAttendanceFile, 'נוכחות עובדים');
        }
        if (controlFile) {
            controlDocId = await handleFileUpload(controlFile, 'מסמך בקרה');
        }

        submitAttendance({
          workerId: workerId,
          classId: selectedClass,
          month: formattedMonth,
          studentAttendanceDoc: studentAttendanceDocId,
          workerAttendanceDoc: workerAttendanceDocId,
          controlDoc: controlDocId,
        });

        handleCloseAttendanceDialog();
      } catch (error) {
        console.error('Error submitting attendance:', error);
      }
    }
  };
  
  const handleFileUpload = (file: File, tag: string): Promise<string> => {
      return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('workerId', workerId);
          formData.append('tag', tag);
          formData.append('documentType', tag);
          formData.append('tz', workerData?.id as string);
          
          uploadDocument(formData, {
              onSuccess: (response) => resolve(response._id),
              onError: (error) => reject(error)
          });
      });
  };

  const handleStatusUpdate = (docId: string, status: DocumentStatus) => {
    updateStatus({ documentId: docId, status });
  };

  const handleDelete = (docId: string, month: string, classId: string, fileName: string) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'אישור מחיקת מסמך',
      content: `האם אתה בטוח שברצונך למחוק את המסמך "${fileName}"? לא ניתן לשחזר פעולה זו.`,
      onConfirm: () => {
        setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
        setDeletingDocIds(prev => new Set([...prev, docId]));
        
        deleteDocument(docId, {
          onSuccess: async () => {
            const record = attendanceData.find(r => {
              const recordMonth = new Date(r.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
              const recordClassId = typeof r.classId === 'string' ? r.classId : r.classId._id;
              return recordMonth === month && recordClassId === classId;
            });

            if (record) {
              let docType = '';
              if (record.studentAttendanceDoc?._id === docId) {
                docType = 'studentAttendanceDoc';
              } else if (record.workerAttendanceDoc?._id === docId) {
                docType = 'workerAttendanceDoc';
              } else if (record.controlDoc?._id === docId) {
                docType = 'controlDoc';
              }

              if (docType) {
                await attendanceService.updateAttendanceAfterDocDelete(record._id, docType);
              }
            }
          },
          onSettled: () => {
            setDeletingDocIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(docId);
              return newSet;
            });
          }
        });
      }
    });
  };

  const handleDeleteMonth = (month: string, classId: string) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'אישור מחיקת דיווח חודשי',
      content: `האם אתה בטוח שברצונך למחוק את כל דיווח הנוכחות לחודש ${month}? פעולה זו תמחק את כל המסמכים המשויכים.`,
      onConfirm: () => {
        setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
        const record = attendanceData.find(r => {
          const recordMonth = new Date(r.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
          const recordClassId = typeof r.classId === 'string' ? r.classId : r.classId._id;
          return recordMonth === month && recordClassId === classId;
        });
        if (record) {
          setDeletingMonths(prev => new Set([...prev, month]));
          deleteAttendance(record._id, {
            onSettled: () => {
              setDeletingMonths(prev => {
                const newSet = new Set(prev);
                newSet.delete(month);
                return newSet;
              });
            }
          });
        }
      }
    });
  };

  const handleUploadDocument = async (file: File, attendanceId: string, docType: string) => {
    setUploadingDocs(prev => new Set([...prev, `${attendanceId}-${docType}`]));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workerId', workerId);
    const formattedDocType = docType === 'studentAttendanceDoc' ? 'נוכחות תלמידים' : docType === 'workerAttendanceDoc' ? 'נוכחות עובדים' : 'מסמך בקרה';
    formData.append('tag', formattedDocType);
    formData.append('documentType', formattedDocType);

    formData.append('tz', workerData?.id as string);

    uploadDocument(formData, {
      onSuccess: async (response) => {
        const documentId = response._id;
        await attendanceService.updateAttendanceAttendanceDoc(attendanceId, docType, documentId);
      },
      onError: (error) => {
        console.error('Error uploading document:', error);
      },
      onSettled: () => {
        setUploadingDocs(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${attendanceId}-${docType}`);
          return newSet;
        });
      }
    });
  };

  // Calculate statistics
  const totalRecords = attendanceData?.length || 0;
  const approvedRecords = attendanceData?.filter(r => getCombinedStatus(r).text === 'דיווח מאושר').length || 0;
  const pendingRecords = totalRecords - approvedRecords;

  if (isAttendanceLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px',
        bgcolor: '#fafafa',
        borderRadius: 3,
        border: '2px dashed #ccc'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <ConfirmationDialog
        open={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        contentText={confirmationDialog.content}
      />

      <Dialog open={isAttendanceDialogOpen} onClose={handleCloseAttendanceDialog} maxWidth="md" fullWidth>
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
                options={workerClasses || []}
                getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                value={workerClasses?.find((cls: Class) => cls._id === selectedClass) || null}
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
          <Button onClick={handleSubmitAttendance} variant="contained" disabled={!selectedMonth || !selectedClass || !studentAttendanceFile || !workerAttendanceFile}>
            שלח דיווח
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#e3f2fd', 
            border: '2px solid #2196f3',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {totalRecords}
              </Typography>
              <Typography variant="body2" color="primary.dark">
                סך הכל דיווחים חודשיים
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#e8f5e9', 
            border: '2px solid #4caf50',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {approvedRecords}
              </Typography>
              <Typography variant="body2" color="success.dark">
                דיווחים מאושרים
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#fff8e1', 
            border: '2px solid #ff9800',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {pendingRecords}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                דיווחים להשלמה/בבדיקה
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 3,
        boxShadow: 3,
        bgcolor: '#fafafa'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="div" sx={{ 
            color: '#1976d2', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AssignmentIcon color="primary" />
            מסמכי נוכחות צהרון
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpenAttendanceDialog}>
            דיווח נוכחות חודשי
          </Button>
        </Box>

        {attendanceData && attendanceData.length > 0 ? (
          Object.entries(
            (attendanceData as AttendanceRecord[]).reduce((acc: { [key: string]: AttendanceRecord[] }, record: AttendanceRecord) => {
              const month = new Date(record.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
              if (!acc[month]) acc[month] = [];
              acc[month].push(record);
              return acc;
            }, {})
          ).map(([month, monthRecords]: [string, AttendanceRecord[]]) => (
            <Card key={month} sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: 2,
              bgcolor: 'white',
              border: '1px solid #e0e0e0'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  pb: 2,
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AssignmentIcon color="primary" />
                    {month}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {Object.entries(
                    monthRecords.reduce((acc: { [key: string]: AttendanceRecord[] }, record: AttendanceRecord) => {
                      const classIdKey = typeof record.classId === 'string' ? record.classId : record.classId._id;
                      if (!acc[classIdKey]) acc[classIdKey] = [];
                      acc[classIdKey].push(record);
                      return acc;
                    }, {})
                  ).map(([classId, classRecords]: [string, AttendanceRecord[]]) => {
                    const className = typeof classRecords[0]?.classId === 'object'
                      ? (classRecords[0]?.classId as { name?: string }).name
                      : workerClasses?.find((c: Class) => c._id === classId)?.name || 'כיתה לא ידועה';
                    const classSymbol = typeof classRecords[0]?.classId === 'object'
                      ? (classRecords[0]?.classId as { uniqueSymbol?: string }).uniqueSymbol
                      : '';

                    const combinedStatus = getCombinedStatus(classRecords[0]);

                    return (
                      <Box key={classId} sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        border: `2px solid`,
                        borderColor: `${combinedStatus.color}.main`,
                        position: 'relative'
                      }}>
                        {/* Header */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          mb: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={`${className} (${classSymbol})`}
                              color={combinedStatus.color as any}
                              variant="filled"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Chip
                              label={combinedStatus.text}
                              color={combinedStatus.color as any}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <Tooltip title="מחק נוכחות לחודש זה">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteMonth(month, classId)}
                              disabled={userRole === 'worker' || deletingMonths.has(month)}
                              sx={{ 
                                bgcolor: '#ffebee',
                                '&:hover': { bgcolor: '#ffcdd2' }
                              }}
                            >
                              {deletingMonths.has(month) ? (
                                <CircularProgress size={20} />
                              ) : (
                                <HighlightOffIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Documents Grid */}
                        <Grid container spacing={2}>
                          {/* Student Attendance */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ 
                              border: `1px solid`,
                              borderColor: classRecords[0]?.studentAttendanceDoc ? statusMap[classRecords[0].studentAttendanceDoc.status].color + '.main' : 'grey.300',
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <SchoolIcon color={classRecords[0]?.studentAttendanceDoc ? statusMap[classRecords[0].studentAttendanceDoc.status].color : "disabled"} />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      נוכחות תלמידים
                                    </Typography>
                                  </Box>
                                  {classRecords[0]?.studentAttendanceDoc && <Chip size="small" label={statusMap[classRecords[0].studentAttendanceDoc.status].label} color={statusMap[classRecords[0].studentAttendanceDoc.status].color} />}
                                </Box>
                                {classRecords[0]?.studentAttendanceDoc ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Tooltip title="צפייה במסמך">
                                      <Button startIcon={<VisibilityIcon />} size="small" onClick={() => window.open(classRecords[0].studentAttendanceDoc?.url || '', '_blank')}>
                                        צפייה
                                      </Button>
                                    </Tooltip>
                                    <DocumentActions
                                      doc={classRecords[0].studentAttendanceDoc}
                                      onUpdateStatus={handleStatusUpdate}
                                      onDelete={() => handleDelete(classRecords[0].studentAttendanceDoc!._id, month, classId, classRecords[0].studentAttendanceDoc!.fileName)}
                                      userRole={userRole}
                                    />
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                      accept="application/pdf,image/*"
                                      style={{ display: 'none' }}
                                      id={`upload-student-${classRecords[0]._id}`}
                                      type="file"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleUploadDocument(file, classRecords[0]._id, 'studentAttendanceDoc');
                                        }
                                      }}
                                    />
                                    <label htmlFor={`upload-student-${classRecords[0]._id}`}>
                                      <Tooltip title="העלה מסמך">
                                        <IconButton 
                                          size="small"
                                          color="primary" 
                                          component="span"
                                          disabled={uploadingDocs.has(`${classRecords[0]._id}-studentAttendanceDoc`)}
                                          sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                        >
                                          {uploadingDocs.has(`${classRecords[0]._id}-studentAttendanceDoc`) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <UploadIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </label>
                                    <Typography variant="caption" color="warning.main">
                                      חסר
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* Worker Attendance */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ 
                              border: `1px solid`,
                              borderColor: classRecords[0]?.workerAttendanceDoc ? statusMap[classRecords[0].workerAttendanceDoc.status].color + '.main' : 'grey.300',
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <PersonIcon color={classRecords[0]?.workerAttendanceDoc ? statusMap[classRecords[0].workerAttendanceDoc.status].color : "disabled"} />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      נוכחות עובדים
                                    </Typography>
                                  </Box>
                                  {classRecords[0]?.workerAttendanceDoc && <Chip size="small" label={statusMap[classRecords[0].workerAttendanceDoc.status].label} color={statusMap[classRecords[0].workerAttendanceDoc.status].color} />}
                                </Box>
                                {classRecords[0]?.workerAttendanceDoc ? (
                                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Tooltip title="צפייה במסמך">
                                      <Button startIcon={<VisibilityIcon />} size="small" onClick={() => window.open(classRecords[0].workerAttendanceDoc?.url || '', '_blank')}>
                                        צפייה
                                      </Button>
                                    </Tooltip>
                                    <DocumentActions
                                      doc={classRecords[0].workerAttendanceDoc}
                                      onUpdateStatus={handleStatusUpdate}
                                      onDelete={() => handleDelete(classRecords[0].workerAttendanceDoc!._id, month, classId, classRecords[0].workerAttendanceDoc!.fileName)}
                                      userRole={userRole}
                                    />
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                      accept="application/pdf,image/*"
                                      style={{ display: 'none' }}
                                      id={`upload-worker-${classRecords[0]._id}`}
                                      type="file"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleUploadDocument(file, classRecords[0]._id, 'workerAttendanceDoc');
                                        }
                                      }}
                                    />
                                    <label htmlFor={`upload-worker-${classRecords[0]._id}`}>
                                      <Tooltip title="העלה מסמך">
                                        <IconButton 
                                          size="small"
                                          color="primary" 
                                          component="span"
                                          disabled={uploadingDocs.has(`${classRecords[0]._id}-workerAttendanceDoc`)}
                                          sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                        >
                                          {uploadingDocs.has(`${classRecords[0]._id}-workerAttendanceDoc`) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <UploadIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </label>
                                    <Typography variant="caption" color="warning.main">
                                      חסר
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>

                          {/* Control Document */}
                          <Grid item xs={12} md={4}>
                            <Card sx={{ 
                              border: `1px solid`,
                              borderColor: classRecords[0]?.controlDoc ? statusMap[classRecords[0].controlDoc.status].color + '.main' : 'grey.300',
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <VerifiedIcon color={classRecords[0]?.controlDoc ? statusMap[classRecords[0].controlDoc.status].color : "disabled"} />
                                    <Typography variant="subtitle2" fontWeight="bold" color={classRecords[0]?.controlDoc ? "success.main" : "text.secondary"}>
                                      מסמך בקרה
                                    </Typography>
                                  </Box>
                                  {classRecords[0]?.controlDoc && <Chip size="small" label={statusMap[classRecords[0].controlDoc.status].label} color={statusMap[classRecords[0].controlDoc.status].color} />}
                                </Box>
                                {classRecords[0]?.controlDoc ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="צפייה במסמך">
                                      <Button startIcon={<VisibilityIcon />} size="small" onClick={() => window.open(classRecords[0].controlDoc?.url || '', '_blank')}>
                                        צפייה
                                      </Button>
                                    </Tooltip>
                                    <DocumentActions
                                      doc={classRecords[0].controlDoc}
                                      onUpdateStatus={handleStatusUpdate}
                                      onDelete={() => handleDelete(classRecords[0].controlDoc!._id, month, classId, classRecords[0].controlDoc!.fileName)}
                                      userRole={userRole}
                                    />
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                      accept="application/pdf,image/*"
                                      style={{ display: 'none' }}
                                      id={`upload-control-${classRecords[0]._id}`}
                                      type="file"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleUploadDocument(file, classRecords[0]._id, 'controlDoc');
                                        }
                                      }}
                                    />
                                    <label htmlFor={`upload-control-${classRecords[0]._id}`}>
                                      <Tooltip title="העלה מסמך (אופציונלי)">
                                        <IconButton 
                                          size="small"
                                          color="primary" 
                                          component="span"
                                          disabled={uploadingDocs.has(`${classRecords[0]._id}-controlDoc`)}
                                          sx={{ bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#e0e0e0' } }}
                                        >
                                          {uploadingDocs.has(`${classRecords[0]._id}-controlDoc`) ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <UploadIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </label>
                                    <Typography variant="caption" color="text.secondary">
                                      אופציונלי
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          ))
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            bgcolor: 'white',
            borderRadius: 2,
            border: '2px dashed #ccc'
          }}>
            <AssignmentIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              אין מסמכי נוכחות
            </Typography>
            <Typography variant="body2" color="text.secondary">
              יש להעלות דיווחי נוכחות חודשיים
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default WorkerAttendanceDocuments; 