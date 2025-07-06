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
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Class } from '../../types';

interface CoordinatorClassesProps {
  coordinatorId: string;
}

const CoordinatorClasses: React.FC<CoordinatorClassesProps> = ({ coordinatorId }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (coordinatorId) {
      fetchCoordinatorClasses();
    }
  }, [coordinatorId]);

  const fetchCoordinatorClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/classes/coordinator/${coordinatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('שגיאה בטעינת הכיתות');
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            כיתות תחת אחריותי
          </Typography>
          <Chip 
            label={classes.length} 
            color="primary" 
            sx={{ ml: 2 }}
          />
        </Box>

        {classes.length === 0 ? (
          <Box textAlign="center" py={4}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              אין כיתות תחת אחריותך
            </Typography>
            <Typography variant="body2" color="text.secondary">
              כיתות יוצגו כאן לאחר שיוך על ידי מנהל המערכת
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>שם הכיתה</TableCell>
                  <TableCell>סימן ייחודי</TableCell>
                  <TableCell>מיקום</TableCell>
                  <TableCell>עובדים</TableCell>
                  <TableCell>סטטוס</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls._id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <SchoolIcon color="primary" fontSize="small" />
                        <Typography variant="body1" fontWeight="medium">
                          {cls.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cls.uniqueSymbol} 
                        variant="outlined" 
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocationOnIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          לא צוין
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PeopleIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {cls.workers?.length || 0} עובדים
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cls.isActive ? 'פעיל' : 'לא פעיל'} 
                        color={cls.isActive ? 'success' : 'default'}
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

export default CoordinatorClasses; 