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
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Autocomplete
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllWorkersAfterNoon, useDeleteWorkerAfterNoon, useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { useFetchClasses } from '../../queries/classQueries';
import { useFetchAllUsers } from '../../queries/useUsers';
import { WorkerAfterNoon, Class } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const ROWS_PER_PAGE = 15;

const WorkersDocumentsList: React.FC = () => {
  const { data: workers = [], isLoading, error } = useFetchAllWorkersAfterNoon();
  const { data: classes = [] } = useFetchClasses();
  const { data: allUsers = [] } = useFetchAllUsers();
  const queryClient = useQueryClient();
  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const updateWorkerMutation = useUpdateWorkerAfterNoon();
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryAccountFilter, setSalaryAccountFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [filterInstitutionCode, setFilterInstitutionCode] = useState('');
  const [filterClassCode, setFilterClassCode] = useState('');
  const [filterRole, setFilterRole] = useState('');
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
    { value: '1', label: 'צהרון שוטף 2025' },
    { value: '2', label: 'קייטנת חנוכה 2025' },
    { value: '3', label: 'קייטנת פסח 2025' },
    { value: '4', label: 'קייטנת קיץ 2025' },
  ];

  // אפשרויות חשבי שכר
  const accountantOptions = useMemo(() => {
    return [
      { value: '', label: 'כל חשבי השכר' },
      ...allUsers
        .filter((user: any) => user.role === 'accountant')
        .map((user: any) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`
        }))
    ];
  }, [allUsers]);

  // אפשרויות קודי מוסד עם שמות
  const institutionOptions = useMemo(() => {
    const institutionMap = new Map<string, { code: string; name: string }>();
    classes.forEach((cls: Class) => {
      if (cls.institutionCode && cls.institutionName) {
        institutionMap.set(cls.institutionCode, { 
          code: cls.institutionCode, 
          name: cls.institutionName 
        });
      }
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(institutionMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(institution => ({ 
          value: institution.code, 
          label: `${institution.code} - ${institution.name}` 
        }))
    ];
  }, [classes]);

  // אפשרויות סמלי כיתה עם שמות
  const classCodeOptions = useMemo(() => {
    const classMap = new Map<string, { symbol: string; name: string }>();
    classes.forEach((cls: Class) => {
      if (cls.uniqueSymbol && cls.name) {
        classMap.set(cls.uniqueSymbol, { 
          symbol: cls.uniqueSymbol, 
          name: cls.name 
        });
      }
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(classMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(classItem => ({ 
          value: classItem.symbol, 
          label: `${classItem.symbol} - ${classItem.name}` 
        }))
    ];
  }, [classes]);

  // אפשרויות תפקידים
  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    workers.forEach(worker => {
      if (worker.roleName) {
        // נרמול התפקיד - הסרת רווחים מיותרים ותווי בלתי נראים
        const normalizedRole = worker.roleName.trim();
        if (normalizedRole) {
          roles.add(normalizedRole);
        }
      }
    });
    return [
      { value: '', label: 'כל התפקידים' },
      ...Array.from(roles).sort().map(role => ({ value: role, label: role }))
    ];
  }, [workers]);


  // Filter workers based on search query and salary account
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const searchLower = searchQuery.toLowerCase();
      const normalizedWorkerRole = worker.roleName?.trim().replace(/\s+/g, ' ');
      const matchesSearch = (
        (worker.id ?? '').toLowerCase().includes(searchLower) ||
        (worker.firstName ?? '').toLowerCase().includes(searchLower) ||
        (worker.lastName ?? '').toLowerCase().includes(searchLower) ||
        (worker.phone ?? '').toLowerCase().includes(searchLower) ||
        (worker.email ?? '').toLowerCase().includes(searchLower) ||
        (normalizedWorkerRole ?? '').toLowerCase().includes(searchLower) ||
        (worker.status ?? '').toLowerCase().includes(searchLower)
      );

      const matchesProject = !projectFilter || (worker.projectCodes && worker.projectCodes.includes(parseInt(projectFilter)));

      // סינון לפי חשב שכר
      let matchesAccountant = true;
      if (salaryAccountFilter) {
        const accountant = allUsers.find((u: any) => u._id === salaryAccountFilter && u.role === 'accountant');
        if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
          const workerClasses = classes.filter((cls: any) =>
            Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
          );
          const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
          matchesAccountant = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
        } else {
          matchesAccountant = false;
        }
      }

      // סינון לפי קוד מוסד
      let institutionMatch = true;
      if (filterInstitutionCode) {
        // נסה למצוא את קוד המוסד דרך הכיתות
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        
        if (workerClasses.length > 0) {
          // אם העובד משויך לכיתות, בדוק אם אחת מהן מתאימה לקוד המוסד
          institutionMatch = workerClasses.some((cls: any) => cls.institutionCode === filterInstitutionCode);
        } else {
          // אם העובד לא משויך לכיתות, נציג אותו רק אם לא נבחר פילטר מוסד
          // או אם יש לו accountantCode שמתאים
          institutionMatch = !filterInstitutionCode || Boolean(worker.accountantCode && worker.accountantCode === filterInstitutionCode);
        }
      }

      // סינון לפי סמל כיתה
      let classCodeMatch = true;
      if (filterClassCode) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        classCodeMatch = workerClasses.some((cls: any) => cls.uniqueSymbol === filterClassCode);
      }

      // סינון לפי תפקיד
      const roleMatch = !filterRole || worker.roleName === filterRole;

      return matchesSearch && matchesProject && matchesAccountant && institutionMatch && classCodeMatch && roleMatch;
    });
  }, [workers, searchQuery, salaryAccountFilter, projectFilter, filterInstitutionCode, filterClassCode, filterRole, allUsers, classes]);

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

  // פונקציה ליצירת תגיות סינון פעילות
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchQuery) {
      filters.push({
        key: 'search',
        label: `חיפוש: "${searchQuery}"`,
        onDelete: () => setSearchQuery('')
      });
    }
    
    if (projectFilter) {
      const project = projectOptions.find(p => p.value === projectFilter);
      filters.push({
        key: 'project',
        label: `פרויקט: ${project?.label}`,
        onDelete: () => setProjectFilter('')
      });
    }
    
    if (salaryAccountFilter) {
      const accountant = accountantOptions.find(a => a.value === salaryAccountFilter);
      filters.push({
        key: 'accountant',
        label: `חשב שכר: ${accountant?.label}`,
        onDelete: () => setSalaryAccountFilter('')
      });
    }
    
    if (filterInstitutionCode) {
      const institution = institutionOptions.find(i => i.value === filterInstitutionCode);
      filters.push({
        key: 'institution',
        label: `מוסד: ${institution?.label}`,
        onDelete: () => setFilterInstitutionCode('')
      });
    }
    
    if (filterClassCode) {
      const classItem = classCodeOptions.find(c => c.value === filterClassCode);
      filters.push({
        key: 'class',
        label: `קבוצה: ${classItem?.label}`,
        onDelete: () => setFilterClassCode('')
      });
    }
    
    if (filterRole) {
      filters.push({
        key: 'role',
        label: `תפקיד: ${filterRole}`,
        onDelete: () => setFilterRole('')
      });
    }
    
    return filters;
  };

  if (isLoading) return <Typography>טוען...</Typography>;
  if (error) return <Typography>שגיאה בטעינת הנתונים</Typography>;

  return (
    <Box>
      {/* סרגל סינון מתקדם בראש העמוד */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔍 סינון מתקדם
            </Typography>
            {getActiveFilters().length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>|</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {getActiveFilters().map((filter) => (
                    <Chip
                      key={filter.key}
                      label={filter.label}
                      onDelete={filter.onDelete}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </>
            )}
          </Box>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                size="small"
                fullWidth
                placeholder="חיפוש חופשי"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: !searchQuery ? <SearchIcon /> : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>פרויקט</InputLabel>
                <Select 
                  value={projectFilter} 
                  label="פרויקט" 
                  onChange={(e) => {
                    setProjectFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {projectOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>חשב שכר</InputLabel>
                <Select 
                  value={salaryAccountFilter} 
                  label="חשב שכר" 
                  onChange={(e) => {
                    setSalaryAccountFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {accountantOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                size="small"
                options={institutionOptions}
                getOptionLabel={(option) => option.label}
                value={institutionOptions.find(opt => opt.value === filterInstitutionCode) || null}
                onChange={(_, newValue) => {
                  setFilterInstitutionCode(newValue?.value || '');
                  setPage(0);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="קוד מוסד" 
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                size="small"
                options={classCodeOptions}
                getOptionLabel={(option) => option.label}
                value={classCodeOptions.find(opt => opt.value === filterClassCode) || null}
                onChange={(_, newValue) => {
                  setFilterClassCode(newValue?.value || '');
                  setPage(0);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="סמל כיתה" 
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.value === value.value}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>תפקיד</InputLabel>
                <Select 
                  value={filterRole} 
                  label="תפקיד" 
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(0);
                  }}
                >
                  {roleOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
              <TableCell sx={{ fontWeight: 'bold' }}>תפקיד</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>קוד מוסד</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>


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

                    </Box>
                  </TableCell>
                  <TableCell>{worker.id}</TableCell>
                  <TableCell>{` ${worker.lastName} ${worker.firstName}`}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{worker.roleName?.trim().replace(/\s+/g, ' ') || 'לא נבחר'}</TableCell>
                  <TableCell>
                    {(() => {
                      const workerClasses = classes.filter((cls: any) =>
                        Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
                      );
                      if (workerClasses.length > 0) {
                        return workerClasses.map((cls: any) => cls.institutionCode).join(', ');
                      } else if (worker.accountantCode) {
                        return worker.accountantCode;
                      } else {
                        return 'לא משויך';
                      }
                    })()}
                  </TableCell>
                  <TableCell>{!worker.status || worker.status === "לא נבחר" ? "פעיל" : worker.status}</TableCell>


                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
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