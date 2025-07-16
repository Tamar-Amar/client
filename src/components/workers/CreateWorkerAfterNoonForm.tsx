import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent, FormGroup, FormControlLabel, Checkbox, Divider } from '@mui/material';
import { useAddWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon } from '../../types';

interface WorkerAfterNoonFormProps {
  onSuccess?: () => void;
}

interface ProjectSelection {
  projectCodes: number[];
}

const WorkerAfterNoonForm: React.FC<WorkerAfterNoonFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>({});
  const [loading, setLoading] = useState(false);
  const [projectSelection, setProjectSelection] = useState<ProjectSelection>({
    projectCodes: []
  });
  const addWorkerMutation = useAddWorkerAfterNoon();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProjectSelectionChange = (projectCode: number) => {
    setProjectSelection(prev => {
      const newCodes = prev.projectCodes.includes(projectCode)
        ? prev.projectCodes.filter(code => code !== projectCode)
        : [...prev.projectCodes, projectCode];
      return { projectCodes: newCodes };
    });
  };

  const getProjectDisplayName = (selection: ProjectSelection): string => {
    const projectNames: { [key: number]: string } = {
      1: "צהרון שוטף 2025",
      2: "קייטנת חנוכה 2025", 
      3: "קייטנת פסח 2025",
      4: "קייטנת קיץ 2025"
    };
    
    const projects = selection.projectCodes.map(code => projectNames[code] || `פרויקט ${code}`);
    return projects.length > 0 ? projects.join(', ') : 'לא נבחר';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // בדיקה שיש לפחות פרויקט אחד נבחר
    if (projectSelection.projectCodes.length === 0) {
      alert('יש לבחור לפחות פרויקט אחד');
      return;
    }

    setLoading(true);
    try {
      const workerData = {
        ...form,
        projectCodes: projectSelection.projectCodes,
        project: getProjectDisplayName(projectSelection)
      } as WorkerAfterNoon;
      
      await addWorkerMutation.mutateAsync(workerData);
      alert('העובד נשמר בהצלחה!');
      setForm({});
      setProjectSelection({
        projectCodes: []
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
          <TextField label="תפקיד"  placeholder="מוביל / סייע" name="roleName" value={form.roleName || ''} onChange={handleChange} fullWidth />
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
                  checked={projectSelection.projectCodes.includes(1)}
                  onChange={() => handleProjectSelectionChange(1)}
                />
              }
              label="צהרון שוטף 2025"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.projectCodes.includes(2)}
                  onChange={() => handleProjectSelectionChange(2)}
                />
              }
              label="קייטנת חנוכה 2025"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.projectCodes.includes(3)}
                  onChange={() => handleProjectSelectionChange(3)}
                />
              }
              label="קייטנת פסח 2025"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={projectSelection.projectCodes.includes(4)}
                  onChange={() => handleProjectSelectionChange(4)}
                />
              }
              label="קייטנת קיץ 2025"
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