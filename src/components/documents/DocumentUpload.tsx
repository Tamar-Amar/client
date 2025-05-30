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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useFetchWorkers } from '../../queries/workerQueries';
import { Worker } from '../../types';
import { useWorkerDocuments } from '../../queries/useDocuments';

const documentTypes = [
  'תעודת זהות',
  'אישור העסקה',
  'הסכם עבודה',
  'אישור בריאות',
  'תעודות הסמכה',
  'אחר'
];

const DocumentUpload: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: workers, isLoading } = useFetchWorkers();
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
    <Box>
      <Typography variant="h6" gutterBottom>
        העלאת מסמכים
      </Typography>
      <Stack spacing={2}>
        <FormControl fullWidth size="small">
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

        <FormControl fullWidth size="small">
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
          sx={{ mt: 2 }}
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
            נבחר: {file.name}
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
          sx={{ mt: 2 }}
        >
          {isUploading ? <CircularProgress size={24} /> : 'העלה מסמך'}
        </Button>
      </Stack>
    </Box>
  );
};

export default DocumentUpload; 