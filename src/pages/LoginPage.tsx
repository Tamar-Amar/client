import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Tabs, Tab, Paper } from '@mui/material';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { userRoleState, userTokenState } from '../recoil/storeAtom';

const API_URL = process.env.REACT_APP_API_URL + '/api/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LoginPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [userRole, setUserRole] = useRecoilState(userRoleState);
  const [userToken, setUserToken] = useRecoilState(userTokenState);
  const [errorMessage, setErrorMessage] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setErrorMessage('');
    setId('');
    setPassword('');
    setVerificationCode('');
    setIsCodeSent(false);
  };

  const handleOperatorLogin = async () => {
    try {
      const response = await axios.post(API_URL, { id, password });
      const { role, token } = response.data;

      setUserRole(role);
      setUserToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      window.location.href = '/';
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'שגיאה בהתחברות');
      console.error('Login failed:', error);
    }
  };

  const handleWorkerLogin = async () => {
    try {
      if (!isCodeSent) {
        const response = await axios.post(`${API_URL}/worker-after-noon/login`, { idNumber: id });
        setMaskedEmail(response.data.email);
        setIsCodeSent(true);
        setErrorMessage('');
      } else {
        const response = await axios.post(`${API_URL}/worker-after-noon/verify`, { 
          idNumber: id,
          code: verificationCode 
        });
        
        const { token } = response.data;
        setUserRole('worker');
        setUserToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('role', 'worker');

        window.location.href = `/workers/${id}`;
      }
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
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="מפעיל / מנהל" />
          <Tab label="עובד צעירון" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" align="center" gutterBottom>
            התחברות מפעיל / מנהל
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
            onClick={handleOperatorLogin}
            sx={{ mt: 2 }}
          >
            התחבר
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" align="center" gutterBottom>
            התחברות עובד צעירון
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {isCodeSent && maskedEmail && (
            <Alert severity="info" sx={{ mb: 2 }}>
              קוד אימות נשלח לכתובת {maskedEmail}
            </Alert>
          )}

          <TextField
            label="תעודת זהות"
            value={id}
            onChange={(e) => setId(e.target.value)}
            fullWidth
            margin="normal"
            disabled={isCodeSent}
          />
          
          {isCodeSent && (
            <TextField
              label="קוד אימות"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              fullWidth
              margin="normal"
              type="number"
            />
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleWorkerLogin}
            sx={{ mt: 2 }}
          >
            {isCodeSent ? 'אמת קוד' : 'שלח קוד אימות'}
          </Button>

          {isCodeSent && (
            <Button
              variant="text"
              color="primary"
              fullWidth
              size="small"
              onClick={() => {
                setIsCodeSent(false);
                setVerificationCode('');
                setErrorMessage('');
              }}
              sx={{ mt: 1 }}
            >
              שלח קוד חדש
            </Button>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default LoginPage;
