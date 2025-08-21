import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, IconButton, Typography, TextField, Box, Stack, Chip, MenuItem, TablePagination, Button, Checkbox,
} from '@mui/material';
import { Link } from 'react-router-dom';
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
import { WorkerAfterNoon} from '../../types';
import UploadAttendanceDialog from '../../components/workers/UploadAttendanceDialog';
import { useAllCampAttendanceReports } from '../../queries/useCampAttendance';
import { useUpdateAttendanceDocumentStatus } from '../../queries/useAttendanceDocumentStatus';

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
    projectCodes?: number[];
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
    { value: '1', label: 'צהרון שוטף 2025' },
    { value: '2', label: 'קייטנת חנוכה 2025' },
    { value: '3', label: 'קייטנת פסח 2025' },
    { value: '4', label: 'קייטנת קיץ 2025' },
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
              if (!worker.projectCodes || !worker.projectCodes.includes(parseInt(filterProject))) {
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

// דף חדש לדוחות נוכחות קייטנת קיץ
export const CampAttendancePage: React.FC = () => {
  const { data: campAttendanceData = [] } = useAllCampAttendanceReports();
  const { mutate: updateDocumentStatus, isPending: isUpdatingStatus } = useUpdateAttendanceDocumentStatus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    content: '',
    onConfirm: () => {},
  });

  const ROWS_PER_PAGE = 15;

  // פונקציה לקבלת סטטוס מסמך
  const getDocumentStatus = (doc: any) => {
    if (!doc) return { text: 'חסר', color: 'error' as const, icon: <WarningIcon fontSize="small" /> };
    
    switch (doc.status) {
      case 'PENDING':
        return { text: 'ממתין', color: 'warning' as const, icon: <HourglassEmptyIcon fontSize="small" /> };
      case 'REJECTED':
        return { text: 'נדחה', color: 'error' as const, icon: <CancelIcon fontSize="small" /> };
      case 'APPROVED':
        return { text: 'מאושר', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
      default:
        return { text: 'לא ידוע', color: 'default' as const, icon: <WarningIcon fontSize="small" /> };
    }
  };

  // פונקציה לקבלת שם המוביל או הרכז
  const getLeaderOrCoordinatorName = (record: any) => {
    if (record.classId?.type === 'גן') {
      // לגן - שם המוביל (לחיץ)
      return record.leaderId ? 
        `${record.leaderId.firstName || ''} ${record.leaderId.lastName || ''} (${record.leaderId.id || ''})` : 
        'לא נמצא';
    } else {
      // לכיתה - שם הרכז (לא לחיץ, בלי סוגריים)
      return record.coordinatorId ? 
        `${record.coordinatorId.firstName || ''} ${record.coordinatorId.lastName || ''}` : 
        'לא נמצא';
    }
  };

  // פונקציה לבדיקה אם זה מוביל (לחיץ) או רכז (לא לחיץ)
  const isLeader = (record: any) => {
    return record.classId?.type === 'גן';
  };

  // פונקציה לקבלת סמל המסגרת
  const getClassSymbol = (record: any) => {
    if (record.classId) {
      return `${record.classId.uniqueSymbol || ''} ${record.classId.name || ''}`;
    }
    return 'לא נמצא';
  };

  // פונקציה לבדיקה אם יש מסמכים
  const hasAnyDocuments = (record: any) => {
    return record.workerAttendanceDoc || record.studentAttendanceDoc || 
           (record.controlDocs && record.controlDocs.length > 0);
  };

  // פונקציה לעדכון סטטוס מסמך
  const handleUpdateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      updateDocumentStatus({ documentId, status: newStatus });
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס:', error);
    }
  };

  // סינון הנתונים
  const filteredData = useMemo(() => {
    return campAttendanceData
      .filter((record: any) => record.projectCode === 4) // רק קייטנת קיץ 2025
      .filter((record: any) => {
        const classSymbol = getClassSymbol(record);
        return classSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [campAttendanceData, searchTerm]);

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
      const allRowKeys = paginatedData.map((record: any) => record._id);
      setSelectedRows(new Set(allRowKeys));
    }
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

      <Stack spacing={2} direction="row" sx={{ mb: 2 }} justifyContent="space-between">
        <Stack spacing={2} direction="row">
          <TextField
            label="חיפוש לפי סמל"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
        </Stack>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            נבחרו: {selectedRows.size} שורות
          </Typography>
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
              <TableCell sx={{ fontWeight: 'bold' }}>סמל מסגרת</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>מוביל/רכז</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>חודש</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>נוכחות עובדים</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>נוכחות תלמידים</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>דוחות בקרה</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    לא נמצאו דוחות נוכחות קייטנה
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record: any) => {
                const hasDocuments = hasAnyDocuments(record);
                const classSymbol = getClassSymbol(record);
                const leaderOrCoordinatorName = getLeaderOrCoordinatorName(record);
                const month = new Date(record.month + '-01').toLocaleString('he-IL', { year: 'numeric', month: 'long' });
                const isSelected = selectedRows.has(record._id);
                
                return (
                  <TableRow 
                    key={record._id} 
                    selected={isSelected}
                    sx={{ backgroundColor: !hasDocuments ? 'grey.100' : 'inherit' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(record._id)}
                      />
                    </TableCell>
                    <TableCell>{classSymbol}</TableCell>
                    <TableCell>
                      {isLeader(record) ? (
                        <Link 
                          to={`/worker/${record.leaderId._id}`}
                          style={{ 
                            textDecoration: 'none', 
                            color: 'inherit',
                            fontWeight: 'bold'
                          }}
                        >
                          {leaderOrCoordinatorName}
                        </Link>
                      ) : (
                        <Typography>{leaderOrCoordinatorName}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{month}</TableCell>
                    <TableCell>
                      {record.workerAttendanceDoc ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="צפייה במסמך">
                            <IconButton 
                              size="small"
                              onClick={() => window.open(record.workerAttendanceDoc.url, '_blank')}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {record.workerAttendanceDoc.status === 'PENDING' && (
                            <>
                              <Tooltip title="אשר מסמך">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleUpdateDocumentStatus(record.workerAttendanceDoc._id, 'APPROVED')}
                                  disabled={isUpdatingStatus}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="דחה מסמך">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleUpdateDocumentStatus(record.workerAttendanceDoc._id, 'REJECTED')}
                                  disabled={isUpdatingStatus}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {record.workerAttendanceDoc.status !== 'PENDING' && (
                            <Chip 
                              icon={getDocumentStatus(record.workerAttendanceDoc).icon}
                              label={getDocumentStatus(record.workerAttendanceDoc).text} 
                              color={getDocumentStatus(record.workerAttendanceDoc).color}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.studentAttendanceDoc ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="צפייה במסמך">
                            <IconButton 
                              size="small"
                              onClick={() => window.open(record.studentAttendanceDoc.url, '_blank')}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {record.studentAttendanceDoc.status === 'PENDING' && (
                            <>
                              <Tooltip title="אשר מסמך">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleUpdateDocumentStatus(record.studentAttendanceDoc._id, 'APPROVED')}
                                  disabled={isUpdatingStatus}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="דחה מסמך">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleUpdateDocumentStatus(record.studentAttendanceDoc._id, 'REJECTED')}
                                  disabled={isUpdatingStatus}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {record.studentAttendanceDoc.status !== 'PENDING' && (
                            <Chip 
                              icon={getDocumentStatus(record.studentAttendanceDoc).icon}
                              label={getDocumentStatus(record.studentAttendanceDoc).text} 
                              color={getDocumentStatus(record.studentAttendanceDoc).color}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.controlDocs && record.controlDocs.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {record.controlDocs.map((doc: any, index: number) => (
                            <Box key={doc._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption">דוח {index + 1}:</Typography>
                              <Tooltip title="צפייה במסמך">
                                <IconButton 
                                  size="small"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status === 'PENDING' && (
                                <>
                                  <Tooltip title="אשר מסמך">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleUpdateDocumentStatus(doc._id, 'APPROVED')}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה מסמך">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleUpdateDocumentStatus(doc._id, 'REJECTED')}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {doc.status !== 'PENDING' && (
                                <Chip 
                                  icon={getDocumentStatus(doc).icon}
                                  label={getDocumentStatus(doc).text} 
                                  color={getDocumentStatus(doc).color}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="error.main">חסר</Typography>
                      )}
                    </TableCell>
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
