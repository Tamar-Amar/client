import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent, FormGroup, FormControlLabel, Checkbox, Divider } from '@mui/material';
import { useAddWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon } from '../../types';

interface WorkerAfterNoonFormProps {
  onSuccess?: () => void;
}

interface ProjectSelection {
  isBaseWorker: boolean;
  isAfterNoon: boolean;
  isHanukaCamp: boolean;
  isPassoverCamp: boolean;
  isSummerCamp: boolean;
}

const WorkerAfterNoonForm: React.FC<WorkerAfterNoonFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>({});
  const [loading, setLoading] = useState(false);
  const [projectSelection, setProjectSelection] = useState<ProjectSelection>({
    isBaseWorker: false,
    isAfterNoon: false,
    isHanukaCamp: false,
    isPassoverCamp: false,
    isSummerCamp: false
  });
  const addWorkerMutation = useAddWorkerAfterNoon();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProjectSelectionChange = (field: keyof ProjectSelection) => {
    setProjectSelection(prev => {
      const newSelection = { ...prev };
      newSelection[field] = !prev[field];
      return newSelection;
    });
  };

  const getProjectDisplayName = (selection: ProjectSelection): string => {
    const projects = [];
    if (selection.isBaseWorker) projects.push('עובד בסיס');
    if (selection.isAfterNoon) projects.push('צהרון');
    if (selection.isHanukaCamp) projects.push('קייטנת חנוכה');
    if (selection.isPassoverCamp) projects.push('קייטנת פסח');
    if (selection.isSummerCamp) projects.push('קייטנת קיץ');
    
    return projects.length > 0 ? projects.join(', ') : 'לא נבחר';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // בדיקה שיש לפחות פרויקט אחד נבחר
    if (!projectSelection.isBaseWorker && 
        !projectSelection.isAfterNoon && 
        !projectSelection.isHanukaCamp && 
        !projectSelection.isPassoverCamp && 
        !projectSelection.isSummerCamp) {
      alert('יש לבחור לפחות פרויקט אחד');
      return;
    }

    setLoading(true);
    try {
      const workerData = {
        ...form,
        ...projectSelection,
        project: getProjectDisplayName(projectSelection)
      } as WorkerAfterNoon;
      
      await addWorkerMutation.mutateAsync(workerData);
      alert('העובד נשמר בהצלחה!');
      setForm({});
      setProjectSelection({
        isBaseWorker: false,
        isAfterNoon: false,
        isHanukaCamp: false,
        isPassoverCamp: false,
        isSummerCamp: false
      });
      onSuccess?.();
    } catch (err) {
      alert('שגיאה בשמירת העובד');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="שם פרטי" name="firstName" value={form.firstName || ''} onChange={handleChange} fullWidth required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="שם משפחה" name="lastName" value={form.lastName || ''} onChange={handleChange} fullWidth required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="תעודת זהות" name="id" value={form.id || ''} onChange={handleChange} fullWidth required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="טלפון" name="phone" value={form.phone || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="אימייל" name="email" value={form.email || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="תאריך התחלה" name="startDate" type="date" value={form.startDate ? String(form.startDate).slice(0,10) : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="תאריך סיום" name="endDate" type="date" value={form.endDate ? String(form.endDate).slice(0,10) : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="סטטוס" name="status" value={form.status || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="סוג תפקיד - מוביל / סייע"  placeholder="מוביל / סייע" name="roleType" value={form.roleType || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="שם תפקיד" name="roleName" value={form.roleName || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="accountantCode-label">חשב שכר</InputLabel>
            <Select
              labelId="accountantCode-label"
              label="חשב שכר"
              name="accountantCode"
              value={form.accountantCode || ''}
              onChange={handleSelectChange}
            >
              <MenuItem value="מירי">מירי</MenuItem>
              <MenuItem value="אסתי">אסתי</MenuItem>
              <MenuItem value="מרים">מרים</MenuItem>
              <MenuItem value="רוחי">רוחי</MenuItem>

            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            בחירת פרויקטים
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.isBaseWorker}
                  onChange={() => handleProjectSelectionChange('isBaseWorker')}
                />
              }
              label="עובד בסיס"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.isAfterNoon}
                  onChange={() => handleProjectSelectionChange('isAfterNoon')}
                />
              }
              label="עובד צהרון"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.isHanukaCamp}
                  onChange={() => handleProjectSelectionChange('isHanukaCamp')}
                />
              }
              label="עובד קייטנת חנוכה"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.isPassoverCamp}
                  onChange={() => handleProjectSelectionChange('isPassoverCamp')}
                />
              }
              label="עובד קייטנת פסח"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.isSummerCamp}
                  onChange={() => handleProjectSelectionChange('isSummerCamp')}
                />
              }
              label="עובד קייטנת קיץ"
            />
          </FormGroup>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              פרויקטים נבחרים:
            </Typography>
            <Typography variant="body2" color="primary">
              {getProjectDisplayName(projectSelection)}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={12}>
          <TextField label="הערות" name="notes" value={form.notes || ''} onChange={handleChange} fullWidth multiline rows={2} />
        </Grid>
      </Grid>
      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          {loading ? 'שומר...' : 'שמור'}
        </Button>
      </Box>
    </Box>
  );
};

export default WorkerAfterNoonForm; 