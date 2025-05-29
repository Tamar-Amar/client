import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Grid
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as VisibilityIcon, CloudUpload as CloudUploadIcon, PictureAsPdf as PictureAsPdfIcon, Image as ImageIcon, InsertDriveFile as InsertDriveFileIcon } from '@mui/icons-material';
import { DocumentStatus, DocumentType } from '../../types/Document';
import { useWorkerDocuments } from '../../queries/useDocuments';

interface Props {
  workerId: string;
}

interface Document {
  _id: string;
  fileName: string;
  documentType: string;
  uploadDate: string;
  expiryDate?: string;
  status: string;
  url: string;
  fileType: string;
}

const DOCUMENT_TYPES = [
  { value: 'תעודת זהות', label: 'תעודת זהות' },
  { value: 'קורות חיים', label: 'קורות חיים' },
  { value: 'תעודות השכלה', label: 'תעודות השכלה' },
  { value: 'תעודת יושר', label: 'תעודת יושר' },
  { value: 'פרטי בנק', label: 'פרטי בנק' },
  { value: 'אחר', label: 'אחר' }
];

const WorkerDocuments: React.FC<Props> = ({ workerId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('אחר');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    documents,
    isLoading,
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting
  } = useWorkerDocuments(workerId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', workerId);
    formData.append('documentType', documentType);

    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType('אחר');
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) {
      deleteDocument(documentId);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'מאושר':
        return 'success';
      case 'נדחה':
        return 'error';
      case 'ממתין':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    return <InsertDriveFileIcon />;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" color="primary">
            העלאת מסמך חדש
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="סוג מסמך"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as string)}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<CloudUploadIcon />}
              >
                {selectedFile ? selectedFile.name : 'בחר קובץ'}
              </Button>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
              >
                העלה
              </Button>
            </Grid>
          </Grid>

          {previewUrl && selectedFile?.type.includes('image') && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={previewUrl} 
                alt="תצוגה מקדימה" 
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} 
              />
            </Box>
          )}
        </Stack>

      <Typography variant="h6" gutterBottom>
        מסמכים קיימים
      </Typography>

      <Grid container spacing={2}>
        {documents.map((doc: Document) => (
          <Grid item xs={12} sm={6} md={4} key={doc._id}>
            <Paper 
              sx={{ 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFileIcon(doc.fileType)}
                <Typography variant="subtitle1" noWrap>
                  {doc.fileName}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                סוג: {doc.documentType}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                הועלה: {formatDate(doc.uploadDate)}
              </Typography>

              {doc.expiryDate && (
                <Typography variant="body2" color="text.secondary">
                  תוקף עד: {formatDate(doc.expiryDate)}
                </Typography>
              )}

              <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={doc.status}
                  color={getStatusColor(doc.status)}
                  size="small"
                />
                
                <Box>
                  <IconButton
                    onClick={() => window.open(doc.url, '_blank')}
                    size="small"
                    title="צפה במסמך"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(doc._id)}
                    size="small"
                    color="error"
                    disabled={isDeleting}
                    title="מחק"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WorkerDocuments; 