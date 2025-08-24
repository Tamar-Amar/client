import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AttendanceReportsPage: React.FC = () => {
  return (
    <Box sx={{ p: 4, mt: 1 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          דיווחי נוכחות
        </Typography>
        <Typography variant="body1" color="text.secondary">
          עמוד זה יהיה זמין בקרוב...
        </Typography>
      </Paper>
    </Box>
  );
};

export default AttendanceReportsPage;
