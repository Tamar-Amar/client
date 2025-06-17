import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
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
import { Document, DocumentStatus, DocumentType } from '../../types/Document';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';

interface Props {
  workerId: string;
}

const DOCUMENT_TYPES = [
  { value: DocumentType.ID, label: 'תעודת זהות' },
  { value: DocumentType.BANK_DETAILS, label: 'פרטי בנק' },
  { value: DocumentType.OTHER, label: 'אחר' }
];

const WorkerDocuments: React.FC<Props> = ({ workerId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
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
  const { data: workerData } = useFetchWorkerAfterNoon(workerId);


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
    formData.append('tz', workerData?.id as string);
    formData.append('documentType', documentType);


    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType(DocumentType.OTHER);
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



  const getStatusColor = (status: DocumentStatus): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'success';
      case DocumentStatus.REJECTED:
        return 'error';
      case DocumentStatus.PENDING:
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
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
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
                סוג: {doc.tag}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                הועלה:  {new Date(doc.createdAt).toLocaleDateString('he-IL')}
              </Typography>

              <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={doc.status}
                  color={getStatusColor(doc.status as DocumentStatus)}
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
                    onClick={() => doc._id && handleDelete(doc._id)}
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