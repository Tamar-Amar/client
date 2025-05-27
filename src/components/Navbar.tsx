import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';
import ClassIcon from '@mui/icons-material/Class';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';

const Navbar = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'flex-end' }}>
          <Button
            component={Link}
            to="/workers"
            color="inherit"
            startIcon={<GroupIcon />}
          >
            ניהול עובדים
          </Button>
          <Button
            component={Link}
            to="/classes"
            color="inherit"
            startIcon={<ClassIcon />}
          >
            ניהול קבוצות
          </Button>
          <Button
            component={Link}
            to="/operators"
            color="inherit"
            startIcon={<GroupIcon />}
          >
            ניהול מפעילים
          </Button>
          <Button
            component={Link}
            to="/payments"
            color="inherit"
            startIcon={<PaymentIcon />}
          >
            דוח תשלומים
          </Button>
          <IconButton
            component={Link}
            to="/messages"
            color="inherit"
            size="large"
          >
            <EmailIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 