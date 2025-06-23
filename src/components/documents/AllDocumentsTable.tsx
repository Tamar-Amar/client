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
  Autocomplete
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllDocuments, useWorkerDocuments } from '../../queries/useDocuments';
import { useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { DocumentStatus } from '../../types/Document';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { WorkerAfterNoon } from '../../types';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

const REQUIRED_DOC_TAGS = ['תעודת זהות', 'אישור משטרה', 'תעודת השכלה'];

const getStatusChip = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.APPROVED:
      return <Chip icon={<CheckCircleIcon />} label="מאושר" color="success" size="small" variant="outlined" />;
    case DocumentStatus.REJECTED:
      return <Chip icon={<CancelIcon />} label="נדחה" color="error" size="small" variant="outlined" />;
    case DocumentStatus.PENDING:
      return <Chip icon={<HourglassEmptyIcon />} label="ממתין" color="warning" size="small" variant="outlined" />;
    default:
      return null;
  }
};

const AllDocumentsTable: React.FC = () => {
  const { data: documents = [], isLoading: isLoadingDocs } = useFetchAllDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { updateStatus, isUpdatingStatus, uploadDocument, isUploading } = useWorkerDocuments('all');

  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  const [filterType, setFilterType] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ workerId: string; workerName: string; workerTz: string; tag: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [manualUploadData, setManualUploadData] = useState<{ worker: WorkerAfterNoon | null; tag: string }>({ worker: null, tag: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workerDocumentsData = useMemo(() => {
    const workerMap = new Map<string, { worker: WorkerAfterNoon; docs: { [key: string]: any } }>();
    workers.forEach(w => {
      workerMap.set(w._id, { worker: w, docs: {} });
    });

    documents.forEach(doc => {
      if (workerMap.has(doc.operatorId)) {
        const entry = workerMap.get(doc.operatorId)!;
        entry.docs[doc.tag] = doc;
      }
    });
    return Array.from(workerMap.values());
  }, [workers, documents]);

  const filteredData = useMemo(() => {
    return workerDocumentsData.filter(({ worker, docs }) => {
      const nameMatch = !searchName || `${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchName.toLowerCase());
      const idMatch = !searchId || (worker.id || '').includes(searchId);

      if (!nameMatch || !idMatch) return false;

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
  }, [workerDocumentsData, searchName, searchId, filterStatus, filterType]);

  if (isLoadingDocs || isLoadingWorkers) {
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

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>ניהול מסמכי עובדים</Typography>

      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
        <Tooltip title="איפוס מסננים">
          <IconButton onClick={() => { setSearchName(''); setSearchId(''); setFilterStatus(''); setFilterType(''); }} sx={{ color: 'grey.600', alignSelf: 'center' }}>
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
        <TextField size="small" label="חפש לפי שם" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <TextField size="small" label="חפש לפי ת.ז" value={searchId} onChange={(e) => setSearchId(e.target.value)} />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>סטטוס מסמך</InputLabel>
          <Select value={filterStatus} label="סטטוס מסמך" onChange={(e) => setFilterStatus(e.target.value as DocumentStatus)}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value={DocumentStatus.APPROVED}>מאושר</MenuItem>
            <MenuItem value={DocumentStatus.PENDING}>ממתין</MenuItem>
            <MenuItem value={DocumentStatus.REJECTED}>נדחה</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>סוג מסמך</InputLabel>
          <Select value={filterType} label="סוג מסמך" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">הכל</MenuItem>
            {REQUIRED_DOC_TAGS.map(tag => (
              <MenuItem key={tag} value={tag}>{tag}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenManualUploadDialog}
            sx={{ ml: 'auto' }}
        >
            העלאת מסמך
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { backgroundColor: 'grey.100', fontWeight: 'bold' } }}>
              <TableCell>שם עובד</TableCell>
              <TableCell>ת"ז</TableCell>
              {REQUIRED_DOC_TAGS.map(tag => (
                <TableCell key={tag} align="center">{tag}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={REQUIRED_DOC_TAGS.length + 2} align="center">
                  לא נמצאו עובדים התואמים את הסינון
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(({ worker, docs }) => (
                <TableRow key={worker._id} hover>
                  <TableCell>{`${worker.lastName} ${worker.firstName}`}</TableCell>
                  <TableCell>{worker.id}</TableCell>
                  {REQUIRED_DOC_TAGS.map(tag => {
                    const doc = docs[tag];
                    return (
                      <TableCell key={tag} align="center">
                        {doc ? (
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            {getStatusChip(doc.status)}
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
                            <IconButton color="primary" sx={{fontSize: '14px'}} onClick={() => handleOpenUploadDialog(worker, tag)}>
                              <UploadFileIcon />
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
