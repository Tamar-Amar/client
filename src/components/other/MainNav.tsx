import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Menu, MenuItem, Typography, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';
import { jwtDecode } from 'jwt-decode';
import { fetchOperatorById } from '../../services/OperatorService';
import { Operator } from '../../types';
import DynamicNavbar from './DynamicNavbar';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';

const MainNav: React.FC = () => {
  const navigate = useNavigate();
  const role = useRecoilValue(userRoleState);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [workerDetails, setWorkerDetails] = useState<{ name: string; idNumber: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const decodedToken: any = token ? jwtDecode(token) : null;
    const userId = decodedToken?.id;

    if (userId) {
      if (role === 'operator') {
        fetchOperatorById(userId)
          .then((data: Operator) => {
            setOperatorName(`${data.firstName} ${data.lastName}`);
          })
          .catch((err) => {
            console.error('Failed to fetch operator name:', err);
          });
      } else if (role === 'worker') {
        const { data } = useFetchWorkerAfterNoon(userId)
        if (data) {
          setWorkerDetails({
            name: `${data?.firstName} ${data?.lastName}`,
            idNumber: data?.id || ''
          });
        }
      }
    }
  }, [role]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <>
      <AppBar position="fixed" sx={{ top: 0, bgcolor: 'rgb(37, 104, 197)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<SchoolIcon />}
              onClick={(e) => setSelectedSection('afternoon')}
              sx={{
                color: 'white',
                fontSize: '1.1rem',
              }}
            >
              צהרון
            </Button>
            <Button
              startIcon={<EventIcon />}
              onClick={(e) => setSelectedSection('camps')}
              sx={{
                color: 'white',
                fontSize: '1.1rem',
                '&:hover': { bgcolor:'rgb(182, 207, 241)'}
              }}
            >
              קייטנות
            </Button>
            <Button
              startIcon={<GroupsIcon />}
              onClick={(e) => setSelectedSection('courses')}
              sx={{
                color: 'white',
                fontSize: '1.1rem',
                '&:hover': { bgcolor:'rgb(182, 207, 241)' }
              }}
            >
              חוגים
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {role ? (
              <>
                {role === 'worker' && workerDetails ? (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {workerDetails.name}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      ת.ז: {workerDetails.idNumber}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {role === 'operator'
                      ? operatorName
                        ? `שלום ${operatorName}`
                        : 'טוען מפעיל...'
                      : role === 'admin'
                      ? 'מערכת ניהול ראשי'
                      : role === 'manager'
                      ? 'מערכת מנהל'
                      : 'DISCONNECTED'}
                  </Typography>
                )}
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'white',
                      color: '#1976d2',
                    },
                  }}
                >
                  התנתקות
                </Button>
              </>
            ) : (
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  fontSize: '1.1rem',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                התחברות
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <DynamicNavbar onLogout={handleLogout} role={role || undefined} selectedSection={selectedSection} />
    </>
  );
};

export default MainNav; 