import React from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import { DocumentStatus } from '../../../types/Document';

interface WorkerPersonalDocumentsProps {
  documents: any[];
  handleStatusUpdate: (docId: string, newStatus: DocumentStatus) => void;
  handleDelete: (docId: string) => void;
}

const WorkerPersonalDocuments: React.FC<WorkerPersonalDocumentsProps> = ({ documents, handleStatusUpdate, handleDelete }) => (
  console.log(documents),
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      מסמכים אישיים
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>סוג מסמך</TableCell>
            <TableCell>סטטוס</TableCell>
            <TableCell>  תוקף</TableCell>
            <TableCell align="center">פעולות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents
            .filter((doc: any) => ['אישור משטרה', 'תעודת הוראה', 'תעודת זהות'].includes(doc.tag))
            .map((doc: any) => (
              <TableRow key={doc._id} sx={{ bgcolor: doc.status === 'מאושר'
                ? '#e8f5e9'
                : doc.status === 'ממתין'
                ? '#fff8e1'
                : '#ffebee' }}>
                <TableCell>{doc.tag}</TableCell>
                <TableCell>
                  <Typography color={
                    doc.status === 'מאושר'
                      ? 'success.main'
                      : doc.status === 'ממתין'
                      ? 'warning.main'
                      : 'error.main'
                  }>
                    {doc.status}
                  </Typography>
                </TableCell>
                <TableCell>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('he-IL') : ''}</TableCell>
                <TableCell align="center">
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
                  <Tooltip title="מחק מסמך">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(doc._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

export default WorkerPersonalDocuments; 