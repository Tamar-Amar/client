// AppContent.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import DynamicNavbar from './components/other/DynamicNavbar';
import { jwtDecode } from 'jwt-decode';
import { useSetRecoilState } from 'recoil';
import { userRoleState, userTokenState } from './recoil/storeAtom';
import { Box } from '@mui/material';
import { Routes, Route, useParams } from 'react-router-dom';
import WorkerEditPage from './components/workers/WorkerEditPage';
import { useFetchWorker } from './queries/workerQueries';
import { Typography } from '@mui/material';

interface DecodedToken {
  id: string;
  role: "admin" | "operator";
  exp: number;
}

const WorkerEditRoute = () => {
  const { workerId } = useParams();
  const { data: worker, isLoading } = useFetchWorker(workerId || '');

  if (isLoading) {
    return <Typography>טוען...</Typography>;
  }

  return <WorkerEditPage worker={worker} />;
};

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const isPublic = location.pathname === '/public-report';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' , mt: '64px' }}>
      {!isPublic && <DynamicNavbar onLogout={handleLogout} />}
      <AppRoutes />
    </Box>
  );
};

export default AppContent;
