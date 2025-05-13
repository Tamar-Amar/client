import React from 'react';
import { Box, TextField, Button, Autocomplete } from '@mui/material';
import { Operator } from '../../types';

interface AttendanceReportProps {
  attendanceMonth: string;
  setAttendanceMonth: (month: string) => void;
  operatorId: string;
  setOperatorId: (id: string) => void;
  handleDownloadAttendanceReport: () => void;
  operators: Operator[];
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({
  attendanceMonth,
  setAttendanceMonth,
  operatorId,
  setOperatorId,
  handleDownloadAttendanceReport,
  operators
}) => {
  return (
    <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2, mb: 2 }}>
      <TextField
        label="בחר חודש לדוח נוכחות"
        type="month"
        value={attendanceMonth}
        onChange={(e) => setAttendanceMonth(e.target.value)}
        sx={{ width: '100%', mb: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      <Autocomplete
        options={operators}
        getOptionLabel={(option: Operator) => `${option.firstName} ${option.lastName}`}
        onChange={(_, newValue) => setOperatorId(newValue?._id ?? '')}
        renderInput={(params) => (
          <TextField {...params} label="בחר מפעיל" sx={{ width: '100%', mb: 2 }} />
        )}
      />

      <Button
        variant="contained"
        color="secondary"
        onClick={handleDownloadAttendanceReport}
        fullWidth
        disabled={!attendanceMonth}
      >
        {operatorId ? 'יצירת דוח מותאם מפעיל' : 'יצירת דוח ריק'}
      </Button>
    </Box>
  );
};

export default AttendanceReport;
