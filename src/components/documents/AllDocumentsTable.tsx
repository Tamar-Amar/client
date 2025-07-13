import React, { useState, useMemo, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select,
  MenuItem, InputLabel, FormControl, Stack, Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllPersonalDocuments, useWorkerDocuments } from '../../queries/useDocuments';
import { useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { DocumentStatus } from '../../types/Document';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { WorkerAfterNoon } from '../../types';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

const REQUIRED_DOC_TAGS = ['אישור משטרה', 'תעודת השכלה', 'חוזה', 'תעודת זהות'];
const ROWS_PER_PAGE = 15;

const getStatusChip = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.APPROVED:
      return <Chip label="מאושר" color="success" size="small" variant="outlined" />;
    case DocumentStatus.REJECTED:
      return <Chip label="נדחה" color="error" size="small" variant="outlined" />;
    case DocumentStatus.PENDING:
      return null;
    default:
      return null;
  }
};

const AllDocumentsTable: React.FC = () => {
  const { data: personalDocuments = [], isLoading: isLoadingPersonalDocs } = useFetchAllPersonalDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { updateStatus, isUpdatingStatus, uploadDocument, isUploading } = useWorkerDocuments('all');

  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ workerId: string; workerName: string; workerTz: string; tag: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [manualUploadData, setManualUploadData] = useState<{ worker: WorkerAfterNoon | null; tag: string }>({ worker: null, tag: '' });
  const [page, setPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workerDocumentsData = useMemo(() => {
    const workerMap = new Map<string, { worker: WorkerAfterNoon; docs: { [key: string]: any } }>();
    workers.forEach(w => {
      workerMap.set(w._id, { worker: w, docs: {} });
    });

    personalDocuments.forEach(doc => {
      if (workerMap.has(doc.operatorId)) {
        const entry = workerMap.get(doc.operatorId)!;
        entry.docs[doc.tag] = doc;
      }
    });
    return Array.from(workerMap.values());
  }, [workers, personalDocuments]);

  const PROJECT_OPTIONS = [
    { value: '', label: 'כל הפרויקטים' },
    { value: '1', label: 'צהרון שוטף 2025' },
    { value: '2', label: 'קייטנת חנוכה 2025' },
    { value: '3', label: 'קייטנת פסח 2025' },
    { value: '4', label: 'קייטנת קיץ 2025' },
  ];

  const filteredData = useMemo(() => {
    return workerDocumentsData.filter(({ worker, docs }) => {
      const nameMatch = !searchName || `${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchName.toLowerCase());
      const idMatch = !searchId || (worker.id || '').includes(searchId);
      const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));

      if (!nameMatch || !idMatch || !projectMatch) return false;

      if (filterType && filterStatus) {
        return docs[filterType] && docs[filterType].status === filterStatus;
      }
      if (filterType) {
        return !!docs[filterType];
      }
      if (filterStatus) {
        return Object.values(docs).some(doc => doc.status === filterStatus);
      }
      return true;
    });
  }, [workerDocumentsData, searchName, searchId, filterStatus, filterType, filterProject]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredData, page]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  if (isLoadingPersonalDocs || isLoadingWorkers) {
    return <Typography>טוען...</Typography>;
  }

  const handleOpenUploadDialog = (worker: WorkerAfterNoon, tag: string) => {
    setUploadTarget({ 
      workerId: worker._id, 
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerTz: worker.id || '', 
      tag 
    });
    setIsUploadDialogOpen(true);
  };
  
  const handleOpenManualUploadDialog = () => {
    setUploadTarget(null);
    setManualUploadData({ worker: null, tag: '' });
    setIsUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setUploadTarget(null);
    setSelectedFile(null);
    setExpirationDate(null);
    setManualUploadData({ worker: null, tag: '' });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    const isManual = !uploadTarget && manualUploadData.worker;
    const targetWorkerId = isManual ? manualUploadData.worker?._id : uploadTarget?.workerId;
    const targetTag = isManual ? manualUploadData.tag : uploadTarget?.tag;
    const targetTz = isManual ? manualUploadData.worker?.id : uploadTarget?.workerTz;

    if (!selectedFile || !targetWorkerId || !targetTag || !targetTz) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', targetWorkerId);
    formData.append('tag', targetTag);
    formData.append('documentType', targetTag);
    formData.append('tz', targetTz);

    if (expirationDate) {
      formData.append('expirationDate', expirationDate.toISOString());
    }

    uploadDocument(formData, {
      onSuccess: () => {
        handleCloseUploadDialog();
      }
    });
  };

  const handleApprove = (documentId: string) => updateStatus({ documentId, status: DocumentStatus.APPROVED });
  const handleReject = (documentId: string) => updateStatus({ documentId, status: DocumentStatus.REJECTED });

  const approvedDocsCount = personalDocuments.filter(d => d.status === DocumentStatus.APPROVED).length;
  const pendingDocsCount = personalDocuments.filter(d => d.status === DocumentStatus.PENDING).length;
  const rejectedDocsCount = personalDocuments.filter(d => d.status === DocumentStatus.REJECTED).length;

  return (
    <Box sx={{ p: 1 }}>
        <Grid container spacing={2}>
            <Grid item xs={12} md={10}>
                <Card component={Paper} elevation={3} sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>ניהול מסמכי עובדים</Typography>

                        <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
                            <Tooltip title="איפוס מסננים">
                            <IconButton onClick={() => { setSearchName(''); setSearchId(''); setFilterStatus(''); setFilterType(''); setFilterProject(''); setPage(0); }} sx={{ color: 'grey.600', alignSelf: 'center' }}>
                                <RestartAltIcon />
                            </IconButton>
                            </Tooltip>
                            <TextField size="small" sx={{ width: '120px' }} label="חפש שם" value={searchName} onChange={(e) => {setSearchName(e.target.value); setPage(0);}} />
                            <TextField size="small" sx={{ width: '120px' }} label="חפש ת.ז" value={searchId} onChange={(e) => {setSearchId(e.target.value); setPage(0);}} />

                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <InputLabel>פרויקט</InputLabel>
                              <Select value={filterProject} label="פרויקט" onChange={(e) => { setFilterProject(e.target.value); setPage(0); }}>
                                {PROJECT_OPTIONS.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>סטטוס מסמך</InputLabel>
                            <Select value={filterStatus} label="סטטוס מסמך" onChange={(e) => {setFilterStatus(e.target.value as DocumentStatus); setPage(0);}}>
                                <MenuItem value="">הכל</MenuItem>
                                <MenuItem value={DocumentStatus.APPROVED}>מאושר</MenuItem>
                                <MenuItem value={DocumentStatus.PENDING}>ממתין</MenuItem>
                                <MenuItem value={DocumentStatus.REJECTED}>נדחה</MenuItem>
                            </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>סוג מסמך</InputLabel>
                            <Select value={filterType} label="סוג מסמך" onChange={(e) => {setFilterType(e.target.value); setPage(0);}}>
                                <MenuItem value="">הכל</MenuItem>
                                {REQUIRED_DOC_TAGS.map(tag => (
                                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                                ))}
                            </Select>
                            </FormControl>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button
                                variant="contained"
                                startIcon={<UploadFileIcon />}
                                onClick={handleOpenManualUploadDialog}
                            >
                                העלאת מסמך
                            </Button>
                        </Stack>

                        <TableContainer sx={{ minHeight: 400 }}>
                            <Table 
                                size="small" 
                                stickyHeader
                                sx={{
                                    tableLayout: 'fixed',
                                    '& thead th': {
                                        padding: '6px 10px',
                                        width: '120px',
                                    },
                                    '& tbody td': {
                                        padding: '2px 10px',
                                        width: '120px',
                                    },
                                }}
                            >
                            <TableHead>
                                <TableRow sx={{ '& th': { backgroundColor: 'grey.100', fontWeight: 'bold' } }}>
                                <TableCell>שם עובד</TableCell>
                                <TableCell>ת"ז</TableCell>
                                {REQUIRED_DOC_TAGS.map(tag => (
                                    <TableCell key={tag} >{tag}</TableCell>
                                ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={REQUIRED_DOC_TAGS.length + 2} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary">לא נמצאו עובדים התואמים את הסינון</Typography>
                                    </TableCell>
                                </TableRow>
                                ) : (
                                paginatedData.map(({ worker, docs }) => (
                                    <TableRow key={worker._id} hover>
                                    <TableCell>{`${worker.lastName} ${worker.firstName}`}</TableCell>
                                    <TableCell>{worker.id}</TableCell>
                                    {REQUIRED_DOC_TAGS.map(tag => {
                                        const doc = docs[tag];
                                        return (
                                        <TableCell key={tag} >
                                            {doc ? (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                              <Tooltip title="צפה במסמך">
                                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                                </Tooltip>
                                                {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}

                                
                                                {doc.status === DocumentStatus.PENDING && (
                                                <>
                                                    <Tooltip title="אשר">
                                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                                        <CheckIcon fontSize="small" color="success" />
                                                    </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="דחה">
                                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                                        <CloseIcon fontSize="small" color="error" />
                                                    </IconButton>
                                                    </Tooltip>
                                                </>
                                                )}
                                            </Stack>
                                            ) : (
                                            <Tooltip title={`העלה ${tag}`}>
                                                <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, tag)}>
                                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                העלה
                                                </IconButton>
                                            </Tooltip>
                                            )}
                                        </TableCell>
                                        );
                                    })}
                                    </TableRow>
                                ))
                                )}
                            </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredData.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={ROWS_PER_PAGE}
                            rowsPerPageOptions={[ROWS_PER_PAGE]}
                            labelRowsPerPage="שורות בעמוד:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={2}>
                <Stack spacing={2}>
                    <Card sx={{ bgcolor: alpha('#2196f3', 0.1), color: 'primary.dark' }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight="bold">{workers.length}</Typography>
                            <Typography variant="body2">עובדים במערכת</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: alpha('#4caf50', 0.1), color: 'success.dark' }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight="bold">{approvedDocsCount}</Typography>
                            <Typography variant="body2">מסמכים מאושרים</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: alpha('#ff9800', 0.1), color: 'warning.dark' }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight="bold">{pendingDocsCount}</Typography>
                            <Typography variant="body2">מסמכים ממתינים</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: alpha('#f44336', 0.1), color: 'error.dark' }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight="bold">{rejectedDocsCount}</Typography>
                            <Typography variant="body2">מסמכים שנדחו</Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </Grid>
        </Grid>

      <Dialog open={isUploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>
          {uploadTarget ? `העלאת מסמך: ${uploadTarget.tag}` : 'העלאת מסמך חדש'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 400 }}>
            {uploadTarget ? (
              <Typography variant="body1">
                עבור: <strong>{uploadTarget.workerName}</strong>
              </Typography>
            ) : (
                <>
                 <Autocomplete
                    options={workers}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.id})`}
                    value={manualUploadData.worker}
                    onChange={(_, newValue) => setManualUploadData(prev => ({ ...prev, worker: newValue }))}
                    renderInput={(params) => <TextField {...params} label="בחר עובד" />}
                 />
                 <FormControl fullWidth>
                    <InputLabel>סוג מסמך</InputLabel>
                    <Select
                        value={manualUploadData.tag}
                        label="סוג מסמך"
                        onChange={(e) => setManualUploadData(prev => ({ ...prev, tag: e.target.value }))}
                    >
                        {REQUIRED_DOC_TAGS.map(tag => (
                            <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                        ))}
                    </Select>
                 </FormControl>
                </>
            )}
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
            >
              {selectedFile ? selectedFile.name : 'בחר קובץ'}
            </Button>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="תוקף (אופציונלי)"
                value={expirationDate}
                onChange={(newValue) => setExpirationDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || (uploadTarget === null && (!manualUploadData.worker || !manualUploadData.tag)) }
          >
            {isUploading ? <CircularProgress size={24} /> : 'העלה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllDocumentsTable;
