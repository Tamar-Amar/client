import React, { useState, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Button, Stack, TextField, MenuItem, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, PictureAsPdf as PictureAsPdfIcon, InsertPhoto as InsertPhotoIcon } from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { userTokenState } from '../recoil/storeAtom';
import { useFetchWorkerAfterNoon } from '../queries/workerAfterNoonQueries';
import { jwtDecode } from 'jwt-decode';
import { DocumentType, REQUIRED_DOCUMENTS } from '../types/Document';
import { useWorkerDocuments } from '../queries/useDocuments';

interface DecodedToken {
  id: string;
  role: string;
}

export const DOCUMENT_TYPES = [
  { value: DocumentType.ID, label: 'תעודת זהות' },
  { value: DocumentType.POLICE_APPROVAL, label: 'אישור משטרה' },
  { value: DocumentType.TEACHING_CERTIFICATE, label: 'תעודת השכלה' },
  { value: DocumentType.CONTRACT, label: 'חוזה' },
];

const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const getFileIcon = (url: string) => {
  const extMatch = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  const ext = extMatch?.[1]?.toLowerCase();
  if (!ext) return null;
  if (ext === 'pdf') return <PictureAsPdfIcon fontSize="medium" color="action" sx={{ mr: 1 }} />;
  if (["jpg", "jpeg", "png"].includes(ext)) return <InsertPhotoIcon fontSize="medium" color="action" sx={{ mr: 1 }} />;
  return null;
};

const WorkerProfilePage = () => {
  const token = useRecoilValue(userTokenState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | "">("");

  const decodedToken = token ? jwtDecode<DecodedToken>(token) : null;
  const workerId = decodedToken?.id;

  const { data: workerData, isLoading, error } = useFetchWorkerAfterNoon(workerId as string);
  const { documents, uploadDocument, deleteDocument, isUploading } = useWorkerDocuments(workerId as string);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
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
      !documents.some((doc: any) => doc.tag === requiredType && doc.status === 'מאושר')
    );
  };

  if (!workerId) return <div>לא נמצא מזהה עובד</div>;
  if (isLoading) return <LoadingSpinner />;
  if (error || !workerData) return <div>שגיאה בטעינת נתוני העובד</div>;

  return (
    <Box p={6}>
      <Box display="flex" gap={3} flexWrap="wrap">
        {/* Personal Info */}
        <Paper elevation={3} sx={{ flex: 1, minWidth: 320, p: 3, borderRadius: 2, background: 'linear-gradient(to bottom right, #e3f2fd, #ffffff)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1565c0' }}>פרטים אישיים</Typography>
          <Box sx={{ display: 'grid', gap: 1, mt: 2, '& > *': { bgcolor: '#fafafa', p: 1.2, borderRadius: 1 } }}>
            <Typography><strong>שם מלא:</strong> {workerData.firstName} {workerData.lastName}</Typography>
            <Typography><strong>תעודת זהות:</strong> {workerData.id}</Typography>
            <Typography><strong>טלפון:</strong> {workerData.phone}</Typography>
            <Typography><strong>דוא"ל:</strong> {workerData.email}</Typography>
            <Typography><strong>תחום פעילות:</strong> {workerData.roleType}</Typography>
            <Typography><strong>כישורים:</strong> {workerData.roleName}</Typography>
          </Box>
        </Paper>

        {/* Documents */}
        <Paper elevation={3} sx={{ flex: 1, minWidth: 320, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>טפסי עובד</Typography>

          {getMissingRequiredDocuments().length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">חסרים / עדיין לא אושרו המסמכים הבאים:</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {getMissingRequiredDocuments().map(docType => (
                  <li key={docType}>{DOCUMENT_TYPES.find(t => t.value === docType)?.label}</li>
                ))}
              </Box>
            </Alert>
          )}

          {documents?.some((doc: any) => doc.tag === documentType && (doc.status === 'מאושר' || doc.status === 'ממתין')) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              קיים כבר מסמך מהסוג הזה שאושר או בהמתנה. לא ניתן להעלות חדש עד למחיקת הקיים.
            </Alert>
          )}

          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <TextField select size="small" label="סוג מסמך" value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} sx={{ minWidth: 150 }}>
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </TextField>

            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

            <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()} startIcon={<CloudUploadIcon />}>
              {selectedFile ? selectedFile.name : 'בחר קובץ'}
            </Button>

            <Button size="small" variant="contained" onClick={handleUpload} disabled={!selectedFile || isUploading || documents?.some((doc: any) => doc.tag === documentType && (doc.status === 'מאושר' || doc.status === 'ממתין'))}>
              העלה
            </Button>
          </Stack>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {documents?.map((doc: any) => (
              <Paper key={doc._id} sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 1,
                borderLeft: `5px solid ${
                  doc.status === 'מאושר' ? '#66bb6a' :
                  doc.status === 'ממתין' ? '#ffa726' :
                  doc.status === 'נדחה' ? '#ef5350' : '#90a4ae'
                }`,
                backgroundColor: '#fdfdfd',
                boxShadow: 2,
                borderRadius: 2,
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {getFileIcon(doc.url)}
                  <Box>
                    <Typography variant="body2" noWrap>{DOCUMENT_TYPES.find(t => t.value === doc.tag)?.label || doc.fileName}</Typography>
                    <Typography variant="caption" color="text.secondary">{doc.status}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => window.open(doc.url, '_blank')}><VisibilityIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(doc._id)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              </Paper>
            ))}
            {(!documents || documents.length === 0) && <Alert severity="info">אין מסמכים להצגה</Alert>}
          </Box>
        </Paper>

        {/* Attendance */}
        <Paper elevation={3} sx={{ flex: 1, minWidth: 320, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>טפסי נוכחות</Typography>
          <Alert severity="info">מידע על טפסי נוכחות יתווסף בקרוב</Alert>
        </Paper>
      </Box>
    </Box>
  );
};

export default WorkerProfilePage;
