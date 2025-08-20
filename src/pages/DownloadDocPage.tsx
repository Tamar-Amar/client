import React, { useState, useMemo } from 'react';
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
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import {
  useDocumentsWithFilters,
  useDocumentStats,
  useDocumentTypes,
  useDownloadMultipleDocuments,
} from '../queries/useDocuments';
import { DocumentStatus } from '../types/Document';
import DocumentStats from '../components/documents/DocumentStats';
import BulkDownloadDialog from '../components/documents/BulkDownloadDialog';
import DownloadOrganizationDialog from '../components/documents/DownloadOrganizationDialog';
import axiosInstance from '../services/axiosConfig';

interface DocumentFilters {
  documentType?: string;
  status?: string;
  workerId?: string;
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
  console.log('🚀 DownloadDocPage - הקומפוננטה נטענה');
  
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 1000, // נביא הרבה מסמכים
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [showOrganizationDialog, setShowOrganizationDialog] = useState(false);
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

  console.log('🔧 DownloadDocPage - לפני הוקים');
  
  // הוקים
  const { data: documentsData, isLoading: documentsLoading } = useDocumentsWithFilters(filters);
  const { data: statsData, isLoading: statsLoading } = useDocumentStats();
  const { data: documentTypes, isLoading: typesLoading } = useDocumentTypes();
  
  console.log('🔧 DownloadDocPage - אחרי הוקים');
  
  const downloadMultipleMutation = useDownloadMultipleDocuments();
  
  // הוספת loading state להורדה
  const [isDownloading, setIsDownloading] = useState(false);
  const [maxDocumentsToDownload, setMaxDocumentsToDownload] = useState(100);

  // חישוב סטטיסטיקות
  const stats = useMemo(() => {
    if (!statsData) return null;
    
    return {
      total: statsData.total,
      byType: statsData.byType || [],
      byStatus: statsData.byStatus || [],
      byMonth: statsData.byMonth || [],
    };
  }, [statsData]);

  // פונקציות עזר

  const getStatusColor = (status: string) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'success';
      case DocumentStatus.REJECTED:
        return 'error';
      case DocumentStatus.PENDING:
        return 'warning';
      case DocumentStatus.EXPIRED:
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // פונקציות פעולה
  const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documentsData?.total) {
      // אם כל המסמכים נבחרו, נבטל את הבחירה
      setSelectedDocuments([]);
    } else {
      // נבחר את כל המסמכים שעונים לפילטרים
      // נשתמש ב-API כדי לקבל את כל ה-IDs
      const allDocumentIds = documentsData?.documents.map((doc: any) => doc._id) || [];
      setSelectedDocuments(allDocumentIds);
    }
  };

  // בדיקה אם כל המסמכים בטבלה הנוכחית נבחרו
  const isAllSelected = documentsData?.documents && 
    documentsData.documents.length > 0 && 
    documentsData.documents.every((doc: any) => selectedDocuments.includes(doc._id)) || false;

  // בדיקה אם חלק מהמסמכים בטבלה הנוכחית נבחרו
  const isIndeterminate = documentsData?.documents && 
    documentsData.documents.length > 0 && 
    documentsData.documents.some((doc: any) => selectedDocuments.includes(doc._id)) &&
    !isAllSelected || false;

  const handleDownloadSelected = () => {
    if (selectedDocuments.length === 0) {
      setSnackbar({
        open: true,
        message: 'לא נבחרו מסמכים להורדה',
        severity: 'warning'
      });
      return;
    }

            setSnackbar({
          open: true,
          message: `מכין קובץ ZIP עם ${selectedDocuments.length} מסמכים... (מחפש פרטי עובדים)`,
          severity: 'info'
        });

    downloadMultipleMutation.mutate({ documentIds: selectedDocuments }, {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: `יורד קובץ ZIP עם ${selectedDocuments.length} מסמכים`,
          severity: 'success'
        });
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'שגיאה בהורדת המסמכים',
          severity: 'error'
        });
      }
    });
  };

  const handleDownloadByFilters = () => {
    if (!documentType) {
      setSnackbar({
        open: true,
        message: 'נא לבחור סוג מסמכים להורדה',
        severity: 'warning'
      });
      return;
    }

    if (documentType === 'project' && !selectedProject) {
      setSnackbar({
        open: true,
        message: 'נא לבחור פרויקט',
        severity: 'warning'
      });
      return;
    }

    // קבלת סיכום המסמכים לפני ההורדה
    const summary = calculateDocumentSummary();
    setDocumentSummary(summary);
    setShowOrganizationDialog(true);
  };

  const calculateDocumentSummary = () => {
    if (!documentsData?.documents) {
      return { total: 0, byType: {}, byWorker: {} };
    }

    const byType: { [key: string]: number } = {};
    const byWorker: { [key: string]: number } = {};

    documentsData.documents.forEach((doc: any) => {
      // לפי סוג מסמך
      byType[doc.tag] = (byType[doc.tag] || 0) + 1;

      // לפי עובד
      const workerName = doc.operatorId && typeof doc.operatorId === 'object' && doc.operatorId.firstName
        ? `${doc.operatorId.lastName} ${doc.operatorId.firstName}`
        : 'לא ידוע';
      byWorker[workerName] = (byWorker[workerName] || 0) + 1;
    });

    return {
      total: documentsData.documents.length,
      byType,
      byWorker
    };
  };

  const loadPersonalDocuments = async () => {
    try {
      console.log('🚀 מתחיל לטעון מסמכים אישיים...');
      
      // בדיקה שהפונקציה נקראת
      if (typeof setSnackbar !== 'function') {
        console.error('❌ setSnackbar לא פונקציה');
        return;
      }
      
      setSnackbar({
        open: true,
        message: 'טוען מסמכים אישיים...',
        severity: 'info'
      });

      console.log('📡 שולח בקשה ל-API...');
      const response = await axiosInstance.get('/api/documents/all-personal');
      console.log('✅ קיבלתי תשובה מהשרת:', response.status);
      
      const data = response.data;
      console.log('📄 נתונים שהתקבלו:', data);
      
      if (!data || !data.documents) {
        console.error('❌ נתונים לא תקינים:', data);
        throw new Error('נתונים לא תקינים מהשרת');
      }
      
      console.log('💾 שומר מסמכים...');
      setAllDocuments(data.documents);
      setFilteredDocuments(data.documents);
      
      console.log('📊 מעדכן סיכום...');
      updateDocumentSummary(data.documents);
      
      console.log('✅ סיים לטעון מסמכים אישיים');
    } catch (error: any) {
      console.error('❌ שגיאה בטעינת מסמכים אישיים:', error);
      console.error('❌ פרטי השגיאה:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      setSnackbar({
        open: true,
        message: `שגיאה בטעינת מסמכים אישיים: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const loadAttendanceDocuments = async (projectCode: string) => {
    try {
      console.log('🚀 מתחיל לטעון מסמכי נוכחות עבור פרויקט:', projectCode);
      setSnackbar({
        open: true,
        message: 'טוען מסמכי נוכחות...',
        severity: 'info'
      });

      console.log('📡 שולח בקשה ל-API...');
      const response = await axiosInstance.get(`/api/documents/attendance/${projectCode}`);
      console.log('✅ קיבלתי תשובה מהשרת:', response.status);
      
      const data = response.data;
      console.log('📄 נתונים שהתקבלו:', data);
      
      console.log('💾 שומר מסמכים...');
      setAllDocuments(data.documents);
      setFilteredDocuments(data.documents);
      
      console.log('📊 מעדכן סיכום...');
      updateDocumentSummary(data.documents);
      
      console.log('✅ סיים לטעון מסמכי נוכחות');
    } catch (error) {
      console.error('❌ שגיאה בטעינת מסמכי נוכחות:', error);
      setSnackbar({
        open: true,
        message: 'שגיאה בטעינת מסמכי נוכחות',
        severity: 'error'
      });
    }
  };

  const updateDocumentSummary = (documents: any[]) => {
    console.log('📊 מתחיל לעדכן סיכום עבור', documents.length, 'מסמכים');
    
    const byType: { [key: string]: number } = {};
    const byWorker: { [key: string]: number } = {};

    documents.forEach((doc: any, index: number) => {
      console.log(`📄 מסמך ${index + 1}:`, doc);
      
      // לפי סוג מסמך
      const docType = doc.tag || doc.type;
      byType[docType] = (byType[docType] || 0) + 1;

      // לפי עובד
      const workerName = doc.operatorId && typeof doc.operatorId === 'object' && doc.operatorId.firstName
        ? `${doc.operatorId.lastName} ${doc.operatorId.firstName}`
        : 'לא ידוע';
      byWorker[workerName] = (byWorker[workerName] || 0) + 1;
    });

    console.log('📈 סיכום לפי סוג:', byType);
    console.log('👥 סיכום לפי עובד:', byWorker);

    setDocumentSummary({
      total: documents.length,
      byType,
      byWorker
    });
    
    console.log('✅ סיים לעדכן סיכום');
  };

  const handleOrganizationDownload = (organizationType: 'byType' | 'byWorker', fileNameFormat: 'simple' | 'detailed') => {
    setShowOrganizationDialog(false);
    setIsDownloading(true);
    
    const actualCount = Math.min(allDocuments.length, maxDocumentsToDownload);
    
    setSnackbar({
      open: true,
      message: allDocuments.length > maxDocumentsToDownload 
        ? `מכין קובץ ZIP עם ${actualCount} מסמכים (מתוך ${allDocuments.length} - מוגבל לביצועים טובים יותר)...`
        : `מכין קובץ ZIP עם ${actualCount} מסמכים...`,
      severity: 'info'
    });

    downloadMultipleMutation.mutate({
      ...filters,
      documentType: documentType || undefined,
      selectedProject: selectedProject,
      projectOrganization: projectOrganization,
      organizationType,
      fileNameFormat,
      maxDocuments: maxDocumentsToDownload
    }, {
      onSuccess: () => {
        setIsDownloading(false);
        setSnackbar({
          open: true,
          message: 'יורד קובץ ZIP עם המסמכים הנבחרים',
          severity: 'success'
        });
      },
      onError: (error: any) => {
        setIsDownloading(false);
        console.error('❌ שגיאה בהורדה:', error);
        setSnackbar({
          open: true,
          message: `שגיאה בהורדת המסמכים: ${error.message || 'timeout או שגיאת רשת'}`,
          severity: 'error'
        });
      }
    });
  };



  const handlePageChange = (event: unknown, newPage: number) => {
    handleFilterChange('page', newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('limit', parseInt(event.target.value, 10));
    handleFilterChange('page', 1);
  };

  console.log('🎨 DownloadDocPage - מתחיל render');
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          הורדת מסמכים
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>הורדת מסמכים מאורגנים:</strong>
            <br />• <strong>מסמכים אישיים:</strong> כל המסמכים האישיים של העובדים
            <br />• <strong>פרויקט:</strong> רק מסמכי נוכחות עם ארגון לפי כיתה או סוג
            <br />• <strong>פורמט:</strong> שם_משפחה_שם_פרטי_סוג_מסמך.pdf
            <br /><br /><strong>הערה:</strong> התהליך יכול לקחת מספר שניות בהתאם לכמות המסמכים
          </Typography>
        </Alert>

        {/* בחירה ראשונית */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            בחר סוג מסמכים להורדה
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={documentType === 'personal' ? 'contained' : 'outlined'}
              onClick={() => {
                console.log('🖱️ לחצו על "מסמכים אישיים"');
                setDocumentType('personal');
                setSelectedProject('');
                setAllDocuments([]);
                setFilteredDocuments([]);
                // טעינת כל המסמכים האישיים
                loadPersonalDocuments();
              }}
            >
              מסמכים אישיים
            </Button>
            <Button
              variant={documentType === 'project' ? 'contained' : 'outlined'}
              onClick={() => {
                console.log('🖱️ לחצו על "מסמכי נוכחות פרויקט"');
                setDocumentType('project');
                setSelectedProject('');
                setAllDocuments([]);
                setFilteredDocuments([]);
              }}
            >
              מסמכי נוכחות פרויקט
            </Button>
          </Stack>

          {/* בחירת פרויקט אם נבחר מסמכי נוכחות */}
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
                      if (e.target.value) {
                        loadAttendanceDocuments(e.target.value);
                      }
                    }}
                  >
                    <MenuItem value="1">צהרון שוטף 2025</MenuItem>
                    <MenuItem value="2">קייטנת חנוכה 2025</MenuItem>
                    <MenuItem value="3">קייטנת פסח 2025</MenuItem>
                    <MenuItem value="4">קייטנת קיץ 2025</MenuItem>
                  </Select>
                </FormControl>

                {selectedProject && (
                  <>
                    <Typography variant="body2">ארגון:</Typography>
                    <FormControl>
                      <Select
                        value={projectOrganization}
                        onChange={(e) => setProjectOrganization(e.target.value as 'byClass' | 'byType')}
                        size="small"
                      >
                        <MenuItem value="byClass">לפי כיתה/מסגרת</MenuItem>
                        <MenuItem value="byType">לפי סוג נוכחות</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* סטטיסטיקות */}
        {!statsLoading && stats && (
          <DocumentStats stats={stats} />
        )}

        {/* סרגל כלים */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              פילטרים
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setShowBulkDownload(true)}
              disabled={downloadMultipleMutation.isPending}
            >
              הורד מרובה
            </Button>

            <Button
              variant="outlined"
              startIcon={downloadMultipleMutation.isPending ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDownloadByFilters}
              disabled={downloadMultipleMutation.isPending}
            >
              {downloadMultipleMutation.isPending ? 'מכין ZIP...' : 'הורד ZIP לפי פילטרים'}
            </Button>

            {selectedDocuments.length > 0 && (
              <>
                <Button
                  variant="contained"
                  startIcon={downloadMultipleMutation.isPending ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleDownloadSelected}
                  disabled={downloadMultipleMutation.isPending}
                >
                  {downloadMultipleMutation.isPending ? 'מכין ZIP...' : `הורד ZIP נבחרים (${selectedDocuments.length})`}
                </Button>


              </>
            )}

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              רענון
            </Button>
          </Stack>
        </Paper>

        {/* פילטרים */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">פילטרים</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 20,
                    sortBy: 'uploadedAt',
                    sortOrder: 'desc',
                  });
                }}
              >
                נקה פילטרים
              </Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>סוג מסמך</InputLabel>
                  <Select
                    value={filters.documentType || ''}
                    onChange={(e) => handleFilterChange('documentType', e.target.value)}
                  >
                    <MenuItem value="">הכל</MenuItem>
                    <MenuItem value="תעודת זהות">תעודת זהות</MenuItem>
                    <MenuItem value="אישור משטרה">אישור משטרה</MenuItem>
                    <MenuItem value="חוזה">חוזה</MenuItem>
                    <MenuItem value="תעודת השכלה">תעודת השכלה</MenuItem>
                    <MenuItem value="אישור וותק">אישור וותק</MenuItem>
                    <MenuItem value="נוכחות קייטנה רכז">נוכחות קייטנה רכז</MenuItem>
                    <MenuItem value="אישור רפואי">אישור רפואי</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

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
                <TextField
                  fullWidth
                  label="מזהה עובד"
                  value={filters.workerId || ''}
                  onChange={(e) => handleFilterChange('workerId', e.target.value)}
                  placeholder="הכנס מזהה עובד"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>פרויקט</InputLabel>
                  <Select
                    value={filters.project || ''}
                    onChange={(e) => handleFilterChange('project', e.target.value)}
                  >
                    <MenuItem value="">הכל</MenuItem>
                    <MenuItem value="1">צהרון שוטף 2025</MenuItem>
                    <MenuItem value="2">קייטנת חנוכה 2025</MenuItem>
                    <MenuItem value="3">קייטנת פסח 2025</MenuItem>
                    <MenuItem value="4">קייטנת קיץ 2025</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="מתאריך"
                  value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                  onChange={(date) => handleFilterChange('dateFrom', date?.toISOString())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="עד תאריך"
                  value={filters.dateTo ? new Date(filters.dateTo) : null}
                  onChange={(date) => handleFilterChange('dateTo', date?.toISOString())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>מיון לפי</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="uploadedAt">תאריך העלאה</MenuItem>
                    <MenuItem value="fileName">שם קובץ</MenuItem>
                    <MenuItem value="tag">סוג מסמך</MenuItem>
                    <MenuItem value="status">סטטוס</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>סדר</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <MenuItem value="desc">יורד</MenuItem>
                    <MenuItem value="asc">עולה</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* תצוגת פילטרים פעילים */}
              {Object.values(filters).some(value => value && typeof value === 'string' && value !== '') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    פילטרים פעילים:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value && typeof value === 'string' && value !== '' && key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') {
                        const getFilterLabel = (key: string, value: string) => {
                          switch (key) {
                            case 'documentType':
                              return `סוג מסמך: ${value}`;
                            case 'status':
                              return `סטטוס: ${value}`;
                            case 'workerId':
                              return `מזהה עובד: ${value}`;
                            case 'project':
                              const projectNames: { [key: string]: string } = {
                                '1': 'צהרון שוטף 2025',
                                '2': 'קייטנת חנוכה 2025',
                                '3': 'קייטנת פסח 2025',
                                '4': 'קייטנת קיץ 2025'
                              };
                              return `פרויקט: ${projectNames[value] || value}`;
                            case 'dateFrom':
                              return `מתאריך: ${new Date(value).toLocaleDateString('he-IL')}`;
                            case 'dateTo':
                              return `עד תאריך: ${new Date(value).toLocaleDateString('he-IL')}`;
                            default:
                              return `${key}: ${value}`;
                          }
                        };
                        
                        return (
                          <Chip
                            key={key}
                            label={getFilterLabel(key, value)}
                            size="small"
                            variant="outlined"
                            onDelete={() => handleFilterChange(key as keyof DocumentFilters, '')}
                          />
                        );
                      }
                      return null;
                    })}
                  </Stack>
                </Box>
              )}
            </Grid>
          </Paper>
        )}

                {/* סיכום מסמכים */}
        {documentType && allDocuments.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              סיכום מסמכים
            </Typography>
            
            <Grid container spacing={3}>
              {/* סיכום כללי */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h4" align="center">
                    {allDocuments.length}
                  </Typography>
                  <Typography variant="body1" align="center">
                    סה"כ מסמכים
                  </Typography>
                </Paper>
              </Grid>

              {/* לפי סוג מסמך */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  לפי סוג מסמך:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(documentSummary.byType).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count}`}
                      color="primary"
                      variant="outlined"
                      size="medium"
                    />
                  ))}
                </Stack>
              </Grid>

              {/* לפי עובד */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  לפי עובד:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(documentSummary.byWorker).slice(0, 20).map(([worker, count]) => (
                    <Chip
                      key={worker}
                      label={`${worker}: ${count}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                  {Object.keys(documentSummary.byWorker).length > 20 && (
                    <Chip
                      label={`+${Object.keys(documentSummary.byWorker).length - 20} עובדים נוספים`}
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>

            {/* כפתורי הורדה */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={() => {
                  console.log('🖱️ לחצו על "הורד ZIP מאורגן"');
                  console.log('📊 סיכום לפני הורדה:', {
                    total: allDocuments.length,
                    byType: documentSummary.byType,
                    byWorker: documentSummary.byWorker
                  });
                  
                  const summary = {
                    total: allDocuments.length,
                    byType: documentSummary.byType,
                    byWorker: documentSummary.byWorker
                  };
                  setDocumentSummary(summary);
                  setShowOrganizationDialog(true);
                }}
                disabled={isDownloading}
                sx={{ mr: 2 }}
              >
                {isDownloading ? 'מוריד...' : 'הורד ZIP מאורגן'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* הודעה כשאין מסמכים */}
        {documentType && allDocuments.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              {documentType === 'personal' 
                ? 'לא נמצאו מסמכים אישיים' 
                : 'לא נמצאו מסמכי נוכחות לפרויקט זה'
              }
            </Typography>
          </Paper>
        )}



        {/* דיאלוג הורדה מרובה */}
        <BulkDownloadDialog
          open={showBulkDownload}
          onClose={() => setShowBulkDownload(false)}
          selectedDocumentIds={selectedDocuments}
        />

        {/* דיאלוג בחירת ארגון */}
        <DownloadOrganizationDialog
          open={showOrganizationDialog}
          onClose={() => setShowOrganizationDialog(false)}
          documentSummary={documentSummary}
          onDownload={handleOrganizationDownload}
          isDownloading={downloadMultipleMutation.isPending}
        />

        {/* Snackbar להודעות */}
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
  
  console.log('🎨 DownloadDocPage - סיים render');
};

export default DownloadDocPage;
