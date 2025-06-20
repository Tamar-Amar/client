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
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllWorkersAfterNoon, useDeleteWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../../queries/classQueries';
import { WorkerAfterNoon, Class } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useFetchAllDocuments } from '../../queries/useDocuments';

const ROWS_PER_PAGE = 15;

const WorkersDocumentsList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchAllWorkersAfterNoon();
  const { data: classes = [] } = useFetchClasses();
  const { data: documents = [] } = useFetchAllDocuments();

  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryAccountFilter, setSalaryAccountFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();


  const documentsByWorkerId = useMemo(() => {
    const map = new Map<string, any[]>();
    documents.forEach((doc) => {
      if (!map.has(doc.operatorId)) map.set(doc.operatorId, []);
      map.get(doc.operatorId)?.push(doc);
    });
    return map;
  }, [documents]);
  
  const getDocStatus = (workerId: string, tag: string) => {
    const docs = documentsByWorkerId.get(workerId) || [];
    const doc = docs.find((doc) => doc.tag === tag);
    if (!doc) return '----';
  
    const color = doc.status === 'מאושר' ? 'green' :
                  doc.status === 'ממתין' ? 'orange' :
                  doc.status === 'נדחה' ? 'red' : 'grey';
  
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="body2">{doc.status}</Typography>
      </Box>
    );
  };
  
  

  // Create a map of class IDs to symbols for quick lookup
  const classSymbolMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((cls: Class) => {
      map.set(cls._id || '', cls.uniqueSymbol || '');
    });
    return map;
  }, [classes]);



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

      return matchesSearch && matchesSalaryAccount;
    });
  }, [workers, searchQuery, salaryAccountFilter]);

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

  const handleViewDocuments = (worker: WorkerAfterNoon) => {
    navigate(`/workers-documents/${worker._id}`);
  };
  


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
              <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>חשב שכר</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>אישור משטרה</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>תעודת הוראה</TableCell>

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
                        color="info"
                        onClick={() => handleViewDocuments(worker)}
                        size="small"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>

                    </Box>
                  </TableCell>
                  <TableCell>{worker.id}</TableCell>
                  <TableCell>{` ${worker.lastName} ${worker.firstName}`}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{!worker.status || worker.status === "לא נבחר" ? "פעיל" : worker.status}</TableCell>
                  <TableCell>{worker.accountantCode}</TableCell>
                  <TableCell>{getDocStatus(worker._id, 'אישור משטרה')}</TableCell>
                  <TableCell>{getDocStatus(worker._id, 'תעודת הוראה')}</TableCell>

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

export default WorkersDocumentsList; 