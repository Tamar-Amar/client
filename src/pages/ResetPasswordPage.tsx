import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/auth';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('טוקן לא תקין');
    }
  }, [searchParams]);


  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }
    
    const hasEnglishChar = /[a-zA-Z]/.test(password);
    if (!hasEnglishChar) {
      return 'הסיסמה חייבת להכיל לפחות תו אחד באנגלית';
    }
    
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (!hasSpecialChar) {
      return 'הסיסמה חייבת להכיל לפחות תו מיוחד (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    
    return null;
  };

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    if (password) {
      const error = validatePassword(password);
      setPasswordError(error || '');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('טוקן לא תקין');
      return;
    }

    if (!newPassword) {
      setError('סיסמה חדשה נדרשת');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await axios.post(`${API_URL}/reset-password`, { 
        token, 
        newPassword 
      });
      
      setMessage(response.data.message);
      

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'שגיאה באיפוס סיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="background.default"
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
            <Alert severity="error" sx={{ mb: 2 }}>
              טוקן לא תקין
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              fullWidth
            >
              חזרה להתחברות
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

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
            איפוס סיסמה
          </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          הזן סיסמה חדשה
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
            label="סיסמה חדשה"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => handlePasswordChange(e.target.value)}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={!!passwordError}
            helperText={passwordError}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />

          <TextField
            label="אימות סיסמה"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={newPassword !== confirmPassword && confirmPassword !== ''}
            helperText={newPassword !== confirmPassword && confirmPassword !== '' ? 'הסיסמאות אינן תואמות' : ''}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || !!passwordError || newPassword !== confirmPassword}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'שנה סיסמה'}
          </Button>
        </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage; 