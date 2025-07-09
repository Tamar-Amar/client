import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../queries/classQueries';
import { Class, WorkerAfterNoon } from '../types';

interface ClassWithWorkers {
  class: Class;
  workers: WorkerAfterNoon[];
}

type SortField = 'uniqueSymbol' | 'name' | 'institutionName' | 'workers';
type SortDirection = 'asc' | 'desc';

const MatsevetPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: workers = [], isLoading: workersLoading } = useFetchAllWorkersAfterNoon();
  const { data: classes = [], isLoading: classesLoading } = useFetchClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('uniqueSymbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleWorkerClick = (workerId: string) => {
    navigate(`/workers/${workerId}`);
  };

  const classesWithWorkers = useMemo(() => {
    const result: ClassWithWorkers[] = [];
    
    classes.forEach((cls: Class) => {
      const classWorkers = workers.filter(worker => 
        cls.workers?.some((w: { workerId: string; roleType: string; project: string }) => w.workerId === worker._id) ||
        cls.name === worker.project ||
        cls.uniqueSymbol === worker.project
      );
      
      result.push({
        class: cls,
        workers: classWorkers
      });
    });
    
    return result;
  }, [classes, workers]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return classesWithWorkers;
    
    const searchLower = searchTerm;
    return classesWithWorkers.filter(classData => 
      (classData.class.name && classData.class.name.includes(searchLower)) ||
      (classData.class.uniqueSymbol && classData.class.uniqueSymbol.includes(searchLower)) ||
      (classData.class.institutionName && classData.class.institutionName.includes(searchLower)) ||
      (classData.class.address && classData.class.address.includes(searchLower)) ||
      classData.workers.some(worker => 
        (worker.firstName && worker.firstName.includes(searchLower)) ||
        (worker.lastName && worker.lastName.includes(searchLower)) ||
        (worker.roleName && worker.roleName.includes(searchLower))
      )
    );
  }, [classesWithWorkers, searchTerm]);

  const sortedClasses = useMemo(() => {
    return [...filteredClasses].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'uniqueSymbol':
          aValue = a.class.uniqueSymbol;
          bValue = b.class.uniqueSymbol;
          break;
        case 'name':
          aValue = a.class.name;
          bValue = b.class.name;
          break;
        case 'institutionName':
          aValue = a.class.institutionName;
          bValue = b.class.institutionName;
          break;
        case 'workers':
          aValue = a.workers.length;
          bValue = b.workers.length;
          break;
        default:
          aValue = a.class.uniqueSymbol;
          bValue = b.class.uniqueSymbol;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'he');
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
  }, [filteredClasses, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  if (workersLoading || classesLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 , p:4}}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            סך הכל: {sortedClasses.length} כיתות
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/matsevet/edit')}
            >
              עריכת מצבת
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/matsevet/import')}
            >
              העלאת מצבת והשוואה
            </Button>
            <TextField
              size="small"
              placeholder="חיפוש בכיתה, סמל, מוסד, כתובת או עובד..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 350, bgcolor: 'white' }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2, maxHeight: 600 , minHeight: 600}}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 50 }}>מס'</TableCell>
              <TableCell 
                sx={{ color: 'black', fontWeight: 'bold', minWidth: 100, cursor: 'pointer' }}
                onClick={() => handleSort('uniqueSymbol')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  סמל כיתה
                  {getSortIcon('uniqueSymbol')}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ color: 'black', fontWeight: 'bold', minWidth: 150, cursor: 'pointer' }}
                onClick={() => handleSort('name')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  שם כיתה
                  {getSortIcon('name')}
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 150, maxWidth: 150 }}>כתובת</TableCell>
              <TableCell 
                sx={{ color: 'black', fontWeight: 'bold', minWidth: 150, cursor: 'pointer' }}
                onClick={() => handleSort('institutionName')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  מוסד
                  {getSortIcon('institutionName')}
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 80 }}>סוג</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 80 }}>מגדר</TableCell>
              <TableCell 
                sx={{ color: 'black', fontWeight: 'bold', minWidth: 80, cursor: 'pointer' }}
                onClick={() => handleSort('workers')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  עובדים
                  {getSortIcon('workers')}
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 300 }}>רשימת עובדים</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedClasses.map((classData, index) => (
              <TableRow 
                key={classData.class._id}
                sx={{ 
                  '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                  '&:hover': { bgcolor: '#e3f2fd' }
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {classData.class.uniqueSymbol}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {classData.class.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    maxWidth: 150, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {classData.class.address || 'לא מוגדר'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {classData.class.institutionName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={classData.class.type}
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={classData.class.gender}
                    color={classData.class.gender === 'בנים' ? 'info' : 'secondary'}
                    size="small"
                    variant="filled"
                    sx={{ 
                      fontSize: '0.7rem',
                      bgcolor: classData.class.gender === 'בנים' ? '#2196f3' : '#e91e63',
                      color: 'white'
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={classData.workers.length}
                    color={classData.workers.length > 0 ? 'success' : 'default'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell>
                  {classData.workers.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {classData.workers.map((worker, workerIndex) => (
                        <Box key={worker._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => handleWorkerClick(worker._id)}
                          >
                            {worker.firstName} {worker.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({worker.roleName || worker.roleType || 'לא מוגדר'})
                          </Typography>
                          {workerIndex < classData.workers.length - 1 && (
                            <Typography variant="caption" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      אין עובדים משויכים
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {sortedClasses.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'white',
          borderRadius: 3,
          border: '2px dashed #ccc'
        }}>
          <SchoolIcon sx={{ fontSize: 80, color: '#ccc', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            לא נמצאו כיתות
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'נסה לשנות את מונח החיפוש' : 'אין כיתות במערכת עדיין'}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default MatsevetPage;
