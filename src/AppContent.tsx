// AppContent.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import MainNav from './components/other/MainNav';
import { jwtDecode } from 'jwt-decode';
import { useSetRecoilState } from 'recoil';
import { userRoleState, userTokenState } from './recoil/storeAtom';
import { Box } from '@mui/material';

interface DecodedToken {
  id: string;
  role: "admin" | "operator";
  exp: number;
}

const AppContent = () => {
  const location = useLocation();
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

  const isPublic = location.pathname === '/public-report';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isPublic && <MainNav />}
      <Box sx={{ mt: '60px' }}>
        <AppRoutes />
      </Box>
    </Box>
  );
};

export default AppContent;
