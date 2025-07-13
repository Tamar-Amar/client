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
  const [form, setForm] = useState<Partial<Coordinator>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

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
      setForm(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${coordinatorId}`, form, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status !== 200) {
        throw new Error('שגיאה בעדכון פרטי הרכז');
      }
      
      setOpenSnackbar(true);
      setEditing(false);
      await fetchCoordinatorDetails(); // רענון הנתונים
    } catch (err: any) {
      setError(err.message);
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
      <Paper sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        bgcolor: '#f7f7fa',
        border: '1px solid #e0e0e0',
        borderBottom: '3px solid #1976d2',
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: 'primary.main', borderRadius: '8px 8px 0 0' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
              {coordinator.firstName} {coordinator.lastName}
            </Typography>
            <Typography color="text.secondary" variant="subtitle1">
              רכז - {coordinator.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing && (
              <Button variant="text" color="secondary" onClick={() => { setForm(coordinator); setEditing(false); }}>
                ביטול
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => editing ? handleSave() : setEditing(true)}
              startIcon={editing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
              sx={{ fontSize: 15, px: 2, py: 0.5 }}
            >
              {editing ? "שמור" : "ערוך"}
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary">פרטי התקשרות</Typography>
            <Stack spacing={2}>
              <TextField
                label="שם פרטי"
                name="firstName"
                value={form.firstName || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                InputProps={{
                  startAdornment: <PersonIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="שם משפחה"
                name="lastName"
                value={form.lastName || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                InputProps={{
                  startAdornment: <PersonIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="טלפון"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
              <TextField
                label="אימייל"
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                InputProps={{
                  startAdornment: <EmailIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary">פרטי חשבון</Typography>
            <Stack spacing={2}>
              <TextField
                label="שם משתמש"
                name="username"
                value={form.username || ''}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                InputProps={{
                  startAdornment: <WorkIcon color="action" fontSize="small" sx={{ mr: 1 }} />,
                }}
              />

            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>פרטי הרכז עודכנו בהצלחה!</Alert>
      </Snackbar>
    </Container>
  );
};

export default CoordinatorPersonalDetails; 