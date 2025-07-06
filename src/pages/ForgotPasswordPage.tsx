import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('כתובת אימייל נדרשת');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (error: any) {
      setError(error.response?.data?.message || 'שגיאה בשליחת בקשה לאיפוס סיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bgcolor="background.default"
      sx={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}
      p={3}
    >
      <Paper
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
          mb: 32,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3 }}>
          <Button
            startIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/login')}
            sx={{ mb: 2 }}
          >
            חזרה להתחברות
          </Button>

          <Typography variant="h5" align="center" gutterBottom>
            שכחתי סיסמה
          </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          הזן את כתובת האימייל, יישלח קישור לאיפוס הסיסמה
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="כתובת אימייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'שלח קישור לאיפוס סיסמה'}
          </Button>
        </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage; 