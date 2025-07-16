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
import { validateDocumentFile } from '../../utils/fileValidation';
import { useFetchAllUsers } from '../../queries/useUsers';
import { useFetchClasses } from '../../queries/classQueries';
import { useNavigate } from 'react-router-dom';




const REQUIRED_DOC_TAGS = ['אישור משטרה', 'תעודת השכלה', 'חוזה', 'תעודת זהות', 'אישור וותק'];
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

const getRequiredDocumentsForWorker = (worker: WorkerAfterNoon) => {
  const baseDocuments = ['אישור משטרה', 'חוזה', 'תעודת זהות'];
  
  // אם התפקיד הוא סייע או סייע משלים - לא צריך תעודת השכלה
  if (worker.roleName && (worker.roleName.includes('סייע') || worker.roleName.includes('משלים'))) {
    return baseDocuments;
  }
  
  // אם התפקיד הוא רכז - צריך גם אישור וותק
  if (worker.roleName && worker.roleName.includes('רכז')) {
    return [...baseDocuments, 'תעודת השכלה', 'אישור וותק'];
  }
  
  // אחרת - כולל תעודת השכלה
  return [...baseDocuments, 'תעודת השכלה'];
};

const AllDocumentsTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: personalDocuments = [], isLoading: isLoadingPersonalDocs } = useFetchAllPersonalDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { updateStatus, isUpdatingStatus, uploadDocument, isUploading } = useWorkerDocuments('all');
  const { data: users = [] } = useFetchAllUsers();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();


  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterAccountant, setFilterAccountant] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ workerId: string; workerName: string; workerTz: string; tag: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [manualUploadData, setManualUploadData] = useState<{ worker: WorkerAfterNoon | null; tag: string }>({ worker: null, tag: '' });
  const [page, setPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

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

  // אפשרויות חשבי שכר מתוך המשתמשים
  const accountantUserOptions = useMemo(() => {
    return [
      { value: '', label: 'כל חשבי השכר', accountant: null },
      ...users
        .filter((u: any) => u.role === 'accountant')
        .map((u: any) => ({
          value: u._id,
          label: `${u.firstName} ${u.lastName}`,
          accountant: u
        }))
    ];
  }, [users]);

  const filteredData = useMemo(() => {
    let filtered = workerDocumentsData.filter(({ worker, docs }) => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
      const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
      let accountantMatch = true;
      if (filterAccountant) {
        const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
        console.log('נבחר חשב:', accountant);
        if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
          // מצא את כל הכיתות של העובד
          const workerClasses = classes.filter((cls: any) =>
            Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
          );
          // אסוף את כל קודי המוסד של הכיתות של העובד
          const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
          // בדוק אם יש חפיפה בין קודי המוסד של העובד לאלו של החשב
          accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
        } else {
          accountantMatch = false;
        }
      }
      if (!nameMatch || !projectMatch || !accountantMatch) return false;

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
    return filtered;
  }, [workerDocumentsData, searchTerm, filterStatus, filterType, filterProject, filterAccountant, users, classes]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredData, page]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  if (isLoadingPersonalDocs || isLoadingWorkers || isLoadingClasses) {
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
      const file = event.target.files[0];
      const validation = validateDocumentFile(file);
      
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      
      setSelectedFile(file);
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

  const handleWorkerClick = (workerId: string) => {
    navigate(`/workers/${workerId}`);
  };

  // סטטיסטיקות מותאמות לסינון
  const filteredWorkers = workers.filter(worker => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
    const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
    let accountantMatch = true;
    if (filterAccountant) {
      const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
      if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
        accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
      } else {
        accountantMatch = false;
      }
    }
    
    return nameMatch && projectMatch && accountantMatch;
  });

  // מסמכים של העובדים המסוננים
  const filteredDocuments = personalDocuments.filter(doc => {
    const worker = workers.find(w => w._id === doc.operatorId);
    if (!worker) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
    const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
    let accountantMatch = true;
    if (filterAccountant) {
      const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
      if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
        accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
      } else {
        accountantMatch = false;
      }
    }
    
    return nameMatch && projectMatch && accountantMatch;
  });

  const approvedDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.APPROVED).length;
  const pendingDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.PENDING).length;
  const rejectedDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.REJECTED).length;
  


  return (
    <Box sx={{ p: 1 }}>
        <Grid container spacing={2}>
            <Grid item xs={12} md={10}>
                <Card component={Paper} elevation={3} sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>ניהול מסמכי עובדים</Typography>

                        <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
                            <Tooltip title="איפוס מסננים">
                            <IconButton onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterType(''); setFilterProject(''); setFilterAccountant(''); setPage(0); }} sx={{ color: 'grey.600', alignSelf: 'center' }}>
                                <RestartAltIcon />
                            </IconButton>
                            </Tooltip>

                            <TextField size="small" sx={{ width: '120px' }} label="חיפוש חופשי" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setPage(0);}} />

                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <InputLabel>פרויקט</InputLabel>
                              <Select value={filterProject} label="פרויקט" onChange={(e) => { setFilterProject(e.target.value); setPage(0); }}>
                                {PROJECT_OPTIONS.map(opt => (
                                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>חשב שכר</InputLabel>
                              <Select value={filterAccountant} label="חשב שכר" onChange={(e) => { setFilterAccountant(e.target.value); setPage(0); }}>
                                {accountantUserOptions.map(opt => (
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
                                <TableCell>תפקיד </TableCell>
                                <TableCell>אישור משטרה</TableCell>
                                <TableCell>תעודת השכלה</TableCell>
                                <TableCell>חוזה</TableCell>
                                <TableCell>תעודת זהות</TableCell>
                                <TableCell>אישור וותק</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary">לא נמצאו עובדים התואמים את הסינון</Typography>
                                    </TableCell>
                                </TableRow>
                                ) : (
                                paginatedData.map(({ worker, docs }) => (
                                    <TableRow key={worker._id} hover>
                                    <TableCell>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          cursor: 'pointer',
                                          '&:hover': { 
                                            color: 'primary.main',
                                            textDecoration: 'underline'
                                          }
                                        }}
                                        onClick={() => handleWorkerClick(worker._id)}
                                      >
                                        {`${worker.lastName} ${worker.firstName}`}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{worker.id}</TableCell>
                                    <TableCell>{worker.roleName}</TableCell>
                                    {/* אישור משטרה */}
                                    <TableCell>
                                        {(() => {
                                            const doc = docs['אישור משטרה'];
                                            return doc ? (
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
                                                <Tooltip title="העלה אישור משטרה">
                                                    <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, 'אישור משטרה')}>
                                                        <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                        העלה
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
                                    </TableCell>
                                    
                                    {/* תעודת השכלה */}
                                    <TableCell>
                                        {(() => {
                                            const requiredDocs = getRequiredDocumentsForWorker(worker);
                                            if (!requiredDocs.includes('תעודת השכלה')) {
                                                return (
                                                  <Tooltip title="לא נדרש">
                                                  <IconButton size="small"  sx={{fontSize: '13px'}}>
                                                   -----
        
                                                  </IconButton>
                                              </Tooltip>
                                                );
                                            }
                                            
                                            const doc = docs['תעודת השכלה'];
                                            return doc ? (
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
                                                <Tooltip title="העלה תעודת השכלה">
                                                    <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, 'תעודת השכלה')}>
                                                        <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                        העלה
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
                                    </TableCell>
                                    
                                    {/* חוזה */}
                                    <TableCell>
                                        {(() => {
                                            const doc = docs['חוזה'];
                                            return doc ? (
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
                                                <Tooltip title="העלה חוזה">
                                                    <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, 'חוזה')}>
                                                        <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                        העלה
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
                                    </TableCell>
                                    
                                    {/* תעודת זהות */}
                                    <TableCell>
                                        {(() => {
                                            const doc = docs['תעודת זהות'];
                                            return doc ? (
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
                                                <Tooltip title="העלה תעודת זהות">
                                                    <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, 'תעודת זהות')}>
                                                        <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                        העלה
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
                                    </TableCell>
                                    
                                    {/* אישור וותק */}
                                    <TableCell>
                                        {(() => {
                                            const requiredDocs = getRequiredDocumentsForWorker(worker);
                                            if (!requiredDocs.includes('אישור וותק')) {
                                                return (
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                       -----
                                                    </Typography>
                                                );
                                            }
                                            
                                            const doc = docs['אישור וותק'];
                                            return doc ? (
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
                                                <Tooltip title="העלה אישור וותק">
                                                    <IconButton size="small" color="primary" sx={{fontSize: '13px'}} onClick={() => handleOpenUploadDialog(worker, 'אישור וותק')}>
                                                        <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                                        העלה
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
                                    </TableCell>
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
                <Card sx={{ bgcolor: alpha('#9c27b0', 0.1), color: 'purple.dark' }}>
                        <CardContent>
                            <Typography variant="body2">הורדת דוחות</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ bgcolor: alpha('#2196f3', 0.1), color: 'primary.dark' }}>
                        <CardContent>
                            <Typography variant="h5" fontWeight="bold">{filteredWorkers.length}</Typography>
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
