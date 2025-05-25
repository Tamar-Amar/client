import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Typography, Box, Button, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchActivitiesByOperator, useDeleteActivity, useAddActivity } from '../../queries/activitiesQueries';
import { jwtDecode } from 'jwt-decode';
import { handleActivityAdded, handleDeleteSelected, handleRowSelect } from '../../utils/ActivityHistoryUtils';
import AddActivity from './addActivity/AddActivity';

const ActivityHistory: React.FC = () => {
  const addActivityMutation = useAddActivity();
  const { mutate: deleteActivity } = useDeleteActivity();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const token = localStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;
  const operatorId = decodedToken?.id;

  const { data: activities = [], isLoading, error } = useFetchActivitiesByOperator(operatorId);

  if (isLoading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
  if (error) return <Typography color="error">שגיאה בטעינת הנתונים</Typography>;

const summaryByMonth = (() => {
  const monthRanges = [
    { label: 'נובמבר 24', from: new Date(2024, 9, 26), to: new Date(2024, 10, 25) },
    { label: 'דצמבר 24', from: new Date(2024, 10, 26), to: new Date(2024, 11, 25) },
    { label: 'ינואר 25', from: new Date(2024, 11, 26), to: new Date(2025, 0, 25) },
    { label: 'פברואר 25', from: new Date(2025, 0, 26), to: new Date(2025, 1, 25) },
    { label: 'מרץ 25', from: new Date(2025, 1, 26), to: new Date(2025, 2, 25) },
    { label: 'אפריל 25', from: new Date(2025, 2, 26), to: new Date(2025, 3, 25) },
    { label: 'מאי 25', from: new Date(2025, 3, 26), to: new Date(2025, 4, 25) },
    { label: 'יוני 25', from: new Date(2025, 4, 26), to: new Date(2025, 5, 25) },
  ];

  const monthly = monthRanges.map(({ label, from, to }) => {
    const count = activities.filter((a) => {
      const d = new Date(a.date);
      return d >= from && d <= to;
    }).length;
    return { label, count };
  });

  const total = activities.length;
  return [...monthly, { label: 'סה״כ הכללי', count: total }];
})();



  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" color="primary">היסטוריית הפעלות</Typography>
        <Box display="flex" gap={1}>
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
            הוסף פעילות
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleDeleteSelected(selectedRows, deleteActivity, setSelectedRows)}
            disabled={selectedRows.size === 0}
          >
            מחק נבחרים
          </Button>
        </Box>
      </Box>

<Paper sx={{ p: 2, mb: 3 }} elevation={1}>
  <Typography variant="h6" mb={2}>סיכום לפי חודשים</Typography>
  <Table size="small">
    <TableBody>
      <TableRow>
        {summaryByMonth.map(({ label }) => (
          <TableCell key={label} align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {label}
          </TableCell>
        ))}
      </TableRow>
      <TableRow>
        {summaryByMonth.map(({ label, count }) => (
          <TableCell key={label + '-count'} align="center">
            {count}
          </TableCell>
        ))}
      </TableRow>
    </TableBody>
  </Table>
</Paper>



      {activities.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center">
          עדיין לא נרשמו הפעלות.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>תאריך</TableCell>
                <TableCell>מוסד</TableCell>
                <TableCell>תיאור</TableCell>
                <TableCell>פעולה</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.has(activity._id as string)}
                      onChange={() => handleRowSelect(activity._id as string, setSelectedRows)}
                    />
                  </TableCell>
                  <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {typeof activity.classId === 'string'
                      ? activity.classId
                      : `${activity.classId?.name} (${activity.classId?.uniqueSymbol})`}
                  </TableCell>
                  <TableCell>{activity.description || '—'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => deleteActivity(activity._id as string)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

<AddActivity
  open={openDialog}
  onClose={() => setOpenDialog(false)}
  onAdd={(newActivities) => handleActivityAdded(newActivities, addActivityMutation, setOpenDialog)}
  operatorId={operatorId}
/>

    </Box>
  );
};

export default ActivityHistory;
