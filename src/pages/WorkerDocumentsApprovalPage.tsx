import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useWorkerDocuments } from '../queries/useDocuments';
import { DocumentStatus } from '../types/Document';
import { useFetchWorker } from '../queries/workerQueries';


const WorkerDocumentsApprovalPage: React.FC = () => {
  const { id: workerId } = useParams<{ id: string }>();
  const {
    documents,
    isLoading,
    isError,
    error,
    updateStatus
  } = useWorkerDocuments(workerId || '');
  const { data: workerData } = useFetchWorker(workerId || '');

  

  const handleStatusUpdate = (docId: string, newStatus: DocumentStatus) => {
    updateStatus({ documentId: docId, status: newStatus });
  };
  

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        ניהול מסמכים לעובד
      </Typography>

      {workerData && (
  <Box mb={3}>
    <Typography variant="subtitle1">
      <strong>שם מלא:</strong> {workerData.lastName} {workerData.firstName}
    </Typography>
    <Typography variant="subtitle1">
      <strong>תעודת זהות:</strong> {workerData.id}
    </Typography>
  </Box>
)}
{documents && (
  <>
    {[
      { tag: 'אישור משטרה', label: 'אישור משטרה' },
      { tag: 'תעודת הוראה', label: 'תעודת הוראה' },
    ].map(({ tag, label }) => {
      const hasDoc = documents.some(doc => doc.tag === tag && doc.status === 'מאושר');
      return !hasDoc ? (
        <Alert key={tag} severity="warning" sx={{ mb: 1 }}>
          חסר לעובד {label} מאושר/ת
        </Alert>
      ) : null;
    })}
  </>
)}



      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">שגיאה בטעינת המסמכים</Alert>}

      <Stack spacing={2} mt={3}>
        {documents.map((doc:any) => (
          <Paper
            key={doc._id}
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: doc.status === 'מאושר'
                ? '#e8f5e9'
                : doc.status === 'ממתין'
                ? '#fff8e1'
                : '#ffebee',
              borderLeft: `5px solid ${
                doc.status === 'מאושר'
                  ? '#66bb6a'
                  : doc.status === 'ממתין'
                  ? '#ffa726'
                  : '#ef5350'
              }`
            }}
          >
            <Box>
              <Typography variant="body1">
                {doc.tag} ({doc.status})
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="צפייה במסמך">
                <IconButton onClick={() => window.open(doc.url, '_blank')}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="אשר מסמך">
                <IconButton
                  color="success"
                  onClick={() => handleStatusUpdate(doc._id, DocumentStatus.APPROVED)}
                  disabled={doc.status === DocumentStatus.APPROVED}
                >
                  <CheckCircleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="דחה מסמך">
                <IconButton
                  color="error"
                  onClick={() => handleStatusUpdate(doc._id, DocumentStatus.REJECTED)}
                  disabled={doc.status === DocumentStatus.REJECTED}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        ))}

        {documents.length === 0 && !isLoading && (
          <Alert severity="info">לא נמצאו מסמכים לעובד זה</Alert>
        )}
      </Stack>
    </Box>
  );
};

export default WorkerDocumentsApprovalPage;