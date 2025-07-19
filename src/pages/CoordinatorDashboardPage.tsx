import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CoordinatorPersonalDetails from '../components/coordinator/CoordinatorPersonalDetails';
import CoordinatorClasses from '../components/coordinator/CoordinatorClasses';
import CoordinatorWorkers from '../components/coordinator/CoordinatorWorkers';
import { CoordinatorAttendanceReports } from '../components/coordinator/CoordinatorAttendanceReports';

interface DecodedToken {
  id: string;
  role: string;
  username?: string;
}

const CoordinatorDashboardPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'personal' | 'classes' | 'workers' | 'attendanceReports'>('personal');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [coordinatorId, setCoordinatorId] = useState<string>('');

  useEffect(() => {

    const connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (connectedUser) {
      try {
        setCoordinatorId(connectedUser.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  return (
    <Box p={4} sx={{ bgcolor: '#f7f7fa', minHeight: '100vh' }}>
      <Box sx={{ marginLeft: '180px', transition: 'margin 0.3s' }}>
        {selectedTab === 'personal' ? (
          <CoordinatorPersonalDetails coordinatorId={coordinatorId} />
        ) : selectedTab === 'classes' ? (
          <CoordinatorClasses coordinatorId={coordinatorId} />
        ) : selectedTab === 'workers' ? (
          <CoordinatorWorkers coordinatorId={coordinatorId} />
        ) : (
          <CoordinatorAttendanceReports coordinatorId={coordinatorId} />
        )}
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        variant="persistent"
        sx={{
          width: '14%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '14%',
            top: '65px',
            bgcolor: '#f7f7fa',
            borderRight: '4px solid #1976d2',
            boxShadow: 2,
          },
        }}
      >
        <List>
          <ListItem>
            <ListItemText
              primary={<Typography variant="h6" color="primary.main">דשבורד רכז</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">ניהול כיתות ועובדים</Typography>}
            />
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedTab === 'personal'} 
              onClick={() => setSelectedTab('personal')} 
              sx={selectedTab === 'personal' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}
            >
              <PersonIcon sx={{ mr: 1 }} color={selectedTab === 'personal' ? 'primary' : 'action'} />
              <ListItemText primary="פרטים אישיים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedTab === 'workers'} 
              onClick={() => setSelectedTab('workers')} 
              sx={selectedTab === 'workers' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}
            >
              <PeopleIcon sx={{ mr: 1 }} color={selectedTab === 'workers' ? 'primary' : 'action'} />
              <ListItemText primary="עובדים" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedTab === 'attendanceReports'} 
              onClick={() => setSelectedTab('attendanceReports')} 
              sx={selectedTab === 'attendanceReports' ? { bgcolor: '#e3f2fd', color: 'primary.main', borderRight: '4px solid #1976d2' } : {}}
            >
              <AssignmentIcon sx={{ mr: 1 }} color={selectedTab === 'attendanceReports' ? 'primary' : 'action'} />
              <ListItemText primary="דוחות נוכחות" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default CoordinatorDashboardPage; 