import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme/theme';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { CacheProvider } from '@emotion/react';
import rtlCache from './theme/mui-rtl';
//hadas
import { QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import queryClient from './queryClient';
import './App.css';
import DynamicNavbar from './components/other/DynamicNavbar';
import { jwtDecode } from 'jwt-decode';
import { userRoleState, userTokenState } from './recoil/storeAtom';

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
      setUserToken(token); // שמירת הטוקן ב-Recoil
      setUserRole(role); // שמירת ה-role ב-Recoil
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
          <AppContent />
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
