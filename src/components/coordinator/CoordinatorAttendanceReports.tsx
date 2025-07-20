import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  TablePagination,
  Autocomplete
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  useCampAttendanceReports, 
  useUploadAttendanceDocument, 
  useDeleteAttendanceDocument,
  useClassesByCoordinatorInstitutionCodes,
  useCreateCampAttendanceWithFiles,
  useDeleteCampAttendanceRecord
} from '../../queries/useCampAttendance';

interface CoordinatorAttendanceReportsProps {
  coordinatorId: string;
}

export const CoordinatorAttendanceReports: React.FC<CoordinatorAttendanceReportsProps> = ({ coordinatorId }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedMissingDocType, setSelectedMissingDocType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string>('');
  const [deleteDocType, setDeleteDocType] = useState<string>('');
  const [deleteDocIndex, setDeleteDocIndex] = useState<number | undefined>(undefined);
  const [deleteFileName, setDeleteFileName] = useState<string>('');
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // פילטרים
  const [filterInstitutionCode, setFilterInstitutionCode] = useState<string>('');
  const [filterClassSymbol, setFilterClassSymbol] = useState<string>('');
  const [filterLeaderName, setFilterLeaderName] = useState<string>('');

  // העלאת דוח חדש
  const [newReportDialogOpen, setNewReportDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [workerFile, setWorkerFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [controlFiles, setControlFiles] = useState<File[]>([]);
  const [uploadingNewReport, setUploadingNewReport] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  // מעבר עמודים
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // הוקים
  const { data, isLoading, refetch } = useCampAttendanceReports(coordinatorId);
  const { data: allClasses, isLoading: classesLoading } = useClassesByCoordinatorInstitutionCodes(coordinatorId);
  const uploadMutation = useUploadAttendanceDocument();
  const deleteMutation = useDeleteAttendanceDocument();
  const deleteRecordMutation = useDeleteCampAttendanceRecord();
  const createCampAttendanceMutation = useCreateCampAttendanceWithFiles();

  // נתונים מסוננים - עכשיו כולל כיתות ללא דוחות
  const filteredData = useMemo(() => {
    if (!data || !allClasses) return [];
    
    // יצירת מפה של דוחות קיימים לפי classId
    const reportsByClassId = new Map();
    data.forEach((rec: any) => {
      reportsByClassId.set(rec.classId._id, rec);
    });
    
    // יצירת רשימה של כל הכיתות עם או בלי דוחות
    const allClassesWithReports = allClasses.map((cls: any) => {
      const existingReport = reportsByClassId.get(cls._id);
      
      // מציאת המוביל או המדריך של הפרויקט
      const leader = cls.workers?.find((worker: any) => 
        worker.workerId?.roleName === 'מוביל' && worker.project === 4
      );
      
      // אם אין מוביל, נחפש מדריך
      const instructor = !leader ? cls.workers?.find((worker: any) => 
        worker.workerId?.roleName === 'מדריך' && worker.project === 4
      ) : null;
      
      const responsibleWorker = leader || instructor;
      
      return existingReport || {
        _id: `no-report-${cls._id}`,
        classId: cls,
        leaderId: responsibleWorker?.workerId || null,
        workerAttendanceDoc: null,
        studentAttendanceDoc: null,
        controlDocs: [],
        hasNoReport: true // סימון שזה כיתה ללא דוח
      };
    });
    
    return allClassesWithReports.filter((rec: any) => {
      const institutionCode = rec.classId?.institutionCode || '';
      const classSymbol = rec.classId?.uniqueSymbol || '';
      const leaderName = rec.leaderId ? `${rec.leaderId?.firstName || ''} ${rec.leaderId?.lastName || ''}`.toLowerCase() : '';
      
      const matchesInstitution = !filterInstitutionCode || institutionCode.includes(filterInstitutionCode);
      const matchesClassSymbol = !filterClassSymbol || classSymbol.includes(filterClassSymbol);
      
      // אם יש פילטר מוביל, נציג רק כיתות עם מוביל שמתאים לפילטר
      // אם אין פילטר מוביל, נציג הכל (כולל כיתות ללא מוביל)
      const matchesLeaderName = !filterLeaderName || (rec.leaderId && leaderName.includes(filterLeaderName.toLowerCase()));
      
      return matchesInstitution && matchesClassSymbol && matchesLeaderName;
    });
  }, [data, allClasses, filterInstitutionCode, filterClassSymbol, filterLeaderName]);

  // רשימת קודי מוסד ייחודיים - עכשיו מכל הכיתות של הרכז
  const uniqueInstitutionCodes = useMemo(() => {
    if (!allClasses) return [];
    const codes = allClasses.map((cls: any) => cls.institutionCode).filter(Boolean);
    return [...new Set(codes)].sort();
  }, [allClasses]);

  // רשימת סמלי מסגרות ייחודיים - עכשיו מכל הכיתות של הרכז
  const uniqueClassSymbols = useMemo(() => {
    if (!allClasses) return [];
    const symbols = allClasses.map((cls: any) => cls.uniqueSymbol).filter(Boolean);
    return [...new Set(symbols)].sort() as string[];
  }, [allClasses]);

  // רשימת כיתות ייחודיות - עכשיו מכל הכיתות של הרכז
  const uniqueClasses = useMemo(() => {
    if (!allClasses) return [];
    return allClasses.map((cls: any) => {
      // מציאת המוביל או המדריך של הפרויקט
      const leader = cls.workers?.find((worker: any) => 
        worker.workerId?.roleName === 'מוביל' && worker.project === 4
      );
      
      // אם אין מוביל, נחפש מדריך
      const instructor = !leader ? cls.workers?.find((worker: any) => 
        worker.workerId?.roleName === 'מד״צ' && worker.project === 4
      ) : null;
      
      const responsibleWorker = leader || instructor;
      const roleName = leader ? 'מוביל' : (instructor ? 'מד״צ' : 'לא מוגדר');
      
      return {
        id: cls._id,
        symbol: cls.uniqueSymbol,
        name: cls.name,
        institutionCode: cls.institutionCode,
        leaderName: responsibleWorker ? `${responsibleWorker.workerId?.firstName} ${responsibleWorker.workerId?.lastName} (${roleName})` : 'לא מוגדר מוביל/מדריך'
      };
    });
  }, [allClasses]);

  // פונקציה לקבלת טקסט סטטוס פשוט
  const getStatusText = (status: string) => {
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
  };

  // פונקציה לקבלת טקסט סוג מסמך
  const getDocumentTypeText = (docType: string) => {
    switch (docType) {
      case 'workerAttendanceDoc':
        return 'דוח נוכחות עובדים';
      case 'studentAttendanceDoc':
        return 'דוח נוכחות תלמידים';
      case 'controlDocs':
        return 'דוח בקרה';
      default:
        return 'מסמך';
    }
  };

  // פונקציה לבדיקה אם ניתן למחוק מסמך
  const canDeleteDocument = (status: string) => {
    return status === 'ממתין' || status === 'נדחה';
  };

  // טיפול בשינוי קובץ
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // טיפול בהעלאה
  const handleUpload = async () => {
    if (!selectedFile || !selectedRecord) return;

    try {
      await uploadMutation.mutateAsync({
        recordId: selectedRecord._id,
        docType: selectedMissingDocType as 'workerAttendanceDoc' | 'studentAttendanceDoc' | 'controlDocs',
        file: selectedFile,
        docIndex: selectedMissingDocType === 'controlDocs' ? selectedRecord.controlDocs?.length : undefined
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedRecord(null);
      setSelectedMissingDocType('');
    } catch (error) {
      console.error('שגיאה בהעלאת מסמך:', error);
    }
  };

  // טיפול בהעלאת דוח חדש
  const handleUploadNewReport = async () => {
    if (!selectedClass || (!workerFile && !studentFile && controlFiles.length === 0)) {
      setUploadError('יש לבחור מסגרת ולפחות מסמך אחד');
      return;
    }

    // בדיקה שיש מוביל לכיתה
    const selectedClassData = allClasses?.find((cls: any) => cls._id === selectedClass);
    if (!selectedClassData) {
      setUploadError('לא נמצאו נתוני מסגרת');
      return;
    }

    // מציאת המוביל או המדריך מתוך העובדים של הכיתה
    const leader = selectedClassData.workers?.find((worker: any) => 
      worker.workerId?.roleName === 'מוביל' && worker.project === 4
    );

    // אם אין מוביל, נחפש מדריך
    const instructor = !leader ? selectedClassData.workers?.find((worker: any) => 
      worker.workerId?.roleName === 'מד״צ' && worker.project === 4
    ) : null;

    const responsibleWorker = leader || instructor;

    if (!responsibleWorker) {
      setUploadError('למסגרת זו לא מוגדר מוביל או מדריך לפרויקט קייטנת קיץ, על מנת להעלות נוכחות יש להגדיר מוביל או מדריך');
      return;
    }

    setUploadingNewReport(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // שימוש בחודש נוכחי
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      await createCampAttendanceMutation.mutateAsync({
        projectCode: 4, // קייטנת קיץ
        classId: selectedClass,
        coordinatorId,
        leaderId: responsibleWorker.workerId._id,
        month: currentMonth,
        workerFile: workerFile || undefined,
        studentFile: studentFile || undefined,
        controlFiles
      });

      setUploadSuccess('הדוח הועלה בהצלחה');
      setSelectedClass('');
      setWorkerFile(null);
      setStudentFile(null);
      setControlFiles([]);
      refetch(); // רענון הנתונים
      // לא סוגרים את הדיאלוג - המשתמש ייסגור בעצמו
    } catch (error: any) {
      console.error('שגיאה בהעלאת דוח חדש:', error);
      setUploadError(error?.response?.data?.error || 'שגיאה בהעלאת הדוח');
    } finally {
      setUploadingNewReport(false);
    }
  };

  // טיפול בלחיצה על מחיקה
  const handleDeleteClick = (recordId: string, docType: string, docIndex?: number, fileName?: string) => {
    setDeleteRecordId(recordId);
    setDeleteDocType(docType);
    setDeleteDocIndex(docIndex);
    setDeleteFileName(fileName || '');
    setDeleteDialogOpen(true);
  };

  // טיפול בפתיחת דיאלוג העלאה חדש
  const handleOpenNewReportDialog = (classId: string) => {
    setSelectedClass(classId);
    setUploadError('');
    setUploadSuccess('');
    setNewReportDialogOpen(true);
  };

  // פונקציה לבדיקה אם ניתן למחוק את כל הדוח
  const shouldDeleteEntireReport = (recordId: string, docType: string) => {
    const record = data?.find((rec: any) => rec._id === recordId);
    if (!record) return false;
    
    // אם זה המסמך האחרון, נמחק את כל הדוח
    const hasWorkerDoc = record.workerAttendanceDoc;
    const hasStudentDoc = record.studentAttendanceDoc;
    const hasControlDocs = record.controlDocs && record.controlDocs.length > 0;
    
    if (docType === 'workerAttendanceDoc' && !hasStudentDoc && !hasControlDocs) return true;
    if (docType === 'studentAttendanceDoc' && !hasWorkerDoc && !hasControlDocs) return true;
    if (docType === 'controlDocs' && !hasWorkerDoc && !hasStudentDoc && record.controlDocs.length === 1) return true;
    
    return false;
  };

  // פונקציה לבדיקה אם מסמך ספציפי נמחק
  const isDeletingDocument = (recordId: string, docType: string, docIndex?: number) => {
    const documentId = `${recordId}-${docType}-${docIndex || 0}`;
    return deletingDocumentId === documentId;
  };

  // טיפול באישור מחיקה
  const handleConfirmDelete = async () => {
    try {
      // יצירת מזהה ייחודי למסמך
      const documentId = `${deleteRecordId}-${deleteDocType}-${deleteDocIndex || 0}`;
      setDeletingDocumentId(documentId);
      
      // בדיקה אם צריך למחוק את כל הדוח
      if (shouldDeleteEntireReport(deleteRecordId, deleteDocType)) {
        await deleteRecordMutation.mutateAsync(deleteRecordId);
      } else {
        await deleteMutation.mutateAsync({
          recordId: deleteRecordId,
          docType: deleteDocType as 'workerAttendanceDoc' | 'studentAttendanceDoc' | 'controlDocs',
          docIndex: deleteDocIndex
        });
      }

      setDeleteDialogOpen(false);
      setDeleteRecordId('');
      setDeleteDocType('');
      setDeleteDocIndex(undefined);
      setDeleteFileName('');
      setDeletingDocumentId(null);
    } catch (error) {
      console.error('שגיאה במחיקת מסמך:', error);
      setDeletingDocumentId(null);
    }
  };

  // איפוס העמוד כשהפילטרים משתנים
  useEffect(() => {
    setPage(0);
  }, [filterInstitutionCode, filterClassSymbol, filterLeaderName]);

  // סגירת הדיאלוג אוטומטית אחרי מחיקה מוצלחת
  useEffect(() => {
    if (deleteMutation.isSuccess && deleteDialogOpen) {
      const timer = setTimeout(() => {
        setDeleteDialogOpen(false);
        setDeleteRecordId('');
        setDeleteDocType('');
        setDeleteDocIndex(undefined);
        setDeleteFileName('');
        setDeletingDocumentId(null);
      }, 1500); // סגירה אחרי 1.5 שניות

      return () => clearTimeout(timer);
    }
  }, [deleteMutation.isSuccess, deleteDialogOpen]);

  // סגירת הדיאלוג כשהמחיקה נכשלת
  useEffect(() => {
    if (deleteMutation.isError && deleteDialogOpen) {
      setDeleteDialogOpen(false);
      setDeleteRecordId('');
      setDeleteDocType('');
      setDeleteDocIndex(undefined);
      setDeleteFileName('');
      setDeletingDocumentId(null);
    }
  }, [deleteMutation.isError, deleteDialogOpen]);

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        דוחות נוכחות
      </Typography>

      {/* תיבות סינון */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon />
            סינון דוחות
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>קוד מוסד</InputLabel>
                <Select
                  value={filterInstitutionCode}
                  label="קוד מוסד"
                  onChange={(e) => setFilterInstitutionCode(e.target.value)}
                >
                  <MenuItem value="">כל קודי המוסד</MenuItem>
                  {uniqueInstitutionCodes.map((code: any) => (
                    <MenuItem key={code} value={code}>{code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete<string>
                options={uniqueClassSymbols}
                value={filterClassSymbol}
                onChange={(event, newValue) => setFilterClassSymbol(newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="סמל מסגרת"
                    placeholder="הקלד סמל מסגרת..."
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="שם מוביל/מדריך"
                value={filterLeaderName}
                onChange={(e) => setFilterLeaderName(e.target.value)}
                placeholder="הקלד שם מוביל או מדריך..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilterInstitutionCode('');
                  setFilterClassSymbol('');
                  setFilterLeaderName('');
                }}
                fullWidth
                color="error"
              >
                נקה סינון
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer component={Paper} sx={{ minHeight: 500 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 1 }}>סמל מסגרת</TableCell>
                  <TableCell sx={{ py: 1 }}>שם המוביל/מדריך</TableCell>
                  <TableCell sx={{ py: 1 }}>דוח עובדים</TableCell>
                  <TableCell sx={{ py: 1 }}>דוח תלמידים</TableCell>
                  <TableCell sx={{ py: 1 }}>דוחות בקרה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((rec: any) => (
                  <TableRow 
                    key={rec._id}
                    sx={rec.hasNoReport ? { 
                      bgcolor: '#f5f5f5',
                      '&:hover': { bgcolor: '#eeeeee' }
                    } : {}}
                  >
                    <TableCell sx={{ py: 1 }}>
                      {rec.classId?.uniqueSymbol}
                      {rec.hasNoReport && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          לא הועלה אף מסמך
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {rec.leaderId ? `${rec.leaderId.firstName} ${rec.leaderId.lastName}` : 'לא מוגדר מוביל/מדריך'}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {rec.hasNoReport ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleOpenNewReportDialog(rec.classId._id)}
                          sx={{ opacity: 0.7 }}
                        >
                          העלה דוח
                        </Button>
                      ) : rec.workerAttendanceDoc ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton size="small" color="primary" onClick={() => window.open(rec.workerAttendanceDoc.url, '_blank')}>
                            <VisibilityIcon />
                          </IconButton>
                          {getStatusText(rec.workerAttendanceDoc.status)}
                          {canDeleteDocument(rec.workerAttendanceDoc.status) && (
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteClick(
                                rec._id, 
                                'workerAttendanceDoc', 
                                undefined, 
                                rec.workerAttendanceDoc.fileName
                              )}
                              disabled={deleteMutation.isPending || isDeletingDocument(rec._id, 'workerAttendanceDoc')}
                            >
                              {deleteMutation.isPending || isDeletingDocument(rec._id, 'workerAttendanceDoc') ? <CircularProgress size={18} /> : <DeleteIcon />}
                            </IconButton>
                          )}
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => {
                            setSelectedRecord(rec);
                            setSelectedMissingDocType('workerAttendanceDoc');
                            setUploadDialogOpen(true);
                          }}
                        >
                          העלה
                        </Button>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {rec.hasNoReport ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleOpenNewReportDialog(rec.classId._id)}
                          sx={{ opacity: 0.7 }}
                        >
                          העלה דוח
                        </Button>
                      ) : rec.studentAttendanceDoc ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton size="small" color="primary" onClick={() => window.open(rec.studentAttendanceDoc.url, '_blank')}>
                            <VisibilityIcon />
                          </IconButton>
                          {getStatusText(rec.studentAttendanceDoc.status)}
                          {canDeleteDocument(rec.studentAttendanceDoc.status) && (
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteClick(
                                rec._id, 
                                'studentAttendanceDoc', 
                                undefined, 
                                rec.studentAttendanceDoc.fileName
                              )}
                              disabled={deleteMutation.isPending || isDeletingDocument(rec._id, 'studentAttendanceDoc')}
                            >
                              {deleteMutation.isPending || isDeletingDocument(rec._id, 'studentAttendanceDoc') ? <CircularProgress size={18} /> : <DeleteIcon />}
                            </IconButton>
                          )}
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => {
                            setSelectedRecord(rec);
                            setSelectedMissingDocType('studentAttendanceDoc');
                            setUploadDialogOpen(true);
                          }}
                        >
                          העלה
                        </Button>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {rec.hasNoReport ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleOpenNewReportDialog(rec.classId._id)}
                          sx={{ opacity: 0.7 }}
                        >
                          העלה דוח
                        </Button>
                      ) : rec.controlDocs && rec.controlDocs.length > 0 ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {rec.controlDocs.map((doc: any, idx: number) => (
                            <Stack key={doc._id} direction="row" alignItems="center" spacing={0.5}>
                              <IconButton size="small" color="primary" onClick={() => window.open(doc.url, '_blank')}>
                                <VisibilityIcon />
                              </IconButton>
                              {getStatusText(doc.status)}
                              {canDeleteDocument(doc.status) && (
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDeleteClick(
                                    rec._id, 
                                    'controlDocs', 
                                    idx, 
                                    doc.fileName
                                  )}
                                  disabled={deleteMutation.isPending || isDeletingDocument(rec._id, 'controlDocs', idx)}
                                >
                                  {deleteMutation.isPending || isDeletingDocument(rec._id, 'controlDocs', idx) ? <CircularProgress size={18} /> : <DeleteIcon />}
                                </IconButton>
                              )}
                            </Stack>
                          ))}
                          {/* כפתור הוספת מסמך בקרה נוסף אם יש פחות מ-5 */}
                          {rec.controlDocs.length < 5 && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<UploadIcon />}
                              onClick={() => {
                                setSelectedRecord(rec);
                                setSelectedMissingDocType('controlDocs');
                                setUploadDialogOpen(true);
                              }}
                            >
                              הוסף
                            </Button>
                          )}
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => {
                            setSelectedRecord(rec);
                            setSelectedMissingDocType('controlDocs');
                            setUploadDialogOpen(true);
                          }}
                        >
                          העלה
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 8, 15, 50]}
            component="div"
            count={filteredData?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 8));
              setPage(0);
            }}
            labelRowsPerPage="שורות בעמוד:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
          />
        </Card>
      )}

      {/* דיאלוג העלאת מסמך */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          העלאת {getDocumentTypeText(selectedMissingDocType)}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                מסגרת: {selectedRecord.classId?.uniqueSymbol}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                מוביל/מדריך: {selectedRecord.leaderId?.firstName} {selectedRecord.leaderId?.lastName}
              </Typography>
              
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ marginTop: 16 }}
              />
              
              {uploadMutation.isPending && (
                <Box display="flex" alignItems="center" gap={1} mt={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">טוען מסמכים...</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploadMutation.isPending}>
            ביטול
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || uploadMutation.isPending}
            startIcon={uploadMutation.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploadMutation.isPending ? 'טוען...' : 'העלה'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}>
        <DialogTitle>
          {deleteMutation.isPending ? 'מוחק מסמך...' : 'אישור מחיקה'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {deleteMutation.isPending 
              ? `מוחק את המסמך "${deleteFileName}"...`
              : `האם אתה בטוח שברצונך למחוק את המסמך "${deleteFileName}"?`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleteMutation.isPending}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleteMutation.isPending ? 'מוחק...' : 'מחק'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג מורחב להעלאת דוח חדש */}
      <Dialog 
        open={newReportDialogOpen} 
        onClose={() => {
          setNewReportDialogOpen(false);
          setUploadError('');
          setUploadSuccess('');
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          העלאת דוח נוכחות חדש
        </DialogTitle>
        <DialogContent>
          {/* שורה ראשונה - סמל כיתה ומוביל */}
          <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="מסגרת נבחרת"
                value={selectedClass ? (() => {
                  const cls = uniqueClasses.find((c: any) => c.id === selectedClass);
                  return cls ? `${cls.symbol} - ${cls.name}` : '';
                })() : ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="מוביל/מדריך"
                value={selectedClass ? (() => {
                  const cls = uniqueClasses.find((c: any) => c.id === selectedClass);
                  return cls ? `${cls.leaderName}` : '';
                })() : ''}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>

          {/* שורה שנייה - העלאת דוחות */}
          <Typography variant="h6" gutterBottom>
            בחירת מסמכים להעלאה
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                size="small"
                disabled={!!workerFile}
              >
                דוח עובדים
                <input
                  type="file"
                  hidden
                  onChange={(e) => setWorkerFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
              </Button>
              {workerFile && (
                <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      {workerFile.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setWorkerFile(null)}
                      sx={{ p: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                size="small"
                disabled={!!studentFile}
              >
                דוח תלמידים
                <input
                  type="file"
                  hidden
                  onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
              </Button>
              {studentFile && (
                <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      {studentFile.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setStudentFile(null)}
                      sx={{ p: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                size="small"
                disabled={controlFiles.length >= 5}
              >
                דוח בקרה 
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setControlFiles(prev => [...prev, ...files].slice(0, 5));
                  }}
                  accept=".pdf,.doc,.docx"
                />
              </Button>
              {controlFiles.length > 0 && (
                <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    {controlFiles.length} קבצים נבחרו:
                  </Typography>
                  {controlFiles.map((file, index) => (
                    <Stack key={index} direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ flex: 1 }}>
                        {file.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => setControlFiles(prev => prev.filter((_, i) => i !== index))}
                        sx={{ p: 0.5 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>
          )}
          {uploadSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setNewReportDialogOpen(false);
              setUploadError('');
              setUploadSuccess('');
            }} 
            disabled={uploadingNewReport}
          >
            {uploadSuccess ? 'סגור' : 'ביטול'}
          </Button>
          <Button 
            onClick={uploadSuccess ? () => {
              setNewReportDialogOpen(false);
              setUploadError('');
              setUploadSuccess('');
            } : handleUploadNewReport} 
            variant="contained"
            disabled={uploadingNewReport || (!selectedClass || (!workerFile && !studentFile && controlFiles.length === 0))}
            startIcon={uploadingNewReport ? <CircularProgress size={16} /> : (uploadSuccess ? null : <AddIcon />)}
          >
            {uploadingNewReport ? 'מעלה...' : (uploadSuccess ? 'סגור' : 'העלה דוח')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 