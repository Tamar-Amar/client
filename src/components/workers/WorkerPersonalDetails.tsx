import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Divider, TextField, Button, Chip, Stack, Snackbar, Alert,
  MenuItem, Tooltip, Paper, Autocomplete, Container, Grid, InputAdornment, FormControlLabel, Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { WorkerAfterNoon, Class } from '../../types';
import { useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { updateClassWithWorker } from '../../queries/classQueries';
import { jwtDecode } from 'jwt-decode';

interface WorkerPersonalDetailsProps {
  workerData: WorkerAfterNoon | undefined;
  classes?: Class[];
}

const accountantOptions = ['מירי', 'אסתי', 'מרים', 'רוחי'];


const EditableField = ({ label, name, value, editing, onChange, icon, select, options, multiline, type }: any) => {
  if (editing) {
    return (
      <TextField
        select={select}
        name={name}
        value={value || ''}
        onChange={onChange}
        label={label}
        fullWidth
        multiline={multiline}
        rows={multiline ? 3 : 1}
        type={type}
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        InputProps={{
          startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
        }}
      >
        {select && options?.map((opt: string) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
      </TextField>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid #eee' }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography fontWeight="500" sx={{ minWidth: '120px' }}>{label}:</Typography>
      <Typography color="text.secondary">
        {type === 'date' && value ? new Date(value).toLocaleDateString('he-IL') : (value || <Typography component="span" color="text.disabled">—</Typography>)}
      </Typography>
    </Box>
  );
};

const projectTypes = [
  { label: 'צהרון שוטף 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
  { label: 'צהרון שוטף 2026', value: 5 },
  { label: 'קייטנת חנוכה 2026', value: 6 },
  { label: 'קייטנת פסח 2026', value: 7 },
  { label: 'קייטנת קיץ 2026', value: 8 },
];

const WorkerPersonalDetails: React.FC<WorkerPersonalDetailsProps> = ({ workerData, classes = [] }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>({});
  const [editing, setEditing] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const updateWorker = useUpdateWorkerAfterNoon();

  const [isCurrentWorker, setIsCurrentWorker] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        setCurrentUserRole(decodedToken.role);
        
        if (decodedToken.role === 'worker' && workerData && decodedToken.id === workerData._id) {
          setIsCurrentWorker(true);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [workerData]);

  useEffect(() => {
    if (workerData) {
      setForm(workerData);
    }
  }, [workerData]);

  if (!workerData) return null;

  const isSameId = (a?: any, b?: any) => a?.toString() === b?.toString();
  const registeredClasses = classes.filter(c => isSameId(c.workers?.[0]?.workerId, workerData._id) || isSameId(c.workers?.[1]?.workerId, workerData._id));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm({ ...form, [name]: checked });
  };

  const handleSave = async () => {
    try {
      await updateWorker.mutateAsync({ id: workerData._id, data: form });
      setOpenSnackbar(true);
      setEditing(false);
    } catch {
      alert('שגיאה בעדכון העובד');
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 16, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <span>סטטוס: <b>{workerData.status || 'לא זמין'}</b></span>
        <span>כיתות משויכות: <b>{registeredClasses.length}</b></span>
        <span>פרויקטים: <b>{(workerData.projectCodes ?? []).length}</b></span>
        <span>תאריך קליטה: <b>{new Date(workerData.createDate).toLocaleDateString('he-IL')}</b></span>
      </Box>
      <Paper sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        bgcolor: '#f7f7fa',
        border: '1px solid #e0e0e0',
        borderBottom: '3px solid #1976d2',
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, bgcolor: 'primary.main', borderRadius: '8px 8px 0 0' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>{workerData.firstName} {workerData.lastName}</Typography>
            <Typography color="text.secondary" variant="subtitle1">
              {workerData.id}
              {!isCurrentWorker && `, ${workerData.roleName}`}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {(workerData.projectCodes ?? []).map(code => {
                const projectNames: { [key: number]: string } = {
                  1: "צהרון שוטף 2025",
                  2: "קייטנת חנוכה 2025", 
                  3: "קייטנת פסח 2025",
                  4: "קייטנת קיץ 2025"
                };
                return (
                  <Chip 
                    key={code} 
                    label={projectNames[code] || `פרויקט ${code}`} 
                    variant="outlined" 
                    size="small" 
                  />
                );
              })}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing && <Button variant="text" color="secondary" onClick={() => { setForm(workerData); setEditing(false); }}>ביטול</Button>}
            {!isCurrentWorker && (
              <Tooltip title={editing ? "שמור שינויים" : "ערוך פרטים"}>
                <Button variant="contained" color="primary" onClick={() => editing ? handleSave() : setEditing(true)} startIcon={editing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />} sx={{ fontSize: 15, px: 2, py: 0.5 }}>
                  {editing ? "שמור" : "ערוך"}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary">פרטי התקשרות</Typography>
            <Stack spacing={1}>
              <EditableField label="טלפון" name="phone" value={form.phone} editing={editing} onChange={handleChange} icon={<PhoneIcon color="action" fontSize="small" />} />
              <EditableField label="אימייל" name="email" value={form.email} editing={editing} onChange={handleChange} icon={<EmailIcon color="action" fontSize="small" />} />
            
              <EditableField label="סטטוס" name="status" value={form.status} editing={editing} onChange={handleChange} icon={<AssignmentIndIcon color="action" fontSize="small" />} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary">פרטי תעסוקה</Typography>
            <Stack spacing={1}>
              <EditableField label="תאריך התחלה" name="startDate" value={form.startDate} editing={editing} onChange={handleChange} type="date" icon={<CalendarTodayIcon color="action" fontSize="small" />} />
              <EditableField label="תאריך סיום" name="endDate" value={form.endDate} editing={editing} onChange={handleChange} type="date" icon={<CalendarTodayIcon color="action" fontSize="small" />} />
              {editing ? (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>פרויקטים</Typography>
                  <Stack spacing={1}>
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={(form.projectCodes ?? []).includes(1)} 
                          onChange={(e) => {
                            const currentCodes = form.projectCodes ?? [];
                            const newCodes = e.target.checked 
                              ? [...currentCodes, 1]
                              : currentCodes.filter(code => code !== 1);
                            setForm({ ...form, projectCodes: newCodes });
                          }} 
                          color="primary" 
                        />
                      } 
                      label="צהרון שוטף 2025" 
                    />
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={(form.projectCodes ?? []).includes(2)} 
                          onChange={(e) => {
                            const currentCodes = form.projectCodes ?? [];
                            const newCodes = e.target.checked 
                              ? [...currentCodes, 2]
                              : currentCodes.filter(code => code !== 2);
                            setForm({ ...form, projectCodes: newCodes });
                          }} 
                          color="primary" 
                        />
                      } 
                      label="קייטנת חנוכה 2025" 
                    />
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={(form.projectCodes ?? []).includes(3)} 
                          onChange={(e) => {
                            const currentCodes = form.projectCodes ?? [];
                            const newCodes = e.target.checked 
                              ? [...currentCodes, 3]
                              : currentCodes.filter(code => code !== 3);
                            setForm({ ...form, projectCodes: newCodes });
                          }} 
                          color="primary" 
                        />
                      } 
                      label="קייטנת פסח 2025" 
                    />
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={(form.projectCodes ?? []).includes(4)} 
                          onChange={(e) => {
                            const currentCodes = form.projectCodes ?? [];
                            const newCodes = e.target.checked 
                              ? [...currentCodes, 4]
                              : currentCodes.filter(code => code !== 4);
                            setForm({ ...form, projectCodes: newCodes });
                          }} 
                          color="primary" 
                        />
                      } 
                      label="קייטנת קיץ 2025" 
                    />
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>פרויקטים</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(workerData.projectCodes ?? []).length === 0 && (
                      <Typography color="text.secondary" fontStyle="italic">לא משויך לפרויקטים</Typography>
                    )}
                    {(workerData.projectCodes ?? []).map(code => {
                      const project = projectTypes.find(p => p.value === code);
                      return (
                        <Chip
                          key={code}
                          label={project ? project.label : code}
                          variant="outlined"
                          size="small"
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          {!isCurrentWorker && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom color="text.primary">תפקיד וחשבונאות</Typography>
              <Stack spacing={1}>
                <EditableField label="תפקיד" name="roleName" value={form.roleName} editing={editing} onChange={handleChange} icon={<WorkIcon color="action" fontSize="small" />} />
                <EditableField label="חשב שכר" name="accountantCode" value={form.accountantCode} editing={editing} onChange={handleChange} select options={accountantOptions} icon={<BadgeIcon color="action" fontSize="small" />} />
              </Stack>
            </Grid>
          )}
          <Grid item xs={12} md={isCurrentWorker ? 12 : 6}>
            <Typography variant="subtitle1" gutterBottom color="text.primary">כיתות משויכות ({registeredClasses.length})</Typography>
            {registeredClasses.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {registeredClasses.map(cls => <Chip key={cls._id} label={`${cls.name} (${cls.uniqueSymbol})`} variant="outlined" size="small" />)}
                </Stack>
            ) : <Typography color="text.secondary">לא משויך לכיתות</Typography>}
            {editing && (
              <Autocomplete
                sx={{ mt: 2 }}
                options={classes.filter(c => !isSameId(c.workers?.[0]?.workerId, workerData._id) && !isSameId(c.workers?.[1]?.workerId, workerData._id))}
                getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                renderInput={(params) => <TextField {...params} label="הוסף שיוך לכיתה" />}
                onChange={async (_, newValue) => {
                  if (newValue) {
                    const updateData = { ...newValue, workers: [...(newValue.workers || []), { workerId: workerData._id }] };
                    await updateClassWithWorker(newValue._id as string, updateData);
                  }
                }}
                noOptionsText="אין כיתות פנויות"
              />
            )}
          </Grid>
          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          {!isCurrentWorker && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom color="text.primary">הערות</Typography>
              <EditableField label="הערות" name="notes" value={form.notes} editing={editing} onChange={handleChange} multiline icon={<NotesIcon color="action" fontSize="small" />} />
            </Grid>
          )}
        </Grid>
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>העובד עודכן בהצלחה!</Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkerPersonalDetails;