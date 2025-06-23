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
import { DOCUMENT_TYPES } from '../../../pages/WorkerProfilePage';

interface WorkerPersonalDocumentsProps {
  documents: any[];
  handleStatusUpdate: (docId: string, newStatus: DocumentStatus) => void;
  handleDelete: (docId: string) => void;
  is101: boolean;
  workerId: string;
  workerTz: string;
}

const WorkerPersonalDocuments: React.FC<WorkerPersonalDocumentsProps> = ({ documents, handleStatusUpdate, handleDelete, is101, workerId, workerTz }) => {
  const userRole = useRecoilValue(userRoleState);
  const { uploadDocument } = useWorkerDocuments(workerId);
  const [isPersonalDocDialogOpen, setIsPersonalDocDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("NULL");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const personalDocs = documents.filter((doc: any) => [
    'אישור משטרה', 
    'תעודת השכלה', 
    'תעודת זהות',
    'תיאום מס'
  ].includes(doc.tag));

  const requiredDocuments = [
    { tag: 'אישור משטרה', label: 'אישור משטרה', description: 'אישור משטרה תקף' },
    { tag: 'תעודת השכלה', label: 'תעודת השכלה', description: 'תעודת השכלה או תעודת הוראה' },
    { tag: 'תעודת זהות', label: 'תעודת זהות', description: 'תעודת זהות ישראלית' },
    { tag: 'תיאום מס', label: 'תיאום מס', description: 'טופס תיאום מס מעביד' }
  ];

  const getMissingDocuments = () => {
    return requiredDocuments.filter(reqDoc => {
      const hasDoc = personalDocs.some(doc => doc.tag === reqDoc.tag && doc.status === 'מאושר');
      return !hasDoc;
    });
  };

  const missingDocs = getMissingDocuments();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !workerId) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', workerId);
    formData.append('documentType', documentType as string);
    formData.append('tz', workerTz);
    if (expirationDate) {
      formData.append('expiryDate', expirationDate.toISOString());
    }
    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType("NULL");
        setExpirationDate(null);
        setIsPersonalDocDialogOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <Container maxWidth="lg">
      {/* The Dialog for uploading personal documents */}
      <Dialog open={isPersonalDocDialogOpen} onClose={() => setIsPersonalDocDialogOpen(false)}>
        <DialogTitle>העלאת מסמך אישי לעובד</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              size="small"
              label="סוג מסמך"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as string)}
              sx={{ minWidth: 150 }}
            >
              {DOCUMENT_TYPES.map((type: any) => (
                <MenuItem key={type.value} value={type.value} disabled={type.value === "NULL"}>{type.label}</MenuItem>
              ))}
            </TextField>
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
              startIcon={<CloudUploadIcon />}
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
          <Button onClick={() => setIsPersonalDocDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || documentType === "NULL"}
          >
            העלה
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* אזהרת טופס 101 */}
      {!is101 && (
        <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
          <AlertTitle>שימו לב</AlertTitle>
          יש למלא טופס 101 מקוון עם קליטת העובד/ת.
          <Link href="https://www.google.com" target="_blank" rel="noopener">
            למילוי הטופס לחצו כאן
          </Link>
        </Alert>
      )}

      {/* סיכום מסמכים */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: '#e8f5e9', 
            border: '2px solid #4caf50',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {personalDocs.filter(doc => doc.status === 'מאושר').length}
              </Typography>
              <Typography variant="body2" color="success.dark">
                מסמכים מאושרים
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: '#fff8e1', 
            border: '2px solid #ff9800',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {personalDocs.filter(doc => doc.status === 'ממתין').length}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                ממתינים לאישור
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: '#ffebee', 
            border: '2px solid #f44336',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {personalDocs.filter(doc => doc.status === 'נדחה').length}
              </Typography>
              <Typography variant="body2" color="error.dark">
                מסמכים נדחו
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: '#f3e5f5', 
            border: '2px solid #9c27b0',
            borderRadius: 3,
            boxShadow: 3
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#9c27b0" fontWeight="bold">
                {missingDocs.length}
              </Typography>
              <Typography variant="body2" color="#9c27b0">
                מסמכים חסרים
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* מסמכים חסרים */}
      {missingDocs.length > 0 && (
        <Paper sx={{
          p: 1.5,
          mb: 3,
          borderRadius: 2,
          bgcolor: '#fff8f8',
          border: '1px solid #ffcdd2',
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
            מסמכים נדרשים שטרם הועלו
          </Typography>
        </Paper>
      )}

      {/* טבלת מסמכים */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 3,
        boxShadow: 3,
        bgcolor: '#fafafa'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="div" sx={{ 
            color: '#1976d2', 
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
            onClick={() => setIsPersonalDocDialogOpen(true)}
            startIcon={<CloudUploadIcon />}
          >
            העלאת מסמכים אישיים
          </Button>
        </Box>
        
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
          <TableContainer sx={{ 
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: 'white'
          }}>
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
                        variant="filled"
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
                            onClick={() => handleDelete(doc._id)}
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
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default WorkerPersonalDocuments; 