import React, { useState, useRef } from 'react';
import { Box, Paper, Typography, Tabs, Tab, CircularProgress, Alert, Button, Stack, TextField, MenuItem, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { userTokenState } from '../recoil/storeAtom';
import { useFetchWorker } from '../queries/workerQueries';
import { Worker, WorkerDocument } from '../types';
import { jwtDecode } from 'jwt-decode';
import { DocumentType, REQUIRED_DOCUMENTS } from '../types/Document';
import { useWorkerDocuments } from '../queries/useDocuments';

interface DecodedToken {
  id: string;
  role: string;
}

const DOCUMENT_TYPES = [
  { value: DocumentType.ID, label: 'תעודת זהות' },
  { value: DocumentType.BANK_DETAILS, label: 'פרטי בנק' },
  { value: DocumentType.POLICE_APPROVAL, label: 'אישור משטרה' },
  { value: DocumentType.TEACHING_CERTIFICATE, label: 'תעודת הוראה' },
  { value: DocumentType.OTHER, label: 'אחר' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const WorkerProfilePage = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const token = useRecoilValue(userTokenState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  
  const decodedToken = token ? jwtDecode<DecodedToken>(token) : null;
  const workerId = decodedToken?.id;
  
  const { data: workerData, isLoading, error } = useFetchWorker(workerId || '');
  const { documents, uploadDocument, deleteDocument, isUploading } = useWorkerDocuments(workerId || '');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !workerId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', workerId);
    formData.append('documentType', documentType);

    uploadDocument(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setDocumentType(DocumentType.OTHER);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) {
      deleteDocument(documentId);
    }
  };

  const getMissingRequiredDocuments = () => {
    if (!documents) return REQUIRED_DOCUMENTS;
    
    return REQUIRED_DOCUMENTS.filter(requiredType => 
      !documents.some(doc => doc.documentType === requiredType && doc.status === 'מאושר')
    );
  };

  if (!workerId) {
    return <div>לא נמצא מזהה עובד</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !workerData) {
    return <div>שגיאה בטעינת נתוני העובד</div>;
  }

  return (
    <Box p={3}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="פרטים אישיים" />
          <Tab label="טפסי עובד" />
          <Tab label="טפסי נוכחות" />
        </Tabs>

        {activeTab === 0 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>פרטים אישיים</Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography>
                <strong>שם מלא:</strong> {workerData.firstName} {workerData.lastName}
              </Typography>
              <Typography>
                <strong>תעודת זהות:</strong> {workerData.id}
              </Typography>
              <Typography>
                <strong>טלפון:</strong> {workerData.phone}
              </Typography>
              <Typography>
                <strong>דוא"ל:</strong> {workerData.email}
              </Typography>
              <Typography>
                <strong>כתובת:</strong> {workerData.street} {workerData.buildingNumber}, {workerData.city}
                {workerData.apartmentNumber && ` דירה ${workerData.apartmentNumber}`}
              </Typography>
              <Typography>
                <strong>תחום פעילות:</strong> {workerData.jobType}
              </Typography>
              <Typography>
                <strong>כישורים:</strong> {workerData.jobTitle}
              </Typography>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box p={3}>
            {getMissingRequiredDocuments().length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>חסרים המסמכים הבאים:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {getMissingRequiredDocuments().map(docType => (
                    <li key={docType}>{DOCUMENT_TYPES.find(t => t.value === docType)?.label}</li>
                  ))}
                </Box>
              </Alert>
            )}

            <Stack direction="row" spacing={2} mb={2} alignItems="center">
              <TextField
                select
                size="small"
                label="סוג מסמך"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                sx={{ minWidth: 150 }}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
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
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<CloudUploadIcon />}
              >
                {selectedFile ? selectedFile.name : 'בחר קובץ'}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                העלה
              </Button>
            </Stack>

            <Box sx={{ display: 'grid', gap: 1 }}>
              {documents?.map((doc) => (
                <Paper 
                  key={doc._id} 
                  sx={{ 
                    p: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    bgcolor: REQUIRED_DOCUMENTS.includes(doc.documentType as DocumentType) ? 'rgba(255, 244, 229, 0.4)' : 'inherit'
                  }}
                >
                  <Box>
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.status}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => doc._id && handleDelete(doc._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
              {(!documents || documents.length === 0) && (
                <Alert severity="info">אין מסמכים להצגה</Alert>
              )}
            </Box>
          </Box>
        )}

        {activeTab === 2 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>טפסי נוכחות</Typography>
            <Alert severity="info">
              מידע על טפסי נוכחות יתווסף בקרוב
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WorkerProfilePage; 