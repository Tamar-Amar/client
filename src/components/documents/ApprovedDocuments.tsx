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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useFetchAllDocuments, useWorkerDocuments } from '../../queries/useDocuments';
import { Document, DocumentStatus } from '../../types/Document';

const ApprovedDocuments: React.FC = () => {
  const { data: documents = [], isLoading } = useFetchAllDocuments();
  const { deleteDocument, isDeleting } = useWorkerDocuments('all');

  const approvedDocuments = documents.filter((doc: Document) => doc.status === DocumentStatus.APPROVED);

  

  const handleDelete = (documentId: string) => {
    deleteDocument(documentId);
  };

  const handleDownload = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  if (isLoading) {
    return <Typography>טוען...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        מסמכים מאושרים
      </Typography>
      <List dense>
        {approvedDocuments.map((doc: Document) => (
          <ListItem key={doc._id} divider>
            <ListItemText
              primary={doc.fileName}
              secondary={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    label={doc.tag}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="body2" component="span" color="text.secondary">
                    {new Date(doc.createdAt).toLocaleDateString('he-IL')}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="download"
                onClick={() => handleDownload(doc.url)}
                sx={{ color: 'primary.main' }}
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(doc._id!)}
                disabled={isDeleting}
                sx={{ color: 'error.main', ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {(!approvedDocuments || approvedDocuments.length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            אין מסמכים מאושרים
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default ApprovedDocuments; 