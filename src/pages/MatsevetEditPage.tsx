import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import { useFetchClasses, useDeleteClass } from '../queries/classQueries';
import { Class, WorkerAfterNoon } from '../types';
import AddClassDialog from '../components/classes/AddClassDialog';

interface ClassWithWorkers {
  class: Class;
  workers: WorkerAfterNoon[];
}

const MatsevetEditPage: React.FC = () => {
  const { data: workers = [], isLoading: workersLoading } = useFetchAllWorkersAfterNoon();
  const { data: classes = [], isLoading: classesLoading } = useFetchClasses();
  const [selected, setSelected] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const classesWithWorkers = useMemo(() => {
    const result: ClassWithWorkers[] = [];
    classes.forEach((cls: Class) => {
      const classWorkers = workers.filter(worker =>
        cls.workers?.some((w: { workerId: string }) => w.workerId === worker._id)
      );
      result.push({ class: cls, workers: classWorkers });
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

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? classes.map((c: Class) => String(c._id)) : []);
  };

  const handleActionsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleActionsClose = () => setAnchorEl(null);

  const deleteClassMutation = useDeleteClass();
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הקבוצות שנבחרו?')) return;
    for (const classId of selected) {
      await deleteClassMutation.mutateAsync(classId);
    }
    setSelected([]);
  };

  if (workersLoading || classesLoading) return null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            הוספת קבוצה
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={selected.length === 0}
            endIcon={<MoreVertIcon />}
            onClick={handleActionsClick}
          >
            פעולות
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleActionsClose}>
            <MenuItem disabled={selected.length === 0}>שיוך רכז</MenuItem>
            <MenuItem disabled={selected.length === 0}>עדכון קוד מוסד</MenuItem>
            <MenuItem disabled={selected.length === 0} onClick={handleDeleteSelected}>מחק</MenuItem>
          </Menu>
        </Box>
      </Box>
      <Box sx={{ mb: 2, maxWidth: 400 }}>
        <TextField
          size="small"
          placeholder="חיפוש בכיתה, סמל, מוסד, כתובת או עובד..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2, maxHeight: 600, minHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < classes.length}
                  checked={selected.length === classes.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>סמל כיתה</TableCell>
              <TableCell>שם כיתה</TableCell>
              <TableCell>מוסד</TableCell>
              <TableCell>עובדים</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClasses.map((classData) => (
              <TableRow key={String(classData.class._id)} selected={selected.includes(String(classData.class._id))}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(String(classData.class._id))}
                    onChange={() => handleSelect(String(classData.class._id))}
                  />
                </TableCell>
                <TableCell>{classData.class.uniqueSymbol}</TableCell>
                <TableCell>{classData.class.name}</TableCell>
                <TableCell>{classData.class.institutionName}</TableCell>
                <TableCell>{classData.workers.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {addDialogOpen && <AddClassDialog onClose={() => setAddDialogOpen(false)} />}
    </Container>
  );
};

export default MatsevetEditPage; 