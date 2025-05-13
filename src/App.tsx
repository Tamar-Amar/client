// App.tsx (מתוקן עם LocalizationProvider)
import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme/theme';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { CacheProvider } from '@emotion/react';
import rtlCache from './theme/mui-rtl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import queryClient from './queryClient';
import './App.css';
import DynamicNavbar from './components/other/DynamicNavbar';
import { jwtDecode } from 'jwt-decode';
import { userRoleState, userTokenState } from './recoil/storeAtom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';


interface DecodedToken {
  id: string;
  role: "admin" | "operator";
  exp: number;
}

const AppContent: React.FC = () => {
  const setUserRole = useSetRecoilState(userRoleState);
  const setUserToken = useSetRecoilState(userTokenState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as "admin" | "operator" | null;

    if (token && role) {
      const decoded: DecodedToken = jwtDecode(token);
      setUserToken(token);
      setUserRole(role);
    }
  }, [setUserRole, setUserToken]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <DynamicNavbar onLogout={handleLogout} />
      <AppRoutes />
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={rtlCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <AppContent />
          </LocalizationProvider>
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
