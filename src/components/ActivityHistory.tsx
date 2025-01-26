import React from 'react';
import { useFetchActivitiesByOperator, useDeleteActivity } from '../queries/activitiesQueries';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import jwtDecode from 'jwt-decode'; // לשימוש אם הטוקן מכיל את ה-operatorId

const ActivityHistory: React.FC = () => {
  const token = localStorage.getItem('token');
  const decodedToken: any = jwtDecode(token || ''); // פענוח הטוקן
  const operatorId = decodedToken?.id;

  const { data: activities = [], isLoading, error } = useFetchActivitiesByOperator(operatorId);
  const { mutate: deleteActivity } = useDeleteActivity();

  if (isLoading) return <CircularProgress />;
  if (error) return <div>שגיאה בטעינת הנתונים</div>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>תאריך</TableCell>
            <TableCell>מוסד</TableCell>
            <TableCell>תיאור</TableCell>
            <TableCell>פעולות</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity._id as string}>
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
  );
};

export default ActivityHistory;
