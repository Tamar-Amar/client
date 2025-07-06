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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Button,
  Tooltip,
  LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllWorkersAfterNoon, useDeleteWorkerAfterNoon, useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../../queries/classQueries';
import { WorkerAfterNoon, Class } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useFetchAllDocuments } from '../../queries/useDocuments';
import { useQueryClient } from '@tanstack/react-query';
import CoordinatorAssignmentDialog from '../coordinator/CoordinatorAssignmentDialog';

const ROWS_PER_PAGE = 15;

const WorkersDocumentsList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchAllWorkersAfterNoon();
  const { data: classes = [] } = useFetchClasses();
  const { data: documents = [] } = useFetchAllDocuments();
  const queryClient = useQueryClient();
  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const updateWorkerMutation = useUpdateWorkerAfterNoon();
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinatorDialogOpen, setCoordinatorDialogOpen] = useState(false);
  const [selectedWorkerForCoordinator, setSelectedWorkerForCoordinator] = useState<WorkerAfterNoon | null>(null);
  const [salaryAccountFilter, setSalaryAccountFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const navigate = useNavigate();


  

  // Create a map of class IDs to symbols for quick lookup
  const classSymbolMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((cls: Class) => {
      map.set(cls._id || '', cls.uniqueSymbol || '');
    });
    return map;
  }, [classes]);

  const projectOptions = [
    { value: '', label: 'כל הפרויקטים' },
    { value: 'isAfterNoon', label: 'צהרון' },
    { value: 'isHanukaCamp', label: 'קייטנת חנוכה' },
    { value: 'isPassoverCamp', label: 'קייטנת פסח' },
    { value: 'isSummerCamp', label: 'קייטנת קיץ' },
  ];


  // Filter workers based on search query and salary account
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        (worker.id ?? '').toLowerCase().includes(searchLower) ||
        (worker.firstName ?? '').toLowerCase().includes(searchLower) ||
        (worker.lastName ?? '').toLowerCase().includes(searchLower) ||
        (worker.phone ?? '').toLowerCase().includes(searchLower) ||
        (worker.email ?? '').toLowerCase().includes(searchLower) ||
        (worker.roleType ?? '').toLowerCase().includes(searchLower) ||
        (worker.roleName ?? '').toLowerCase().includes(searchLower) ||
        (worker.status ?? '').toLowerCase().includes(searchLower)
      );

      const matchesSalaryAccount = !salaryAccountFilter || worker.accountantCode === salaryAccountFilter;
      const matchesProject = !projectFilter || worker[projectFilter as keyof WorkerAfterNoon] === true;

      return matchesSearch && matchesSalaryAccount && matchesProject;
    });
  }, [workers, searchQuery, salaryAccountFilter, projectFilter]);

  // Calculate pagination
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

  const handleViewWorker = (worker: WorkerAfterNoon) => {
    navigate(`/workers/${worker._id}`);
  };

  const handleAssignCoordinator = (worker: WorkerAfterNoon) => {
    setSelectedWorkerForCoordinator(worker);
    setCoordinatorDialogOpen(true);
  };

  const handleCoordinatorAssign = async (coordinatorId: string) => {
    if (selectedWorkerForCoordinator) {
      try {
        await updateWorkerMutation.mutateAsync({
          id: selectedWorkerForCoordinator._id,
          data: { coordinatorId }
        });
        // רענון הנתונים
        queryClient.invalidateQueries({ queryKey: ['workers'] });
      } catch (error) {
        console.error('Error assigning coordinator:', error);
      }
    }
  };
  
  // Handle individual worker selection
  const handleWorkerSelect = (workerId: string) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkers(newSelected);
  };

  // Handle select all workers on current page
  const handleSelectAll = () => {
    const allWorkerIds = filteredWorkers.map(worker => worker._id);
    const allSelected = allWorkerIds.every(id => selectedWorkers.has(id));
    
    const newSelected = new Set(selectedWorkers);
    if (allSelected) {
      // Deselect all workers
      allWorkerIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all workers
      allWorkerIds.forEach(id => newSelected.add(id));
    }
    setSelectedWorkers(newSelected);
  };

  // Handle delete selected workers
  const handleDeleteSelected = async () => {
    if (selectedWorkers.size === 0) return;
    
    const confirmMessage = `האם אתה בטוח שברצונך למחוק ${selectedWorkers.size} עובדים?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsDeletingSelected(true);
      setDeleteProgress(0);
      
      const selectedWorkerIds = Array.from(selectedWorkers);
      const totalWorkers = selectedWorkerIds.length;
      
      for (let i = 0; i < selectedWorkerIds.length; i++) {
        await deleteWorkerMutation.mutateAsync(selectedWorkerIds[i]);
        queryClient.invalidateQueries({ queryKey: ['workers'] });
        const progress = ((i + 1) / totalWorkers) * 100;

        setDeleteProgress(progress);
      }
      
      setSelectedWorkers(new Set());
      alert(`נמחקו ${totalWorkers} עובדים בהצלחה!`);
    } catch (error) {
      console.error('Error deleting selected workers:', error);
      alert('שגיאה במחיקת העובדים');
    } finally {
      setIsDeletingSelected(false);
      setDeleteProgress(0);
    }
  };

  // Check if all current page workers are selected
  const isAllSelected = filteredWorkers.length > 0 && 
    filteredWorkers.every(worker => selectedWorkers.has(worker._id));

  // Check if some current page workers are selected
  const isSomeSelected = filteredWorkers.some(worker => selectedWorkers.has(worker._id));

  if (isLoading) return <Typography>טוען...</Typography>;
  if (error) return <Typography>שגיאה בטעינת הנתונים</Typography>;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>חשב שכר</InputLabel>
          <Select
            value={salaryAccountFilter}
            label="חשב שכר"
            onChange={(e) => {
              setSalaryAccountFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="מירי">מירי</MenuItem>
            <MenuItem value="אסתי">אסתי</MenuItem>
            <MenuItem value="מרים">מרים</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>פרויקט</InputLabel>
          <Select
            value={projectFilter}
            label="פרויקט"
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(0);
            }}
          >
            {projectOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedWorkers.size > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="primary">
            נבחרו {selectedWorkers.size} עובדים
          </Typography>
          <Tooltip title="מחק עובדים נבחרים">
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={isDeletingSelected}
              onClick={handleDeleteSelected}
              startIcon={<DeleteIcon />}
            >
              {isDeletingSelected ? 'מוחק...' : `מחק ${selectedWorkers.size} עובדים`}
            </Button>
          </Tooltip>
        </Box>
      )}

      {isDeletingSelected && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={deleteProgress} 
            color="error"
            sx={{
              height: 8,
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center" 
            sx={{ mt: 0.5 }}
          >
            {`מוחק ${Math.round(deleteProgress)}% מהעובדים הנבחרים...`}
          </Typography>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ mb: 2, minHeight: 500 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ fontWeight: 'bold' }}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected && !isAllSelected}
                  onChange={handleSelectAll}
                  size="small"
                />
              </TableCell>
              <TableCell padding="checkbox" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ת.ז.</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>שם מלא</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>טלפון</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>אימייל</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>חשב שכר</TableCell>


            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWorkers.length > 0 ? (
              paginatedWorkers.map((worker) => (
                <TableRow key={worker._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedWorkers.has(worker._id)}
                      onChange={() => handleWorkerSelect(worker._id)}
                      size="small"
                    />
                  </TableCell>
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
                        color="info"
                        onClick={() => handleViewWorker(worker)}
                        size="small"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleAssignCoordinator(worker)}
                        size="small"
                        title="שייך רכז"
                      >
                        👥
                      </IconButton>

                    </Box>
                  </TableCell>
                  <TableCell>{worker.id}</TableCell>
                  <TableCell>{` ${worker.lastName} ${worker.firstName}`}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{!worker.status || worker.status === "לא נבחר" ? "פעיל" : worker.status}</TableCell>
                  <TableCell>{worker.accountantCode}</TableCell>


                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
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

      {coordinatorDialogOpen && (
        <CoordinatorAssignmentDialog
          open={coordinatorDialogOpen}
          onClose={() => setCoordinatorDialogOpen(false)}
          type="worker"
          item={selectedWorkerForCoordinator || undefined}
          onAssign={handleCoordinatorAssign}
        />
      )}
    </Box>
  );
};

export default WorkersDocumentsList; 