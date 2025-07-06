import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import { WorkerAfterNoon } from '../../types';

interface CoordinatorWorkersProps {
  coordinatorId: string;
}

const CoordinatorWorkers: React.FC<CoordinatorWorkersProps> = ({ coordinatorId }) => {
  const [workers, setWorkers] = useState<WorkerAfterNoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (coordinatorId) {
      fetchCoordinatorWorkers();
    }
  }, [coordinatorId]);

  const fetchCoordinatorWorkers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workers/coordinator/${coordinatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('שגיאה בטעינת העובדים');
      }
      
      const data = await response.json();
      setWorkers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProjectCount = (worker: WorkerAfterNoon) => {
    return [worker.isBaseWorker, worker.isAfterNoon, worker.isHanukaCamp, worker.isPassoverCamp, worker.isSummerCamp].filter(Boolean).length;
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Paper sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        bgcolor: '#f7f7fa',
        border: '1px solid #e0e0e0',
        borderBottom: '3px solid #1976d2',
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: 'primary.main', borderRadius: '8px 8px 0 0' }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            עובדים תחת אחריותי
          </Typography>
          <Chip 
            label={workers.length} 
            color="primary" 
            sx={{ ml: 2 }}
          />
        </Box>

        {workers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              אין עובדים תחת אחריותך
            </Typography>
            <Typography variant="body2" color="text.secondary">
              עובדים יוצגו כאן לאחר שיוך על ידי מנהל המערכת
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>שם העובד</TableCell>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>אימייל</TableCell>
                  <TableCell>פרויקטים</TableCell>
                  <TableCell>סטטוס</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker._id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PeopleIcon color="primary" fontSize="small" />
                        <Typography variant="body1" fontWeight="medium">
                          {worker.firstName} {worker.lastName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {worker.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {worker.phone || 'לא צוין'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {worker.email || 'לא צוין'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {worker.isBaseWorker && <Chip label="בסיס" size="small" variant="outlined" />}
                        {worker.isAfterNoon && <Chip label="צהרון" size="small" variant="outlined" />}
                        {worker.isHanukaCamp && <Chip label="חנוכה" size="small" variant="outlined" />}
                        {worker.isPassoverCamp && <Chip label="פסח" size="small" variant="outlined" />}
                        {worker.isSummerCamp && <Chip label="קיץ" size="small" variant="outlined" />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={worker.status || 'לא זמין'} 
                        color={worker.status === 'פעיל' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default CoordinatorWorkers; 