import React, { useState} from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import {
  useDownloadMultipleDocuments,
  useFetchAllPersonalDocuments,
  useFetchAttendanceDocuments,
} from '../queries/useDocuments';
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../queries/classQueries';
import { DocumentStatus } from '../types/Document';
import {
  Folder as FolderIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Assignment as AttendanceIcon,
} from '@mui/icons-material';

interface DocumentFilters {
  documentType?: string;
  status?: string;
  tag?: string;
  workerId?: string;
  classId?: string;
  project?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  organizationType?: 'byType' | 'byWorker';
  fileNameFormat?: 'simple' | 'detailed';
}

const DownloadDocPage: React.FC = () => {
  
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 1000, 
    sortBy: 'fileName',
    sortOrder: 'asc',
    tag: '', 
  });

  const [showFilters, setShowFilters] = useState(true);
  const [documentSummary, setDocumentSummary] = useState<{
    total: number;
    byType: { [key: string]: number };
    byWorker: { [key: string]: number };
  }>({ total: 0, byType: {}, byWorker: {} });
  const [documentType, setDocumentType] = useState<'personal' | 'project' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectOrganization, setProjectOrganization] = useState<'byClass' | 'byType'>('byClass');
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  
  const [organizationType, setOrganizationType] = useState<'byType' | 'byWorker'>('byType');

  const { data: workers = [], isLoading: workersLoading } = useFetchAllWorkersAfterNoon();
  const { data: classes = [], isLoading: classesLoading } = useFetchClasses();


  const { 
    data: personalDocumentsData, 
    isLoading: personalDocumentsLoading,
    error: personalDocumentsError
  } = useFetchAllPersonalDocuments(documentType === 'personal');


  const { 
    data: attendanceDocumentsData, 
    isLoading: attendanceDocumentsLoading,
    error: attendanceDocumentsError
  } = useFetchAttendanceDocuments(selectedProject);


  React.useEffect(() => {


    if (personalDocumentsError) {
      console.error('❌ שגיאה בטעינת מסמכים אישיים:', personalDocumentsError);
      setSnackbar({
        open: true,
        message: 'שגיאה בטעינת מסמכים אישיים',
        severity: 'error'
      });
    }
    
    if (attendanceDocumentsError) {
      console.error('❌ שגיאה בטעינת מסמכי נוכחות:', attendanceDocumentsError);
      setSnackbar({
        open: true,
        message: 'שגיאה בטעינת מסמכי נוכחות',
        severity: 'error'
      });
    }
    
    if (documentType === 'personal' && personalDocumentsData) {
      const documents = Array.isArray(personalDocumentsData) ? personalDocumentsData : [];
      setAllDocuments(documents);
      setFilteredDocuments(documents);
      updateDocumentSummary(documents);
    } else if (documentType === 'project' && attendanceDocumentsData?.documents) {
      const documents = Array.isArray(attendanceDocumentsData.documents) ? attendanceDocumentsData.documents : [];
      setAllDocuments(documents);
      setFilteredDocuments(documents);
      updateDocumentSummary(documents);
    } else {

      setAllDocuments([]);
      setFilteredDocuments([]);
      updateDocumentSummary([]);
    }
  }, [documentType, personalDocumentsData, attendanceDocumentsData, personalDocumentsError, attendanceDocumentsError]);


  React.useEffect(() => {
    
    if (allDocuments.length > 0) {
      applyFiltersWithFilters(filters);
    }
  }, [allDocuments, filters.status, filters.tag, filters.workerId, filters.classId]);
  
  const downloadMultipleMutation = useDownloadMultipleDocuments();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {

    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: 1 };
      
      setTimeout(() => {
        applyFiltersWithFilters(newFilters);
      }, 0);
      
      return newFilters;
    });
  };

  const applyFiltersWithFilters = (currentFilters: DocumentFilters) => {
  
    let filtered = [...allDocuments];

    if (currentFilters.status) {
      filtered = filtered.filter(doc => doc.status === currentFilters.status);
    }

    if (currentFilters.tag) {

      filtered = filtered.filter(doc => {
        const docTag = doc.tag || doc.type;
        return docTag === currentFilters.tag;
      });
    }

    if (currentFilters.workerId && documentType === 'personal') {
      
      filtered = filtered.filter(doc => {
        if (!doc.operatorId) return false;
        
        if (typeof doc.operatorId === 'string') {
          return doc.operatorId === currentFilters.workerId;
        }
        
        if (typeof doc.operatorId === 'object') {
          return doc.operatorId.idNumber === currentFilters.workerId || 
                 doc.operatorId._id === currentFilters.workerId ||
                 doc.operatorId.id === currentFilters.workerId;
        }
        
        return false;
      });
    }

    if (currentFilters.classId && documentType === 'project') {
      
      filtered = filtered.filter(doc => {
        return doc.classId === currentFilters.classId;
      });
    }

    setFilteredDocuments(filtered);
    updateDocumentSummary(filtered);
  };



  const updateDocumentSummary = (documents: any) => {
    
    if (!Array.isArray(documents)) {
      setDocumentSummary({
        total: 0,
        byType: {},
        byWorker: {}
      });
      return;
    }

    const byType: { [key: string]: number } = {};
    const byWorker: { [key: string]: number } = {};

    documents.forEach((doc: any) => {
      const docType = doc.tag || doc.type || 'לא ידוע';
      byType[docType] = (byType[docType] || 0) + 1;

      let workerName = 'לא ידוע';
      
      if (doc.operatorId) {
        if (typeof doc.operatorId === 'string') {
          const worker = workers.find(w => w._id === doc.operatorId || w.id === doc.operatorId);
          if (worker) {
            workerName = `${worker.lastName} ${worker.firstName}`;
          } else {
            workerName = `ת.ז: ${doc.operatorId}`;
          }
        }

        else if (typeof doc.operatorId === 'object') {
          if (doc.operatorId.firstName && doc.operatorId.lastName) {
            workerName = `${doc.operatorId.lastName} ${doc.operatorId.firstName}`;
          } else if (doc.operatorId.idNumber) {
            workerName = `ת.ז: ${doc.operatorId.idNumber}`;
          } else if (doc.operatorId.id) {
            workerName = `ת.ז: ${doc.operatorId.id}`;
          }
        }
      }
      
      byWorker[workerName] = (byWorker[workerName] || 0) + 1;
    });

    setDocumentSummary({
      total: documents.length,
      byType,
      byWorker
    });
  };


  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentBatch(0);
    setShowProgressDialog(true);
    
    const documentsToDownload = filteredDocuments.length > 0 ? filteredDocuments : allDocuments;
    const maxDocuments = 5000;
    const batchSize = 500; 
    const actualCount = Math.min(documentsToDownload.length, maxDocuments);
    
    const calculatedTotalBatches = Math.ceil(actualCount / batchSize);
    setTotalBatches(calculatedTotalBatches);
    
    try {
      for (let batchIndex = 0; batchIndex < calculatedTotalBatches; batchIndex++) {
        setCurrentBatch(batchIndex + 1);
        const batchProgress = ((batchIndex + 1) / calculatedTotalBatches) * 100;
        setDownloadProgress(batchProgress);
        
        // חישוב המסמכים של ה-batch הנוכחי
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, actualCount);
        const currentBatchDocuments = documentsToDownload.slice(startIndex, endIndex);
        const currentBatchDocumentIds = currentBatchDocuments.map(doc => doc._id);
        
        console.log(`📦 מוריד batch ${batchIndex + 1} מתוך ${calculatedTotalBatches} עם ${currentBatchDocuments.length} מסמכים`);
        
        const result = await new Promise((resolve, reject) => {
          downloadMultipleMutation.mutate({
            documentIds: currentBatchDocumentIds, 
            documentType: documentType || undefined,
            selectedProject: selectedProject,
            projectOrganization: organizationType === 'byWorker' ? 'byClass' : 'byType',
            organizationType,
            fileNameFormat: 'simple',
            maxDocuments: currentBatchDocuments.length,
            batchSize: batchSize,
            batchIndex: batchIndex
          }, {
            onSuccess: (data) => {
              resolve(data);
            },
            onError: (error: any) => {
              reject(error);
            }
          });
        });
        
        if (batchIndex < calculatedTotalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setTimeout(() => {
        setIsDownloading(false);
        setShowProgressDialog(false);
        setDownloadProgress(0);
        setCurrentBatch(0);
        setTotalBatches(0);
        setSnackbar({
          open: true,
          message: `הורדה הושלמה! ירדו ${calculatedTotalBatches} קבצי ZIP`,
          severity: 'success'
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ שגיאה בהורדה:', error);
      setIsDownloading(false);
      setShowProgressDialog(false);
      setDownloadProgress(0);
      setCurrentBatch(0);
      setTotalBatches(0);
      setSnackbar({
        open: true,
        message: `שגיאה בהורדה: ${error.message || 'timeout או שגיאת רשת'}`,
        severity: 'error'
      });
    }
  };



  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            בחר סוג מסמכים להורדה
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={documentType === 'personal' ? 'contained' : 'outlined'}
              onClick={() => {
                setDocumentType('personal');
                setSelectedProject('');
                setAllDocuments([]);
                setFilteredDocuments([]);
              }}
              startIcon={<DocumentIcon />}
            >
              מסמכים אישיים
            </Button>
            <Button
              variant={documentType === 'project' ? 'contained' : 'outlined'}
              onClick={() => {
                setDocumentType('project');
                setSelectedProject('');
                setAllDocuments([]);
                setFilteredDocuments([]);
              }}
              startIcon={<AttendanceIcon />}
            >
              מסמכי נוכחות פרויקט
            </Button>
          </Stack>

          {documentType === 'project' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                בחר פרויקט:
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>פרויקט</InputLabel>
                  <Select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                    }}
                  >
                    <MenuItem value="1">צהרון שוטף 2025</MenuItem>
                    <MenuItem value="2">קייטנת חנוכה 2025</MenuItem>
                    <MenuItem value="3">קייטנת פסח 2025</MenuItem>
                    <MenuItem value="4">קייטנת קיץ 2025</MenuItem>
                  </Select>
                </FormControl>


              </Stack>
            </Box>
          )}
        </Paper>





        {documentType && showFilters && (documentType === 'personal' || (documentType === 'project' && selectedProject)) && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>פילטרים</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>סטטוס</InputLabel>
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">הכל</MenuItem>
                    {Object.values(DocumentStatus).map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                {documentType === 'personal' ? (
                  <Autocomplete
                    options={workers}
                    getOptionLabel={(option) => `${option.id} - ${option.firstName} ${option.lastName}`}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="מזהה עובד"
                        placeholder="הקלד תעודת זהות או שם..."
                      />
                    )}
                    onChange={(event, newValue) => {
                      handleFilterChange('workerId', newValue?._id || newValue?.id || '');
                    }}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.id.includes(inputValue) ||
                        `${option.firstName} ${option.lastName}`.includes(inputValue)
                      );
                    }}
                  />
                ) : (
                  <Autocomplete
                    options={classes}
                    getOptionLabel={(option: any) => `${option.uniqueSymbol} - ${option.name}`}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="כיתה"
                        placeholder="הקלד סמל ייחודי או שם כיתה..."
                      />
                    )}
                    onChange={(event, newValue) => {
                      handleFilterChange('classId', (newValue as any)?._id || '');
                    }}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter((option: any) =>
                        option.uniqueSymbol.includes(inputValue) ||
                        option.name.includes(inputValue)
                      );
                    }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    סוג מסמך:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant={!filters.tag ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handleFilterChange('tag', '')}
                    >
                      הכל
                    </Button>
                    {documentType === 'personal' ? (
                      <>
                        <Button
                          variant={filters.tag === 'תעודת זהות' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'תעודת זהות')}
                        >
                          תעודת זהות
                        </Button>
                        <Button
                          variant={filters.tag === 'חוזה' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'חוזה')}
                        >
                          חוזה
                        </Button>
                        <Button
                          variant={filters.tag === 'אישור משטרה' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'אישור משטרה')}
                        >
                          אישור משטרה
                        </Button>
                        <Button
                          variant={filters.tag === 'אישור וותק' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'אישור וותק')}
                        >
                          אישור וותק
                        </Button>
                        <Button
                          variant={filters.tag === 'תעודת השכלה' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'תעודת השכלה')}
                        >
                          תעודת השכלה
                        </Button>
                        <Button
                          variant={filters.tag === 'אישור רפואי' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'אישור רפואי')}
                        >
                          אישור רפואי
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant={filters.tag === 'נוכחות עובדים' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'נוכחות עובדים')}
                        >
                          נוכחות עובדים
                        </Button>
                        <Button
                          variant={filters.tag === 'נוכחות תלמידים' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'נוכחות תלמידים')}
                        >
                          נוכחות תלמידים
                        </Button>
                        <Button
                          variant={filters.tag === 'בקרה' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleFilterChange('tag', 'בקרה')}
                        >
                          בקרה
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {documentType && allDocuments.length > 0 && (documentType === 'personal' || (documentType === 'project' && selectedProject)) && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              סיכום מסמכים {filteredDocuments.length !== allDocuments.length ? `(מסוננים: ${filteredDocuments.length} מתוך ${allDocuments.length})` : ''}
              {filteredDocuments.length !== allDocuments.length && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>שים לב:</strong> יורדו רק המסמכים שעונים לפילטרים הפעילים ({filteredDocuments.length} מסמכים)
                  </Typography>
                </Alert>
              )}
            </Typography>
            
            <Grid container spacing={3}>

              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  לפי סוג מסמך:
                </Typography>
                {Object.keys(documentSummary.byType).length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {Object.entries(documentSummary.byType).map(([type, count]) => (
                      <Chip
                        key={type}
                        label={`${type}: ${count}`}
                        color="primary"
                        variant="outlined"
                        size="medium"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    אין מסמכים שעונים לפילטרים הפעילים
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {documentType === 'personal' ? 'לפי עובד:' : 'לפי כיתה:'}
                </Typography>
                {Object.keys(documentSummary.byWorker).length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {Object.entries(documentSummary.byWorker).slice(0, 20).map(([worker, count]) => (
                      <Chip
                        key={worker}
                        label={`${worker}: ${count}`}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                    {Object.keys(documentSummary.byWorker).length > 20 && (
                      <Chip
                        label={`+${Object.keys(documentSummary.byWorker).length - 20} ${documentType === 'personal' ? 'עובדים' : 'כיתות'} נוספות`}
                        variant="outlined"
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    אין מסמכים שעונים לפילטרים הפעילים
                  </Typography>
                )}
              </Grid>
            </Grid>

          </Paper>
        )}

        {documentType && (personalDocumentsLoading || attendanceDocumentsLoading) && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              טוען מסמכים...
            </Typography>
          </Paper>
        )}

        {documentType && !personalDocumentsLoading && !attendanceDocumentsLoading && allDocuments.length === 0 && (documentType === 'personal' || (documentType === 'project' && selectedProject)) && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              {documentType === 'personal' 
                ? 'לא נמצאו מסמכים אישיים' 
                : 'לא נמצאו מסמכי נוכחות לפרויקט זה'
              }
            </Typography>
          </Paper>
        )}

        {documentType && filteredDocuments.length > 0 && (documentType === 'personal' || (documentType === 'project' && selectedProject)) && (
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              הגדרות הורדה
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  ארגון תיקיות
                </Typography>
                {documentType === 'personal' ? (
                  <>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant={organizationType === 'byType' ? 'contained' : 'outlined'}
                        startIcon={<FolderIcon />}
                        onClick={() => setOrganizationType('byType')}
                        size="small"
                      >
                        לפי סוג מסמך
                      </Button>
                      <Button
                        variant={organizationType === 'byWorker' ? 'contained' : 'outlined'}
                        startIcon={<PersonIcon />}
                        onClick={() => setOrganizationType('byWorker')}
                        size="small"
                      >
                        לפי עובד
                      </Button>
                    </Stack>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {organizationType === 'byType' 
                        ? 'הקבצים יאורגנו בתיקיות לפי סוג מסמך'
                        : 'הקבצים יאורגנו בתיקיות לפי עובד (כל עובד תיקיה משלה)'
                      }
                    </Typography>
                  </>
                ) : (
                  <>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant={organizationType === 'byType' ? 'contained' : 'outlined'}
                        startIcon={<FolderIcon />}
                        onClick={() => setOrganizationType('byType')}
                        size="small"
                      >
                        לפי סוג נוכחות
                      </Button>
                      <Button
                        variant={organizationType === 'byWorker' ? 'contained' : 'outlined'}
                        startIcon={<PersonIcon />}
                        onClick={() => setOrganizationType('byWorker')}
                        size="small"
                      >
                        לפי כיתה
                      </Button>
                    </Stack>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {organizationType === 'byType' 
                        ? 'הקבצים יאורגנו בתיקיות לפי סוג נוכחות (עובדים, תלמידים, בקרה)'
                        : 'הקבצים יאורגנו בתיקיות לפי כיתה (כל כיתה תיקיה משלו)'
                      }
                    </Typography>
                  </>
                )}
              </Grid>


            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                color="success"
                startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? 'מוריד...' : 'הורד ZIP'}
              </Button>
            </Box>
          </Paper>
        )}

        <Dialog
          open={showProgressDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 2
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center' }}>
            מכין קובץ ZIP...
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={downloadProgress} 
                size={80}
                thickness={4}
                sx={{ mb: 2 }}
              />
              <Typography variant="h6" color="primary" gutterBottom>
                {Math.round(downloadProgress)}%
              </Typography>
              {totalBatches > 1 && (
                <Typography variant="body1" color="secondary" gutterBottom>
                  Batch {currentBatch} מתוך {totalBatches}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary">
                מוריד קובץ ZIP עם המסמכים הנבחרים...
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                {totalBatches > 1 
                  ? `יורדו ${currentBatch} מתוך ${totalBatches} קבצי ZIP`
                  : 'זה עשוי לקחת כמה רגעים'
                }
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
  

};

export default DownloadDocPage;
