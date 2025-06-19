import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent } from '@mui/material';
import { useAddWorkerAfterNoon } from '../../queries/workerAfterNoonQueries';
import { WorkerAfterNoon } from '../../types';

interface WorkerAfterNoonFormProps {
  onSuccess?: () => void;
}

const WorkerAfterNoonForm: React.FC<WorkerAfterNoonFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<Partial<WorkerAfterNoon>>({});
  const [loading, setLoading] = useState(false);
  const addWorkerMutation = useAddWorkerAfterNoon();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addWorkerMutation.mutateAsync(form as WorkerAfterNoon);
      alert('העובד נשמר בהצלחה!');
      setForm({});
      onSuccess?.();
    } catch (err) {
      alert('שגיאה בשמירת העובד');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
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
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="פרויקט" name="project" value={form.project || "צהרון"} onChange={handleChange} fullWidth />
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