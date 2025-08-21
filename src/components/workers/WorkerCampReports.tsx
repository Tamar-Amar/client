import React, { useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateCampAttendanceWithFiles, useCreateCampAttendance, useDeleteCampAttendanceRecord, useDeleteAttendanceDocument, useUploadAttendanceDocument, useAllCampAttendanceReports } from '../../queries/useCampAttendance';
import { fetchClasses } from '../../services/ClassService';
import { Class, User} from '../../types';
import { useFetchAllUsers } from '../../queries/useUsers';

interface WorkerCampReportsProps {
  workerId: string;
  workerData: any;
}

export const WorkerCampReports: React.FC<WorkerCampReportsProps> = ({ workerId, workerData }) => {
  const queryClient = useQueryClient();

  // State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState('');
  const [deleteDocType, setDeleteDocType] = useState('');
  const [deleteDocIndex, setDeleteDocIndex] = useState<number | undefined>();
  const [deleteFileName, setDeleteFileName] = useState('');
  const [uploadingNewReport, setUploadingNewReport] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [workerFile, setWorkerFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [controlFiles, setControlFiles] = useState<File[]>([]);

  // State לניהול העלאת מסמכים נפרדת
  const [uploadingWorkerDoc, setUploadingWorkerDoc] = useState(false);
  const [uploadingStudentDoc, setUploadingStudentDoc] = useState(false);
  const [uploadingControlDoc, setUploadingControlDoc] = useState(false);
  const [workerFileInput, setWorkerFileInput] = useState<File | null>(null);
  const [studentFileInput, setStudentFileInput] = useState<File | null>(null);
  const [controlFileInput, setControlFileInput] = useState<File | null>(null);
  const { data: allUsers } = useFetchAllUsers();

  // Queries - נקבל את כל הכיתות
  const { data: allClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['allClasses'],
    queryFn: () => fetchClasses(), // נקבל את כל הכיתות
    enabled: true
  });

  // מציאת הכיתה שבה המוביל מוביל בקייטנת קיץ
  const leaderClass = useMemo(() => {
    if (!allClasses || !workerId) return null;
    
    return allClasses.find((cls: Class) => {
      return cls.workers?.some((worker: any) => 
        worker.workerId === workerId && worker.project === 4
      );
    });
  }, [allClasses, workerId]);

  // מציאת הרכז לפי קוד המוסד של הכיתה
  const coordinatorId = useMemo(() => {
    if (!leaderClass || !allUsers) return null;
    
    const institutionCode = leaderClass.institutionCode;
    
    const coordinator = allUsers.find((user: User) => {
      const isCoordinator = user.role === 'coordinator';
      const hasInstitutionCode = user.projectCodes?.some((pc: { institutionCode: string }) => pc.institutionCode === institutionCode);
      return isCoordinator && hasInstitutionCode;
    });
    
    
    // אם לא נמצא רכז, נשתמש ב-ID של המוביל
    if (!coordinator) {
      return workerId;
    }
    
    return coordinator._id;
  }, [leaderClass, allUsers, workerId]);

  const { data: allAttendanceData, isLoading: dataLoading, refetch } = useAllCampAttendanceReports();
  
  // סינון הדוחות לפי הכיתה הספציפית
  const attendanceData = useMemo(() => {
    if (!allAttendanceData || !leaderClass?._id) return [];
    return allAttendanceData.filter((record: any) => record.classId?._id === leaderClass._id);
  }, [allAttendanceData, leaderClass?._id]);

  // Mutations
  const createCampAttendanceMutation = useCreateCampAttendanceWithFiles();
  const createCampAttendanceSimpleMutation = useCreateCampAttendance();
  const deleteMutation = useDeleteCampAttendanceRecord();
  const deleteDocumentMutation = useDeleteAttendanceDocument();
  const uploadDocumentMutation = useUploadAttendanceDocument();
  
  const currentMonth = new Date().toISOString().slice(0, 7);

  // מציאת הדוח של הכיתה הספציפית
  const classReport = useMemo(() => {
    if (!attendanceData || !leaderClass) return null;
    
    return attendanceData.find((rec: any) => rec.classId._id === leaderClass._id);
  }, [attendanceData, leaderClass?._id]);

  // פונקציה לקבלת טקסט סטטוס
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'ממתין':
        return <Typography variant="caption" color="warning.main">ממתין</Typography>;
      case 'נדחה':
        return <Typography variant="caption" color="error.main">נדחה</Typography>;
      case 'מאושר':
        return <Typography variant="caption" color="success.main">מאושר</Typography>;
      default:
        return <Typography variant="caption" color="text.secondary">{status || 'לא ידוע'}</Typography>;
    }
  }, []);

  // פונקציה לבדיקה אם ניתן למחוק מסמך
  const canDeleteDocument = useCallback((status: string) => {
    return status === 'ממתין' || status === 'נדחה';
  }, []);

  // טיפול בלחיצה על מחיקה
  const handleDeleteClick = useCallback((recordId: string, docType: string, docIndex?: number, fileName?: string) => {
    setDeleteRecordId(recordId);
    setDeleteDocType(docType);
    setDeleteDocIndex(docIndex);
    setDeleteFileName(fileName || '');
    setDeleteDialogOpen(true);
  }, []);

  // בדיקה אם צריך למחוק את כל הדוח
  const shouldDeleteEntireReport = useCallback((recordId: string, docType: string) => {
    if (!classReport) return false;
    
    if (docType === 'workerAttendanceDoc' && !classReport.studentAttendanceDoc && classReport.controlDocs?.length === 0) {
      return true;
    }
    if (docType === 'studentAttendanceDoc' && !classReport.workerAttendanceDoc && classReport.controlDocs?.length === 0) {
      return true;
    }
    if (docType === 'controlDocs' && !classReport.workerAttendanceDoc && !classReport.studentAttendanceDoc && classReport.controlDocs?.length === 1) {
      return true;
    }
    
    return false;
  }, [classReport]);

  // טיפול באישור מחיקה
  const handleConfirmDelete = useCallback(async () => {
    try {
      if (shouldDeleteEntireReport(deleteRecordId, deleteDocType)) {
        await deleteMutation.mutateAsync(deleteRecordId);
      } else {
        await deleteDocumentMutation.mutateAsync({
          recordId: deleteRecordId,
          docType: deleteDocType,
          docIndex: deleteDocIndex
        });
      }
      // סגירת הדיאלוג אחרי המחיקה
      setDeleteDialogOpen(false);
      setDeleteRecordId('');
      setDeleteDocType('');
      setDeleteDocIndex(undefined);
      setDeleteFileName('');
      refetch();
    } catch (error) {
      console.error('שגיאה במחיקה:', error);
    }
  }, [shouldDeleteEntireReport, deleteRecordId, deleteDocType, deleteDocIndex, deleteMutation, deleteDocumentMutation, refetch]);

  // טיפול בהעלאת דוח חדש
  const handleUploadNewReport = async () => {
    if (!leaderClass) return;

    setUploadingNewReport(true);
    try {
      await createCampAttendanceMutation.mutateAsync({
        projectCode: 4, // קייטנת קיץ
        classId: leaderClass._id,
        coordinatorId,
        leaderId: workerId,
        month: currentMonth,
        workerFile: workerFile || undefined,
        studentFile: studentFile || undefined,
        controlFiles
      });

      setUploadSuccess('הדוח הועלה בהצלחה');
      setWorkerFile(null);
      setStudentFile(null);
      setControlFiles([]);
      refetch();
    } catch (error: any) {
      console.error('שגיאה בהעלאת דוח חדש:', error);
      setUploadError(error?.response?.data?.error || 'שגיאה בהעלאת הדוח');
    } finally {
      setUploadingNewReport(false);
    }
  };

  // פונקציות להעלאת מסמכים נפרדת
  const handleUploadWorkerDoc = useCallback(async () => {
    if (!workerFileInput) return;
    
    setUploadingWorkerDoc(true);
    try {
      // אם אין דוח קיים, צור דוח חדש
      let recordId = classReport?._id;
      if (!recordId) {
        if (!leaderClass) {
          console.error('חסרים נתונים ליצירת דוח חדש:', { leaderClass: leaderClass?._id });
          setUploadingWorkerDoc(false);
          return;
        }
        

        
        const newReport = await createCampAttendanceSimpleMutation.mutateAsync({
          projectCode: 4,
          classId: leaderClass._id,
          coordinatorId,
          leaderId: workerId,
          month: currentMonth
        });

        recordId = newReport._id;
        await refetch(); // רענון הנתונים
      }
      

      await uploadDocumentMutation.mutateAsync({
        recordId,
        docType: 'workerAttendanceDoc',
        file: workerFileInput
      });
      
      // ניקוי מידי של ה-state
      setWorkerFileInput(null);
      setUploadingWorkerDoc(false);
      await refetch(); // רענון הנתונים
    } catch (error: any) {
      console.error('שגיאה בהעלאת דוח עובדים:', error);
      setUploadingWorkerDoc(false);
      // הצגת שגיאה למשתמש
      alert(`שגיאה בהעלאת דוח עובדים: ${error?.response?.data?.error || error.message}`);
    }
  }, [workerFileInput, classReport?._id, leaderClass, coordinatorId, createCampAttendanceSimpleMutation, uploadDocumentMutation, workerId, currentMonth, refetch]);

  const handleUploadStudentDoc = useCallback(async () => {
    if (!studentFileInput) return;
    
    setUploadingStudentDoc(true);
    try {
      // אם אין דוח קיים, צור דוח חדש
      let recordId = classReport?._id;
      if (!recordId) {
        if (!leaderClass) {
          console.error('חסרים נתונים ליצירת דוח חדש:', { leaderClass: leaderClass?._id });
          setUploadingStudentDoc(false);
          return;
        }
        

        
        const newReport = await createCampAttendanceSimpleMutation.mutateAsync({
          projectCode: 4,
          classId: leaderClass._id,
          coordinatorId,
          leaderId: workerId,
          month: currentMonth
        });

        recordId = newReport._id;
        await refetch(); // רענון הנתונים
      }
      

      await uploadDocumentMutation.mutateAsync({
        recordId,
        docType: 'studentAttendanceDoc',
        file: studentFileInput
      });
      
      // ניקוי מידי של ה-state
      setStudentFileInput(null);
      setUploadingStudentDoc(false);
      await refetch(); // רענון הנתונים
    } catch (error: any) {
      console.error('שגיאה בהעלאת דוח תלמידים:', error);
      setUploadingStudentDoc(false);
      // הצגת שגיאה למשתמש
      alert(`שגיאה בהעלאת דוח תלמידים: ${error?.response?.data?.error || error.message}`);
    }
  }, [studentFileInput, classReport?._id, leaderClass, coordinatorId, createCampAttendanceSimpleMutation, uploadDocumentMutation, workerId, currentMonth, refetch]);

  const handleUploadControlDoc = useCallback(async () => {
    if (!controlFileInput) return;
    
    setUploadingControlDoc(true);
    try {
      // אם אין דוח קיים, צור דוח חדש
      let recordId = classReport?._id;
      if (!recordId) {
        if (!leaderClass) {
          console.error('חסרים נתונים ליצירת דוח חדש:', { leaderClass: leaderClass?._id });
          setUploadingControlDoc(false);
          return;
        }
        

        
        const newReport = await createCampAttendanceSimpleMutation.mutateAsync({
          projectCode: 4,
          classId: leaderClass._id,
          coordinatorId,
          leaderId: workerId,
          month: currentMonth
        });

        recordId = newReport._id;
        await refetch(); // רענון הנתונים
      }
      

      await uploadDocumentMutation.mutateAsync({
        recordId,
        docType: 'controlDocs',
        file: controlFileInput
      });
      
      // ניקוי מידי של ה-state
      setControlFileInput(null);
      setUploadingControlDoc(false);
      await refetch(); // רענון הנתונים
    } catch (error: any) {
      console.error('שגיאה בהעלאת דוח בקרה:', error);
      setUploadingControlDoc(false);
      // הצגת שגיאה למשתמש
      alert(`שגיאה בהעלאת דוח בקרה: ${error?.response?.data?.error || error.message}`);
    }
  }, [controlFileInput, classReport?._id, leaderClass, coordinatorId, createCampAttendanceSimpleMutation, uploadDocumentMutation, workerId, currentMonth, refetch]);

  // טיפול בפתיחת דיאלוג העלאה
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setUploadError('');
    setUploadSuccess('');
    setWorkerFile(null);
    setStudentFile(null);
    setControlFiles([]);
  };

  // טיפול בסגירת דיאלוג העלאה
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadError('');
    setUploadSuccess('');
    setWorkerFile(null);
    setStudentFile(null);
    setControlFiles([]);
  };

  if (classesLoading || dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!leaderClass) {
    return (
      <Alert severity="warning">
        לא נמצאה מסגרת שבה אתה מוביל בקייטנת קיץ
      </Alert>
    );
  }

  return (
    <Box>
      {leaderClass && (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {/* כרטיס מידע על המסגרת */}
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {leaderClass.uniqueSymbol} - {leaderClass.name} - {leaderClass.institutionCode}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              מוביל/מדריך: {`${workerData?.firstName} ${workerData?.lastName}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {coordinatorId === workerId ? (
                <>
                  רכז: {`${workerData?.firstName} ${workerData?.lastName}`} (לא מוגדר רכז, מוביל/מדריך משמש כרכז)
                </>
              ) : (
                <>
                  רכז: {allUsers?.find((user: User) => user._id === coordinatorId)?.firstName} {allUsers?.find((user: User) => user._id === coordinatorId)?.lastName}
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              חודש: {currentMonth}
            </Typography>
          </Paper>

          {/* כרטיסי מסמכים */}
          <Grid container spacing={3}>
            {/* דוח נוכחות עובדים */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom align="center">
                  דוח נוכחות עובדים
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {classReport?.workerAttendanceDoc ? (
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                                            <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          סטטוס: {getStatusText(classReport.workerAttendanceDoc.status)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          צפייה: <span 
                            style={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => window.open(classReport.workerAttendanceDoc.url, '_blank')}
                          >
                            צפייה במסמך
                          </span>
                        </Typography>
                      </Box>
                      {canDeleteDocument(classReport.workerAttendanceDoc.status) && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            מחיקה: <span 
                              style={{ color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => handleDeleteClick(
                                classReport._id,
                                'workerAttendanceDoc',
                                undefined,
                                classReport.workerAttendanceDoc.fileName
                              )}
                            >
                              מחיקה
                            </span>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        style={{ display: 'none' }}
                        id="worker-file-input"
                        onChange={(e) => {
                            setWorkerFileInput(e.target.files?.[0] || null);
                        }}
                      />
                      <label htmlFor="worker-file-input">
                        <Button
                          variant="outlined"
                          size="small"
                          component="span"
                          disabled={uploadingWorkerDoc}
                          startIcon={uploadingWorkerDoc ? <CircularProgress size={16} /> : <UploadIcon />}
                        >
                          העלה מסמך
                        </Button>
                      </label>
                      {workerFileInput && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            {workerFileInput.name}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleUploadWorkerDoc}
                            disabled={uploadingWorkerDoc}
                          >
                            {uploadingWorkerDoc ? <CircularProgress size={16} /> : 'העלה'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* דוח נוכחות תלמידים */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom align="center">
                  דוח נוכחות תלמידים
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {classReport?.studentAttendanceDoc ? (
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          סטטוס: {getStatusText(classReport.studentAttendanceDoc.status)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          צפייה: <span 
                            style={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => window.open(classReport.studentAttendanceDoc.url, '_blank')}
                          >
                            צפייה במסמך
                          </span>
                        </Typography>
                      </Box>
                      {canDeleteDocument(classReport.studentAttendanceDoc.status) && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                          מחיקה: <span 
                                    style={{ color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => handleDeleteClick(
                                      classReport._id,
                                      'studentAttendanceDoc',
                                      undefined,
                                      classReport.studentAttendanceDoc.fileName
                                    )}
                                  >
                                    מחיקה
                                  </span>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        style={{ display: 'none' }}
                        id="student-file-input"
                        onChange={(e) => setStudentFileInput(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="student-file-input">
                        <Button
                          variant="outlined"
                          size="small"
                          component="span"
                          disabled={uploadingStudentDoc}
                          startIcon={uploadingStudentDoc ? <CircularProgress size={16} /> : <UploadIcon />}
                        >
                          העלה מסמך
                        </Button>
                      </label>
                      {studentFileInput && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            {studentFileInput.name}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleUploadStudentDoc}
                            disabled={uploadingStudentDoc}
                          >
                            {uploadingStudentDoc ? <CircularProgress size={16} /> : 'העלה'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* דוחות בקרה */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom align="center">
                  דוחות בקרה
                </Typography>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {classReport?.controlDocs && classReport.controlDocs.length > 0 ? (
                    <Box sx={{ width: '100%' }}>
                      {classReport.controlDocs.map((doc: any, index: number) => (
                        <Paper 
                          key={index} 
                          sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: 'background.paper'
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                            דוח בקרה {index + 1}
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              סטטוס: {getStatusText(doc.status)}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              צפייה: <span 
                                style={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => window.open(doc.url, '_blank')}
                              >
                                צפייה במסמך
                              </span>
                            </Typography>
                          </Box>
                          {canDeleteDocument(doc.status) && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                מחיקה: <span 
                                  style={{ color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => handleDeleteClick(
                                    classReport._id,
                                    'controlDocs',
                                    index,
                                    doc.fileName
                                  )}
                                >
                                  מחיקה
                                </span>
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      ))}
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          style={{ display: 'none' }}
                          id="control-file-input"
                          onChange={(e) => setControlFileInput(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="control-file-input">
                          <IconButton
                            color="primary"
                            component="span"
                            disabled={uploadingControlDoc}
                            sx={{ 
                              border: '2px dashed',
                              borderColor: 'primary.main',
                              borderRadius: '50%',
                              width: 40,
                              height: 40
                            }}
                          >
                            {uploadingControlDoc ? <CircularProgress size={20} /> : <AddIcon />}
                          </IconButton>
                        </label>
                        {controlFileInput && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" display="block">
                              {controlFileInput.name}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={handleUploadControlDoc}
                              disabled={uploadingControlDoc}
                            >
                              {uploadingControlDoc ? <CircularProgress size={16} /> : 'העלה'}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        style={{ display: 'none' }}
                        id="control-file-input"
                        onChange={(e) => setControlFileInput(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="control-file-input">
                        <IconButton
                          color="primary"
                          component="span"
                          disabled={uploadingControlDoc}
                          sx={{ 
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            borderRadius: '50%',
                            width: 40,
                            height: 40
                          }}
                        >
                          {uploadingControlDoc ? <CircularProgress size={20} /> : <AddIcon />}
                        </IconButton>
                      </label>
                      {controlFileInput && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            {controlFileInput.name}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleUploadControlDoc}
                            disabled={uploadingControlDoc}
                          >
                            {uploadingControlDoc ? <CircularProgress size={16} /> : 'העלה'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* דיאלוג העלאה */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="md" fullWidth>
        <DialogTitle>העלה דוח קייטנת קיץ חדש</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                מסגרת: {leaderClass.uniqueSymbol} - {leaderClass.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                מוביל/מדריך: {workerData?.firstName} {workerData?.lastName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                דוח נוכחות עובדים
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                id="worker-file"
                type="file"
                onChange={(e) => setWorkerFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="worker-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  {workerFile ? workerFile.name : 'בחר קובץ'}
                </Button>
              </label>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                דוח נוכחות תלמידים
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                id="student-file"
                type="file"
                onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="student-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  {studentFile ? studentFile.name : 'בחר קובץ'}
                </Button>
              </label>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                דוחות בקרה
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                id="control-files"
                type="file"
                multiple
                onChange={(e) => setControlFiles(Array.from(e.target.files || []))}
              />
              <label htmlFor="control-files">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  בחר קבצים
                </Button>
              </label>
              {controlFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    קבצים נבחרים:
                  </Typography>
                  {controlFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => setControlFiles(controlFiles.filter((_, i) => i !== index))}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>

            {uploadError && (
              <Grid item xs={12}>
                <Alert severity="error">{uploadError}</Alert>
              </Grid>
            )}

            {uploadSuccess && (
              <Grid item xs={12}>
                <Alert severity="success">{uploadSuccess}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>
            {uploadSuccess ? 'סגור' : 'ביטול'}
          </Button>
          {!uploadSuccess && (
            <Button
              onClick={handleUploadNewReport}
              variant="contained"
              disabled={uploadingNewReport || (!workerFile && !studentFile && controlFiles.length === 0)}
            >
              {uploadingNewReport ? <CircularProgress size={20} /> : 'העלה דוח'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את המסמך "{deleteFileName}"?
            {shouldDeleteEntireReport(deleteRecordId, deleteDocType) && (
              <Typography color="warning.main" sx={{ mt: 1 }}>
                זהו המסמך האחרון בדוח. הדוח כולו יימחק.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending || deleteDocumentMutation.isPending}
          >
            {deleteMutation.isPending || deleteDocumentMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'מחק'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 