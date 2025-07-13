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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Upload as UploadIcon
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
}

const roleLabels = {
  admin: 'מנהל מערכת',
  manager_project: 'מנהל פרויקט',
  accountant: 'חשב שכר',
  coordinator: 'רכז'
};

const roleColors = {
  admin: 'error',
  manager_project: 'warning',
  accountant: 'secondary',
  coordinator: 'primary'
} as const;

const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
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
    projectCodes: []
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
  
  // ייבוא רכזים
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    getCurrentUserRole();
    fetchInstitutionCodes();
  }, []);

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
      
      // יצירת Map של קוד מוסד -> שם מוסד
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
        projectCodes: user.projectCodes || []
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
        projectCodes: []
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
    
    // אם השתנה קוד המוסד, עדכן גם את שם המוסד
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

  // פונקציות ייבוא רכזים
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          ניהול משתמשים
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportDialogOpen}
          >
            ייבוא רכזים
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            הוסף משתמש חדש
          </Button>
        </Box>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם משתמש</TableCell>
              <TableCell>תפקיד</TableCell>
              <TableCell>שם מלא</TableCell>
              <TableCell>אימייל</TableCell>
              <TableCell>טלפון</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>שיוכי פרויקטים</TableCell>
              <TableCell>תאריך יצירה</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Chip
                    label={roleLabels[user.role]}
                    color={roleColors[user.role]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'פעיל' : 'לא פעיל'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.role === 'coordinator' && user.projectCodes && user.projectCodes.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {user.projectCodes.map((assignment, index) => {
                        const project = projectTypes.find(p => p.value === assignment.projectCode);
                        return (
                          <Chip
                            key={index}
                            label={`${project?.label || `פרויקט ${assignment.projectCode}`} - ${assignment.institutionCode} (${assignment.institutionName})`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        );
                      })}
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
                <TableCell>{formatDate(user.createDate)}</TableCell>
                <TableCell>
                  {!(currentUserRole === 'manager_project' && (user.role === 'admin' || user.role === 'manager_project')) && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user._id)}
                        color="error"
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

            {/* שיוכי פרויקטים - רק לרכזים */}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג ייבוא רכזים */}
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
    </Box>
  );
};

export default UsersManagementPage; 