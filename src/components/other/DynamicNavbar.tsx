import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Tabs, Tab, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import EmailIcon from '@mui/icons-material/Email';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import LoginIcon from '@mui/icons-material/Login';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import { jwtDecode } from 'jwt-decode';
import { fetchOperatorById } from '../../services/OperatorService';
import { Operator, WorkerAfterNoon } from '../../types';
import { useFetchWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';


interface DynamicNavbarProps {
  selectedSection?: string;
  role: string | undefined;
}

const DynamicNavbar: React.FC<DynamicNavbarProps> = ({selectedSection, role }) => {
  const navigate = useNavigate();
  const location = useLocation();


  const adminAfternoonTabs = [
    { label: 'ניהול עובדים', path: '/workers', icon: <PeopleIcon fontSize="small" /> },
    { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'ניהול מסמכים', path: '/documents', icon: <FolderIcon fontSize="small" /> },
  ];

  const adminCampTabs = [
    { label: 'דוח הפעלות', path: '/activities', icon: <AssessmentIcon fontSize="small" /> },
    { label: 'ניהול מפעילים', path: '/operators', icon: <PeopleIcon fontSize="small" /> },
    { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'ניהול מסמכים', path: '/documents', icon: <FolderIcon fontSize="small" /> },
    { label: 'מיילים', path: '/emails', icon: <EmailIcon fontSize="small" /> },
  ];

  const managerTabs = [
    //{ label: 'ניהול מסמכים', path: '/documents' },
    { label: 'ניהול עובדים', path: '/workers-documents' },
    { label: 'דיווחי נוכחות', path: '/worker-attendance' },
  ];

  const operatorTabs = [
    { label: 'פרטים אישיים', path: '/personal-details', icon: <AccountCircleIcon fontSize="small" /> },
    { label: 'היסטוריית הפעלות', path: '/activity-history', icon: <HistoryIcon fontSize="small" /> },
    { label: 'מסמכים', path: '/personal-documents', icon: <InsertDriveFileIcon fontSize="small" /> },
  ];

  const workerTabs = [
    { label: 'פרטים אישיים', path: '/worker/profile', icon: <AccountCircleIcon fontSize="small" /> },
  ];

  const loginTab = [{ label: 'התחבר', path: '/login', icon: <LoginIcon fontSize="small" /> }];

  const getTabsBySection = () => {
    if (!selectedSection) return [];
    
    if (role === 'manager' && selectedSection === 'afternoon') {
      return managerTabs;
    }

    if (role === 'admin' && selectedSection === 'afternoon') {
      return adminAfternoonTabs;
    }

    if (role === 'admin' && selectedSection === 'camp') {
      return adminCampTabs;
    }

    if (role === 'operator' && selectedSection === 'afternoon') {
      return operatorTabs;
    }

    if (role === 'worker' && selectedSection === 'afternoon') {
      return workerTabs;
    }

    return [];

  };

  const tabs = getTabsBySection();

  return (
    <AppBar position="fixed" sx={{ top: '64px', bgcolor: '#f5f5f5', boxShadow: 1 }}>
      <Toolbar variant="dense">
        <Tabs
          value={location.pathname}
          onChange={(e, newValue) => navigate(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '.MuiTabs-flexContainer': { gap: '10px' },
            '& .MuiTab-root': {
              minHeight: 35,
              minWidth: 120,
              color: 'rgb(2, 10, 126)',
              transition: 'all 0.3s',
              '&:hover': {
                backgroundColor:'rgb(203, 225, 255)' 
              },
              '&.Mui-selected': {
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
                  <span>{tab.label}</span>
                </Stack>
              }
              value={tab.path}
            />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default DynamicNavbar;
