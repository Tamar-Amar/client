import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, IconButton, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useFetchClasses } from '../queries/classQueries';
import { useAttendance } from '../queries/useAttendance';

interface AttendanceRecord {
  _id: string;
  workerId: string;
  classId: string | { _id: string; name?: string; uniqueSymbol?: string };
  month: string;
  studentAttendanceDoc: any;
  workerAttendanceDoc: any;
  controlDoc: any;
}

interface Class {
  _id: string;
  name: string;
  uniqueSymbol: string;
}


const WorkerAttendancePage: React.FC = () => {
    const { attendance: attendanceData, isLoading } = useAttendance('');
    const { data: workerClasses = [] } = useFetchClasses();
  const grouped: { [month: string]: { [symbol: string]: AttendanceRecord[] } } = {};
  attendanceData.forEach((record: AttendanceRecord) => {
    const month = new Date(record.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
    const classObj = typeof record.classId === 'object' ? record.classId : workerClasses.find((c: Class) => c._id === record.classId);
    const symbol = classObj?.uniqueSymbol || '---';
    if (!grouped[month]) grouped[month] = {};
    if (!grouped[month][symbol]) grouped[month][symbol] = [];
    grouped[month][symbol].push(record);
  });

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>חודש</TableCell>
            <TableCell>קבוצה/סמל</TableCell>
            <TableCell>מסמכים</TableCell>
            <TableCell>סטטוס</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(grouped).map(([month, symbols]) =>
            Object.entries(symbols).map(([symbol, records]) => {
              const docs = [
                records[0]?.studentAttendanceDoc,
                records[0]?.workerAttendanceDoc,
                records[0]?.controlDoc
              ].filter(Boolean);
              const isOk = docs.length >= 2;
              return (
                <TableRow key={month + symbol}>
                  <TableCell>{month}</TableCell>
                  <TableCell>{symbol}</TableCell>
                  <TableCell>
                    {docs.map((doc: any, idx: number) => (
                      <Tooltip key={doc?._id || idx} title="צפייה במסמך">
                        <IconButton onClick={() => window.open(doc.url, '_blank')}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </TableCell>
                  <TableCell>
                    {isOk ? (
                      <Typography color="success.main">תקין</Typography>
                    ) : (
                      <Tooltip title="חסרים מסמכי נוכחות">
                        <WarningAmberIcon color="warning" />
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WorkerAttendancePage;
