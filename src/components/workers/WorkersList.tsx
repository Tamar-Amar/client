import React, { useState, useMemo } from 'react';
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
  Box,
  TextField,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllWorkersAfterNoon, useDeleteWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon } from '../../types';
import { useNavigate } from 'react-router-dom';

const ROWS_PER_PAGE = 15;

const WorkersList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchAllWorkersAfterNoon();
  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();


  
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (worker.id ?? '').toLowerCase().includes(searchLower) ||
        (worker.firstName ?? '').toLowerCase().includes(searchLower) ||
        (worker.lastName ?? '').toLowerCase().includes(searchLower) ||
        (worker.phone ?? '').toLowerCase().includes(searchLower) ||
        (worker.email ?? '').toLowerCase().includes(searchLower) ||
        (worker.roleName ?? '').toLowerCase().includes(searchLower) ||
        (worker.status ?? '').toLowerCase().includes(searchLower)
      );
    });
  }, [workers, searchQuery]);

  
  const paginatedWorkers = useMemo(() => {
    const startIndex = page * ROWS_PER_PAGE;
    return filteredWorkers.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredWorkers, page]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      try {
        await deleteWorkerMutation.mutateAsync(workerId);
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const handleEdit = (worker: WorkerAfterNoon) => {
    navigate(`/workers/edit/${worker._id}`);
  };

  const handleViewDetails = (worker: WorkerAfterNoon) => {
    navigate(`/workers/${worker._id}`);
  };


  if (isLoading) return <Typography>טוען...</Typography>;
  if (error) return <Typography>שגיאה בטעינת הנתונים</Typography>;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="חיפוש חופשי..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0); 
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ת.ז.</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>שם מלא</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>טלפון</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>אימייל</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWorkers.length > 0 ? (
              paginatedWorkers.map((worker) => (
                <TableRow key={worker._id} hover>
                  <TableCell padding="checkbox">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(worker._id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(worker)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="info"
                        onClick={() => handleViewDetails(worker)}
                        size="small"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{worker.id}</TableCell>
                  <TableCell>{`${worker.firstName} ${worker.lastName}`}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'לא נמצאו תוצאות לחיפוש' : 'לא קיימים עובדים במערכת'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          סה"כ: {filteredWorkers.length} עובדים
          {searchQuery && ` (מתוך ${workers.length})`}
        </Typography>
        <TablePagination
          component="div"
          count={filteredWorkers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Box>
    </Box>
  );
};

export default WorkersList; 