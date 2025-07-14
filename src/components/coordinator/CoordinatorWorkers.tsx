import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Link
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { WorkerWithClassInfo } from '../../types';
import axios from 'axios';
import { Document, DocumentStatus, DocumentType } from '../../types/Document';
import { validateDocumentFile } from '../../utils/fileValidation';

interface CoordinatorWorkersProps {
  coordinatorId: string;
}

const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
];

const CoordinatorWorkers: React.FC<CoordinatorWorkersProps> = ({ coordinatorId }) => {
  const [workers, setWorkers] = useState<WorkerWithClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordinatorInfo, setCoordinatorInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const workersPerPage = 10;
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithClassInfo | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [workerDocuments, setWorkerDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [documentsSummary, setDocumentsSummary] = useState({
    totalMissing: 0,
    totalUploaded: 0
  });

  useEffect(() => {
    if (coordinatorId) {
      fetchCoordinatorWorkers();
    }
  }, [coordinatorId]);

  const fetchCoordinatorWorkers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // קבלת פרטי הרכז
      const coordinatorResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${coordinatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (coordinatorResponse.status === 200) {
        const coordinatorData = coordinatorResponse.data;
        setCoordinatorInfo(coordinatorData);
      }
      
      // קבלת העובדים
      const workersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/coordinator/${coordinatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (workersResponse.status !== 200) {
        throw new Error('שגיאה בטעינת העובדים');
      }
      
      const workersData = workersResponse.data;
      setWorkers(workersData);
      
      // חישוב סיכום מסמכים
      calculateDocumentsSummary(workersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDocumentsSummary = (workersData: WorkerWithClassInfo[]) => {
    let totalUploaded = 0;
    let totalMissing = 0;
    
    workersData.forEach(worker => {
      totalUploaded += worker.documentsCount || 0;
      // נניח שכל עובד צריך 4 מסמכים בסיסיים
      const requiredDocuments = 4;
      const missing = Math.max(0, requiredDocuments - (worker.documentsCount || 0));
      totalMissing += missing;
    });
    
    setDocumentsSummary({
      totalUploaded,
      totalMissing
    });
  };

  const getProjectCount = (worker: WorkerWithClassInfo) => {
    return worker.projectCodes ? worker.projectCodes.length : 0;
  };

  // סינון עובדים לפי חיפוש
  const filteredWorkers = workers.filter(worker => {
    const searchLower = searchTerm.toLowerCase();
    return (
      worker.firstName?.toLowerCase().includes(searchLower) ||
      worker.lastName?.toLowerCase().includes(searchLower) ||
      worker.id?.includes(searchTerm) ||
      worker.phone?.includes(searchTerm) ||
      worker.email?.toLowerCase().includes(searchLower) ||
      worker.roleType?.toLowerCase().includes(searchLower) ||
      worker.classSymbol?.toLowerCase().includes(searchLower) ||
      worker.className?.toLowerCase().includes(searchLower)
    );
  });

  // חישוב דפדוף
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

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const fetchWorkerDocuments = async (workerId: string) => {
    try {
      setDocumentsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/documents/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setWorkerDocuments(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching worker documents:', err);
      setWorkerDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleWorkerClick = async (worker: WorkerWithClassInfo) => {
    setSelectedWorker(worker);
    setDocumentsDialogOpen(true);
    await fetchWorkerDocuments(worker._id);
  };

  const handleCloseDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedWorker(null);
    setWorkerDocuments([]);
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
        // רענון רשימת הטפסים
        await fetchWorkerDocuments(selectedWorker._id);
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

  const getMissingDocuments = (worker: WorkerWithClassInfo) => {
    const requiredDocuments = [
      DocumentType.ID,
      DocumentType.POLICE_APPROVAL, 
      DocumentType.TEACHING_CERTIFICATE,
      DocumentType.CONTRACT
    ];
    
    const uploadedDocuments = workerDocuments
      .filter(doc => doc.operatorId === worker.id)
      .map(doc => doc.tag);
    
    const missingDocs = requiredDocuments.filter(doc => !uploadedDocuments.includes(doc));
    
    // הוספת מידע על קישור 101 אם חסר
    const result: Array<{
      tag: string;
      hasLink: boolean;
      link?: string;
      linkText?: string;
    }> = missingDocs.map(doc => ({
      tag: doc,
      hasLink: false
    }));
    
    // אם אין מסמך 101 שהועלה וגם אין לעובד 101 - הוסף את זה
    if (!worker.is101) {
      result.push({
        tag: 'טופס 101',
        hasLink: true,
        link: "https://101.rdn.org.il/#!/account/emp-login",
        linkText: "למילוי הטופס לחצו כאן"
      });
    }
    
    return result;
  };

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
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Paper sx={{
        p: { xs: 2, md: 3 },
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

        {/* כרטיס סיכום של הפרויקטים והקודי מוסד */}
        {coordinatorInfo && coordinatorInfo.projectCodes && coordinatorInfo.projectCodes.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Grid container spacing={2}>
                {coordinatorInfo.projectCodes.map((assignment: any, index: number) => {
                  const project = projectTypes.find(p => p.value === assignment.projectCode);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <BusinessIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            {assignment.institutionCode}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.institutionName}
                        </Typography>
                        <Chip 
                          label={project ? project.label : `פרויקט ${assignment.projectCode}`}
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* תיבת חיפוש */}
        <Box sx={{ mb: 3 }}>
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
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            נמצאו {filteredWorkers.length} עובדים מתוך {workers.length} סה"כ
          </Typography>
        </Box>

        {filteredWorkers.length === 0 ? (
          <Box textAlign="center" py={4}>
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
            {/* טאבים לסיכום מסמכים */}
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
                      color="success" 
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      מסמכים חסרים:
                    </Typography>
                    <Chip 
                      label={documentsSummary.totalMissing} 
                      color="error" 
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* הטבלה */}
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>שם העובד</TableCell>
                      <TableCell>תעודת זהות</TableCell>
                      <TableCell>טפסים הועלו</TableCell>
                      <TableCell>תפקיד</TableCell>
                      <TableCell>כיתה</TableCell>
                      <TableCell>פרויקטים</TableCell>
                      <TableCell>סטטוס</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentWorkers.map((worker) => (
                      <TableRow 
                        key={worker._id} 
                        hover 
                        onClick={() => handleWorkerClick(worker)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PeopleIcon color="primary" fontSize="small" />
                            <Typography variant="body1" fontWeight="medium">
                              {worker.firstName} {worker.lastName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {worker.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DescriptionIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                              {worker.documentsCount || 0} טפסים
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">
                              {worker.roleName || 'לא צוין'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">
                              {worker.classSymbol ? (
                                <Chip 
                                  label={worker.classSymbol} 
                                  size="small" 
                                  variant="outlined"
                                  color="primary"
                                />
                              ) : (
                                worker.roleName || 'לא צוין'
                              )}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {(worker.projectCodes ?? []).map(code => {
                              const project = projectTypes.find(p => p.value === code);
                              return (
                                <Chip 
                                  key={code} 
                                  label={project ? project.label : `פרויקט ${code}`} 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                />
                              );
                            })}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={worker.status || 'לא זמין'} 
                            color={worker.status === 'פעיל' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}          
        {/* דפדוף */}
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

      {/* דיאלוג טפסים של עובד */}
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
              {/* טפסים חסרים */}
              {selectedWorker && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    טפסים חסרים:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* טופס 101 - מוצג בנפרד ומיוחד */}
                    {getMissingDocuments(selectedWorker).filter(doc => doc.tag === 'טופס 101').map((doc, index) => (
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
                    
                    {/* שאר הטפסים החסרים */}
                    {getMissingDocuments(selectedWorker).filter(doc => doc.tag !== 'טופס 101').length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          טפסים נוספים חסרים:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {getMissingDocuments(selectedWorker).filter(doc => doc.tag !== 'טופס 101').map((doc, index) => (
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

              {/* טפסים שהועלו */}
              <Typography variant="h6" gutterBottom>
                טפסים שהועלו:
              </Typography>
              
              {workerDocuments.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    אין טפסים שהועלו
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    העובד עדיין לא העלה טפסים למערכת
                  </Typography>
                </Box>
              ) : (
                <List>
                  {workerDocuments.map((doc: Document, index: number) => (
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
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג העלאת טפס */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6">
              העלאת טופס ל{selectedWorker?.firstName} {selectedWorker?.lastName}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>סוג טופס</InputLabel>
              <Select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                label="סוג טופס"
              >
                <MenuItem value="תעודת זהות">תעודת זהות</MenuItem>
                <MenuItem value="אישור משטרה">אישור משטרה</MenuItem>
                <MenuItem value="תעודת השכלה">תעודת השכלה</MenuItem>
                <MenuItem value="חוזה">חוזה</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="document-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="document-file">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<DescriptionIcon />}
                >
                  {selectedFile ? selectedFile.name : 'בחר קובץ'}
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  נבחר: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="תאריך תפוגה (אופציונלי)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} color="secondary">
            ביטול
          </Button>
          <Button 
            onClick={handleUploadDocument}
            variant="contained"
            color="primary"
            disabled={!selectedFile || !selectedDocumentType || uploadLoading}
            startIcon={uploadLoading ? <CircularProgress size={16} /> : <DescriptionIcon />}
          >
            {uploadLoading ? 'מעלה...' : 'העלה טופס'}
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Container>
  );
};

export default CoordinatorWorkers; 