import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { userRoleState, userTokenState } from '../recoil/storeAtom';

const API_URL = process.env.REACT_APP_API_URL + '/api/auth';

const LoginPage: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useRecoilState(userRoleState);
  const [userToken, setUserToken] = useRecoilState(userTokenState);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, { id, password });
      const { role, token } = response.data;

      // Update Recoil state and localStorage
      setUserRole(role);
      setUserToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'שגיאה בהתחברות');
      console.error('Login failed:', error);
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
      p={3}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          התחברות
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <TextField
          label="תעודת זהות"
          value={id}
          onChange={(e) => setId(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleLogin}
          sx={{ mt: 2 }}
        >
          התחבר
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
