import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Tooltip,
  IconButton,
  CircularProgress,
  Autocomplete,
  Divider,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useFetchClasses } from '../queries/classQueries';
import { useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import { useFetchAllUsers } from '../queries/useUsers';
import { useUpdateAttendanceDocumentStatus } from '../queries/useAttendanceDocumentStatus';
import { Class, WorkerAfterNoon } from '../types';
import { useAllCampAttendanceReports } from '../queries/useCampAttendance';

const PROJECT_CODE = 4; 

const statusTabs = [
  { value: '', label: 'הכל' },
  { value: 'ממתין', label: 'ממתינים' },
  { value: 'מאושר', label: 'מאושרים' },
  { value: 'נדחה', label: 'נדחו' }
];

const SummerCampAttendancePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstitutionCode, setFilterInstitutionCode] = useState('');
  const [filterClassCode, setFilterClassCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tabStatus, setTabStatus] = useState('');
  
  const [controlDocsDialog, setControlDocsDialog] = useState<{
    open: boolean;
    documents: any[];
    row: any;
  }>({
    open: false,
    documents: [],
    row: null
  });

  const { data: campAttendance = [], isLoading: loadingAttendance } = useAllCampAttendanceReports(); 
  const { data: classes = [], isLoading: loadingClasses } = useFetchClasses();
  const { data: workers = [], isLoading: loadingWorkers } = useFetchAllWorkersAfterNoon();
  const { data: users = [], isLoading: loadingUsers } = useFetchAllUsers();

  const summerClasses = useMemo(() => classes.filter((cls: Class) => Array.isArray(cls.projectCodes) && cls.projectCodes.includes(PROJECT_CODE)), [classes]);

  const institutionOptions = useMemo(() => {
    const codes = new Set<string>();
    summerClasses.forEach((cls: Class) => {
      if (cls.institutionCode) codes.add(cls.institutionCode);
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(codes).sort().map(code => ({ value: code, label: code }))
    ];
  }, [summerClasses]);

  const classCodeOptions = useMemo(() => {
    const classMap = new Map<string, { symbol: string; name: string }>();
    summerClasses.forEach((cls: Class) => {
      if (cls.uniqueSymbol && cls.name) {
        classMap.set(cls.uniqueSymbol, { symbol: cls.uniqueSymbol, name: cls.name });
      }
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map(classItem => ({ value: classItem.symbol, label: `${classItem.symbol} - ${classItem.name}` }))
    ];
  }, [summerClasses]);

  const accountantUserOptions = useMemo(() => {
    return [
      { value: '', label: 'כל חשבי השכר', accountant: null },
      ...users
        .filter((u: any) => u.role === 'accountant')
        .map((u: any) => ({
          value: u._id,
          label: `${u.firstName} ${u.lastName}`,
          accountant: u
        }))
    ];
  }, [users]);
  const [filterAccountant, setFilterAccountant] = useState('');

  const tableData = useMemo(() => {
    return campAttendance
      .filter((row: any) => row.projectCode === PROJECT_CODE)
      .filter((row: any) => {
        if (searchTerm) {
          const cls = classes.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
          const leader = workers.find((w: WorkerAfterNoon) => w._id === row.leaderId?._id || w._id === row.leaderId);
          return (
            (cls?.name?.includes(searchTerm) || cls?.uniqueSymbol?.includes(searchTerm) || cls?.institutionName?.includes(searchTerm) || leader?.firstName?.includes(searchTerm) || leader?.lastName?.includes(searchTerm))
          );
        }
        return true;
      })
      .filter((row: any) => {
        if (filterInstitutionCode) {
          const cls = classes.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
          return cls?.institutionCode === filterInstitutionCode;
        }
        return true;
      })
      .filter((row: any) => {
        if (filterClassCode) {
          const cls = classes.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
          return cls?.uniqueSymbol === filterClassCode;
        }
        return true;
      })
      .filter((row: any) => {
        const statusToCheck = tabStatus || filterStatus;
        if (statusToCheck) {
          const status = row.workerAttendanceDoc?.status;
          return status === statusToCheck;
        }
        return true;
      });
  }, [campAttendance, classes, workers, searchTerm, filterInstitutionCode, filterClassCode, filterStatus, tabStatus]);

  const filteredTableData = useMemo(() => {
    return tableData.filter((row: any) => {
      if (!filterAccountant) return true;
      const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
      if (!accountant || !Array.isArray(accountant.accountantInstitutionCodes)) return false;
      const cls = classes.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
      return cls && accountant.accountantInstitutionCodes.includes(cls.institutionCode);
    });
  }, [tableData, filterAccountant, users, classes]);

  const classIdsWithAttendance = useMemo(() => new Set(campAttendance.map((row: any) => (row.classId?._id || row.classId))), [campAttendance]);

  const filteredSummerClasses = useMemo(() => {
    return summerClasses.filter((cls: Class) => {
      if (filterInstitutionCode && cls.institutionCode !== filterInstitutionCode) return false;
      if (filterClassCode && cls.uniqueSymbol !== filterClassCode) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        let leaderName = '';
        const leaderUser = users.find((u: any) => u.role === 'worker' && cls.workers?.some((w: any) => w.workerId === u._id && w.roleType?.includes('מוביל')));
        if (leaderUser) leaderName = `${leaderUser.firstName} ${leaderUser.lastName}`;
        if (!(
          cls.name?.toLowerCase().includes(searchLower) ||
          cls.uniqueSymbol?.toLowerCase().includes(searchLower) ||
          cls.institutionCode?.toLowerCase().includes(searchLower) ||
          leaderName.toLowerCase().includes(searchLower)
        )) return false;
      }
      return true;
    });
  }, [summerClasses, filterInstitutionCode, filterClassCode, searchTerm, users]);

  const classesWithoutAttendance = useMemo(() => {
    return filteredSummerClasses.filter((cls: Class) => {
      if (!classIdsWithAttendance.has(cls._id)) {
        if (!filterAccountant) return true;
        const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
        if (!accountant || !Array.isArray(accountant.accountantInstitutionCodes)) return false;
        return accountant.accountantInstitutionCodes.includes(cls.institutionCode);
      }
      return false;
    });
  }, [filteredSummerClasses, classIdsWithAttendance, filterAccountant, users]);

  const reported = useMemo(() => {
    return filteredTableData
      .map((row: any) => {
        const cls = filteredSummerClasses.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
        return cls ? { ...row, _class: cls } : null;
      })
      .filter(Boolean);
  }, [filteredTableData, filteredSummerClasses]);

  const fullTableData = useMemo(() => {
    const missing = classesWithoutAttendance.map((cls: Class) => ({
      _id: 'missing-' + cls._id,
      classId: cls._id,
      _class: cls,
      leaderId: null,
      workerAttendanceDoc: null,
      studentAttendanceDoc: null,
      controlDocs: [],
      missing: true
    }));
    let allRows = [...reported, ...missing];
    if (filterStatus === 'חסר') {
      allRows = allRows.filter(row => row.missing);
    } else if (filterStatus) {
      allRows = allRows.filter(row => {
        if (row.missing) return false;
        const docs = [row.workerAttendanceDoc, row.studentAttendanceDoc, ...(row.controlDocs || [])];
        return docs.some(doc => doc && doc.status === filterStatus);
      });
    }
    return allRows.sort((a, b) => {
      const aSymbol = a._class?.uniqueSymbol || '';
      const bSymbol = b._class?.uniqueSymbol || '';
      return aSymbol.localeCompare(bSymbol, 'he');
    });
  }, [reported, classesWithoutAttendance, filterStatus]);

  const stats = useMemo(() => {
    let total = 0, pending = 0, approved = 0, rejected = 0;
    campAttendance.forEach((row: any) => {
      if (row.projectCode !== PROJECT_CODE) return;
      if (row.workerAttendanceDoc) {
        total++;
        if (row.workerAttendanceDoc.status === 'ממתין') pending++;
        else if (row.workerAttendanceDoc.status === 'מאושר') approved++;
        else if (row.workerAttendanceDoc.status === 'נדחה') rejected++;
      }
      if (row.studentAttendanceDoc) {
        total++;
        if (row.studentAttendanceDoc.status === 'ממתין') pending++;
        else if (row.studentAttendanceDoc.status === 'מאושר') approved++;
        else if (row.studentAttendanceDoc.status === 'נדחה') rejected++;
      }
      if (Array.isArray(row.controlDocs)) {
        row.controlDocs.forEach((doc: any) => {
          total++;
          if (doc.status === 'ממתין') pending++;
          else if (doc.status === 'מאושר') approved++;
          else if (doc.status === 'נדחה') rejected++;
        });
      }
    });
    return { total, pending, approved, rejected };
  }, [campAttendance]);

  const [page, setPage] = useState(0);
  const rowsPerPage = 18;
  const paginatedData = useMemo(() => fullTableData.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [fullTableData, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterInstitutionCode, filterClassCode, filterStatus, filterAccountant]);

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateAttendanceDocumentStatus();

  const handleViewDocument = async (docId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/attendance/document/${docId}/url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        console.error('שגיאה ביצירת URL למסמך');
      }
    } catch (error) {
      console.error('שגיאה ביצירת URL למסמך:', error);
    }
  };

  const handleApprove = (row: any) => {
    let docId = null;
    if (row.docType === 'workerAttendanceDoc' && row.workerAttendanceDoc?._id) docId = row.workerAttendanceDoc._id;
    else if (row.docType === 'studentAttendanceDoc' && row.studentAttendanceDoc?._id) docId = row.studentAttendanceDoc._id;
    else if (row.docType === 'controlDocs' && row.controlDocs && typeof row.docIndex === 'number' && row.controlDocs[row.docIndex]?._id) docId = row.controlDocs[row.docIndex]._id;
    if (docId) updateStatus({ documentId: docId, status: 'מאושר' });
  };
  const handleReject = (row: any) => {
    let docId = null;
    if (row.docType === 'workerAttendanceDoc' && row.workerAttendanceDoc?._id) docId = row.workerAttendanceDoc._id;
    else if (row.docType === 'studentAttendanceDoc' && row.studentAttendanceDoc?._id) docId = row.studentAttendanceDoc._id;
    else if (row.docType === 'controlDocs' && row.controlDocs && typeof row.docIndex === 'number' && row.controlDocs[row.docIndex]?._id) docId = row.controlDocs[row.docIndex]._id;
    if (docId) updateStatus({ documentId: docId, status: 'נדחה' });
  };

  const handleViewControlDocuments = (controlDocs: any[], row: any) => {
    setControlDocsDialog({
      open: true,
      documents: controlDocs,
      row: row
    });
  };

  const handleCloseControlDocsDialog = () => {
    setControlDocsDialog({
      open: false,
      documents: [],
      row: null
    });
  };

  const handleApproveSingleDoc = (doc: any) => {
    updateStatus({ documentId: doc._id, status: 'מאושר' });
  };

  const handleRejectSingleDoc = (doc: any) => {
    updateStatus({ documentId: doc._id, status: 'נדחה' });
  };

  if (loadingAttendance || loadingClasses || loadingWorkers || loadingUsers) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 4 }}>


      <Paper sx={{ p: 4, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          label="חיפוש חופשי"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <Autocomplete
          size="small"
          options={institutionOptions}
          getOptionLabel={(option) => option.label}
          value={institutionOptions.find(opt => opt.value === filterInstitutionCode) || null}
          onChange={(_, newValue) => setFilterInstitutionCode(newValue?.value || '')}
          renderInput={(params) => <TextField {...params} label="קוד מוסד" />}
          sx={{ minWidth: 180 }}
        />
        <Autocomplete
          size="small"
          options={classCodeOptions}
          getOptionLabel={(option) => option.label}
          value={classCodeOptions.find(opt => opt.value === filterClassCode) || null}
          onChange={(_, newValue) => setFilterClassCode(newValue?.value || '')}
          renderInput={(params) => <TextField {...params} label="סמל כיתה" />}
          sx={{ minWidth: 180 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>סטטוס</InputLabel>
          <Select value={filterStatus} label="סטטוס" onChange={e => setFilterStatus(e.target.value)}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="ממתין">ממתין</MenuItem>
            <MenuItem value="מאושר">מאושר</MenuItem>
            <MenuItem value="נדחה">נדחה</MenuItem>
            <MenuItem value="חסר">חסר</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>חשב שכר</InputLabel>
          <Select
            value={filterAccountant}
            label="חשב שכר"
            onChange={e => setFilterAccountant(e.target.value)}
          >
            {accountantUserOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Grid container spacing={2}>

        <Grid item xs={12} md={2} lg={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pr: 1 }}>
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Card sx={{ minWidth: 60, p: 0.5, boxShadow: 1, borderRight: 3, borderColor: 'primary.main' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">סה"כ מסמכים</Typography>
                <Typography variant="subtitle1" color="primary.main" fontWeight="bold">{stats.total}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 60, p: 0.5, boxShadow: 1, borderRight: 3, borderColor: 'warning.main' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">ממתינים</Typography>
                <Typography variant="subtitle1" color="warning.main" fontWeight="bold">{stats.pending}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 60, p: 0.5, boxShadow: 1, borderRight: 3, borderColor: 'success.main' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">מאושרים</Typography>
                <Typography variant="subtitle1" color="success.main" fontWeight="bold">{stats.approved}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 60, p: 0.5, boxShadow: 1, borderRight: 3, borderColor: 'error.main' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">נדחו</Typography>
                <Typography variant="subtitle1" color="error.main" fontWeight="bold">{stats.rejected}</Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={10} lg={11}>
          <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2,minHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ height: 34 }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 60, minWidth: 60, maxWidth: 60 }}>קוד מוסד</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 80, minWidth: 80, maxWidth: 80 }}>סמל</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 140, minWidth: 80, maxWidth: 180 }}>שם</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 180, minWidth: 120, maxWidth: 220 }}>רכז</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 120, minWidth: 100, maxWidth: 160 }}>מוביל</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 100, minWidth: 80, maxWidth: 120 }}>עובדים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 100, minWidth: 80, maxWidth: 120 }}>תלמידים</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 140, minWidth: 120, maxWidth: 160 }}>בקרה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row: any) => {
                  const cls = row._class || classes.find((c: Class) => c._id === row.classId?._id || c._id === row.classId);
                  const leader = row.leaderId ? workers.find((w: WorkerAfterNoon) => w._id === row.leaderId?._id || w._id === row.leaderId) : null;
                  const workerDoc = row.workerAttendanceDoc;
                  const studentDoc = row.studentAttendanceDoc;
                  const controlDocs = row.controlDocs || [];
                  return (
                    <TableRow key={row._id} sx={{ height: 32 }}>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 60, minWidth: 60, maxWidth: 60 }}>{cls?.institutionCode || '-'}</TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 80, minWidth: 80, maxWidth: 80 }}>{cls?.uniqueSymbol || '-'}</TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 180, minWidth: 120, maxWidth: 220 }}>{cls?.name || '-'}</TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 180, minWidth: 120, maxWidth: 220 }}>
                        {(() => {
                          const coordinators = users.filter((u: any) => u.role === 'coordinator' && Array.isArray(u.projectCodes) && u.projectCodes.some((pc: any) => pc.institutionCode === cls?.institutionCode));
                          if (coordinators.length === 0) return '-';
                          return coordinators.map((c: any) => `${c.firstName} ${c.lastName}`).join(', ');
                        })()}
                      </TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 120, minWidth: 100, maxWidth: 160 }}>{leader ? `${leader.firstName} ${leader.lastName}` : '-'}</TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 100, minWidth: 80, maxWidth: 120 }}>
                        {workerDoc && workerDoc.status === 'ממתין' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => window.open(workerDoc.url, '_blank')} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Stack direction="row" spacing={0.1} alignItems="center">
                              <Tooltip title="אשר">
                                <IconButton size="small" color="success" onClick={() => handleApprove({ ...row, docType: 'workerAttendanceDoc' })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                  <CheckIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="דחה">
                                <IconButton size="small" color="error" onClick={() => handleReject({ ...row, docType: 'workerAttendanceDoc' })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                  <CloseIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        ) : workerDoc && workerDoc.status === 'מאושר' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Chip label="מאושר" color="success" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => handleViewDocument(workerDoc._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : workerDoc && workerDoc.status === 'נדחה' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Chip label="נדחה" color="error" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => handleViewDocument(workerDoc._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : row.missing ? (
                          <Typography variant="body2" color="error">חסר</Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 100, minWidth: 80, maxWidth: 120 }}>
                        {studentDoc && studentDoc.status === 'ממתין' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => window.open(studentDoc.url, '_blank')} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Stack direction="row" spacing={0.1} alignItems="center">
                              <Tooltip title="אשר">
                                <IconButton size="small" color="success" onClick={() => handleApprove({ ...row, docType: 'studentAttendanceDoc' })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                  <CheckIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="דחה">
                                <IconButton size="small" color="error" onClick={() => handleReject({ ...row, docType: 'studentAttendanceDoc' })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                  <CloseIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        ) : studentDoc && studentDoc.status === 'מאושר' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Chip label="מאושר" color="success" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => handleViewDocument(studentDoc._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : studentDoc && studentDoc.status === 'נדחה' ? (
                          <Stack direction="row" spacing={0.25} alignItems="center">
                            <Chip label="נדחה" color="error" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                            <Tooltip title="צפה במסמך">
                              <IconButton size="small" onClick={() => handleViewDocument(studentDoc._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : row.missing ? (
                          <Typography variant="body2" color="error">חסר</Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 0.2, minHeight: 28, maxHeight: 28, width: 100, minWidth: 80, maxWidth: 120 }}>
                        {controlDocs.length > 0 ? (
                          <Box>
                            {controlDocs.length > 1 ? (
                              <Stack direction="row" spacing={0.25} alignItems="center">
                                <Tooltip title="צפה בכל מסמכי הבקרה">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleViewControlDocuments(controlDocs, row)} 
                                    sx={{ p: 0.2, minWidth: 24, height: 24 }}
                                  >
                                    <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                  {controlDocs.length} 
                                </Typography>

                                {controlDocs.every((doc: any) => doc.status === 'מאושר') && (
                                  <Chip label="כולם מאושרים" color="success" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                                )}
                                {controlDocs.every((doc: any) => doc.status === 'נדחה') && (
                                  <Chip label="כולם נדחו" color="error" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                                )}
                                {controlDocs.some((doc: any) => doc.status === 'ממתין') && (
                                  <Chip label="ממתין לאישור" color="warning" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                                )}
                              </Stack>
                            ) : (
                              <Box display="flex" alignItems="center" gap={0.1}>
                                {controlDocs[0].status === 'ממתין' ? (
                                  <>
                                    <Tooltip title="צפה במסמך">
                                      <IconButton size="small" onClick={() => window.open(controlDocs[0].url, '_blank')} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                        <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Stack direction="row" spacing={0.1} alignItems="center">
                                      <Tooltip title="אשר">
                                        <IconButton size="small" color="success" onClick={() => handleApprove({ ...row, docType: 'controlDocs', docIndex: 0 })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                          <CheckIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="דחה">
                                        <IconButton size="small" color="error" onClick={() => handleReject({ ...row, docType: 'controlDocs', docIndex: 0 })} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                          <CloseIcon fontSize="inherit" sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </>
                                ) : controlDocs[0].status === 'מאושר' ? (
                                  <Stack direction="row" spacing={0.25} alignItems="center">
                                    <Chip label="מאושר" color="success" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                                    <Tooltip title="צפה במסמך">
                                      <IconButton size="small" onClick={() => handleViewDocument(controlDocs[0]._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                        <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                ) : controlDocs[0].status === 'נדחה' ? (
                                  <Stack direction="row" spacing={0.25} alignItems="center">
                                    <Chip label="נדחה" color="error" size="small" sx={{ height: 18, fontSize: '0.7rem', px: 0.3 }} />
                                    <Tooltip title="צפה במסמך">
                                      <IconButton size="small" onClick={() => handleViewDocument(controlDocs[0]._id)} sx={{ p: 0.2, minWidth: 24, height: 24 }}>
                                        <VisibilityIcon color="primary" fontSize="inherit" sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                ) : null}
                              </Box>
                            )}
                          </Box>
                        ) : row.missing ? (
                          <Typography variant="body2" color="error">חסר</Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Box display="flex" alignItems="center">
              <Button
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                sx={{ mx: 1 }}
              >
                הקודם
              </Button>
              <Typography variant="body2" sx={{ mx: 2 }}>{page + 1} / {Math.ceil(fullTableData.length / rowsPerPage)}</Typography>
              <Button
                variant="outlined"
                disabled={(page + 1) * rowsPerPage >= fullTableData.length}
                onClick={() => setPage(page + 1)}
                sx={{ mx: 1 }}
              >
                הבא
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              סה"כ שורות: {fullTableData.length} | מוצגות: {paginatedData.length}
            </Typography>
          </Box>
          
        </Grid>
      </Grid>
      

      <Dialog 
        open={controlDocsDialog.open} 
        onClose={handleCloseControlDocsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          מסמכי בקרה - {controlDocsDialog.row?.coordinatorName || 'לא ידוע'}
        </DialogTitle>
        <DialogContent>
          <List>
            {controlDocsDialog.documents.map((doc: any, index: number) => (
              <React.Fragment key={doc._id || index}>
                <ListItem>
                  <ListItemText
                    primary={`מסמך ${index + 1}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          סטטוס: {doc.status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          תאריך העלאה: {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString('he-IL')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="צפה במסמך">
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {doc.status === 'ממתין' && (
                        <>
                          <Tooltip title="אשר">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleApproveSingleDoc(doc)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="דחה">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleRejectSingleDoc(doc)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {doc.status === 'מאושר' && (
                        <Chip label="מאושר" color="success" size="small" />
                      )}
                      
                      {doc.status === 'נדחה' && (
                        <Chip label="נדחה" color="error" size="small" />
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < controlDocsDialog.documents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseControlDocsDialog}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SummerCampAttendancePage; 