import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Typography, Stack, Menu, MenuItem,IconButton, Tabs, Tab, Dialog, Chip, Select, FormControl, InputLabel } from '@mui/material';
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
import { projectOptions } from '../../utils/projectUtils';
import BusinessIcon from '@mui/icons-material/Business';
import { useCurrentProject } from '../../hooks/useCurrentProject';
import SettingsIcon from '@mui/icons-material/Settings';

interface TabInfo {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

const MainNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useRecoilValue(userRoleState);
  const { currentProject, currentProjectName, setCurrentProject } = useCurrentProject();
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [workerDetails, setWorkerDetails] = useState<{ idObj:string; name: string; idNumber: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('general');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [projectMenuAnchorEl, setProjectMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [personalMenuAnchorEl, setPersonalMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const projectMenuOpen = Boolean(projectMenuAnchorEl);
  const personalMenuOpen = Boolean(personalMenuAnchorEl);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const getAttendanceReportsPath = () => {
    return [2, 3, 4, 6, 7, 8].includes(currentProject) ? '/camp-attendance' : '/attendance-reports';
  };

  const adminGeneralTabs: TabInfo[] = [
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'מצבת', path: '/matsevet' },
    { label: ' מסמכים אישיים', path: '/documents', },
    { label: 'הורדת מסמכים', path: '/download-doc' },
    { label: 'דיווחי נוכחות', path: getAttendanceReportsPath() },

  ];

  const adminActivityTabs: TabInfo[] = [
    { label: 'דוח הפעלות', path: '/activities' },
    { label: 'ניהול מפעילים', path: '/operators' },
    { label: ' מסמכים אישיים', path: '/documents' },
    { label: 'הורדת מסמכים', path: '/download-doc' },

  ];

  const managerTabs: TabInfo[] = [    
    { label: 'מצבת', path: '/matsevet' },
    { label: 'ניהול עובדים', path: '/workers' },
    { label: 'דיווחי נוכחות', path: getAttendanceReportsPath() },
    { label: 'מסמכים אישיים', path: '/documents' },
    { label: 'הורדת מסמכים', path: '/download-doc' },

  ];

  const accountantTabs: TabInfo[] = [
    { label: ' מסמכים אישיים', path: '/documents' },
    { label: 'הורדת מסמכים', path: '/download-doc' },
    { label: 'מצבת', path: '/matsevet' },
    { label: 'עובדים', path: '/workers' },
    { label: 'דיווחי נוכחות', path: getAttendanceReportsPath() },
  ];



  const leaderTabs: TabInfo[] = [
    { label: 'דוחות קייטנת קיץ', path: '/leader/camp-reports' },
  ];

  const getTabsBySection = () => {
    if (role === 'manager_project') return managerTabs;
    if (role === 'admin' && selectedSection === 'activity') return adminActivityTabs;
    if (role === 'admin') return adminGeneralTabs; 
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

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProjectMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setProjectMenuAnchorEl(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchorEl(null);
  };

  const handlePersonalMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPersonalMenuAnchorEl(event.currentTarget);
  };

  const handlePersonalMenuClose = () => {
    setPersonalMenuAnchorEl(null);
  };

  const handleProjectChange = (projectCode: number) => {
    setCurrentProject(projectCode);
    setSelectedSection('general'); 
    navigate('/workers'); 
    handleProjectMenuClose();
  };

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
          
          {(role === 'admin' || role === 'manager_project' || role === 'coordinator') && 
            (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                onClick={handleProjectMenuClick}
                startIcon={<BusinessIcon />}
                sx={{
                  backgroundColor: '#c58a00',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#a07000',
                  }
                }}
              >
                {currentProjectName}
              </Button>
              <Menu
                anchorEl={projectMenuAnchorEl}
                open={projectMenuOpen}
                onClose={handleProjectMenuClose}
                PaperProps={{
                  sx: {
                    minWidth: 250,
                    maxHeight: 400
                  }
                }}
              >
                {projectOptions.map((project) => (
                  <MenuItem
                    key={project.value}
                    selected={project.value === currentProject}
                    onClick={() => handleProjectChange(project.value)}
                    sx={{
                      backgroundColor: project.value === currentProject ? 'rgba(197, 138, 0, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(197, 138, 0, 0.05)',
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1">{project.label}</Typography>
                      {project.value === currentProject && (
                        <Chip 
                          label="נוכחי" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
                {role === 'admin' && (
                  <MenuItem
                    onClick={() => {
                      setSelectedSection('activity');
                      navigate('/activities'); 
                      handleProjectMenuClose();
                    }}
                    sx={{
                      borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1" color="primary">חוגים</Typography>
                    </Stack>
                  </MenuItem>
                )}
              </Menu>
            </Box>
          )}

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

           {tabs.length > 0 && (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
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
                {role === 'admin' && selectedSection === 'activity' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedSection('general');
                        navigate('/workers'); 
                    }}
                    sx={{
                      color: '#1976d2',
                      borderColor: '#1976d2',
                      fontSize: '0.8rem',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      }
                    }}
                  >
                    חזרה לכללי
                  </Button>
                )}
                </Box>
             )}


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
              <IconButton
                onClick={handlePersonalMenuClick}
                sx={{ 
                  color: '#1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': { 
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  }
                }}
              >
                <SettingsIcon />
              </IconButton>
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

      <Menu
        anchorEl={personalMenuAnchorEl}
        open={personalMenuOpen}
        onClose={handlePersonalMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1
          }
        }}
      >
        <MenuItem
          onClick={() => {
            navigate('/users');
            handlePersonalMenuClose();
          }}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1">משתמשים</Typography>
          </Stack>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/workers-after-noon-notifications');
            handlePersonalMenuClose();
          }}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1">התראות</Typography>
          </Stack>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/workers-after-noon-email');
            handlePersonalMenuClose();
          }}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1">מיילים</Typography>
          </Stack>
        </MenuItem>
      </Menu>

      <Dialog open={impersonateDialogOpen} onClose={() => setImpersonateDialogOpen(false)}>
        <Box sx={{ p: 4, minWidth: 350 }}>
          <Typography variant="h6">התחברות כמשתמש אחר (בקרוב)</Typography>
          <Button onClick={() => setImpersonateDialogOpen(false)} sx={{ mt: 2 }}>סגור</Button>
        </Box>
      </Dialog>

      <ImpersonateDialog
        open={impersonateDialogOpen}
        onClose={() => setImpersonateDialogOpen(false)}
        onImpersonate={handleImpersonate}
      />
    </>
  );
};

export default MainNav; 