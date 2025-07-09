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
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
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
    isActive: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    getCurrentUserRole();
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
        isActive: user.isActive
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
        isActive: true
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          הוסף משתמש חדש
        </Button>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagementPage; 