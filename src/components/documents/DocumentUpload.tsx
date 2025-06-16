import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useFetchWorker, useFetchWorkers } from '../../queries/workerQueries';
import { useWorkerDocuments } from '../../queries/useDocuments';

const DocumentUpload: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = [
    'תעודת זהות',
    'אישור משטרה',
    'תעודת הוראה',
    'אחר'
  ];

  const { data: workers, isLoading } = useFetchWorkers();
  const { data: workerData } = useFetchWorker(selectedEmployee);
  const { uploadDocument, isUploading } = useWorkerDocuments(selectedEmployee);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!file || !selectedEmployee || !documentType) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workerId', selectedEmployee);
    formData.append('tz', workerData?.id as string);
    formData.append('tag', documentType);
    formData.append('documentType', documentType);

    uploadDocument(formData, {
      onSuccess: () => {
        setFile(null);
        setSelectedEmployee('');
        setDocumentType('');
        setError(null);
      },
      onError: (error: any) => {
        console.error('Upload failed:', error);
        setError(error?.response?.data?.error || 'שגיאה בהעלאת הקובץ');
      }
    });
  };

  if (isLoading) {
    return <Typography>טוען...</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        העלאת מסמך אישי חדש לעובד
      </Typography>

      <Divider sx={{ mb: 2 }} />
      <Stack direction="row" spacing={2}>
  <FormControl fullWidth size="small" sx={{ flex: 1 }}>
    <InputLabel>בחר עובד</InputLabel>
    <Select
      value={selectedEmployee}
      onChange={(e) => {
        setSelectedEmployee(e.target.value);
        setError(null);
      }}
      label="בחר עובד"
    >
      {workers?.map((employee) => (
        <MenuItem key={employee._id} value={employee._id}>
          {`${employee.firstName} ${employee.lastName}`}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <FormControl fullWidth size="small" sx={{ flex: 1 }}>
    <InputLabel>סוג מסמך</InputLabel>
    <Select
      value={documentType}
      onChange={(e) => {
        setDocumentType(e.target.value);
        setError(null);
      }}
      label="סוג מסמך"
    >
      {documentTypes.map((type) => (
        <MenuItem key={type} value={type}>
          {type}
        </MenuItem>
      ))}
    </Select>
  </FormControl>


        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ borderStyle: 'dashed', color: 'primary.main' }}
        >
          בחר קובץ
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </Button>

        {file && (
          <Typography variant="body2" color="text.secondary">
            📄 קובץ שנבחר: <strong>{file.name}</strong>
          </Typography>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || !selectedEmployee || !documentType || isUploading}
          sx={{ bgcolor: 'success.main', color: 'white', mt: 2 }}
        >
          {isUploading ? <CircularProgress size={24} /> : 'העלה מסמך'}
        </Button>
      </Stack>
    </Paper>
  );
};

export default DocumentUpload;
