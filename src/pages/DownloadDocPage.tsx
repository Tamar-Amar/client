import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
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
  Divider,
  Stack,
  Badge,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Warning as ExpiredIcon,
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
  useBulkUpdateDocumentStatus,
  useBulkDeleteDocuments,
} from '../queries/useDocuments';
import { DocumentStatus } from '../types/Document';
import DocumentStats from '../components/documents/DocumentStats';
import BulkDownloadDialog from '../components/documents/BulkDownloadDialog';

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
}

const DownloadDocPage: React.FC = () => {
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkComments, setBulkComments] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // הוקים
  const { data: documentsData, isLoading: documentsLoading } = useDocumentsWithFilters(filters);
  const { data: statsData, isLoading: statsLoading } = useDocumentStats();
  const { data: documentTypes, isLoading: typesLoading } = useDocumentTypes();
  
  const downloadMultipleMutation = useDownloadMultipleDocuments();
  const bulkUpdateMutation = useBulkUpdateDocumentStatus();
  const bulkDeleteMutation = useBulkDeleteDocuments();

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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <ApprovedIcon color="success" />;
      case DocumentStatus.REJECTED:
        return <RejectedIcon color="error" />;
      case DocumentStatus.PENDING:
        return <PendingIcon color="warning" />;
      case DocumentStatus.EXPIRED:
        return <ExpiredIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

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
    if (selectedDocuments.length === documentsData?.documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documentsData?.documents.map((doc: any) => doc._id) || []);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedDocuments.length === 0) {
      setSnackbar({
        open: true,
        message: 'לא נבחרו מסמכים להורדה',
        severity: 'warning'
      });
      return;
    }

    downloadMultipleMutation.mutate({ documentIds: selectedDocuments });
  };

  const handleDownloadByFilters = () => {
    downloadMultipleMutation.mutate(filters);
  };

  const handleBulkUpdateStatus = () => {
    if (selectedDocuments.length === 0 || !bulkStatus) {
      setSnackbar({
        open: true,
        message: 'נא לבחור מסמכים וסטטוס',
        severity: 'warning'
      });
      return;
    }

    bulkUpdateMutation.mutate({
      documentIds: selectedDocuments,
      status: bulkStatus,
      comments: bulkComments,
    }, {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: 'עודכנו המסמכים בהצלחה',
          severity: 'success'
        });
        setSelectedDocuments([]);
        setBulkStatus('');
        setBulkComments('');
        setShowBulkActions(false);
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'שגיאה בעדכון המסמכים',
          severity: 'error'
        });
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.length === 0) {
      setSnackbar({
        open: true,
        message: 'לא נבחרו מסמכים למחיקה',
        severity: 'warning'
      });
      return;
    }

    if (window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedDocuments.length} מסמכים?`)) {
      bulkDeleteMutation.mutate(selectedDocuments, {
        onSuccess: () => {
          setSnackbar({
            open: true,
            message: 'נמחקו המסמכים בהצלחה',
            severity: 'success'
          });
          setSelectedDocuments([]);
        },
        onError: () => {
          setSnackbar({
            open: true,
            message: 'שגיאה במחיקת המסמכים',
            severity: 'error'
          });
        }
      });
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    handleFilterChange('page', newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('limit', parseInt(event.target.value, 10));
    handleFilterChange('page', 1);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          DOWNLOAD DOC - ניהול מסמכים מתקדם
        </Typography>

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

            {selectedDocuments.length > 0 && (
              <>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadSelected}
                  disabled={downloadMultipleMutation.isPending}
                >
                  הורד נבחרים ({selectedDocuments.length})
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setShowBulkActions(true)}
                >
                  עדכון מרובה
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  מחיקה מרובה
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
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>סוג מסמך</InputLabel>
                  <Select
                    value={filters.documentType || ''}
                    onChange={(e) => handleFilterChange('documentType', e.target.value)}
                  >
                    <MenuItem value="">הכל</MenuItem>
                    {documentTypes?.map((type: string) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
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
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="פרויקט"
                  value={filters.project || ''}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                />
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
            </Grid>
          </Paper>
        )}

        {/* טבלת מסמכים */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < (documentsData?.documents.length || 0)}
                      checked={selectedDocuments.length === documentsData?.documents.length && documentsData?.documents.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>שם קובץ</TableCell>
                  <TableCell>סוג מסמך</TableCell>
                  <TableCell>עובד</TableCell>
                  <TableCell>פרויקט</TableCell>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>גודל</TableCell>
                  <TableCell>תאריך העלאה</TableCell>
                  <TableCell>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : documentsData?.documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      לא נמצאו מסמכים
                    </TableCell>
                  </TableRow>
                ) : (
                  documentsData?.documents.map((doc: any) => (
                    <TableRow key={doc._id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDocuments.includes(doc._id)}
                          onChange={() => handleSelectDocument(doc._id)}
                        />
                      </TableCell>
                      <TableCell>{doc.fileName}</TableCell>
                      <TableCell>
                        <Chip label={doc.tag} size="small" />
                      </TableCell>
                      <TableCell>
                        {doc.operatorId ? 
                          `${doc.operatorId.firstName} ${doc.operatorId.lastName}` : 
                          'לא ידוע'
                        }
                      </TableCell>
                      <TableCell>{doc.operatorId?.project || 'לא ידוע'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(doc.status)}
                          label={doc.status}
                          color={getStatusColor(doc.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="צפייה">
                            <IconButton
                              size="small"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="הורדה">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {documentsData && (
            <TablePagination
              component="div"
              count={documentsData.pagination.totalCount}
              page={documentsData.pagination.currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.limit}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage="שורות בעמוד:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} מתוך ${count}`
              }
            />
          )}
        </Paper>

        {/* דיאלוג עדכון מרובה */}
        <Dialog open={showBulkActions} onClose={() => setShowBulkActions(false)}>
          <DialogTitle>עדכון סטטוס מרובה</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>סטטוס חדש</InputLabel>
                <Select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                >
                  {Object.values(DocumentStatus).map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="הערות (אופציונלי)"
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBulkActions(false)}>ביטול</Button>
            <Button 
              onClick={handleBulkUpdateStatus}
              variant="contained"
              disabled={!bulkStatus || bulkUpdateMutation.isPending}
            >
              עדכון
            </Button>
          </DialogActions>
        </Dialog>

        {/* דיאלוג הורדה מרובה */}
        <BulkDownloadDialog
          open={showBulkDownload}
          onClose={() => setShowBulkDownload(false)}
          selectedDocumentIds={selectedDocuments}
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
};

export default DownloadDocPage;
