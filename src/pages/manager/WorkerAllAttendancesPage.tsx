import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, IconButton, Typography, TextField, Box, Stack, Chip, MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useFetchClasses } from '../../queries/classQueries';
import { useAttendance } from '../../queries/useAttendance';
import { DocumentStatus } from '../../types/Document';

interface AttendanceDocument {
  _id: string;
  url: string;
  status: DocumentStatus;
}

interface AttendanceRecord {
  _id: string;
  workerId: string | { 
    _id: string; 
    firstName?: string; 
    lastName?: string; 
    id?: string;
    isAfterNoon?: boolean;
    isHanukkah?: boolean;
    isPassover?: boolean;
    isSummer?: boolean;
  };
  classId: string | { _id: string; name?: string; uniqueSymbol?: string };
  month: string;
  studentAttendanceDoc: AttendanceDocument | null;
  workerAttendanceDoc: AttendanceDocument | null;
  controlDoc: AttendanceDocument | null;
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

const projectOptions = [
    { value: '', label: 'כל הפרויקטים' },
    { value: 'isAfterNoon', label: 'צהרון' },
    { value: 'isHanukkah', label: 'קייטנת חנוכה' },
    { value: 'isPassover', label: 'קייטנת פסח' },
    { value: 'isSummer', label: 'קייטנת קיץ' },
];

const getStatus = (record: AttendanceRecord) => {
  const { studentAttendanceDoc, workerAttendanceDoc } = record;
  
  if (!studentAttendanceDoc || !workerAttendanceDoc) {
    return { text: 'חסר מסמכים', color: 'warning' as const, icon: <WarningIcon fontSize="small" /> };
  }
  
  const docs = [studentAttendanceDoc, workerAttendanceDoc];
  
  if (docs.some(doc => doc.status === DocumentStatus.REJECTED || doc.status === DocumentStatus.EXPIRED)) {
    return { text: 'נדחה', color: 'error' as const, icon: <CancelIcon fontSize="small" /> };
  }

  if (docs.every(doc => doc.status === DocumentStatus.APPROVED)) {
    return { text: 'תקין', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
  }
  
  return { text: 'ממתין לאישור', color: 'primary' as const, icon: <HourglassEmptyIcon fontSize="small" /> };
};

const WorkerAttendancePage: React.FC = () => {
  const { attendance: attendanceData, isLoading } = useAttendance('');
  const { data: workerClasses = [] } = useFetchClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWorkerId, setFilterWorkerId] = useState('');
  const [filterProject, setFilterProject] = useState('');

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
          .filter(([symbol]) => symbol.toLowerCase().includes(searchTerm.toLowerCase()))
          .flatMap(([symbol, records]) => {
            const worker = records[0]?.workerId;
            const workerIdString = typeof worker === 'object' ? worker?.id || '' : worker.toString();
            
            if (filterWorkerId && !workerIdString.includes(filterWorkerId)) return [];

            if (filterProject && typeof worker === 'object' && worker !== null) {
              if (!worker[filterProject as keyof typeof worker]) {
                return [];
              }
            }
            
            return [{ month, symbol, records }];
          })
      );
  }, [grouped, searchTerm, filterMonth, filterWorkerId, filterProject]);

  return (
    <Box sx={{ p: 10}}>
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
          label="סינון לפי ת.ז עובד"
          variant="outlined"
          value={filterWorkerId}
          onChange={(e) => setFilterWorkerId(e.target.value)}
          size="small"
        />
        <TextField
          select
          label="סינון לפי פרויקט"
          variant="outlined"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {projectOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 600, overflowY: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>חודש</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סמל קבוצה</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>מסמכים</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>שם עובד</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    לא נמצאו דיווחי נוכחות
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(({ month, symbol, records }) => {
                const record = records[0];
                const docs = [
                  record?.studentAttendanceDoc,
                  record?.workerAttendanceDoc,
                  record?.controlDoc
                ];
                const status = getStatus(record);
                const workerId = record?.workerId || '';
                const fullName = typeof workerId === 'object'
                  ? `${workerId.firstName || ''} ${workerId.lastName || ''} (${workerId.id || ''})`
                  : workerId;

                return (
                  <TableRow key={month + symbol}>
                    <TableCell>{month}</TableCell>
                    <TableCell>{symbol}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {docs.map((doc, idx) =>
                          doc ? (
                            <Tooltip key={doc._id || idx} title={`צפייה במסמך (${getDocLabel(idx)})`}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton onClick={() => window.open(doc.url, '_blank')} size="small">
                                  <VisibilityIcon fontSize="inherit" />
                                </IconButton>
                                <Typography variant="caption">{getDocLabel(idx)}</Typography>
                              </Box>
                            </Tooltip>
                          ) : null
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={status.icon}
                        label={status.text} 
                        color={status.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{fullName}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
};

export default WorkerAttendancePage;
