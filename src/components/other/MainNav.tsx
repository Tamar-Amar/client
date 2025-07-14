import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Typography, Stack, Menu, MenuItem, Avatar, IconButton, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import FolderIcon from '@mui/icons-material/Folder';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';
import { jwtDecode } from 'jwt-decode';
import { fetchOperatorById } from '../../services/OperatorService';
import { Operator, WorkerAfterNoon } from '../../types';
import { fetchWorkerById } from '../../services/WorkerAfterNoonService';

interface TabInfo {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

const MainNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useRecoilValue(userRoleState);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [workerDetails, setWorkerDetails] = useState<{ idObj:string; name: string; idNumber: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('general');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const sections = [
    { key: 'general', label: 'כללי', icon: <AssessmentIcon fontSize="small" /> },
    { key: 'activity', label: 'חוגים', icon: <EventIcon fontSize="small" /> },
    { key: 'users', label: 'משתמשים', icon: <GroupsIcon fontSize="small" /> }
  ];

  const accountantSections = [
    { key: 'users', label: 'משתמשים', icon: <GroupsIcon fontSize="small" /> }
  ];

  const adminGeneralTabs: TabInfo[] = [
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'מצבת', path: '/matsevet' },
   // { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'ניהול מסמכים', path: '/documents', },
    { label: 'דיווחי נוכחות', path: '/worker-attendance' },
    { label: 'מיילים', path: '/workers-after-noon-email' },
    { label: 'התראות', path: '/workers-after-noon-notifications' },
  ];

  const adminActivityTabs: TabInfo[] = [
    { label: 'דוח הפעלות', path: '/activities', icon: <AssessmentIcon fontSize="small" /> },
    { label: 'ניהול מפעילים', path: '/operators', icon: <PeopleIcon fontSize="small" /> },
    //{ label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: 'ניהול מסמכים', path: '/documents', icon: <FolderIcon fontSize="small" /> },
    { label: 'מיילים', path: '/emails', icon: <EmailIcon fontSize="small" /> },
  ];

  const managerTabs: TabInfo[] = [    
    { label: 'מצבת', path: '/matsevet' },
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'דיווחי נוכחות', path: '/worker-attendance' },
    { label: 'מסמכים אישיים', path: '/documents' },
    { label: 'מיילים', path: '/workers-after-noon-email' },
    { label: 'התראות', path: '/workers-after-noon-notifications' }, 
  ];

  const accountantTabs: TabInfo[] = [
    { label: 'ניהול מסמכים', path: '/documents', icon: <FolderIcon fontSize="small" /> },
    { label: 'מצבת', path: '/matsevet', icon: <AssessmentIcon fontSize="small" /> },
    { label: 'עובדים', path: '/workers', icon: <PeopleIcon fontSize="small" /> },
    { label: 'נוכחות עובדים', path: '/worker-attendance' },
  ];

  const usersTabs: TabInfo[] = [
    { label: 'משתמשים', path: '/users', icon: <PeopleIcon fontSize="small" /> },
  ];

  const getTabsBySection = () => {
    if (!selectedSection) return [];
    if (role === 'manager_project' && selectedSection === 'general') return managerTabs;
    if (role === 'admin' && selectedSection === 'general') return adminGeneralTabs;
    if (role === 'admin' && selectedSection === 'activity') return adminActivityTabs;
    if (role === 'accountant') return accountantTabs;
    if ((role === 'admin' || role === 'manager_project' || role === 'accountant') && selectedSection === 'users') return usersTabs;
    if (role === 'worker') return [];
    return [];
  };

  const tabs = getTabsBySection();

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
        fetchWorkerById(userId)
          .then((data: WorkerAfterNoon) => {
            setWorkerDetails({
              idObj: data._id,
              name: `${data.firstName} ${data.lastName}`,
              idNumber: data.id || ''
            });
          })
          .catch((err) => {
            console.error('Failed to fetch worker details:', err);
          });
      }
    }
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const handleWorkerProfileClick = () => {
    navigate(`/worker/${workerDetails?.idObj}`);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (section: string) => {
    setSelectedSection(section);
    handleMenuClose();
  };

  const selectedSectionObject = role === 'accountant' 
    ? accountantSections.find(s => s.key === selectedSection)
    : sections.find(s => s.key === selectedSection);

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          top: 0, 
          bgcolor: '#ffffff',
          padding: '0 30px',
          border: '1px solid #1976d2',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {role ? (
              <>
                {role === 'worker' && workerDetails ? (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton
                      onClick={handleWorkerProfileClick}
                      sx={{ 
                        color: '#1976d2',
                        '&:hover': { 
                          backgroundColor: 'rgba(25, 118, 210, 0.08)' 
                        }
                      }}
                    >
                      <AccountCircleIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 500 }}>
                      ברוך הבא {workerDetails.name}
                    </Typography>
                  </Stack>
                ) : role === 'operator' && (
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {operatorName ? `שלום ${operatorName}`: 'טוען מפעיל...'}
                  </Typography>
                )}
              </>
            ) : null}

            {role && (role !== 'worker' && role !== 'accountant' && role !== 'coordinator') && (
             <Box>
              <Button
                id="section-button"
                aria-controls={open ? 'section-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleMenuClick}
                startIcon={selectedSectionObject?.icon}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{
                  color: '#1976d2',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    color: '#1565c0'
                  }
                }}
              >
                {selectedSectionObject?.label}
              </Button>
              <Menu
                id="section-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'section-button',
                }}
              >
                {(role === 'accountant' ? accountantSections : sections).map((section) => (
                  <MenuItem
                    key={section.key}
                    selected={section.key === selectedSection}
                    onClick={() => handleMenuItemClick(section.key)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {section.icon}
                      <Typography>{section.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}

          {role === 'accountant' && (
            <Box>
              <Button
                onClick={() => navigate('/accountant/dashboard')}
                sx={{
                  color: '#1976d2',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    color: '#1565c0'
                  }
                }}
              >
                דשבורד חשב שכר
              </Button>
            </Box>
          )}
          </Box>
          {/* Center: Tabs */}
           {tabs.length > 0 && (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                <Tabs
                  value={tabs.some(tab => tab.path === location.pathname) ? location.pathname : false}
                  onChange={(e, newValue) => navigate(newValue)}
                  indicatorColor="primary"
                  sx={{
                    '.MuiTabs-flexContainer': { gap: '10px' },
                    '& .MuiTab-root': {
                      minHeight: 35,
                      minWidth: 120,
                      color: '#c58a00',
                      transition: 'all 0.3s',
                      fontSize: '0.9rem',
                      '&:hover': {
                        backgroundColor: 'rgba(247, 181, 28, 0.16)',
                        color: '#a07000'
                      },
                      '&.Mui-selected': {
                        color: '#a07000',
                        backgroundColor:  'rgba(247, 181, 28, 0.16)',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor:'rgba(247, 181, 28, 0.88)',
                    }
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
              </Box>
           )}

          {/* Right side: User Info and Section Dropdown */}
         
                    {/* Left side: Role and Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             {(role === 'admin' || role === 'manager_project' || role === 'accountant' || role === 'coordinator') && (
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {role === 'admin' ? 'מערכת ניהול ראשי' : 
                   role === 'manager_project' ? 'מנהל פרויקט' : 
                   role === 'accountant' ? 'חשב שכר' : 
                   role === 'coordinator' ? 'רכז' : ''}
                </Typography>
             )}
            {role ? (
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                    color: '#ffffff',
                    borderColor: '#1976d2',
                  },
                }}
              >
                התנתקות
              </Button>
            ) : (
              <Button
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  fontSize: '1.1rem',
                  color: '#1976d2',
                  '&:hover': { 
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    color: '#1565c0'
                  }
                }}
              >
                התחברות
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default MainNav; 