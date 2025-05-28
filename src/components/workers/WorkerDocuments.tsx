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
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { DocumentStatus, DocumentType } from '../../types/Document';
import { useWorkerDocuments } from '../../queries/useDocuments';

interface Props {
  workerId: string;
}

const DOCUMENT_TYPES = [
  { value: DocumentType.ID, label: 'תעודת זהות' },
  { value: DocumentType.RESUME, label: 'קורות חיים' },
  { value: DocumentType.EDUCATION, label: 'תעודות השכלה' },
  { value: DocumentType.CRIMINAL_RECORD, label: 'תעודת יושר' },
  { value: DocumentType.BANK_DETAILS, label: 'פרטי בנק' },
  { value: DocumentType.OTHER, label: 'אחר' }
];

const WorkerDocuments: React.FC<Props> = ({ workerId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [expiryDate, setExpiryDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setSelectedFile(file || null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', workerId);
    formData.append('documentType', documentType);
    if (expiryDate) {
      formData.append('expiryDate', new Date(expiryDate).toISOString());
    }

    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType(DocumentType.OTHER);
        setExpiryDate('');
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

  const getStatusColor = (status: DocumentStatus) => {
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        ניהול מסמכים
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="סוג מסמך"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            sx={{ minWidth: 200 }}
          >
            {DOCUMENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            label="תאריך תפוגה"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

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

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? <CircularProgress size={24} /> : 'העלה'}
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם קובץ</TableCell>
              <TableCell>סוג מסמך</TableCell>
              <TableCell>תאריך העלאה</TableCell>
              <TableCell>תאריך תפוגה</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc: any) => (
              <TableRow key={doc._id}>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell>
                  {DOCUMENT_TYPES.find(type => type.value === doc.documentType)?.label || doc.documentType}
                </TableCell>
                <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                <TableCell>{doc.expiryDate ? formatDate(doc.expiryDate) : '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={doc.status}
                    color={getStatusColor(doc.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => window.open(doc.url, '_blank')}
                    size="small"
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(doc._id)}
                    size="small"
                    color="error"
                    disabled={isDeleting}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkerDocuments; 