import React from 'react';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab, Box, Stack } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';
import { useNavigate, useLocation } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import EmailIcon from '@mui/icons-material/Email';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import LoginIcon from '@mui/icons-material/Login';

const DynamicNavbar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const role = useRecoilValue(userRoleState);
  const navigate = useNavigate();
  const location = useLocation();

  const adminTabs = [
    { label: 'דוח הפעלות', path: '/activities', icon: <AssessmentIcon fontSize="small" /> },
    { label: 'ניהול מפעילים', path: '/operators', icon: <PeopleIcon fontSize="small" /> },
    { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'מיילים', path: '/emails', icon: <EmailIcon fontSize="small" /> },
        // { label: 'ניהול מוסדות', path: '/institutions' },
        // { label: 'ניהול אנשי קשר', path: '/contacts' },
  ];

  const operatorTabs = [
    { label: 'פרטים אישיים', path: '/personal-details', icon: <AccountCircleIcon fontSize="small" /> },
    { label: 'היסטוריית הפעלות', path: '/activity-history', icon: <HistoryIcon fontSize="small" /> },
  ];

  const loginTab = [{ label: 'התחבר', path: '/login', icon: <LoginIcon fontSize="small" /> }];

  const tabs = role === 'admin' ? adminTabs : role === 'operator' ? operatorTabs : loginTab;

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
        background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '2px solid #1565c0',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
          {role === 'admin'
            ? 'מערכת מנהל'
            : role === 'operator'
            ? 'דשבורד מפעיל'
            : 'DISCONNECTED'}
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'right' }}>
          <Tabs
            value={location.pathname}
            onChange={(e, newValue) => navigate(newValue)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{
              '.MuiTabs-flexContainer': { gap: '10px' },
              '& .MuiTab-root': {
                minHeight: 35,
                minWidth: 120,
                borderRadius: 1,
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(2, 10, 126)',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'rgb(0, 11, 109)',
                  color:'white',
                },
                '&.Mui-selected': {
                  backgroundColor: 'white',
                  color: '#1976d2',
                },
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.path}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Stack>
                }
                value={tab.path}
              />
            ))}
          </Tabs>

          {role && (role === 'admin' || role === 'operator') && (
            <Button
              color="inherit"
              variant="outlined"
              onClick={onLogout}
              sx={{
                marginLeft: 2,
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'white',
                  color: '#1976d2',
                },
              }}
            >
              יציאה
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DynamicNavbar;
