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
  Container
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
import { Class } from '../../../types';
import { useWorkerDocuments } from '../../../queries/useDocuments';
import { useAttendance } from '../../../queries/useAttendance';
import { attendanceService } from '../../../services/attendanceService';
import { useFetchWorkerAfterNoon } from '../../../queries/workerAfterNoonQueries';
import { userRoleState } from '../../../recoil/storeAtom';

interface AttendanceRecord {
  _id: string;
  workerId: string;
  classId: string | { _id: string; name?: string; uniqueSymbol?: string };
  month: string;
  studentAttendanceDoc: any;
  workerAttendanceDoc: any;
  controlDoc: any;
}

interface WorkerAttendanceDocumentsProps {
  attendanceData: AttendanceRecord[];
  isAttendanceLoading: boolean;
  workerClasses: Class[];
}

const WorkerAttendanceDocuments: React.FC<WorkerAttendanceDocumentsProps> = ({ 
  attendanceData, 
  isAttendanceLoading, 
  workerClasses
}) => {
  const userRole = useRecoilValue(userRoleState);
  const [deletingDocIds, setDeletingDocIds] = useState<Set<string>>(new Set());
  const [deletingMonths, setDeletingMonths] = useState<Set<string>>(new Set());
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const workerId = attendanceData?.[0]?.workerId || '';
  const { deleteDocument, uploadDocument, isUploading } = useWorkerDocuments(workerId);
  const { data: workerData } = useFetchWorkerAfterNoon(workerId);
  const { deleteAttendance, isDeleting } = useAttendance(workerId);

  const handleDelete = (docId: string, month: string, classId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) {
      setDeletingDocIds(prev => new Set([...prev, docId]));
      
      deleteDocument(docId, {
        onSuccess: async () => {
          // Find the attendance record
          const record = attendanceData.find(r => {
            const recordMonth = new Date(r.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
            const recordClassId = typeof r.classId === 'string' ? r.classId : r.classId._id;
            return recordMonth === month && recordClassId === classId;
          });

          if (record) {
            // Determine which document type was deleted
            let docType = '';
            if (record.studentAttendanceDoc?._id === docId) {
              docType = 'studentAttendanceDoc';
            } else if (record.workerAttendanceDoc?._id === docId) {
              docType = 'workerAttendanceDoc';
            } else if (record.controlDoc?._id === docId) {
              docType = 'controlDoc';
            }

            if (docType) {
              // Update the attendance record to remove the document reference
              await attendanceService.updateAttendanceAfterDocDelete(record._id, docType);
            }

            // Check if all documents for this month and class are deleted
            const hasRemainingDocs = record.studentAttendanceDoc || record.workerAttendanceDoc || record.controlDoc;
            if (!hasRemainingDocs) {
              handleDeleteMonth(month, classId);
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
  };

  const handleDeleteMonth = (month: string, classId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל רשום הנוכחות לחודש זה?')) {
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
  const completeRecords = attendanceData?.filter(record => 
    record.studentAttendanceDoc && record.workerAttendanceDoc
  ).length || 0;
  const incompleteRecords = totalRecords - completeRecords;

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
                סך הכל דיווחים
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
                {completeRecords}
              </Typography>
              <Typography variant="body2" color="success.dark">
                דיווחים מלאים
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
                {incompleteRecords}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                דיווחים חלקיים
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
        <Typography variant="h5" gutterBottom sx={{ 
          color: '#1976d2', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3
        }}>
          <AssignmentIcon color="primary" />
          מסמכי נוכחות צהרון
        </Typography>

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

                    const hasAllDocs = classRecords[0]?.studentAttendanceDoc && classRecords[0]?.workerAttendanceDoc;

                    return (
                      <Box key={classId} sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: hasAllDocs ? '#f8f9fa' : '#fff3e0',
                        border: `2px solid ${hasAllDocs ? '#e8f5e9' : '#ff9800'}`,
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
                              color={hasAllDocs ? "success" : "warning"}
                              variant="filled"
                              icon={hasAllDocs ? <VerifiedIcon /> : <WarningIcon />}
                              sx={{ fontWeight: 'bold' }}
                            />
                            {hasAllDocs && (
                              <Chip
                                label="מלא"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
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
                              bgcolor: classRecords[0]?.studentAttendanceDoc ? '#e8f5e9' : '#fff8e1',
                              border: `2px solid ${classRecords[0]?.studentAttendanceDoc ? '#4caf50' : '#ff9800'}`,
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <SchoolIcon color={classRecords[0]?.studentAttendanceDoc ? "success" : "warning"} />
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    נוכחות תלמידים
                                  </Typography>
                                </Box>
                                {classRecords[0]?.studentAttendanceDoc ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="צפייה במסמך">
                                      <IconButton 
                                        size="small"
                                        onClick={() => window.open(classRecords[0].studentAttendanceDoc?.url || '', '_blank')}
                                        sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                      >
                                        <VisibilityIcon color="primary" fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="מחק מסמך">
                                      <IconButton 
                                        size="small"
                                        color="error" 
                                        onClick={() => handleDelete(classRecords[0].studentAttendanceDoc?._id, month, classId)}
                                        disabled={userRole === 'worker' || deletingDocIds.has(classRecords[0].studentAttendanceDoc?._id)}
                                        sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                                      >
                                        {deletingDocIds.has(classRecords[0].studentAttendanceDoc?._id) ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <DeleteIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Tooltip>
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
                              bgcolor: classRecords[0]?.workerAttendanceDoc ? '#e8f5e9' : '#fff8e1',
                              border: `2px solid ${classRecords[0]?.workerAttendanceDoc ? '#4caf50' : '#ff9800'}`,
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <PersonIcon color={classRecords[0]?.workerAttendanceDoc ? "success" : "warning"} />
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    נוכחות עובד
                                  </Typography>
                                </Box>
                                {classRecords[0]?.workerAttendanceDoc ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="צפייה במסמך">
                                      <IconButton 
                                        size="small"
                                        onClick={() => window.open(classRecords[0].workerAttendanceDoc?.url || '', '_blank')}
                                        sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                      >
                                        <VisibilityIcon color="primary" fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="מחק מסמך">
                                      <IconButton 
                                        size="small"
                                        color="error" 
                                        onClick={() => handleDelete(classRecords[0].workerAttendanceDoc?._id, month, classId)}
                                        disabled={userRole === 'worker' || deletingDocIds.has(classRecords[0].workerAttendanceDoc?._id)}
                                        sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                                      >
                                        {deletingDocIds.has(classRecords[0].workerAttendanceDoc?._id) ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <DeleteIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Tooltip>
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
                              bgcolor: classRecords[0]?.controlDoc ? '#e8f5e9' : '#f5f5f5',
                              border: `2px solid ${classRecords[0]?.controlDoc ? '#4caf50' : '#e0e0e0'}`,
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <VerifiedIcon color={classRecords[0]?.controlDoc ? "success" : "disabled"} />
                                  <Typography variant="subtitle2" fontWeight="bold" color={classRecords[0]?.controlDoc ? "success.main" : "text.secondary"}>
                                    מסמך בקרה
                                  </Typography>
                                </Box>
                                {classRecords[0]?.controlDoc ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="צפייה במסמך">
                                      <IconButton 
                                        size="small"
                                        onClick={() => window.open(classRecords[0].controlDoc?.url || '', '_blank')}
                                        sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                      >
                                        <VisibilityIcon color="primary" fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="מחק מסמך">
                                      <IconButton 
                                        size="small"
                                        color="error" 
                                        onClick={() => handleDelete(classRecords[0].controlDoc?._id, month, classId)}
                                        disabled={userRole === 'worker' || deletingDocIds.has(classRecords[0].controlDoc?._id)}
                                        sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                                      >
                                        {deletingDocIds.has(classRecords[0].controlDoc?._id) ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <DeleteIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Tooltip>
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