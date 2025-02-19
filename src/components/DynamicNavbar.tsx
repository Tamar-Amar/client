import React from 'react';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab, Box } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../recoil/storeAtom';
import { useNavigate, useLocation } from 'react-router-dom';

const DynamicNavbar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const role = useRecoilValue(userRoleState);
  const navigate = useNavigate();
  const location = useLocation();

  const adminTabs = [
    { label: 'ניהול מוסדות', path: '/institutions' },
    { label: 'דוח הפעלות', path: '/activities' },
    { label: 'ניהול מפעילים', path: '/operators' },
    { label: 'יצירת מסמך נוכחות', path: '/report-pdf' },
    { label: 'יומן נוכחות', path: '/attendance' },
  ];

  const operatorTabs = [
    { label: 'פרטים אישיים', path: '/personal-details' },
    { label: 'היסטוריית הפעלות', path: '/activity-history' },
    { label: 'יצירת מסמך נוכחות', path: '/report-pdf' },
  ];

  const loginTab = [{ label: 'התחבר', path: '/login' }];

  const tabs = role === 'admin' ? adminTabs : role === 'operator' ? operatorTabs : loginTab;

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#f5f5f5', boxShadow: 'none', borderBottom: '1px solid #ddd' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ flexGrow: 1, color: '#333', fontWeight: 'bold' }}>
          {role === 'admin'
            ? 'מנהל מערכת'
            : role === 'operator'
            ? 'דשבורד למפעיל'
            : 'DISCONNECTED'}
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'right' }}>
          <Tabs
            value={location.pathname}
            onChange={(e, newValue) => navigate(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '.MuiTabs-flexContainer': { gap: '20px' },
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.path}
                label={tab.label}
                value={tab.path}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#555',
                  '&.Mui-selected': { color: '#1976d2' },
                }}
              />
            ))}
                      {role && (role === 'admin' || role === 'operator') && (
          <Button
            color="primary"
            variant="outlined"
            onClick={onLogout}
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#1976d2',
                color: '#fff',
              },
            }}
          >
            יציאה
          </Button>
        )}
          </Tabs>
        </Box>


      </Toolbar>
    </AppBar>
  );
};

export default DynamicNavbar;
