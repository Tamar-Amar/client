import React from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllDocuments, useWorkerDocuments } from '../../queries/useDocuments';
import { Document, DocumentStatus } from '../../types/Document';
import { useFetchWorkers } from '../../queries/workerQueries';
import { Worker } from '../../types';

const PendingDocuments: React.FC = () => {
  const { data: documents = [], isLoading: isLoadingDocs } = useFetchAllDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchWorkers();
  const { updateStatus, isUpdatingStatus } = useWorkerDocuments('all');

  const pendingDocuments = documents.filter((doc: Document) => doc.status === DocumentStatus.PENDING);
  console.log("pendingDocuments", pendingDocuments);

  const getOperatorDetails = (operatorId: string): { name: string; id: string } => {
    const worker = workers?.find((w: Worker) => w._id === operatorId);
    return worker ? {
      name: `${worker.firstName} ${worker.lastName}`,
      id: worker.id || ''
    } : { name: 'לא נמצא', id: '' };
  };

  const handleApprove = (documentId: string) => {
    updateStatus({ documentId, status: DocumentStatus.APPROVED });
  };

  const handleReject = (documentId: string) => {
    updateStatus({ documentId, status: DocumentStatus.REJECTED });
  };

  if (isLoadingDocs || isLoadingWorkers) {
    return <Typography>טוען...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        מסמכים ממתינים לאישור
      </Typography>
      <List dense>
        {pendingDocuments.map((doc: Document) => {
          const operatorDetails = getOperatorDetails(doc.operatorId);
          return (
            <ListItem key={doc._id} divider>
              <ListItemText
                primary={doc.fileName}
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={doc.documentType}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                      <Typography variant="body2" component="span" color="text.secondary">
                        {new Date(doc.createdAt).toLocaleDateString('he-IL')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      מפעיל: {operatorDetails.name} (ת.ז: {operatorDetails.id})
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="צפה במסמך">
                  <IconButton
                    edge="end"
                    aria-label="view"
                    onClick={() => window.open(doc.url, '_blank')}
                    sx={{ color: 'info.main' }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="אשר מסמך">
                  <IconButton
                    edge="end"
                    aria-label="approve"
                    onClick={() => handleApprove(doc._id!)}
                    disabled={isUpdatingStatus}
                    sx={{ color: 'success.main', ml: 1 }}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="דחה מסמך">
                  <IconButton
                    edge="end"
                    aria-label="reject"
                    onClick={() => handleReject(doc._id!)}
                    disabled={isUpdatingStatus}
                    sx={{ color: 'error.main', ml: 1 }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
        {(!pendingDocuments || pendingDocuments.length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            אין מסמכים ממתינים לאישור
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default PendingDocuments; 