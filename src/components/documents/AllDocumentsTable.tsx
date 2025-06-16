import React, { useState, useMemo } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select,
  MenuItem, InputLabel, FormControl, Stack, Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useFetchAllDocuments } from '../../queries/useDocuments';
import { useFetchWorkers } from '../../queries/workerQueries';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useWorkerDocuments } from '../../queries/useDocuments';
import { DocumentStatus } from '../../types/Document';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';



const AllDocumentsTable: React.FC = () => {
  const { data: documents = [], isLoading: isLoadingDocs } = useFetchAllDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchWorkers();
  const { updateStatus, isUpdatingStatus } = useWorkerDocuments('all');

  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const getWorkerInfo = (operatorId: string) => {
    const w = workers.find(w => w._id === operatorId);
    return w ? { name: ` ${w.lastName} ${w.firstName}`, id: w.id } : { name: 'לא נמצא', id: '' };
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const worker = getWorkerInfo(doc.operatorId);
      return (
        (!searchName || worker.name.includes(searchName)) &&
        (!searchId || worker.id.includes(searchId)) &&
        (!filterStatus || doc.status === filterStatus) &&
        (!filterType || doc.tag === filterType)
      );
    });
  }, [documents, workers, searchName, searchId, filterStatus, filterType]);

  if (isLoadingDocs || isLoadingWorkers) {
    return <Typography>טוען...</Typography>;
  }

 

const handleApprove = (documentId: string) => {
  updateStatus({ documentId, status: DocumentStatus.APPROVED });
};

const handleReject = (documentId: string) => {
  updateStatus({ documentId, status: DocumentStatus.REJECTED });
};


  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>כל המסמכים</Typography>

      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
      <Tooltip title="איפוס מסננים">
        <IconButton
    onClick={() => {
      setSearchName('');
      setSearchId('');
      setFilterStatus('');
      setFilterType('');
    }}
    sx={{ color: 'grey.600', alignSelf: 'center' }}
  >
    <RestartAltIcon />
  </IconButton>
</Tooltip>
        <TextField
          size="small"
          label="חפש לפי שם"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <TextField
          size="small"
          label="חפש לפי ת.ז"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />



        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>סטטוס</InputLabel>
          <Select value={filterStatus} label="סטטוס" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="מאושר">מאושר</MenuItem>
            <MenuItem value="ממתין">ממתין</MenuItem>
            <MenuItem value="נדחה">נדחה</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>סוג מסמך</InputLabel>
          <Select value={filterType} label="סוג מסמך" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="תעודת זהות">תעודת זהות</MenuItem>
            <MenuItem value="אישור משטרה">אישור משטרה</MenuItem>
            <MenuItem value="תעודת הוראה">תעודת הוראה</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </Select>
        </FormControl>

      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 450, overflow: 'auto', minHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ backgroundColor: '#ffe082' }}>
            <TableRow>
            <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>צפייה</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>שם עובד</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>ת"ז</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>סוג מסמך</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>תאריך</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>סטטוס</TableCell>
              <TableCell align="center">פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  לא קיימים מסמכים במערכת
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => {
                const worker = getWorkerInfo(doc.operatorId);
                return (
                  <TableRow key={doc._id}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#37474f' }}>
                      <Tooltip title="צפה במסמך">
                        <IconButton size="small" onClick={() => window.open(doc.url, '_blank')}>
                          <VisibilityIcon fontSize="small" color="info" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: '#37474f' }}>{worker.name}</TableCell>
                    <TableCell sx={{ color: '#37474f' }}>{worker.id}</TableCell>
                    <TableCell sx={{  color: '#37474f' }}>{doc.tag}</TableCell>
                    <TableCell sx={{ color: '#37474f' }}>{new Date(doc.createdAt).toLocaleDateString('he-IL')}</TableCell>

                    <TableCell sx={{  color: '#37474f' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {doc.status === 'מאושר' && (
                          <Tooltip title="מאושר">
                            <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                          </Tooltip>
                        )}
                        {doc.status === 'נדחה' && (
                          <Tooltip title="נדחה">
                            <CancelIcon sx={{ color: 'error.main' }} fontSize="small" />
                          </Tooltip>
                        )}
                        {doc.status === 'ממתין' && (
                          <Tooltip title="ממתין">
                            <HourglassEmptyIcon sx={{ color: 'warning.main' }} fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      {doc.status === 'ממתין' && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="אשר">
                            <IconButton
                              size="small"
                              onClick={() => handleApprove(doc._id!)}
                              disabled={isUpdatingStatus}
                            >
                              <CheckIcon fontSize="small" sx={{ color: 'success.main' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="דחה">
                            <IconButton
                              size="small"
                              onClick={() => handleReject(doc._id!)}
                              disabled={isUpdatingStatus}
                            >
                              <CloseIcon fontSize="small" sx={{ color: 'error.main' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary rows */}
      <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Typography variant="subtitle1" gutterBottom>סיכום מסמכים:</Typography>
        <Stack direction="row" spacing={4}>
          <Typography>סה"כ מסמכים שהתקבלו: {filteredDocuments.length}</Typography>
          <Typography>סה"כ אישורי משטרה: {filteredDocuments.filter(doc => doc.tag === 'אישור משטרה').length}</Typography>
          <Typography>סה"כ תעודות הוראה: {filteredDocuments.filter(doc => doc.tag === 'תעודת הוראה').length}</Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default AllDocumentsTable;
