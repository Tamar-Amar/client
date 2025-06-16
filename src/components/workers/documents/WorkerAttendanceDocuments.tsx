import React, { useState } from 'react';
import { Paper, Typography, Box, Stack, Tooltip, IconButton, CircularProgress, Divider } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Class } from '../../../types';
import { useWorkerDocuments } from '../../../queries/useDocuments';
import { useAttendance } from '../../../queries/useAttendance';
import UploadIcon from '@mui/icons-material/Upload';
import { attendanceService } from '../../../services/attendanceService';

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
  const [deletingDocIds, setDeletingDocIds] = useState<Set<string>>(new Set());
  const [deletingMonths, setDeletingMonths] = useState<Set<string>>(new Set());
  const workerId = attendanceData?.[0]?.workerId || '';
  const { deleteDocument, uploadDocument } = useWorkerDocuments(workerId);
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workerId', workerId);
    formData.append('tag', docType);
    formData.append('documentType', docType);

    uploadDocument(formData, {
      onSuccess: async (response) => {
        const documentId = response._id;
        await attendanceService.updateAttendanceAttendanceDoc(attendanceId,docType, documentId);
      },
      onError: (error) => {
        console.error('Error uploading document:', error);
      }
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        מסמכי נוכחות
      </Typography>
      {isAttendanceLoading ? (
        <CircularProgress />
      ) : attendanceData && attendanceData.length > 0 ? (
        Object.entries(
          (attendanceData as AttendanceRecord[]).reduce((acc: { [key: string]: AttendanceRecord[] }, record: AttendanceRecord) => {
            const month = new Date(record.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
            if (!acc[month]) acc[month] = [];
            acc[month].push(record);
            return acc;
          }, {})
        ).map(([month, monthRecords]: [string, AttendanceRecord[]]) => (
          <Box key={month} sx={{ mb: 2 }}>
            <Stack spacing={1}>
              {Object.entries(
                monthRecords.reduce((acc: { [key: string]: AttendanceRecord[] }, record: AttendanceRecord) => {
                  console.log("record", record);
                  const classIdKey = typeof record.classId === 'string' ? record.classId : record.classId._id;
                  if (!acc[classIdKey]) acc[classIdKey] = [];
                  acc[classIdKey].push(record);
                  return acc;
                }, {})
              ).map(([classId, classRecords]: [string, AttendanceRecord[]]) => {
                console.log("classRecords", classRecords);
                const className = typeof classRecords[0]?.classId === 'object'
                  ? (classRecords[0]?.classId as { name?: string }).name
                  : workerClasses?.find((c: Class) => c._id === classId)?.name || 'כיתה לא ידועה';
                const classSymbol = typeof classRecords[0]?.classId === 'object'
                  ? (classRecords[0]?.classId as { uniqueSymbol?: string }).uniqueSymbol
                  : '';
                return (
                  <Box key={classId} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                    <Tooltip title="מחק נוכחות לחודש זה">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMonth(month, classId)}
                        disabled={deletingMonths.has(month)}
                        sx={{ ml: 1 }}
                      >
                        <HighlightOffIcon />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                      {month}
                    </Typography>
                    <Typography sx={{ minWidth: 120 }}>
                      {className} ({classSymbol})
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, borderRightWidth: 1, borderColor: '#424242', opacity: 1 }} />
                    {/* Student Attendance */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>נוכחות תלמידים</Typography>
                      {classRecords[0]?.studentAttendanceDoc ? (
                        <>
                          <Tooltip title="צפייה במסמך">
                            <IconButton onClick={() => window.open(classRecords[0].studentAttendanceDoc?.url || '', '_blank')}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחק מסמך">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDelete(classRecords[0].studentAttendanceDoc?._id, month, classId)}
                              disabled={deletingDocIds.has(classRecords[0].studentAttendanceDoc?._id)}
                            >
                              {deletingDocIds.has(classRecords[0].studentAttendanceDoc?._id) ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
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
                              <IconButton color="primary" component="span">
                                <UploadIcon />
                              </IconButton>
                            </Tooltip>
                          </label>
                        </>
                      )}
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, borderRightWidth: 1, borderColor: '#424242', opacity: 1 }} />
                    {/* Worker Attendance */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>נוכחות עובד</Typography>
                      {classRecords[0]?.workerAttendanceDoc ? (
                        <>
                          <Tooltip title="צפייה במסמך">
                            <IconButton onClick={() => window.open(classRecords[0].workerAttendanceDoc?.url || '', '_blank')}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחק מסמך">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDelete(classRecords[0].workerAttendanceDoc?._id, month, classId)}
                              disabled={deletingDocIds.has(classRecords[0].workerAttendanceDoc?._id)}
                            >
                              {deletingDocIds.has(classRecords[0].workerAttendanceDoc?._id) ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
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
                              <IconButton color="primary" component="span">
                                <UploadIcon />
                              </IconButton>
                            </Tooltip>
                          </label>
                        </>
                      )}
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, borderRightWidth: 1, borderColor: '#424242', opacity: 1 }} />
                    {/* Control Document */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>מסמך בקרה</Typography>
                      {classRecords[0]?.controlDoc ? (
                        <>
                          <Tooltip title="צפייה במסמך">
                            <IconButton onClick={() => window.open(classRecords[0].controlDoc?.url || '', '_blank')}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחק מסמך">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDelete(classRecords[0].controlDoc?._id, month, classId)}
                              disabled={deletingDocIds.has(classRecords[0].controlDoc?._id)}
                            >
                              {deletingDocIds.has(classRecords[0].controlDoc?._id) ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
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
                            <Tooltip title="העלה מסמך">
                              <IconButton color="primary" component="span">
                                <UploadIcon />
                              </IconButton>
                            </Tooltip>
                          </label>
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))
      ) : (
        <Typography color="text.secondary">לא נמצאו מסמכי נוכחות</Typography>
      )}
    </Paper>
  );
};

export default WorkerAttendanceDocuments; 