import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, IconButton, Typography, TextField, Box, Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/Warning';
import { useFetchClasses } from '../queries/classQueries';
import { useAttendance } from '../queries/useAttendance';
import { useFetchWorkers } from '../queries/workerQueries';

interface AttendanceRecord {
  _id: string;
  workerId: string | { _id: string; firstName?: string; lastName?: string; id?: string };
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

const getDocLabel = (index: number) => {
  switch (index) {
    case 0: return 'תלמידים';
    case 1: return 'עובדים';
    case 2: return 'בקרה';
    default: return '';
  }
};

const WorkerAttendancePage: React.FC = () => {
  const { attendance: attendanceData, isLoading } = useAttendance('');
  const { data: workerClasses = [] } = useFetchClasses();
  const { data: workers = [] } = useFetchWorkers();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWorkerId, setFilterWorkerId] = useState('');

  const grouped: { [month: string]: { [symbol: string]: AttendanceRecord[] } } = {};
  attendanceData.forEach((record: AttendanceRecord) => {
    const month = new Date(record.month).toLocaleString('he-IL', { year: 'numeric', month: 'long' });
    const classObj = typeof record.classId === 'object' ? record.classId : workerClasses.find((c: Class) => c._id === record.classId);
    const symbol = classObj?.uniqueSymbol + ' ' + classObj?.name || '---';
    if (!grouped[month]) grouped[month] = {};
    if (!grouped[month][symbol]) grouped[month][symbol] = [];
    grouped[month][symbol].push(record);
  });

  const filteredData = useMemo(() => {
    return Object.entries(grouped)
      .filter(([month]) => !filterMonth || month.includes(filterMonth))
      .flatMap(([month, symbols]) =>
        Object.entries(symbols)
          .filter(([symbol]) => symbol.includes(searchTerm))
          .flatMap(([symbol, records]) => {
            if (filterWorkerId && !records[0].workerId.toString().includes(filterWorkerId)) return [];
            return [{ month, symbol, records }];
          })
      );
  }, [grouped, searchTerm, filterMonth, filterWorkerId]);

  return (
    <Box sx={{ m: 5 }}>
      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <TextField
          label="חיפוש לפי סמל"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
        <TextField
          label="סינון לפי חודש"
          variant="outlined"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          size="small"
        />
        <TextField
          label="סינון לפי מזהה עובד"
          variant="outlined"
          value={filterWorkerId}
          onChange={(e) => setFilterWorkerId(e.target.value)}
          size="small"
        />
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>חודש</TableCell>
              <TableCell>סמל קבוצה</TableCell>
              <TableCell>מסמכים</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>מזהה עובד</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map(({ month, symbol, records }) => {
              const docs = [
                records[0]?.studentAttendanceDoc,
                records[0]?.workerAttendanceDoc,
                records[0]?.controlDoc
              ];
              const isOk = docs.filter(Boolean).length >= 2;
              const workerId = records[0]?.workerId || '';

              return (
                <TableRow key={month + symbol}>
                  <TableCell>{month}</TableCell>
                  <TableCell>{symbol} </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {docs.map((doc, idx) =>
                        doc ? (
                          <Tooltip key={doc._id || idx} title={`צפייה במסמך (${getDocLabel(idx)})`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton onClick={() => window.open(doc.url, '_blank')}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="caption">{getDocLabel(idx)}</Typography>
                            </Box>
                          </Tooltip>
                        ) : null
                      )}
                    </Stack>
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
                  <TableCell>{typeof workerId === 'object' ? workerId.id+' '+ workerId.firstName + ' ' + workerId.lastName : workerId}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkerAttendancePage;
