import React, { useEffect, useState } from 'react';
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
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { jwtDecode } from 'jwt-decode';
import { fetchOperatorById } from '../../services/OperatorService';
import { Operator } from '../../types';


const DynamicNavbar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const role = useRecoilValue(userRoleState);
  const navigate = useNavigate();
  const location = useLocation();

const [operatorName, setOperatorName] = useState<string | null>(null);

useEffect(() => {
  const token = localStorage.getItem('token');
  const decodedToken: any = token ? jwtDecode(token) : null;
  const operatorId = decodedToken?.id;

  if (operatorId && role === 'operator') {
    fetchOperatorById(operatorId)
      .then((data: Operator) => {
        setOperatorName(`${data.firstName} ${data.lastName}`);
      })
      .catch((err) => {
        console.error('Failed to fetch operator name:', err);
      });
  }
}, [role]);



  const adminTabs = [
    { label: 'דוח הפעלות', path: '/activities', icon: <AssessmentIcon fontSize="small" /> },
    { label: 'ניהול מפעילים', path: '/operators', icon: <PeopleIcon fontSize="small" /> },
    { label: 'ניהול עובדים', path: '/workers', icon: <PeopleIcon fontSize="small" /> },
    { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'מיילים', path: '/emails', icon: <EmailIcon fontSize="small" /> },
        // { label: 'ניהול מוסדות', path: '/institutions' },
        // { label: 'ניהול אנשי קשר', path: '/contacts' },
  ];

const operatorTabs = [
  { label: 'פרטים אישיים', path: '/personal-details', icon: <AccountCircleIcon fontSize="small" /> },
  { label: 'היסטוריית הפעלות', path: '/activity-history', icon: <HistoryIcon fontSize="small" /> },
  { label: 'מסמכים', path: '/personal-documents', icon: <InsertDriveFileIcon fontSize="small" /> },
];

  const loginTab = [{ label: 'התחבר', path: '/login', icon: <LoginIcon fontSize="small" /> }];

  const tabs = role === 'admin' ? adminTabs : role === 'operator' ? operatorTabs : loginTab;

  return (
    <AppBar position="fixed">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
{role === 'operator'
  ? operatorName
    ? `שלום ${operatorName}`
    : 'טוען מפעיל...'
  : role === 'admin'
  ? 'מערכת מנהל'
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
