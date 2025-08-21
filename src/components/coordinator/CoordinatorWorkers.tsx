import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Link,
  SelectChangeEvent
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { WorkerWithClassInfo } from '../../types';
import axios from 'axios';
import { Document, DocumentStatus, DocumentType } from '../../types/Document';
import { validateDocumentFile } from '../../utils/fileValidation';
import { useCoordinatorWorkers } from '../../queries/useCoordinatorWorkers';
import UploadWorkerDocumentDialog from './UploadWorkerDocumentDialog';


interface CoordinatorWorkersProps {
  coordinatorId: string;
}


const CoordinatorWorkers: React.FC<CoordinatorWorkersProps> = ({ coordinatorId }) => {
  const {
    workers,
    workersLoading: loading,
    workersError: error,
    allWorkerDocuments,
    documentsLoading,
    documentsSummary,
    refetchDocuments,
  } = useCoordinatorWorkers(coordinatorId);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterInstitutionCode, setFilterInstitutionCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const workersPerPage = 10;
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithClassInfo | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    documentId: string | null;
    documentName: string;
    workerName: string;
  }>({
    open: false,
    documentId: null,
    documentName: '',
    workerName: ''
  });

  const [form101Dialog, setForm101Dialog] = useState<{
    open: boolean;
    workerName: string;
  }>({
    open: false,
    workerName: ''
  });

  useEffect(() => {
    if (workers.length > 0) {
      // calculateDocumentsSummary(workers); // This function is no longer needed
    }
  }, [allWorkerDocuments, workers]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    workers.forEach((worker: WorkerWithClassInfo) => {
      if (worker.roleName) {
        const normalizedRole = worker.roleName.trim().replace(/\s+/g, ' ');
        if (normalizedRole) {
          roles.add(normalizedRole);
        }
      }
    });
    return [
      { value: '', label: 'כל התפקידים' },
      ...Array.from(roles).sort().map(role => ({ value: role, label: role }))
    ];
  }, [workers]);

  const institutionCodeOptions = useMemo(() => {
    const codes = new Set<string>();
    workers.forEach((worker: WorkerWithClassInfo) => {
      if (worker.institutionCode) {
        codes.add(worker.institutionCode);
      }
    });
    return [
      { value: '', label: 'כל קודי המוסד' },
      ...Array.from(codes).sort().map(code => ({ value: code, label: code }))
    ];
  }, [workers]);

  const filteredWorkers = workers.filter(worker => {
    const searchLower = searchTerm.toLowerCase();
    const normalizedWorkerRole = worker.roleName?.trim().replace(/\s+/g, ' ');
    
    const matchesSearch = (
      worker.firstName?.toLowerCase().includes(searchLower) ||
      worker.lastName?.toLowerCase().includes(searchLower) ||
      worker.id?.includes(searchTerm) ||
      worker.phone?.includes(searchTerm) ||
      worker.email?.toLowerCase().includes(searchLower) ||
      normalizedWorkerRole?.toLowerCase().includes(searchLower) ||
      worker.classSymbol?.toLowerCase().includes(searchLower) ||
      worker.className?.toLowerCase().includes(searchLower)
    );
    
    const matchesRole = !filterRole || normalizedWorkerRole === filterRole;
    const matchesInstitutionCode = !filterInstitutionCode || worker.institutionCode === filterInstitutionCode;
    
    return matchesSearch && matchesRole && matchesInstitutionCode;
  });

  const totalPages = Math.ceil(filteredWorkers.length / workersPerPage);
  const startIndex = (currentPage - 1) * workersPerPage;
  const endIndex = startIndex + workersPerPage;
  const currentWorkers = filteredWorkers.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // איפוס לדף ראשון בעת חיפוש
  };

  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterRole(event.target.value as string);
    setCurrentPage(1); // איפוס לדף ראשון בעת סינון תפקיד
  };

  const handleInstitutionCodeFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterInstitutionCode(event.target.value as string);
    setCurrentPage(1); // איפוס לדף ראשון בעת סינון קוד מוסד
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterInstitutionCode('');
    setCurrentPage(1);
  };


  const handleWorkerClick = async (worker: WorkerWithClassInfo) => {
    setSelectedWorker(worker);
    setDocumentsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedWorker(null);
  };

  const handleViewDocument = (document: Document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedWorker || !selectedFile || !selectedDocumentType) {
      return;
    }

    try {
      setUploadLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('workerId', selectedWorker._id);
      formData.append('documentType', selectedDocumentType);
      formData.append('tz', selectedWorker.id);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        await refetchDocuments();
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setSelectedDocumentType('');
        setExpiryDate('');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert('שגיאה בהעלאת הטפס');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateDocumentFile(file);
      
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setSelectedDocumentType('');
    setExpiryDate('');
  };

  const handleUploadDocumentForWorker = (worker: WorkerWithClassInfo, documentType: string) => {
    setSelectedWorker(worker);
    setSelectedDocumentType(documentType);
    setUploadDialogOpen(true);
  };


  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      await refetchDocuments();
      
      setDeleteConfirmDialog({
        open: false,
        documentId: null,
        documentName: '',
        workerName: ''
      });
    } catch (error) {
      console.error('שגיאה במחיקת המסמך:', error);
    }
  };

  const openDeleteConfirmDialog = (documentId: string, documentName: string, workerName: string) => {
    setDeleteConfirmDialog({
      open: true,
      documentId,
      documentName,
      workerName
    });
  };

  const closeDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({
      open: false,
      documentId: null,
      documentName: '',
      workerName: ''
    });
  };

  const getMissingDocuments = (worker: WorkerWithClassInfo) => {
    const baseDocuments = [
      DocumentType.ID,
      DocumentType.POLICE_APPROVAL, 
      DocumentType.CONTRACT
    ];
    
    const normalizedRole = worker.roleName?.trim().replace(/\s+/g, ' ');
    
    let requiredDocuments = [...baseDocuments];
    if (worker.roleName && !(worker.roleName.includes('סייע') || worker.roleName.includes('משלים') || worker.roleName.includes('מד"צ'))) {
      requiredDocuments.push(DocumentType.TEACHING_CERTIFICATE);
    }
    
    if (worker.roleName && worker.roleName.includes('רכז')) {
      requiredDocuments.push('אישור וותק' as any);
    }
    
    const uploadedDocuments = allWorkerDocuments
      .filter(doc => doc.operatorId === worker._id)
      .map(doc => doc.tag);
    
    const missingDocs = requiredDocuments.filter(doc => !uploadedDocuments.includes(doc));
    
    const result: Array<{
      tag: string;
      hasLink: boolean;
      link?: string;
      linkText?: string;
    }> = missingDocs.map(doc => ({
      tag: doc,
      hasLink: false
    }));
    
    if (!worker.is101) {
      result.push({
        tag: 'טופס 101',
        hasLink: true,
        link: "https://101.rdn.org.il/#!/account/emp-login",
        linkText: "למילוי הטופס לחצו כאן"
      });
    }

    if (normalizedRole && (normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז'))) {
      requiredDocuments.push(DocumentType.CAMP_ATTENDANCE_COORDINATOR);
    }
    
    return result;
  };

  const isDocExists = React.useMemo(() => {
    if (!selectedWorker || !selectedDocumentType) return false;
    const workerDocs = allWorkerDocuments.filter(doc => doc.operatorId === selectedWorker._id);
    return workerDocs.some(doc => doc.tag === selectedDocumentType);
  }, [selectedWorker, selectedDocumentType, allWorkerDocuments]);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Paper sx={{
        p: { xs: 1, md: 1 },
        borderRadius: 2,
        bgcolor: '#f7f7fa',
        border: '1px solid #e0e0e0',
        borderBottom: '3px solid #1976d2',
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: 'primary.main', borderRadius: '8px 8px 0 0' }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold" color="primary.main">
           עובדים
          </Typography>
          <Chip 
            label={workers.length} 
            color="primary" 
            sx={{ ml: 2 }}
          />
        </Box>




        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>פרויקט</InputLabel>
                <Select
                  value="4"
                  label="פרויקט"
                  disabled
                >
                  <MenuItem value="4">קייטנת קיץ 2025</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>קוד מוסד</InputLabel>
                <Select
                  value={filterInstitutionCode}
                  label="קוד מוסד"
                  onChange={handleInstitutionCodeFilterChange}
                >
                  {institutionCodeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>תפקיד</InputLabel>
                <Select
                  value={filterRole}
                  label="תפקיד"
                  onChange={handleRoleFilterChange}
                >
                  {roleOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="חיפוש עובדים..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={clearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary">
            נמצאו {filteredWorkers.length} עובדים מתוך {workers.length} סה"כ
          </Typography>
        </Box>

        {filteredWorkers.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            bgcolor: '#fafafa',
            borderRadius: 1,
            p: 4
          }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'לא נמצאו עובדים התואמים לחיפוש' : 'אין עובדים תחת אחריותך'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'נסה לשנות את מונח החיפוש' : 'עובדים יוצגו כאן לאחר שיוך על ידי מנהל המערכת'}
            </Typography>
          </Box>
        ) : (
          <>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  סיכום מסמכים
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      מסמכים שהועלו:
                    </Typography>
                    <Chip 
                      label={documentsSummary.totalUploaded} 
                      color="primary" 
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      מסמכים מאושרים:
                    </Typography>
                    <Chip 
                      label={documentsSummary.totalApproved} 
                      color="success" 
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      מסמכים ממתינים:
                    </Typography>
                    <Chip 
                      label={documentsSummary.totalPending} 
                      color="warning" 
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      נדחו:
                    </Typography>
                    <Chip 
                      label={documentsSummary.totalRejected} 
                      color="error" 
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>


            <Box>
              <TableContainer sx={{ bgcolor: '#f9fbfd', borderRadius: 1, minHeight: '400px' }}>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '15%' }}>שם העובד</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '12%' }}>ת"ז</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '12%' }}>תפקיד</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '8%' }}>101</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '12%' }}>אישור משטרה</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '12%' }}>תעודת השכלה</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '10%' }}>חוזה</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '12%' }}>תעודת זהות</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '7%' }}>אישור וותק</TableCell>
                      <TableCell sx={{ py: 1, px: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '10%' }}>נוכחות קייטנה</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                                       {currentWorkers.map((worker) => {
                      const workerDocs = allWorkerDocuments.filter(doc => doc.operatorId === worker._id);
                      
                      return (
                                              <TableRow 
                        key={worker._id} 
                        hover
                        onClick={() => handleWorkerClick(worker)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f0f0' } }}
                      >
                                                                          <TableCell sx={{ py: 1, px: 1, width: '15%' }}>
                          <Typography variant="body2" fontWeight="medium" noWrap>
                           {worker.lastName} {worker.firstName} 
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 1, width: '12%' }}>
                          <Typography variant="body2" noWrap>
                            {worker.id}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 1, width: '12%' }}>
                          <Typography variant="body2" noWrap>
                            {worker.roleName || 'לא צוין'}
                          </Typography>
                        </TableCell>
                                                  <TableCell sx={{ py: 1, px: 1, width: '8%' }}>
                          {worker.is101 ? (
                            <Typography variant="body2" noWrap>
                              מלא
                            </Typography>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'primary.main', 
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'primary.dark'
                                }
                              }} 
                              noWrap
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm101Dialog({
                                  open: true,
                                  workerName: `${worker.firstName} ${worker.lastName}`
                                });
                              }}
                            >
                              חסר
                            </Typography>
                          )}
                        </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '12%' }}>
                            {(() => {
                              const doc = workerDocs.find(d => d.tag === 'אישור משטרה');
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'אישור משטרה', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה אישור משטרה">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, 'אישור משטרה');
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '12%' }}>
                            {(() => {
                              const normalizedRole = worker.roleName?.trim().replace(/\s+/g, ' ');
                              const needsEducation = normalizedRole && !(normalizedRole.includes('סייע') || normalizedRole.includes('משלים') || normalizedRole.includes('מד"צ'));
                              if (!needsEducation) {
                                return (
                                  <Typography variant="body2" noWrap>
                                    ------
                                  </Typography>
                                );
                              }
                              const doc = workerDocs.find(d => d.tag === 'תעודת השכלה');
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'תעודת השכלה', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה תעודת השכלה">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, 'תעודת השכלה');
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '10%' }}>
                            {(() => {
                              const doc = workerDocs.find(d => d.tag === 'חוזה');
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                         
                                      
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'חוזה', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה חוזה">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, 'חוזה');
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '12%' }}>
                            {(() => {
                              const doc = workerDocs.find(d => d.tag === 'תעודת זהות');
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                      
                                      
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'תעודת זהות', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה תעודת זהות">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, 'תעודת זהות');
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '7%' }}>
                            {(() => {
                              const isCoordinator = worker.roleName && worker.roleName.includes('רכז');
                              
                              if (!isCoordinator) {
                                return (
                                  <Typography variant="body2" noWrap>
                                    ------
                                  </Typography>
                                );
                              }
                              
                              const doc = workerDocs.find(d => d.tag === 'אישור וותק' as any);
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                      
                                      
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'אישור וותק', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה אישור וותק">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, 'אישור וותק');
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          <TableCell sx={{ py: 1, px: 1, width: '10%' }}>
                            {(() => {
                              const normalizedRole = worker.roleName?.trim().replace(/\s+/g, ' ');
                              const needsCampAttendance = normalizedRole && (normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז'));
                              if (!needsCampAttendance) {
                                return (
                                  <Typography variant="body2" noWrap>
                                    ------
                                  </Typography>
                                );
                              }
                              const doc = workerDocs.find(d => d.tag === DocumentType.CAMP_ATTENDANCE_COORDINATOR);
                              if (doc) {
                                return (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="צפה במסמך">
                                      <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(doc.url, '_blank');
                                        }} 
                                        disabled={!doc.url}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.status === DocumentStatus.APPROVED && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }} noWrap>
                                        מאושר
                                      </Typography>
                                    )}
                                    {doc.status === DocumentStatus.PENDING && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }} noWrap>
                                          ממתין
                                        </Typography>
                                      </>
                                    )}
                                    {doc.status === DocumentStatus.REJECTED && (
                                      <>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }} noWrap>
                                          נדחה
                                        </Typography>
                                        <Tooltip title="מחק מסמך נדחה והעלה חדש">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteConfirmDialog(doc._id!, 'נוכחות קייטנה', `${worker.firstName} ${worker.lastName}`);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Stack>
                                );
                              }
                              return (
                                <Tooltip title="העלה נוכחות קייטנה">
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUploadDocumentForWorker(worker, DocumentType.CAMP_ATTENDANCE_COORDINATOR);
                                    }}
                                    sx={{ fontSize: '13px' }}
                                  >
                                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                    העלה
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}          

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}


      <Dialog 
        open={documentsDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <DescriptionIcon color="primary" />
              <Typography variant="h6">
                טפסים של {selectedWorker?.firstName} {selectedWorker?.lastName}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenUploadDialog}
              startIcon={<DescriptionIcon />}
            >
              העלאת טופס חדש
            </Button>
          </Stack> 
        </DialogTitle>
        <DialogContent>
          {documentsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>

              {selectedWorker && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    טפסים חסרים:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {getMissingDocuments(selectedWorker).filter((doc: {tag: string}) => doc.tag === 'טופס 101').map((doc, index) => (
                      <Alert 
                        key={index} 
                        severity="warning" 
                        sx={{ 
                          border: '2px solid #ff9800',
                          bgcolor: '#fff3e0',
                          '& .MuiAlert-icon': { color: '#f57c00' }
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          העובד צריך למלא טופס 101 לשנת המס 2025
                        </Typography>
                        <Link 
                          href={doc.link} 
                          target="_blank" 
                          rel="noopener"
                          sx={{ 
                            fontSize: '0.875rem', 
                            color: '#1976d2',
                            textDecoration: 'underline',
                            fontWeight: 'bold'
                          }}
                        >
                          {doc.linkText}
                        </Link>
                      </Alert>
                    ))}
                    

                    {getMissingDocuments(selectedWorker).filter((doc: {tag: string}) => doc.tag !== 'טופס 101').length > 0 && (
                      <Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {getMissingDocuments(selectedWorker).filter((doc: {tag: string}) => doc.tag !== 'טופס 101').map((doc, index) => (
                            <Chip 
                              key={index}
                              label={doc.tag}
                              color="error"
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {getMissingDocuments(selectedWorker).length === 0 && (
                      <Typography variant="body2" color="success.main">
                        ✓ כל הטפסים הנדרשים הועלו
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />


              <Typography variant="h6" gutterBottom>
                טפסים שהועלו:
              </Typography>
              
              {(() => {
                const selectedWorkerDocs = allWorkerDocuments.filter(doc => doc.operatorId === selectedWorker?._id);
                if (selectedWorkerDocs.length === 0) {
                  return (
                    <Box textAlign="center" py={3}>
                      <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        אין טפסים שהועלו
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        העובד עדיין לא העלה טפסים למערכת
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                  <>
                    <List>
                      {selectedWorkerDocs.map((doc: Document, index: number) => (
                        <ListItem key={index} divider>
                          <ListItemIcon>
                            {doc.status === DocumentStatus.APPROVED ? (
                              <CheckCircleIcon color="success" />
                            ) : doc.status === DocumentStatus.PENDING ? (
                              <WarningIcon color="warning" />
                            ) : (
                              <DescriptionIcon color="action" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.tag}
                            secondary={
                              <Stack direction="row" spacing={2}>
                                <Typography variant="body2" color="text.secondary">
                                  סטטוס: {doc.status}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  תאריך העלאה: {new Date(doc.createdAt).toLocaleDateString('he-IL')}
                                </Typography>
                                {doc.expiryDate && (
                                  <Typography variant="body2" color="text.secondary">
                                    תאריך תפוגה: {new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <IconButton
                            onClick={() => handleViewDocument(doc)}
                            disabled={!doc.url}
                            color="primary"
                            size="small"
                            title="צפייה בטופס"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
        
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            סגור
          </Button>
        </DialogActions>
      </Dialog>


      <UploadWorkerDocumentDialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        worker={selectedWorker}
        allWorkerDocuments={allWorkerDocuments}
        refetchDocuments={refetchDocuments}
        setDialogOpen={setUploadDialogOpen}
      />


      <Dialog
        open={form101Dialog.open}
        onClose={() => setForm101Dialog({ open: false, workerName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6">
              טופס 101 חסר
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
            לעובד <strong>{form101Dialog.workerName}</strong> אין טופס 101 מלא במערכת.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>            טופס 101 הוא טופס חובה ויש למלא אותו בקישור החיצוני.
</AlertTitle>
          </Alert>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<DescriptionIcon />}
            onClick={() => {
              window.open("https://101.rdn.org.il/#!/account/emp-login", '_blank');
              setForm101Dialog({ open: false, workerName: '' });
            }}
            sx={{ mb: 1 }}
          >
            מעבר למילוי טופס 101 
          </Button>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setForm101Dialog({ open: false, workerName: '' })}
            color="secondary"
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={deleteConfirmDialog.open}
        onClose={closeDeleteConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <DeleteIcon color="error" />
            <Typography variant="h6">
              אישור מחיקת מסמך
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            האם אתה בטוח שברצונך למחוק את המסמך <strong>{deleteConfirmDialog.documentName}</strong> של העובד <strong>{deleteConfirmDialog.workerName}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>שים לב!</AlertTitle>
            פעולה זו תמחק את המסמך לצמיתות. לאחר המחיקה תוכל להעלות מסמך חדש במקומו.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmDialog} color="secondary">
            ביטול
          </Button>
          <Button 
            onClick={() => deleteConfirmDialog.documentId && handleDeleteDocument(deleteConfirmDialog.documentId)}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            מחק מסמך
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Container>
  );
};

export default CoordinatorWorkers; 