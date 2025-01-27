import React from 'react';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../recoil/storeAtom';
import { useNavigate, useLocation } from 'react-router-dom';

interface DynamicNavbarProps {
    isAdmin: boolean; // האם המשתמש הוא מנהל
    onLogout: () => void; // פונקציית יציאה
  }

const DynamicNavbar: React.FC<DynamicNavbarProps> = ({ isAdmin, onLogout }) => {
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

  const tabs = role === 'admin' ? adminTabs : operatorTabs;

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    window.location.href = '/login'; 
    onLogout();
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {role === 'admin' ? 'מנהל מערכת' : 'דשבורד למפעיל'}
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
        <Button color="inherit" onClick={handleLogout}>
          יציאה
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default DynamicNavbar;
