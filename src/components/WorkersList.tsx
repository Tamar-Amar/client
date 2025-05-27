import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchWorkers, useDeleteWorker } from '../queries/workerQueries';
import { Worker } from '../types';
import WorkerEditDialog from './WorkerEditDialog';
import WorkerExcelImport from './workers/WorkerExcelImport';

const WorkersList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchWorkers();
  const deleteWorkerMutation = useDeleteWorker();
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = async (workerId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      try {
        await deleteWorkerMutation.mutateAsync(workerId);
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowEditDialog(true);
  };

  const handleCloseDialog = () => {
    setShowEditDialog(false);
    setSelectedWorker(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (isLoading) return <Typography>טוען...</Typography>;
  if (error) return <Typography>שגיאה בטעינת הנתונים</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <WorkerExcelImport />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>תעודת זהות</TableCell>
              <TableCell>שם משפחה</TableCell>
              <TableCell>שם פרטי</TableCell>
              <TableCell>טלפון</TableCell>
              <TableCell>אימייל</TableCell>
              <TableCell>כתובת</TableCell>
              <TableCell>תאריך לידה</TableCell>
              <TableCell>אופן תשלום</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker._id}>
                <TableCell>{worker.id}</TableCell>
                <TableCell>{worker.lastName}</TableCell>
                <TableCell>{worker.firstName}</TableCell>
                <TableCell>{worker.phone}</TableCell>
                <TableCell>{worker.email}</TableCell>
                <TableCell>
                  {`${worker.city}`}
                </TableCell>
                <TableCell>{formatDate(worker.birthDate)}</TableCell>
                <TableCell>{worker.paymentMethod}</TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(worker._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(worker)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedWorker && (
        <WorkerEditDialog
          worker={selectedWorker}
          open={showEditDialog}
          onClose={handleCloseDialog}
        />
      )}
    </Box>
  );
};

export default WorkersList; 