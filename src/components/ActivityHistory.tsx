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
  CircularProgress,
  Typography,
  Box,
  Button,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFetchActivitiesByOperator, useDeleteActivity, useAddActivity } from '../queries/activitiesQueries';
import { jwtDecode } from 'jwt-decode';
import AddActivity from './ActvitiesCreate';
import { handleActivityAdded, handleDeleteSelected, handleRowSelect } from '../utils/ActivityHistoryUtils';
import { useQueryClient } from '@tanstack/react-query';

const ActivityHistory: React.FC = () => {
  


  const addActivityMutation = useAddActivity();
  const { mutate: deleteActivity } = useDeleteActivity();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const token = localStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;
  const operatorId = decodedToken?.id;

  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, error } = useFetchActivitiesByOperator(operatorId);

  if (isLoading) return <CircularProgress />;
  if (error) return <div>שגיאה בטעינת הנתונים</div>;

  if (activities.length === 0) {
    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">היסטוריית הפעלות</Typography>
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
            הוסף פעילות
          </Button>
        </Box>
        <Typography variant="h6" align="center" color="textSecondary">
          עדיין לא נרשמו הפעלות.
        </Typography>
        <AddActivity
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onAdd={(newActivities) => handleActivityAdded(newActivities, addActivityMutation, setOpenDialog)}
          defaultOperatorId={operatorId}
        />
      </>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>תאריך</TableCell>
              <TableCell>מוסד</TableCell>
              <TableCell>תיאור</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity._id as string}>
                <TableCell>
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
                <TableCell>{activity.description}</TableCell>
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

      <AddActivity
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onAdd={(newActivities) => handleActivityAdded(newActivities, addActivityMutation, setOpenDialog)}
        defaultOperatorId={operatorId}
      />
    </>
  );
};

export default ActivityHistory;
