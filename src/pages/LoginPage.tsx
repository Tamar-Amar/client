import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL+ "/api/auth";

const Login: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, {
        id,
        password,
      });

      const { token } = response.data;
      localStorage.setItem('token', token); // שומר את ה-JWT
      window.location.href = '/dashboard'; // מפנה לאזור האישי
    } catch (error: any) {
      setError(error.response?.data?.message || 'שגיאה בכניסה');
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Typography variant="h4" marginBottom={2}>כניסת מפעילים</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="תעודת זהות"
        value={id}
        onChange={(e) => setId(e.target.value)}
        margin="normal"
        fullWidth
      />
      <TextField
        label="סיסמה"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        fullWidth
      />
      <Button onClick={handleLogin} variant="contained" color="primary" fullWidth>
        התחבר
      </Button>
    </Box>
  );
};

export default Login;
