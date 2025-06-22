import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Divider, TextField, Button, Chip, Stack, IconButton, Snackbar, Alert,
  MenuItem, Tooltip, Paper, Autocomplete, Container, Grid, Card, CardContent, InputAdornment, FormControlLabel, Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ClassIcon from '@mui/icons-material/Class';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { WorkerAfterNoon, Class } from '../../types';
import { useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { updateClassWithWorker } from '../../queries/classQueries';

// Props Interface
interface WorkerPersonalDetailsProps {
  workerData: WorkerAfterNoon | undefined;
  classes?: Class[];
}

const accountantOptions = ['מירי', 'אסתי', 'מרים'];

// Helper Component for Stat Cards
const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <Card sx={{
    display: 'flex',
    alignItems: 'center',
    p: 2,
    borderRadius: 3,
    boxShadow: 2,
    bgcolor: `${color}.lighter`,
    borderLeft: `5px solid`,
    borderColor: `${color}.main`
  }}>
    <Box sx={{ mr: 2, color: `${color}.main` }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  </Card>
);

// Helper Component for Editable Fields
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


const WorkerPersonalDetails: React.FC<WorkerPersonalDetailsProps> = ({ workerData, classes = [] }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>({});
  const [editing, setEditing] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const updateWorker = useUpdateWorkerAfterNoon();

  useEffect(() => {
    if (workerData) {
      setForm(workerData);
    }
  }, [workerData]);

  if (!workerData) return null;

  const isSameId = (a?: any, b?: any) => a?.toString() === b?.toString();
  const registeredClasses = classes.filter(c => isSameId(c.workerAfterNoonId1, workerData._id) || isSameId(c.workerAfterNoonId2, workerData._id));

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

  const getProjectCount = () => [workerData.isBaseWorker, workerData.isAfterNoon, workerData.isHanukaCamp, workerData.isPassoverCamp, workerData.isSummerCamp].filter(Boolean).length;

  return (
    <Container>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<PersonIcon />} label="סטטוס" value={workerData.status || 'לא זמין'} color="success" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<ClassIcon />} label="כיתות משויכות" value={registeredClasses.length} color="info" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<BusinessCenterIcon />} label="פרויקטים" value={getProjectCount()} color="secondary" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={<EventAvailableIcon />} label="תאריך קליטה" value={new Date(workerData.createDate).toLocaleDateString('he-IL')} color="warning" /></Grid>
      </Grid>
      
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 3, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">{workerData.firstName} {workerData.lastName}</Typography>
            <Typography color="text.secondary" variant="h6">{workerData.id}, {workerData.roleType} - {workerData.roleName}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {workerData.isBaseWorker && <Chip label="עובד בסיס" color="primary" size="small" />}
              {workerData.isAfterNoon && <Chip label="צהרון" color="success" size="small" />}
              {workerData.isHanukaCamp && <Chip label="קייטנת חנוכה" color="secondary" size="small" />}
              {workerData.isPassoverCamp && <Chip label="קייטנת פסח" color="warning" size="small" />}
              {workerData.isSummerCamp && <Chip label="קייטנת קיץ" color="info" size="small" />}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editing && <Button variant="text" color="secondary" onClick={() => { setForm(workerData); setEditing(false); }}>ביטול</Button>}
            <Tooltip title={editing ? "שמור שינויים" : "ערוך פרטים"}>
              <Button variant="contained" color="primary" onClick={() => editing ? handleSave() : setEditing(true)} startIcon={editing ? <SaveIcon /> : <EditIcon />}>
                {editing ? "שמור" : "ערוך"}
              </Button>
            </Tooltip>
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.primary">פרטי התקשרות</Typography>
            <Stack spacing={1}>
              <EditableField label="טלפון" name="phone" value={form.phone} editing={editing} onChange={handleChange} icon={<PhoneIcon color="action" />} />
              <EditableField label="אימייל" name="email" value={form.email} editing={editing} onChange={handleChange} icon={<EmailIcon color="action" />} />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.primary">פרטי תעסוקה</Typography>
            <Stack spacing={1}>
              <EditableField label="תאריך התחלה" name="startDate" value={form.startDate} editing={editing} onChange={handleChange} type="date" icon={<CalendarTodayIcon color="action" />} />
              <EditableField label="תאריך סיום" name="endDate" value={form.endDate} editing={editing} onChange={handleChange} type="date" icon={<CalendarTodayIcon color="action" />} />
              <EditableField label="סטטוס" name="status" value={form.status} editing={editing} onChange={handleChange} icon={<AssignmentIndIcon color="action" />} />
              
              {editing ? (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    פרויקטים
                  </Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isBaseWorker}
                          onChange={(e) => handleCheckboxChange('isBaseWorker', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="עובד בסיס"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isAfterNoon}
                          onChange={(e) => handleCheckboxChange('isAfterNoon', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="צהרון"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isHanukaCamp}
                          onChange={(e) => handleCheckboxChange('isHanukaCamp', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="קייטנת חנוכה"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isPassoverCamp}
                          onChange={(e) => handleCheckboxChange('isPassoverCamp', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="קייטנת פסח"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.isSummerCamp}
                          onChange={(e) => handleCheckboxChange('isSummerCamp', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="קייטנת קיץ"
                    />
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    פרויקטים
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {form.isBaseWorker && (
                      <Chip label="עובד בסיס" color="primary" size="small" />
                    )}
                    {form.isAfterNoon && (
                      <Chip label="צהרון" color="secondary" size="small" />
                    )}
                    {form.isHanukaCamp && (
                      <Chip label="קייטנת חנוכה" color="success" size="small" />
                    )}
                    {form.isPassoverCamp && (
                      <Chip label="קייטנת פסח" color="warning" size="small" />
                    )}
                    {form.isSummerCamp && (
                      <Chip label="קייטנת קיץ" color="info" size="small" />
                    )}
                  </Box>
                </Box>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.primary">תפקיד וחשבונאות</Typography>
            <Stack spacing={1}>
              <EditableField label="סוג תפקיד" name="roleType" value={form.roleType} editing={editing} onChange={handleChange} icon={<WorkIcon color="action" />} />
              <EditableField label="שם תפקיד" name="roleName" value={form.roleName} editing={editing} onChange={handleChange} icon={<WorkIcon color="action" />} />
              <EditableField label="חשב שכר" name="accountantCode" value={form.accountantCode} editing={editing} onChange={handleChange} select options={accountantOptions} icon={<BadgeIcon color="action" />} />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.primary">כיתות משויכות ({registeredClasses.length})</Typography>
            {registeredClasses.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {registeredClasses.map(cls => <Chip key={cls._id} label={`${cls.name} (${cls.uniqueSymbol})`} color="info" />)}
                </Stack>
            ) : <Typography color="text.secondary">לא משויך לכיתות</Typography>}
            {editing && (
              <Autocomplete
                sx={{ mt: 2 }}
                options={classes.filter(c => !isSameId(c.workerAfterNoonId1, workerData._id) && !isSameId(c.workerAfterNoonId2, workerData._id))}
                getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                renderInput={(params) => <TextField {...params} label="הוסף שיוך לכיתה" />}
                onChange={async (_, newValue) => {
                  if (newValue) {
                    const updateData = { ...newValue, workerAfterNoonId1: newValue.workerAfterNoonId1 || workerData._id };
                    await updateClassWithWorker(newValue._id as string, updateData);
                  }
                }}
                noOptionsText="אין כיתות פנויות"
              />
            )}
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="text.primary">הערות</Typography>
            <EditableField label="הערות" name="notes" value={form.notes} editing={editing} onChange={handleChange} multiline icon={<NotesIcon color="action" />} />
          </Grid>
        </Grid>
        
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>העובד עודכן בהצלחה!</Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkerPersonalDetails;