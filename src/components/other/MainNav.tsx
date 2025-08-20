import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Typography, Stack, Menu, MenuItem, Avatar, IconButton, Tabs, Tab, Dialog } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginIcon from '@mui/icons-material/Login';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../../recoil/storeAtom';
import { jwtDecode } from 'jwt-decode';
import { fetchOperatorById } from '../../services/OperatorService';
import { Operator, WorkerAfterNoon } from '../../types';
import { fetchWorkerById } from '../../services/WorkerAfterNoonService';
import ImpersonateDialog from './ImpersonateDialog';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

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
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const sections = [
    { key: 'general', label: 'כללי' },
    { key: 'activity', label: 'חוגים' },
  ];

  const adminGeneralTabs: TabInfo[] = [
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'מצבת', path: '/matsevet' },
   // { label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: ' מסמכים אישיים', path: '/documents', },
    { label: 'דיווחי קיץ', path: '/summer-camp-attendance' },
    { label: 'מיילים', path: '/workers-after-noon-email' },
    { label: 'התראות', path: '/workers-after-noon-notifications' },
    { label: 'משתמשים', path: '/users' },
  ];

  const adminActivityTabs: TabInfo[] = [
    { label: 'דוח הפעלות', path: '/activities' },
    { label: 'ניהול מפעילים', path: '/operators' },
    //{ label: 'ניהול קבוצות', path: '/classes', icon: <GroupWorkIcon fontSize="small" /> },
    { label: ' מסמכים אישיים', path: '/documents' },
    { label: 'מיילים', path: '/emails' },
  ];

  const managerTabs: TabInfo[] = [    
    { label: 'מצבת', path: '/matsevet' },
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'דיווחי קיץ', path: '/summer-camp-attendance' },
    { label: 'מסמכים אישיים', path: '/documents' },
    { label: 'מיילים', path: '/workers-after-noon-email' },
    { label: 'התראות', path: '/workers-after-noon-notifications' }, 
    { label: 'משתמשים', path: '/users' },
  ];

  const accountantTabs: TabInfo[] = [
    { label: ' מסמכים אישיים', path: '/documents' },
    { label: 'מצבת', path: '/matsevet' },
    { label: 'עובדים', path: '/workers' },
    { label: 'דיווחי קיץ', path: '/summer-camp-attendance' },
    { label: 'התראות', path: '/workers-after-noon-notifications' }, 

  ];

  const usersTabs: TabInfo[] = [
    { label: 'משתמשים', path: '/users' },
  ];

  const leaderTabs: TabInfo[] = [
    { label: 'דוחות קייטנת קיץ', path: '/leader/camp-reports' },
  ];

  const getTabsBySection = () => {
    if (!selectedSection) return [];
    if (role === 'manager_project') return managerTabs;
    if (role === 'admin' && selectedSection === 'general') return adminGeneralTabs;
    if (role === 'admin' && selectedSection === 'activity') return adminActivityTabs;
    if (role === 'accountant') return accountantTabs;
    if (role === 'worker' && isLeader) return leaderTabs;
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
            
            // בדיקה אם העובד הוא מוביל
            if (data.roleName === 'מוביל') {
              setIsLeader(true);
            }
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

  const selectedSectionObject = sections.find(s => s.key === selectedSection);

  const handleImpersonate = (user: any, type: any) => {
    if (!localStorage.getItem('original_admin_token')) {
      localStorage.setItem('original_admin_token', localStorage.getItem('token') || '');
      localStorage.setItem('original_admin_role', localStorage.getItem('role') || '');
      localStorage.setItem('original_admin_user', localStorage.getItem('user') || '');
    }

    if (type === 'user') {
      localStorage.setItem('role', user.role);
      if (user) {
        user.id = user._id;
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (user.role === 'coordinator') {
        window.location.href = '/coordinator/dashboard';
        return;
      } else if (user.role === 'accountant') {
        window.location.href = '/accountant/dashboard';
        return;
      }
    } else if (type === 'worker') {
      localStorage.setItem('role', 'worker');
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = `/worker/${user._id}`;
      return;
    }
    window.location.reload();
  };

  const handleReturnToAdmin = () => {
    if (localStorage.getItem('original_admin_token')) {
      localStorage.setItem('token', localStorage.getItem('original_admin_token') || '');
      localStorage.setItem('role', localStorage.getItem('original_admin_role') || '');
      localStorage.setItem('user', localStorage.getItem('original_admin_user') || '');
      localStorage.removeItem('original_admin_token');
      localStorage.removeItem('original_admin_role');
      localStorage.removeItem('original_admin_user');
      window.location.reload();
    }
  };

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

            {role === 'admin' && (
             <Box>
              <Button
                id="section-button"
                aria-controls={open ? 'section-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleMenuClick}
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
                {sections.map((section) => (
                  <MenuItem
                    key={section.key}
                    selected={section.key === selectedSection}
                    onClick={() => handleMenuItemClick(section.key)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
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

          {/* תפריט למוביל */}
          {role === 'worker' && isLeader && tabs.length === 0 && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/leader/camp-reports')}
                sx={{
                  backgroundColor: '#c58a00',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#a07000',
                  }
                }}
              >
                דוחות קייטנת קיץ
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             {(role === 'admin' || role === 'manager_project' || role === 'accountant' || role === 'coordinator') && (
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>

                   {
                   role === 'accountant' ? 'חשב שכר' : 
                   role === 'coordinator' ? 'רכז' : ''}
                </Typography>
             )}
            {(role === 'admin' || role === 'manager_project') && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<PersonSearchIcon />}
                sx={{ ml: 2, fontWeight: 'bold' }}
                onClick={() => setImpersonateDialogOpen(true)}
              >
                התחבר כ...
              </Button>
            )}
                        {localStorage.getItem('original_admin_token') && (
              <Button
                variant="outlined"
                color="warning"
                sx={{ ml: 2, fontWeight: 'bold' }}
                onClick={handleReturnToAdmin}
              >
                חזור למנהל
              </Button>
            )}
            {role ? (
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: 'red',
                  color: 'red',
                  '&:hover': {
                    backgroundColor: 'rgba(247, 43, 28, 0.29)',
                    borderColor: 'red',
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
      <Dialog open={impersonateDialogOpen} onClose={() => setImpersonateDialogOpen(false)}>
        <Box sx={{ p: 4, minWidth: 350 }}>
          <Typography variant="h6">התחברות כמשתמש אחר (בקרוב)</Typography>
          <Button onClick={() => setImpersonateDialogOpen(false)} sx={{ mt: 2 }}>סגור</Button>
        </Box>
      </Dialog>
      {/* דיאלוג התחזות אמיתי */}
      <ImpersonateDialog
        open={impersonateDialogOpen}
        onClose={() => setImpersonateDialogOpen(false)}
        onImpersonate={handleImpersonate}
      />
    </>
  );
};

export default MainNav; 