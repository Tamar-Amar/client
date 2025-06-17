import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { WorkerAfterNoon } from '../../types';

interface WorkerPersonalDetailsProps {
  workerData: WorkerAfterNoon | undefined;
}

const WorkerPersonalDetails: React.FC<WorkerPersonalDetailsProps> = ({ workerData }) => {
  if (!workerData) return null;
  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>פרטים אישיים</Typography>
      <Stack spacing={2}>
        <Typography><strong>שם מלא:</strong> {workerData.lastName} {workerData.firstName}</Typography>
        <Typography><strong>תעודת זהות:</strong> {workerData.id}</Typography>
        <Typography><strong>טלפון:</strong> {workerData.phone}</Typography>
        <Typography><strong>אימייל:</strong> {workerData.email}</Typography>
        <Typography><strong>סטטוס:</strong> {workerData.status}</Typography>
        <Typography><strong>סוג תפקיד:</strong> {workerData.roleType}</Typography>
        <Typography><strong>שם תפקיד:</strong> {workerData.roleName}</Typography>
        <Typography><strong>חשב שכר:</strong> {workerData.accountantCode}</Typography>
        <Typography><strong>פרויקט:</strong> {workerData.project}</Typography>
        <Typography><strong>הערות:</strong> {workerData.notes}</Typography>
      </Stack>
    </Box>
  );
};

export default WorkerPersonalDetails; 