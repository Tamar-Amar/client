import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Upload as UploadIcon,
  FilterList as FilterListIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/users';

interface User {
  _id: string;
  username: string;
  role: 'admin' | 'manager_project' | 'accountant' | 'coordinator';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createDate: string;
  updateDate: string;
  updateBy: string;
  projectCodes?: Array<{
    projectCode: number;
    institutionCode: string;
    institutionName: string;
  }>;
  accountantInstitutionCodes?: string[]; // קודי מוסד לחשבי שכר
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  projectCodes?: ProjectAssignment[];
  accountantInstitutionCodes?: string[]; // קודי מוסד לחשבי שכר
}

const roleLabels = {
  admin: 'מנהל מערכת',
  manager_project: 'מנהל פרויקט',
  accountant: 'חשב שכר',
  coordinator: 'רכז'
};



const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: ' חנוכה 2025', value: 2 },
  { label: ' פסח 2025', value: 3 },
  { label: ' קיץ 2025', value: 4 },
];

interface ProjectAssignment {
  projectCode: number;
  institutionCode: string;
  institutionName: string;
}

const getAvailableRoles = (currentUserRole: string) => {
  if (currentUserRole === 'manager_project') {
    return ['coordinator', 'accountant'];
  }
  return ['admin', 'manager_project', 'accountant', 'coordinator'];
};

const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  }
  
  const hasEnglishChar = /[a-zA-Z]/.test(password);
  if (!hasEnglishChar) {
    return 'הסיסמה חייבת להכיל לפחות תו אחד באנגלית';
  }
  
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecialChar) {
    return 'הסיסמה חייבת להכיל לפחות תו מיוחד (!@#$%^&*()_+-=[]{}|;:,.<>?)';
  }
  
  return null;
};

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'operator',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isActive: true,
    projectCodes: [],
    accountantInstitutionCodes: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [institutionCodes, setInstitutionCodes] = useState<string[]>([]);
  const [institutionNames, setInstitutionNames] = useState<string[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    getCurrentUserRole();
    fetchInstitutionCodes();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, roleFilter, searchTerm]);

  const getCurrentUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserRole(payload.role);
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  };

  const fetchInstitutionCodes = async () => {
    try {
      setLoadingInstitutions(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const institutionMap = new Map<string, string>();
      response.data.forEach((cls: any) => {
        if (cls.institutionCode && cls.institutionName) {
          institutionMap.set(cls.institutionCode, cls.institutionName);
        }
      });
      
      const codes = [...institutionMap.keys()].sort() as string[];
      const names = codes.map(code => institutionMap.get(code) || '');
      
      setInstitutionCodes(codes);
      setInstitutionNames(names);
    } catch (error: any) {
      console.error('Error fetching institution codes:', error);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error: any) {
      setError('שגיאה בטעינת רשימת המשתמשים');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        isActive: user.isActive,
        projectCodes: user.projectCodes || [],
        accountantInstitutionCodes: user.accountantInstitutionCodes || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: getAvailableRoles(currentUserRole)[0] || 'coordinator',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isActive: true,
        projectCodes: [],
        accountantInstitutionCodes: []
      });
    }
    setDialogOpen(true);
    setDialogError('');
    setDialogSuccess('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setDialogError('');
    setDialogSuccess('');
    setPasswordError('');
    setShowPassword(false);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      const error = validatePassword(password);
      setPasswordError(error || '');
    } else {
      setPasswordError('');
    }
  };

  const addProjectAssignment = () => {
    const newAssignment: ProjectAssignment = {
      projectCode: 1,
      institutionCode: institutionCodes[0] || '',
      institutionName: institutionNames[0] || ''
    };
    setFormData({
      ...formData,
      projectCodes: [...(formData.projectCodes || []), newAssignment]
    });
  };

  const removeProjectAssignment = (index: number) => {
    const updatedAssignments = formData.projectCodes?.filter((_, i) => i !== index) || [];
    setFormData({
      ...formData,
      projectCodes: updatedAssignments
    });
  };

  const updateProjectAssignment = (index: number, field: keyof ProjectAssignment, value: number | string) => {
    const updatedAssignments = [...(formData.projectCodes || [])];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value
    };
    
    if (field === 'institutionCode') {
      const codeIndex = institutionCodes.indexOf(value as string);
      if (codeIndex !== -1) {
        updatedAssignments[index].institutionName = institutionNames[codeIndex] || '';
      }
    }
    
    setFormData({
      ...formData,
      projectCodes: updatedAssignments
    });
  };

  const handleSubmit = async () => {
    try {
      setDialogError('');
      setDialogSuccess('');
      
      if (!editingUser && formData.password) {
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setDialogError(passwordError);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingUser) {
        const updateData = { ...formData };
        delete (updateData as any).password;
        
        await axios.put(`${API_URL}/${editingUser._id}`, updateData, { headers });
        setDialogSuccess('משתמש עודכן בהצלחה');
      } else {
        await axios.post(API_URL, formData, { headers });
        setDialogSuccess('משתמש נוצר בהצלחה');
      }

      fetchUsers();
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (error: any) {
      setDialogError(error.response?.data?.message || 'שגיאה בשמירת המשתמש');
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('משתמש נמחק בהצלחה');
      fetchUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'שגיאה במחיקת המשתמש');
      console.error('Error deleting user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    setImportError('');
    setImportSuccess('');
    setImportFile(null);
    setSelectedProject(1);
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setImportError('');
    setImportSuccess('');
    setImportFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setImportFile(file);
        setImportError('');
      } else {
        setImportError('אנא בחר קובץ אקסל (.xlsx או .xls)');
        setImportFile(null);
      }
    }
  };

  const handleImportCoordinators = async () => {
    if (!importFile) {
      setImportError('אנא בחר קובץ אקסל');
      return;
    }

    try {
      setImportLoading(true);
      setImportError('');
      setImportSuccess('');

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('projectCode', selectedProject.toString());

      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/import-coordinators`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportSuccess(`יובאו בהצלחה ${response.data.createdCount} רכזים`);
      fetchUsers(); // רענון רשימת המשתמשים
    } catch (error: any) {
      console.error('Error importing coordinators:', error);
      setImportError(error.response?.data?.message || 'שגיאה בייבוא הרכזים');
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenDetailsDialog = (user: User) => {
    setSelectedUserForDetails(user);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedUserForDetails(null);
  };

  const renderLimitedItems = (items: any[], maxItems: number = 2) => {
    if (items.length <= maxItems) {
      return items;
    }
    return items.slice(0, maxItems);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, mt: 5 }}>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          p: 2,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              backgroundColor: 'rgb(55, 179, 102)',
              '&:hover': { backgroundColor: 'rgb(62, 204, 116)' }
            }}
          >
            הוסף משתמש חדש
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportDialogOpen}
            sx={{ 
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': { 
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            ייבוא רכזים
          </Button>

          <TextField
            size="small"
            placeholder="חיפוש חופשי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              minWidth: 200,
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#1976d2',
                },
                '&:hover fieldset': {
                  borderColor: '#1565c0',
                },
              },
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>סינון לפי תפקיד</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="סינון לפי תפקיד"
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">כל התפקידים</MenuItem>
              <MenuItem value="admin">מנהל מערכת</MenuItem>
              <MenuItem value="manager_project">מנהל פרויקט</MenuItem>
              <MenuItem value="accountant">חשב שכר</MenuItem>
              <MenuItem value="coordinator">רכז</MenuItem>
            </Select>
          </FormControl>
          
          {(roleFilter !== 'all' || searchTerm.trim()) && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}
            >
              מוצגים {filteredUsers.length} מתוך {users.length} משתמשים
            </Typography>
          )}
        </Box>


      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxWidth: 1200, 
            width: '100%',
            maxHeight: 600,
            minHeight: 400,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#a8a8a8',
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>שם משתמש</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>תפקיד</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>שם מלא</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>אימייל</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>טלפון</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>שיוכי פרויקטים</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>קודי מוסד (חשב שכר)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>תאריך יצירה</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id} sx={{ 
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                }}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: user.role === 'admin' ? '#d32f2f' : 
                               user.role === 'manager_project' ? '#ed6c02' : 
                               user.role === 'accountant' ? '#9c27b0' : '#1976d2',
                        fontWeight: 'medium'
                      }}
                    >
                      {roleLabels[user.role]}
                    </Typography>
                  </TableCell>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>

                  <TableCell sx={{ height: 80, verticalAlign: 'top' }}>
                    {user.role === 'coordinator' && user.projectCodes && user.projectCodes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {(() => {
                          const groupedByProject = user.projectCodes.reduce((acc, assignment) => {
                            const projectCode = assignment.projectCode;
                            if (!acc[projectCode]) {
                              acc[projectCode] = [];
                            }
                            acc[projectCode].push(assignment);
                            return acc;
                          }, {} as Record<number, typeof user.projectCodes>);

                          const projectEntries = Object.entries(groupedByProject);
                          const limitedProjects = renderLimitedItems(projectEntries, 2);

                          return limitedProjects.map(([projectCode, assignments]) => {
                            const project = projectTypes.find(p => p.value === parseInt(projectCode));
                            const institutionsText = assignments.map((a: any) => a.institutionCode).join(', ');
                            return (
                              <Typography 
                                key={projectCode}
                                variant="caption" 
                                sx={{ 
                                  color: '#666',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {project?.label || `פרויקט ${projectCode}`} - {institutionsText}
                              </Typography>
                            );
                          });
                        })()}
                        {(() => {
                          const groupedByProject = user.projectCodes.reduce((acc, assignment) => {
                            const projectCode = assignment.projectCode;
                            if (!acc[projectCode]) {
                              acc[projectCode] = [];
                            }
                            acc[projectCode].push(assignment);
                            return acc;
                          }, {} as Record<number, typeof user.projectCodes>);

                          const projectEntries = Object.entries(groupedByProject);
                          
                          if (projectEntries.length > 2) {
                            return (
                              <Button
                                size="small"
                                startIcon={<InfoIcon />}
                                onClick={() => handleOpenDetailsDialog(user)}
                                sx={{ 
                                  mt: 0.5,
                                  fontSize: '0.7rem',
                                  minWidth: 'auto',
                                  p: 0.5
                                }}
                              >
                                הצג עוד {projectEntries.length - 2} פרויקטים
                              </Button>
                            );
                          } else if (projectEntries.length > 0) {
                            return (
                              <Button
                                size="small"
                                startIcon={<InfoIcon />}
                                onClick={() => handleOpenDetailsDialog(user)}
                                sx={{ 
                                  mt: 0.5,
                                  fontSize: '0.7rem',
                                  minWidth: 'auto',
                                  p: 0.5
                                }}
                              >
                                הצג פרטים
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                    ) : user.role === 'coordinator' ? (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        אין שיוכים
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        לא רלוונטי
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ height: 80, verticalAlign: 'top' }}>
                    {user.role === 'accountant' && user.accountantInstitutionCodes && user.accountantInstitutionCodes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {renderLimitedItems(user.accountantInstitutionCodes, 2).map((code, index) => {
                            const codeIndex = institutionCodes.indexOf(code);
                            const name = codeIndex !== -1 ? institutionNames[codeIndex] : code;
                            return (
                              <Chip 
                                key={index} 
                                label={`${code} - ${name}`} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                        {user.accountantInstitutionCodes.length > 2 && (
                          <Button
                            size="small"
                            startIcon={<InfoIcon />}
                            onClick={() => handleOpenDetailsDialog(user)}
                            sx={{ 
                              mt: 0.5,
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              p: 0.5
                            }}
                          >
                            הצג עוד {user.accountantInstitutionCodes.length - 2} קודים
                          </Button>
                        )}
                        {user.accountantInstitutionCodes.length <= 2 && user.accountantInstitutionCodes.length > 0 && (
                          <Button
                            size="small"
                            startIcon={<InfoIcon />}
                            onClick={() => handleOpenDetailsDialog(user)}
                            sx={{ 
                              mt: 0.5,
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              p: 0.5
                            }}
                          >
                            הצג פרטים
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        לא רלוונטי
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createDate)}</TableCell>
                  <TableCell>
                    {!(currentUserRole === 'manager_project' && (user.role === 'admin' || user.role === 'manager_project')) && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          sx={{ color: '#1976d2' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user._id)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {dialogError}
              </Alert>
            )}

            {dialogSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {dialogSuccess}
              </Alert>
            )}
            <TextField
              label="שם משתמש"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              margin="normal"
              disabled={!!editingUser}
            />
            
            {!editingUser && (
              <TextField
                label="סיסמה"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                fullWidth
                margin="normal"
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>תפקיד</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="תפקיד"
              >
                {getAvailableRoles(currentUserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabels[role as keyof typeof roleLabels]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="שם פרטי"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="שם משפחה"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="אימייל"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="טלפון"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>

            <FormControl fullWidth margin="normal">
              <InputLabel>סטטוס</InputLabel>
              <Select
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value as boolean })}
                label="סטטוס"
              >
                <MenuItem value="true">פעיל</MenuItem>
                <MenuItem value="false">לא פעיל</MenuItem>
              </Select>
            </FormControl>


            {formData.role === 'coordinator' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  שיוכי פרויקטים
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  בחר את הפרויקטים וקודי המוסד שהרכז אחראי עליהם
                </Typography>
                
                {formData.projectCodes && formData.projectCodes.length > 0 && (
                  <List dense>
                    {formData.projectCodes.map((assignment, index) => (
                      <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>פרויקט</InputLabel>
                                <Select
                                  value={assignment.projectCode}
                                  onChange={(e) => updateProjectAssignment(index, 'projectCode', e.target.value as number)}
                                  label="פרויקט"
                                >
                                  {projectTypes.map((project) => (
                                    <MenuItem key={project.value} value={project.value}>
                                      {project.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              
                              <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>קוד מוסד</InputLabel>
                                <Select
                                  value={assignment.institutionCode}
                                  onChange={(e) => updateProjectAssignment(index, 'institutionCode', e.target.value)}
                                  label="קוד מוסד"
                                  disabled={loadingInstitutions}
                                >
                                  {institutionCodes.map((code, codeIndex) => (
                                    <MenuItem key={code} value={code}>
                                      {code} - {institutionNames[codeIndex]}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeProjectAssignment(index)}
                            color="error"
                            size="small"
                          >
                            <RemoveCircleIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<AddCircleIcon />}
                  onClick={addProjectAssignment}
                  sx={{ mt: 1 }}
                  disabled={loadingInstitutions}
                >
                  הוסף שיוך פרויקט
                </Button>
              </Box>
            )}


            {formData.role === 'accountant' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  קודי מוסד לחשב שכר
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  בחר את קודי המוסד שהחשב שכר אחראי עליהם
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>קודי מוסד</InputLabel>
                  <Select
                    multiple
                    value={formData.accountantInstitutionCodes || []}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      accountantInstitutionCodes: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                    })}
                    label="קודי מוסד"
                    disabled={loadingInstitutions}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const codeIndex = institutionCodes.indexOf(value);
                          const name = codeIndex !== -1 ? institutionNames[codeIndex] : value;
                          return (
                            <Chip 
                              key={value} 
                              label={`${value} - ${name}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {institutionCodes.map((code, codeIndex) => (
                      <MenuItem key={code} value={code}>
                        {code} - {institutionNames[codeIndex]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog open={importDialogOpen} onClose={handleImportDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          ייבוא רכזים מקובץ אקסל
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {importError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {importError}
              </Alert>
            )}

            {importSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {importSuccess}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              הקובץ צריך להכיל את העמודות הבאות:.זהות, שם משפחה, שם פרטי, נייד, מייל עובד, קוד מוסד
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>פרויקט לייבוא</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value as number)}
                label="פרויקט לייבוא"
              >
                {projectTypes.map((project) => (
                  <MenuItem key={project.value} value={project.value}>
                    {project.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="import-file-input"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="import-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<UploadIcon />}
                >
                  {importFile ? importFile.name : 'בחר קובץ אקסל'}
                </Button>
              </label>
            </Box>

            {importFile && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                ✓ קובץ נבחר: {importFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>ביטול</Button>
          <Button 
            onClick={handleImportCoordinators} 
            variant="contained"
            disabled={!importFile || importLoading}
            startIcon={importLoading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {importLoading ? 'מייבא...' : 'ייבא רכזים'}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          פרטים מלאים - {selectedUserForDetails ? `${selectedUserForDetails.firstName} ${selectedUserForDetails.lastName}` : ''}
        </DialogTitle>
        <DialogContent>
          {selectedUserForDetails && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        פרטי משתמש
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>שם משתמש:</strong> {selectedUserForDetails.username}
                        </Typography>
                        <Typography variant="body2">
                          <strong>תפקיד:</strong> {roleLabels[selectedUserForDetails.role]}
                        </Typography>
                        <Typography variant="body2">
                          <strong>שם מלא:</strong> {selectedUserForDetails.firstName} {selectedUserForDetails.lastName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>אימייל:</strong> {selectedUserForDetails.email}
                        </Typography>
                        <Typography variant="body2">
                          <strong>טלפון:</strong> {selectedUserForDetails.phone || '-'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>סטטוס:</strong> {selectedUserForDetails.isActive ? 'פעיל' : 'לא פעיל'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>תאריך יצירה:</strong> {formatDate(selectedUserForDetails.createDate)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>


                {selectedUserForDetails.role === 'coordinator' && selectedUserForDetails.projectCodes && selectedUserForDetails.projectCodes.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          שיוכי פרויקטים ({selectedUserForDetails.projectCodes.length})
                        </Typography>
                        <List dense>
                          {(() => {
                            const groupedByProject = selectedUserForDetails.projectCodes.reduce((acc, assignment) => {
                              const projectCode = assignment.projectCode;
                              if (!acc[projectCode]) {
                                acc[projectCode] = [];
                              }
                              acc[projectCode].push(assignment);
                              return acc;
                            }, {} as Record<number, typeof selectedUserForDetails.projectCodes>);

                            return Object.entries(groupedByProject).map(([projectCode, assignments]) => {
                              const project = projectTypes.find(p => p.value === parseInt(projectCode));
                              return (
                                <ListItem key={projectCode} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                                    {project?.label || `פרויקט ${projectCode}`}
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 2 }}>
                                    {assignments.map((assignment, index) => (
                                      <Chip
                                        key={index}
                                        label={`${assignment.institutionCode}${assignment.institutionName ? ` - ${assignment.institutionName}` : ''}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                </ListItem>
                              );
                            });
                          })()}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}


                {selectedUserForDetails.role === 'accountant' && selectedUserForDetails.accountantInstitutionCodes && selectedUserForDetails.accountantInstitutionCodes.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          קודי מוסד לחשב שכר ({selectedUserForDetails.accountantInstitutionCodes.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedUserForDetails.accountantInstitutionCodes.map((code, index) => {
                            const codeIndex = institutionCodes.indexOf(code);
                            const name = codeIndex !== -1 ? institutionNames[codeIndex] : code;
                            return (
                              <Chip 
                                key={index} 
                                label={`${code} - ${name}`} 
                                size="medium" 
                                color="secondary" 
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagementPage; 