import React, { useState, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Tooltip, 
  IconButton, 
  Box, 
  Chip, 
  Alert, 
  Link,
  Card,
  CardContent,
  Grid,
  AlertTitle,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import { DocumentStatus } from '../../../types/Document';
import { userRoleState } from '../../../recoil/storeAtom';
import { useWorkerDocuments } from '../../../queries/useDocuments';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { he } from 'date-fns/locale';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { REQUIRED_DOC_TAGS } from '../../../types';
import UploadWorkerDocumentDialog from '../../coordinator/UploadWorkerDocumentDialog';
import axios from 'axios';

interface WorkerPersonalDocumentsProps {
  documents: any[];
  handleStatusUpdate: (docId: string, newStatus: DocumentStatus) => void;
  handleDelete: (docId: string) => void;
  is101: boolean;
  workerId: string;
  workerTz: string;
  workerRoleName?: string;
}

const WorkerPersonalDocuments: React.FC<WorkerPersonalDocumentsProps> = ({ documents, handleStatusUpdate, handleDelete, is101, workerId, workerTz, workerRoleName }) => {
  const userRole = useRecoilValue(userRoleState);
  const { uploadDocument } = useWorkerDocuments(workerId);
  const [isPersonalDocDialogOpen, setIsPersonalDocDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const personalDocs = documents.filter((doc: any) => [
    'אישור משטרה', 
    'תעודת השכלה', 
    'חוזה',
    'תעודת זהות',
    'נוכחות קייטנה רכז',
    'אישור רפואי',
    'אישור וותק',
  ].includes(doc.tag));

  const requiredDocuments = [
    { tag: 'אישור משטרה', label: 'אישור משטרה', description: 'אישור משטרה תקף' },
    { tag: 'תעודת השכלה', label: 'תעודת השכלה', description: 'תעודת השכלה או תעודת השכלה' },
    { tag: 'חוזה', label: 'חוזה', description: 'חוזה עבודה חתום' },
    { tag: 'תעודת זהות', label: 'תעודת זהות', description: 'תעודת זהות' },
    { tag: 'נוכחות קייטנה רכז', label: 'נוכחות קייטנה רכז', description: 'נוכחות קייטנה רכז' },
    { tag: 'אישור רפואי', label: 'אישור רפואי', description: 'אישור רפואי' },
    { tag: 'אישור וותק', label: 'אישור וותק', description: 'אישור וותק' },
  ];

  const getMissingDocuments = () => {
    // נרמול התפקיד לצורך קביעת מסמכים נדרשים
    const normalizedRole = workerRoleName?.trim().replace(/\s+/g, ' ');
    let filteredRequiredDocuments = requiredDocuments;

    // תעודת השכלה רק למוביל/רכז/סגן רכז
    if (!(normalizedRole && (normalizedRole.includes('מוביל') || normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז')))) {
      filteredRequiredDocuments = filteredRequiredDocuments.filter(doc => doc.tag !== 'תעודת השכלה');
    }

    // אישור רפואי רק למד"צ
    if (!(normalizedRole && normalizedRole.includes('מד"צ'))) {
      filteredRequiredDocuments = filteredRequiredDocuments.filter(doc => doc.tag !== 'אישור רפואי');
    }

    // נוכחות קייטנה רכז רק לרכז/סגן רכז
    if (!(normalizedRole && (normalizedRole.includes('רכז') || normalizedRole.includes('סגן רכז')))) {
      filteredRequiredDocuments = filteredRequiredDocuments.filter(doc => doc.tag !== 'נוכחות קייטנה רכז');
    }

    // אישור וותק רק לרכז
    if (!(normalizedRole && normalizedRole.includes('רכז'))) {
      filteredRequiredDocuments = filteredRequiredDocuments.filter(doc => doc.tag !== 'אישור וותק');
    }

    return filteredRequiredDocuments.filter(reqDoc => {
      const hasDoc = personalDocs.some(doc => doc.tag === reqDoc.tag && doc.status === 'מאושר');
      return !hasDoc;
    });
  };

  const missingDocs = getMissingDocuments();

  // פונקציה לקבלת סוגי מסמכים זמינים להעלאה
  const getAvailableDocumentTypes = () => {
    const normalizedRole = workerRoleName?.trim().replace(/\s+/g, ' ');
    
    // מסמכים בסיסיים לכל העובדים
    let filteredDocTags = [...REQUIRED_DOC_TAGS];
    
    // תעודת השכלה נדרשת רק עבור מובילים ורכזים
    if (normalizedRole && (normalizedRole.includes('מוביל') || normalizedRole.includes('רכז'))) {
      filteredDocTags.push('תעודת השכלה');
    }

    // אישור וותק נדרש רק עבור רכזים
    if (normalizedRole && normalizedRole.includes('רכז')) {
      filteredDocTags.push('אישור וותק');
    }
    
    // הסר סוגי מסמכים שכבר קיימים אצל העובד (לא משנה מה הסטטוס)
    const existingDocTags = documents.map(doc => doc.tag);
    return filteredDocTags.filter(tag => !existingDocTags.includes(tag));
  };


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // שליפת העובד מה-localStorage
  const currentWorker = JSON.parse(localStorage.getItem("user") || "{}");

  const refetchDocuments = async () => {
    window.location.reload();
  };

  const handleDeleteClick = (doc: any) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/documents/${docToDelete._id}`);
      setDeleteDialogOpen(false);
      setDocToDelete(null);
      refetchDocuments();
    } catch (err) {
      alert('שגיאה במחיקת המסמך');
    }
  };

  // summary values
  const approvedCount = personalDocs.filter(doc => doc.status === 'מאושר').length;
  const pendingCount = personalDocs.filter(doc => doc.status === 'ממתין').length;
  const rejectedCount = personalDocs.filter(doc => doc.status === 'נדחה').length;
  const missingCount = missingDocs.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* דיאלוג העלאת מסמך חדש */}
      <UploadWorkerDocumentDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        worker={currentWorker}
        allWorkerDocuments={documents}
        refetchDocuments={refetchDocuments}
        setDialogOpen={setUploadDialogOpen}
      />

      {/* דיאלוג אישור מחיקת מסמך */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>אישור מחיקת מסמך</DialogTitle>
        <DialogContent>
          <Typography>האם אתה בטוח שברצונך למחוק את המסמך <b>{docToDelete?.tag}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">ביטול</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">מחק</Button>
        </DialogActions>
      </Dialog>
      
      {/* אזהרת טופס 101 */}
      {!is101 && (
        <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
          <AlertTitle>שימו לב</AlertTitle>
          לחצו כאן למילוי טופס 101 לשנת המס 2025 <br />
          <Link href="https://101.rdn.org.il/#!/account/emp-login" target="_blank" rel="noopener">
            למילוי הטופס לחצו כאן
          </Link>
        </Alert>
      )}

      <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        {/* Sidebar summary - now on the right */}
        <Grid item xs={12} md={3} order={{ xs: 1, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#fcfcfc', border: '1px solid #eee', borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">מסמכים מאושרים</Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">{approvedCount}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">ממתינים לאישור</Typography>
                <Typography variant="h6" color="warning.main" fontWeight="bold">{pendingCount}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">מסמכים נדחו</Typography>
                <Typography variant="h6" color="error.main" fontWeight="bold">{rejectedCount}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">מסמכים חסרים</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">{missingCount}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        {/* Main table - now on the left */}
        <Grid item xs={12} md={9} order={{ xs: 2, md: 1 }}>
          {/* מסמכים חסרים */}
          {missingDocs.length > 0 && (
            <Paper sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              bgcolor: '#fff',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', order: { xs: 2, sm: 2 } }}>
                {missingDocs.map((doc, index) => (
                  <Chip
                    key={index}
                    label={doc.label}
                    variant="outlined"
                    size="small"
                    icon={<DescriptionIcon />}
                  />
                ))}
              </Box>
              <Typography
                variant="subtitle2"
                color="error.dark"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 500,
                  order: { xs: 1, sm: 1 }
                }}
              >
                <WarningIcon color="error" />
                מסמכים נדרשים
              </Typography>
            </Paper>
          )}

          {/* טבלת מסמכים */}
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            boxShadow: 0,
            bgcolor: '#fafafa',
            border: '1px solid #eee'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="div" sx={{ 
                color: 'text.primary', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DescriptionIcon color="primary" />
                מסמכים אישיים
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setUploadDialogOpen(true)}
                startIcon={<CloudUploadIcon />}
                size={isMobile ? 'small' : 'medium'}
              >
                העלאת מסמכים אישיים
              </Button>
            </Box>
            <TableContainer sx={{ 
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              bgcolor: 'white'
            }}>
              {personalDocs.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '2px dashed #ccc'
                }}>
                  <DescriptionIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    לא הועלו מסמכים אישיים
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    יש להעלות את המסמכים הנדרשים
                  </Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>סוג מסמך</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>סטטוס</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>תוקף</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {personalDocs.map((doc: any) => (
                      <TableRow 
                        key={doc._id} 
                        sx={{ 
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon color="primary" fontSize="small" />
                            <Typography fontWeight="bold">{doc.tag}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={doc.status}
                            color={
                              doc.status === 'מאושר'
                                ? 'success'
                                : doc.status === 'ממתין'
                                ? 'warning'
                                : 'error'
                            }
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          {doc.expiryDate ? (
                            <Typography variant="body2" color="text.secondary">
                              {new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              ללא תוקף
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="צפייה במסמך">
                              <IconButton 
                                onClick={() => window.open(doc.url, '_blank')}
                                sx={{ 
                                  bgcolor: '#e3f2fd',
                                  '&:hover': { bgcolor: '#bbdefb' }
                                }}
                              >
                                <VisibilityIcon color="primary" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="אשר מסמך">
                              <IconButton
                                color="success"
                                onClick={() => handleStatusUpdate(doc._id, DocumentStatus.APPROVED)}
                                disabled={userRole === 'worker' || doc.status === DocumentStatus.APPROVED}
                                sx={{ 
                                  bgcolor: '#e8f5e9',
                                  '&:hover': { bgcolor: '#c8e6c9' },
                                  '&:disabled': { bgcolor: '#f5f5f5' }
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="דחה מסמך">
                              <IconButton
                                color="error"
                                onClick={() => handleStatusUpdate(doc._id, DocumentStatus.REJECTED)}
                                disabled={userRole === 'worker' || doc.status === DocumentStatus.REJECTED}
                                sx={{ 
                                  bgcolor: '#ffebee',
                                  '&:hover': { bgcolor: '#ffcdd2' },
                                  '&:disabled': { bgcolor: '#f5f5f5' }
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="מחק מסמך">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteClick(doc)}
                                disabled={doc.status === DocumentStatus.APPROVED}
                                sx={{ 
                                  bgcolor: '#ffebee',
                                  '&:hover': { bgcolor: '#ffcdd2' }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WorkerPersonalDocuments; 