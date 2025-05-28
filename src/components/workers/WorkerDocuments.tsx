import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { DocumentStatus, DocumentType } from '../../types/Document';


interface Document {
  _id: string;
  fileName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadDate: string;
  expiryDate?: string;
  url?: string;
}

interface Props {
  workerId: string;
}

const WorkerDocuments: React.FC<Props> = ({ workerId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [workerId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/worker/${workerId}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workerId', workerId);
    formData.append('documentType', DocumentType.OTHER);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setDocuments(docs => docs.filter(doc => doc._id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'success';
      case DocumentStatus.PENDING:
        return 'warning';
      case DocumentStatus.REJECTED:
        return 'error';
      case DocumentStatus.EXPIRED:
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>טוען...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">מסמכי העובד</Typography>
        <Button
          variant="contained"
          component="label"
        >
          העלאת מסמך
          <input
            type="file"
            hidden
            onChange={handleUpload}
          />
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם הקובץ</TableCell>
              <TableCell>סוג מסמך</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>תאריך העלאה</TableCell>
              <TableCell>תאריך תפוגה</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell>{doc.documentType}</TableCell>
                <TableCell>
                  <Chip
                    label={doc.status}
                    color={getStatusColor(doc.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(doc.uploadDate).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>
                  {doc.expiryDate && new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => doc.url && window.open(doc.url)}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(doc._id)}
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