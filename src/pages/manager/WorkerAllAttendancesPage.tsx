import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, IconButton, Typography, TextField, Box, Stack, Chip, MenuItem, TablePagination, Button, Checkbox,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckIcon from '@mui/icons-material/Check';
import UploadIcon from '@mui/icons-material/Upload';
import { useFetchClasses } from '../../queries/classQueries';
import { useAttendance } from '../../queries/useAttendance';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { DocumentStatus } from '../../types/Document';
import ConfirmationDialog from '../../components/other/ConfirmationDialog';
import { useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon, Class as ClassType } from '../../types';
import UploadAttendanceDialog from '../../components/workers/UploadAttendanceDialog';

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

const ROWS_PER_PAGE = 15;

const WorkerAttendancePage: React.FC = () => {
  const { attendance: attendanceData } = useAttendance('');
  const { data: workerClasses = [] } = useFetchClasses();
  const { updateStatus, isUpdatingStatus } = useWorkerDocuments('all');
  const { data: allWorkers = [] } = useFetchAllWorkersAfterNoon();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWorkerId, setFilterWorkerId] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: () => {},
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerAfterNoon | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [studentAttendanceFile, setStudentAttendanceFile] = useState<File | null>(null);
  const [workerAttendanceFile, setWorkerAttendanceFile] = useState<File | null>(null);
  const [controlFile, setControlFile] = useState<File | null>(null);

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

  // Pagination
  const paginatedData = useMemo(() => {
    return filteredData.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredData, page]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleSelectRow = (rowKey: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
    } else {
      newSelected.add(rowKey);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allRowKeys = paginatedData.map(({ month, symbol }) => `${month}-${symbol}`);
      setSelectedRows(new Set(allRowKeys));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedRows.size === 0) {
      setConfirmationDialog({
        isOpen: true,
        title: 'אין שורות נבחרות',
        content: 'יש לבחור לפחות שורה אחת לאישור',
        onConfirm: () => setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} })
      });
      return;
    }

    const pendingDocuments: { documentId: string; status: DocumentStatus }[] = [];
    
    
    paginatedData.forEach(({ month, symbol, records }) => {
      const rowKey = `${month}-${symbol}`;
      if (selectedRows.has(rowKey)) {
        records.forEach((record) => {
          if (record.studentAttendanceDoc?.status === DocumentStatus.PENDING) {
            pendingDocuments.push({
              documentId: record.studentAttendanceDoc._id,
              status: DocumentStatus.APPROVED
            });
          }
          if (record.workerAttendanceDoc?.status === DocumentStatus.PENDING) {
            pendingDocuments.push({
              documentId: record.workerAttendanceDoc._id,
              status: DocumentStatus.APPROVED
            });
          }
          if (record.controlDoc?.status === DocumentStatus.PENDING) {
            pendingDocuments.push({
              documentId: record.controlDoc._id,
              status: DocumentStatus.APPROVED
            });
          }
        });
      }
    });

    if (pendingDocuments.length === 0) {
      setConfirmationDialog({
        isOpen: true,
        title: 'אין מסמכים ממתינים',
        content: 'אין מסמכים ממתינים לאישור בשורות שנבחרו',
        onConfirm: () => setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} })
      });
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: 'אישור מסמכים',
      content: `האם לאשר ${pendingDocuments.length} מסמכים מהשורות שנבחרו?`,
      onConfirm: async () => {
        setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
        
        try {
          
          for (const doc of pendingDocuments) {
            await updateStatus(doc);
          }
          
          setConfirmationDialog({
            isOpen: true,
            title: 'האישור הושלם בהצלחה',
            content: `אושרו ${pendingDocuments.length} מסמכים בהצלחה`,
            onConfirm: () => {
              setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
              setSelectedRows(new Set()); 
            }
          });
        } catch (error) {
          console.error('שגיאה באישור מסמכים:', error);
          setConfirmationDialog({
            isOpen: true,
            title: 'שגיאה באישור',
            content: 'שגיאה באישור המסמכים. אנא נסה שוב.',
            onConfirm: () => setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} })
          });
        }
      }
    });
  };

  const handleUploadAttendance = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedWorker(null);
    setSelectedClass(null);
    setSelectedMonth(null);
    setStudentAttendanceFile(null);
    setWorkerAttendanceFile(null);
    setControlFile(null);
  };



  return (
    <Box sx={{ p: 10 }}>
      <ConfirmationDialog
        open={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        contentText={confirmationDialog.content}
      />

      <UploadAttendanceDialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        workerId={selectedWorker?._id || ''}
        allWorkers={allWorkers}
        workerClasses={workerClasses}
        attendanceData={attendanceData}
      />

      <Stack spacing={2} direction="row" sx={{ mb: 2 }} justifyContent="space-between">
        <Stack spacing={2} direction="row">
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
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            נבחרו: {selectedRows.size} שורות
          </Typography>

          <Tooltip title="אשר את מסמכי הנוכחות הממתינים מהשורות שנבחרו">
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleApproveSelected}
              disabled={isUpdatingStatus || selectedRows.size === 0}
              sx={{ minWidth: 120 }}
            >
              אשר נבחרים
            </Button>
          </Tooltip>
          <Tooltip title="העלאת מסמכי נוכחות לעובד">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={handleUploadAttendance}
              sx={{ minWidth: 120 }}
            >
              העלאת נוכחות
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 600, minHeight: 600, overflowY: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                  checked={selectedRows.size > 0 && selectedRows.size === paginatedData.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סמל קבוצה</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>חודש</TableCell>
              
              <TableCell sx={{ fontWeight: 'bold' }}>נוכחות תלמידים</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>נוכחות עובדים</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>בקרה</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>שם עובד</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    לא נמצאו דיווחי נוכחות
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(({ month, symbol, records }) => {
                const record = records[0];
                const status = getStatus(record);
                const workerId = record?.workerId || '';
                const fullName = typeof workerId === 'object'
                  ? `${workerId.firstName || ''} ${workerId.lastName || ''} (${workerId.id || ''})`
                  : workerId;
                  
                const studentDoc = record?.studentAttendanceDoc;
                const workerDoc = record?.workerAttendanceDoc;
                const controlDoc = record?.controlDoc;
                const rowKey = `${month}-${symbol}`;
                const isSelected = selectedRows.has(rowKey);
                
                return (
                  <TableRow key={month + symbol} selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowKey)}
                      />
                    </TableCell>
                    <TableCell>{symbol}</TableCell>
                    <TableCell>{month}</TableCell>
                    <TableCell>
                      {studentDoc ? (
                        <Tooltip title="צפייה במסמך תלמידים">
                          <IconButton onClick={() => window.open(studentDoc.url, '_blank')} size="small">
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workerDoc ? (
                        <Tooltip title="צפייה במסמך עובדים">
                          <IconButton onClick={() => window.open(workerDoc.url, '_blank')} size="small">
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {controlDoc ? (
                        <Tooltip title="צפייה במסמך בקרה">
                          <IconButton onClick={() => window.open(controlDoc.url, '_blank')} size="small">
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
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
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={ROWS_PER_PAGE}
        rowsPerPageOptions={[ROWS_PER_PAGE]}
        labelRowsPerPage="שורות בעמוד:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
      />
    </Box>
  );
};

export default WorkerAttendancePage;
