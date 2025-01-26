import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <AppBar position="fixed" color="primary" elevation={3} sx={{ mb: 2 }} dir="rtl">

      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          מערכת ניהול ביתר
        </Typography>
        <Box>
          <Button
            color={location.pathname === '/operators' ? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/operators"
          >
            מפעילים
          </Button>
          <Button
            color={location.pathname === '/institutions' ? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/institutions"
          >
            מוסדות
          </Button>
          <Button
            color={location.pathname === '/activities' ? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/activities"
          >
            חוגים
          </Button>
          <Button
            color={location.pathname === '/purchases' ? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/purchases"
          >
            רכש
          </Button>
          <Button
            color={location.pathname === '/classes' ? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/classes"
          >
            קבוצות
          </Button>
          <Button
            color={location.pathname === '/invoices'? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/invoices"
          >
            חשבוניות
          </Button>
          <Button
            color={location.pathname === '/attendance'? 'secondary' : 'inherit'}
            sx={{ mx: 1 }}
            href="/attendance"
          >
            נוכחות
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;