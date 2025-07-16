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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../queries/classQueries';
import { Class, WorkerAfterNoon } from '../types';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

interface ClassWithWorkers {
  class: Class;
  workers: WorkerAfterNoon[];
}

const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
];

type SortField = 'uniqueSymbol' | 'name' | 'institutionName' | 'workers';
type SortDirection = 'asc' | 'desc';

const MatsevetPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: workers = [], isLoading: workersLoading } = useFetchAllWorkersAfterNoon();
  const { data: classes = [], isLoading: classesLoading } = useFetchClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [sortField, setSortField] = useState<SortField>('uniqueSymbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedClassDialog, setSelectedClassDialog] = useState<ClassWithWorkers | null>(null);

  let isAdmin = false;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      isAdmin = decoded.role === 'admin';
    }
  } catch {}

  const handleWorkerClick = (workerId: string) => {
    navigate(`/workers/${workerId}`);
  };

  const handleClassClick = (classData: ClassWithWorkers) => {
    setSelectedClassDialog(classData);
  };

  const handleCloseDialog = () => {
    setSelectedClassDialog(null);
  };

  const classesWithWorkers = useMemo(() => {
    const result: ClassWithWorkers[] = [];

    classes.forEach((cls: Class) => {
      let classWorkers = workers.filter(worker => 
        cls.workers?.some((w: { workerId: string; project: number }) => w.workerId === worker._id)
      );
      
      if (selectedProject !== '') {
        const hasSelectedProject = cls.projectCodes?.includes(selectedProject as number);
        if (!hasSelectedProject) {
          return;
        }
        
        classWorkers = classWorkers.filter(worker => {
          const workerAssignment = cls.workers?.find(w => w.workerId === worker._id);
          return workerAssignment && workerAssignment.project === (selectedProject as number);
        });
      }
      
      result.push({
        class: cls,
        workers: classWorkers
      });
    });

    const workersWithClasses = new Set<string>();
    classes.forEach((cls: Class) => {
      cls.workers?.forEach((w: { workerId: string; project: number }) => workersWithClasses.add(w.workerId));
    });
    
    const workersWithoutClasses = workers.filter(worker => !workersWithClasses.has(worker._id));

    if (selectedProject !== '') {
      const filteredWorkersWithoutClasses = workersWithoutClasses.filter(worker => 
        worker.projectCodes?.includes(selectedProject as number)
      );
      if (filteredWorkersWithoutClasses.length > 0) {
        result.push({
          class: {
            _id: 'no-class',
            name: 'עובדים ללא מסגרת',
            uniqueSymbol: 'ללא מסגרת',
            institutionName: 'לא משויכים',
            institutionCode: '000000',
            coordinatorId: '',
            type: 'כיתה',
            gender: 'בנים',
            education: 'רגיל',
            isActive: true,
            hasAfternoonCare: false,
            projectCodes: [],
            workers: []
          } as Class,
          workers: filteredWorkersWithoutClasses
        });
      }
    } else if (workersWithoutClasses.length > 0) {
      result.push({
        class: {
          _id: 'no-class',
          name: 'עובדים ללא מסגרת',
          uniqueSymbol: 'ללא מסגרת',
          institutionName: 'לא משויכים',
          institutionCode: '000000',
          coordinatorId: '',
          type: 'כיתה',
          gender: 'בנים',
          education: 'רגיל',
          isActive: true,
          hasAfternoonCare: false,
          projectCodes: [],
          workers: []
        } as Class,
        workers: workersWithoutClasses
      });
    }
    
    return result;
  }, [classes, workers, selectedProject]);

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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            סך הכל: {sortedClasses.length} כיתות
            {selectedProject !== '' && (
              <span>
                {' '}(מסונן לפי {projectTypes.find(p => p.value === selectedProject)?.label})
              </span>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/matsevet/import')}
              >
                העלאת מצבת והשוואה
              </Button>
            )}
            <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
              <InputLabel>סינון לפי פרויקט</InputLabel>
              <Select
                value={selectedProject}
                label="סינון לפי פרויקט"
                onChange={(e) => setSelectedProject(e.target.value as number | '')}
              >
                <MenuItem value="">
                  <em>כל הפרויקטים</em>
                </MenuItem>
                {projectTypes.map((project) => (
                  <MenuItem key={project.value} value={project.value}>
                    {project.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(selectedProject !== '' || searchTerm) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedProject('');
                  setSearchTerm('');
                }}
                sx={{ bgcolor: 'white' }}
              >
                נקה סינון
              </Button>
            )}
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
              <TableCell 
                sx={{ color: 'black', fontWeight: 'bold', minWidth: 150, cursor: 'pointer' }}
                onClick={() => handleSort('institutionName')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  קוד מוסד
                  {getSortIcon('institutionName')}
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 80 }}>סוג</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 80 }}>מגדר</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', minWidth: 120 }}>קודי פרויקט</TableCell>
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
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color="primary.main"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        color: 'primary.dark',
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => handleClassClick(classData)}
                  >
                    {classData.class.uniqueSymbol}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {classData.class.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {classData.class.institutionCode}
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
                  {classData.class.projectCodes && classData.class.projectCodes.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {classData.class.projectCodes.map((projectCode) => {
                        const project = projectTypes.find(p => p.value === projectCode);
                        return (
                          <Chip
                            key={projectCode}
                            label={project ? project.label : projectCode}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: '0.6rem' }}
                          />
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      אין קודי פרויקט
                    </Typography>
                  )}
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
                            {worker.roleName || 'לא מוגדר'}
                          </Typography>
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

      {/* דיאלוג פרטי כיתה */}
      <Dialog 
        open={!!selectedClassDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedClassDialog && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  פרטי כיתה: {selectedClassDialog.class.name}
                </Typography>
                <IconButton
                  aria-label="close"
                  onClick={handleCloseDialog}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* פרטי הכיתה */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    פרטי הכיתה
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="שם כיתה"
                        secondary={selectedClassDialog.class.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="סמל כיתה"
                        secondary={selectedClassDialog.class.uniqueSymbol}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="קוד מוסד"
                        secondary={selectedClassDialog.class.institutionCode}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="שם מוסד"
                        secondary={selectedClassDialog.class.institutionName}
                      />
                    </ListItem>
                    {selectedClassDialog.class.address && (
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="כתובת"
                          secondary={selectedClassDialog.class.address}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="סוג"
                        secondary={selectedClassDialog.class.type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="מגדר"
                        secondary={selectedClassDialog.class.gender}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="חינוך"
                        secondary={selectedClassDialog.class.education}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="צהרון"
                        secondary={selectedClassDialog.class.hasAfternoonCare ? 'כן' : 'לא'}
                      />
                    </ListItem>
                    {selectedClassDialog.class.childresAmount && (
                      <ListItem>
                        <ListItemIcon>
                          <PeopleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="מספר ילדים"
                          secondary={selectedClassDialog.class.childresAmount}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* קודי פרויקט */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    קודי פרויקט
                  </Typography>
                  {selectedClassDialog.class.projectCodes && selectedClassDialog.class.projectCodes.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedClassDialog.class.projectCodes.map((projectCode) => {
                        const project = projectTypes.find(p => p.value === projectCode);
                        return (
                          <Chip
                            key={projectCode}
                            label={project ? project.label : `פרויקט ${projectCode}`}
                            color="primary"
                            variant="filled"
                            sx={{ mb: 1 }}
                          />
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      אין קודי פרויקט משויכים
                    </Typography>
                  )}
                </Grid>

                {/* עובדים משויכים */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    עובדים משויכים ({selectedClassDialog.workers.length})
                  </Typography>
                  {selectedClassDialog.workers.length > 0 ? (
                    <List dense>
                      {selectedClassDialog.workers.map((worker) => (
                        <ListItem 
                          key={worker._id}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
                          }}
                          onClick={() => {
                            handleCloseDialog();
                            handleWorkerClick(worker._id);
                          }}
                        >
                          <ListItemIcon>
                            <PersonIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${worker.firstName} ${worker.lastName}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  תעודת זהות: {worker.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  תפקיד: {worker.roleName || 'לא מוגדר'}
                                </Typography>
                                {worker.phone && (
                                  <Typography variant="body2" color="text.secondary">
                                    טלפון: {worker.phone}
                                  </Typography>
                                )}
                                {worker.email && (
                                  <Typography variant="body2" color="text.secondary">
                                    אימייל: {worker.email}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      אין עובדים משויכים לכיתה זו
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDialog} color="primary">
                סגור
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default MatsevetPage;
