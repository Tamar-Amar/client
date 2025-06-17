import React, { useState } from 'react';
import { Box, Typography, Avatar, Divider, TextField, Button, Chip, Stack, IconButton, Snackbar, Alert, MenuItem, Tooltip, Paper, Autocomplete } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { WorkerAfterNoon, Class } from '../../types';
import { useUpdateWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { updateClassWithWorker } from '../../queries/classQueries';

interface WorkerPersonalDetailsProps {
  workerData: WorkerAfterNoon | undefined;
  classes?: Class[];
}

const accountantOptions = ['מירי', 'אסתי', 'מרים'];

const fieldIcons: Record<string, React.ReactNode> = {
  id: <BadgeIcon color="primary" />,
  phone: <PhoneIcon color="primary" />,
  email: <EmailIcon color="primary" />,
  status: <AssignmentIndIcon color="primary" />,
  roleType: <WorkIcon color="primary" />,
  roleName: <WorkIcon color="primary" />,
  accountantCode: <WorkIcon color="primary" />,
  project: <WorkIcon color="primary" />,
  notes: <NotesIcon color="primary" />,
};

const WorkerPersonalDetails: React.FC<WorkerPersonalDetailsProps> = ({ workerData, classes = [] }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>(workerData || {});
  const [editing, setEditing] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const updateWorker = useUpdateWorkerAfterNoon();

  if (!workerData) return null;

  console.log('classes', classes);

  const registeredClasses = classes.filter(
    c => c.workerAfterNoonId1 === workerData._id || c.workerAfterNoonId2 === workerData._id
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    <Paper elevation={3} sx={{ mx: 'auto',  borderRadius: 6, p: 4, bgcolor: '#fff', position: 'relative' }}>
      <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="#1976d2">{workerData.firstName} {workerData.lastName}</Typography>
        <Typography color="text.secondary" fontSize={18}>{workerData.id}, {workerData.roleType} - {workerData.roleName} </Typography>
        <Box mt={2} width="100%" display="flex" justifyContent="center">
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {registeredClasses.length === 0 ? (
              <Chip label="לא משויך לכיתה" color="warning" />
            ) : (
              registeredClasses.map(cls => (
                <Chip key={cls._id} label={`${cls.name} (${cls.uniqueSymbol})`} color="info" />
              ))
            )}
            <Chip label={workerData.project} color="primary" />
          </Stack>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      {/* פרטי קשר */}
      <Typography variant="subtitle1" fontWeight="bold" color="#1976d2" mb={1}>פרטי קשר</Typography>
      <Stack spacing={2} mb={2}>
        <Box display="flex" gap={2}>
          <Field label="טלפון" name="phone" icon={fieldIcons.phone} value={form.phone} editing={editing} onChange={handleChange} />
          <Field label="אימייל" name="email" icon={fieldIcons.email} value={form.email} editing={editing} onChange={handleChange} />
        </Box>
        <Box display="flex" gap={2}>
          <Field label="תאריך התחלה" name="startDate" icon={<BadgeIcon color="primary" />} value={form.startDate} editing={editing} onChange={handleChange} type="date" />
          <Field label="תאריך סיום" name="endDate" icon={<BadgeIcon color="primary" />} value={form.endDate} editing={editing} onChange={handleChange} type="date" />
          <Field label="סטטוס" name="status" icon={fieldIcons.status} value={form.status} editing={editing} onChange={handleChange} />
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {/* תפקיד */}
      <Typography variant="subtitle1" fontWeight="bold" color="#1976d2" mb={1}>תפקיד</Typography>
      <Stack spacing={2} mb={2}>
        <Box display="flex" gap={2}>
          <Field label="סוג תפקיד" name="roleType" icon={fieldIcons.roleType} value={form.roleType} editing={editing} onChange={handleChange} />
          <Field label="שם תפקיד" name="roleName" icon={fieldIcons.roleName} value={form.roleName} editing={editing} onChange={handleChange} />
        </Box>
        <Box display="flex" gap={2}>
        <Field
          label="חשב שכר"
          name="accountantCode"
          icon={fieldIcons.accountantCode}
          value={form.accountantCode}
          editing={editing}
          onChange={handleChange}
          select
          options={accountantOptions}
        />
        <Field label="פרויקט" name="project" icon={fieldIcons.project} value={form.project} editing={editing} onChange={handleChange} />
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {/* הערות */}
      <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={1}>הערות</Typography>
      <Field label="הערות" name="notes" icon={fieldIcons.notes} value={form.notes} editing={editing} onChange={handleChange} multiline />
      <Divider sx={{ my: 2 }} />
      {/* סמלים */}
      <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={1}>סמלים</Typography>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="body1" color="text.secondary">
          {registeredClasses.length > 0 ? `סמלים: ${registeredClasses.map(cls => cls.uniqueSymbol).join(', ')}` : 'לא פעיל בסמלים'}
        </Typography>
        {editing && (
          <Autocomplete
            options={classes.map(cls => ({ id: cls._id, symbol: cls.uniqueSymbol }))}
            getOptionLabel={(option) => option.symbol}
            renderInput={(params) => <TextField {...params} label="בחר סמל" />}
            onChange={(_, newValue) => {
              if (newValue) {
                const selectedClass = classes.find(cls => cls._id === newValue.id);
                if (selectedClass) {
                  const updateData = { ...selectedClass };
                  if (!updateData.workerAfterNoonId1) {
                    updateData.workerAfterNoonId1 = workerData._id;
                  } else if (!updateData.workerAfterNoonId2) {
                    updateData.workerAfterNoonId2 = workerData._id;
                  }
                  if (workerData._id && selectedClass._id) {
                    console.log('updateData', updateData);
                    console.log('selectedClass', selectedClass);
                    updateClassWithWorker(selectedClass._id, updateData);
                  }
                }
              }
            }}
          />
        )}
      </Box>
      <Box display="flex" justifyContent="center" mt={4}>
        <IconButton color="primary" sx={{ bgcolor: '#f5faff', boxShadow: 2 }} onClick={() => editing ? handleSave() : setEditing(true)}>
          {editing ? <SaveIcon /> : <EditIcon />}
        </IconButton>
        {editing && (
          <Button variant="text" color="secondary" onClick={() => { setForm(workerData); setEditing(false); }} sx={{ ml: 2 }}>
            ביטול
          </Button>
        )}
      </Box>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          העובד עודכן בהצלחה!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

// קומפוננטת שדה לשורה
const Field = ({ label, name, icon, value, editing, onChange, select, options, multiline, type }: any) => (
  <Box display="flex" alignItems="center" gap={2} minWidth={220}>
    <Box color="#1976d2"  display="flex" alignItems="center">
      <Tooltip title={label} sx={{ color: '#1976d2' }}><span>{icon}</span></Tooltip>
      <Typography fontWeight="bold" color="#1976d2"  ml={1}>{label}:</Typography>
    </Box>
    {editing ? (
      select ? (
        <TextField
          select
          name={name}
          value={value || ''}
          onChange={onChange}
          fullWidth
          size="small"
        >
          {options?.map((opt: string) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          name={name}
          value={value || ''}
          onChange={onChange}
          fullWidth
          size="small"
          multiline={multiline}
          type={type}
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        />
      )
    ) : (
      <Typography color="text.secondary" sx={{ fontSize: 16}}>
        {type === 'date' && value ? new Date(value).toLocaleDateString('he-IL') : (value || <span style={{ color: '#bbb' }}>—</span>)}
      </Typography>
    )}
  </Box>
);

export default WorkerPersonalDetails;