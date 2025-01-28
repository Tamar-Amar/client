import React from 'react';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../recoil/storeAtom';
import { useNavigate, useLocation } from 'react-router-dom';

const DynamicNavbar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const role = useRecoilValue(userRoleState); // האם המשתמש מנהל או מפעיל
  const navigate = useNavigate();
  const location = useLocation();

  const adminTabs = [
    { label: 'ניהול מוסדות', path: '/institutions' },
    { label: 'דוח הפעלות', path: '/activities' },
    { label: 'ניהול מפעילים', path: '/operators' },
    { label: 'יצירת מסמך נוכחות', path: '/attendance' },
  ];

  const operatorTabs = [
    { label: 'פרטים אישיים', path: '/personal-details' },
    { label: 'היסטוריית הפעלות', path: '/activity-history' },
  ];

  const loginTab = [{ label: 'התחבר', path: '/login' }];

  const tabs = role === 'admin' ? adminTabs : role === 'operator' ? operatorTabs : loginTab;

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {role === 'admin'
            ? 'מנהל מערכת'
            : role === 'operator'
            ? 'דשבורד למפעיל'
            : 'DISCONNECTED'}
        </Typography>
        <Tabs
          value={location.pathname}
          onChange={(e, newValue) => navigate(newValue)}
          indicatorColor="secondary"
          textColor="inherit"
        >
          {tabs.map((tab) => (
            <Tab key={tab.path} label={tab.label} value={tab.path} />
          ))}
        </Tabs>
        {role && (role === 'admin' || role === 'operator') && (
          <Button color="inherit" onClick={onLogout}>
            יציאה
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default DynamicNavbar;
