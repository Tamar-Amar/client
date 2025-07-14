import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Container,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import axios from 'axios';

interface Coordinator {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createDate: Date;
  updateDate: Date;
}

interface CoordinatorPersonalDetailsProps {
  coordinatorId: string;
}

const CoordinatorPersonalDetails: React.FC<CoordinatorPersonalDetailsProps> = ({ coordinatorId }) => {
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (coordinatorId) {
      fetchCoordinatorDetails();
    }
  }, [coordinatorId]);

  const fetchCoordinatorDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${coordinatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status !== 200) {
        throw new Error('שגיאה בטעינת פרטי הרכז');
      }
      
      const data = response.data;
      setCoordinator(data);
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

  if (!coordinator) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 2 }}>לא נמצאו פרטי רכז</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
              {coordinator.firstName} {coordinator.lastName}
            </Typography>
            <Typography color="text.secondary" variant="subtitle1">
              רכז - {coordinator.username}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="bold">פרטי התקשרות</Typography>
            <Stack spacing={2}>
              <TextField
                label="שם פרטי"
                name="firstName"
                value={coordinator.firstName || ''}
                fullWidth
                disabled={true}
                InputProps={{
                  startAdornment: <PersonIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="שם משפחה"
                name="lastName"
                value={coordinator.lastName || ''}
                fullWidth
                disabled={true}
                InputProps={{
                  startAdornment: <PersonIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="טלפון"
                name="phone"
                value={coordinator.phone || ''}
                fullWidth
                disabled={true}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="אימייל"
                name="email"
                value={coordinator.email || ''}
                fullWidth
                disabled={true}
                InputProps={{
                  startAdornment: <EmailIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="bold">פרטי חשבון</Typography>
            <Stack spacing={2}>
              <TextField
                label="שם משתמש"
                name="username"
                value={coordinator.username || ''}
                fullWidth
                disabled={true}
                InputProps={{
                  startAdornment: <WorkIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />

            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CoordinatorPersonalDetails; 