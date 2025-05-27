import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchWorkers, useDeleteWorker } from '../../queries/workerQueries';
import { Worker } from '../../types';

const WorkerList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchWorkers();
  const deleteWorkerMutation = useDeleteWorker();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">שגיאה בטעינת הנתונים</Typography>
      </Box>
    );
  }

  const handleDelete = async (workerId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      try {
        await deleteWorkerMutation.mutateAsync(workerId);
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>שם פרטי</TableCell>
            <TableCell>שם משפחה</TableCell>
            <TableCell>תעודת זהות</TableCell>
            <TableCell>טלפון</TableCell>
            <TableCell>עיר</TableCell>
            <TableCell>אופן תשלום</TableCell>
            <TableCell>פעולות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workers.map((worker: Worker) => (
            <TableRow key={worker._id}>
              <TableCell>{worker.firstName}</TableCell>
              <TableCell>{worker.lastName}</TableCell>
              <TableCell>{worker.id}</TableCell>
              <TableCell>{worker.phone}</TableCell>
              <TableCell>{worker.city}</TableCell>
              <TableCell>{worker.paymentMethod}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => worker._id && handleDelete(worker._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WorkerList; 