import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Autocomplete } from '@mui/material';
import { useAddClass } from '../../queries/classQueries';
import { useFetchStores } from '../../queries/storeQueries';
import { useFetchOperators } from '../../queries/operatorQueries';
import { Class } from '../../types';

const AddClassDialog = ({ onClose }: any) => {
  const addClassMutation = useAddClass();
  const { data: stores } = useFetchStores();
  const { data: operators } = useFetchOperators();


const [formData, setFormData] = useState<Partial<Class>>({
    name: '',
    address: '',
    uniqueSymbol: '',
    monthlyBudget: 0,
    gender: 'בנים',
    description: '',
    chosenStore: undefined, 
    regularOperatorId: '',
    type: 'גן',
    institutionCode: '',
    institutionName: '',
    workers: [],
    education: 'רגיל',
    hasAfternoonCare: false,
    isActive: true,
    childresAmount: 0,
    AfternoonOpenDate: undefined,
    coordinatorId: '',
});
const [coordinators, setCoordinators] = useState<any[]>([]);
const [loadingCoordinators, setLoadingCoordinators] = useState(false);
useEffect(() => {
  const fetchCoordinators = async () => {
    setLoadingCoordinators(true);
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users?role=coordinator', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setCoordinators(await response.json());
    }
    setLoadingCoordinators(false);
  };
  fetchCoordinators();
}, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.education || !formData.gender || !formData.uniqueSymbol || !formData.institutionName || !formData.institutionCode || !formData.type) {
      alert('יש למלא את כל שדות החובה: שם, חינוך, מגדר, סמל קבוצה, שם מוסד, קוד מוסד, סוג קבוצה');
      return;
    }
    
    const cleanedFormData = { ...formData };
    if (!cleanedFormData.chosenStore || cleanedFormData.chosenStore === '') {
      delete cleanedFormData.chosenStore;
    }
    if (!cleanedFormData.regularOperatorId || cleanedFormData.regularOperatorId === '') {
      delete cleanedFormData.regularOperatorId;
    }
    if (!cleanedFormData.coordinatorId || cleanedFormData.coordinatorId === '') {
      delete cleanedFormData.coordinatorId;
    }
    
    addClassMutation.mutate(cleanedFormData as Class);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>הוספת כיתה</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="שם" name="name" value={formData.name} onChange={handleChange} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="כתובת" name="address" value={formData.address} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="סמל קבוצה" name="uniqueSymbol" value={formData.uniqueSymbol} onChange={handleChange} required /></Grid>
          <Grid item xs={6}><TextField
            select
            fullWidth
            label="סוג קבוצה"
            name="type"
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as 'כיתה' | 'גן';
              setFormData({
                ...formData,
                type: newType,
                monthlyBudget: newType === 'כיתה' ? 250 : 200
              });
            }}
            required
          >
            <MenuItem value="כיתה">כיתה</MenuItem>
            <MenuItem value="גן">גן</MenuItem>
          </TextField></Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="חינוך"
              name="education"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value as 'רגיל' | 'מיוחד' })}
              required
            >
              <MenuItem value="רגיל">רגיל</MenuItem>
              <MenuItem value="מיוחד">מיוחד</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="תקציב חודשי" name="monthlyBudget" type="number" value={formData.monthlyBudget} onChange={handleChange} /></Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="מגדר" name="gender" value={formData.gender} onChange={handleChange} required>
              <MenuItem value="בנים">בנים</MenuItem>
              <MenuItem value="בנות">בנות</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="תיאור" name="description" value={formData.description} onChange={handleChange} /></Grid>
          <Grid item xs={12}>
            <TextField select fullWidth label="חנות רכש" name="chosenStore" value={formData.chosenStore || ''} onChange={handleChange}>
              <MenuItem value="">בחר חנות</MenuItem>
              {stores?.map((s: any) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="שם מוסד" name="institutionName" value={formData.institutionName} onChange={handleChange} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="קוד מוסד" name="institutionCode" value={formData.institutionCode} onChange={handleChange} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="מספר ילדים" name="childresAmount" type="number" value={formData.childresAmount} onChange={handleChange} /></Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="תאריך פתיחת צהרון"
              name="AfternoonOpenDate"
              type="date"
              value={formData.AfternoonOpenDate ? String(formData.AfternoonOpenDate).substring(0,10) : ''}
              onChange={(e) => setFormData({ ...formData, AfternoonOpenDate: e.target.value ? new Date(e.target.value) : undefined })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="רכז"
              name="coordinatorId"
              value={formData.coordinatorId}
              onChange={handleChange}
              required
              disabled={loadingCoordinators}
            >
              <MenuItem value="">בחר רכז</MenuItem>
              {coordinators.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.firstName} {c.lastName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="פעיל"
              name="isActive"
              select
              fullWidth
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            >
              <MenuItem value="true">כן</MenuItem>
              <MenuItem value="false">לא</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="צהרון פעיל"
              name="hasAfternoonCare"
              select
              fullWidth
              value={formData.hasAfternoonCare ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, hasAfternoonCare: e.target.value === 'true' })}
            >
              <MenuItem value="true">כן</MenuItem>
              <MenuItem value="false">לא</MenuItem>
            </TextField>
          </Grid>
          
<Grid item xs={12}>
  <Autocomplete
    options={operators || []}
    getOptionLabel={(option) => `${option.firstName} ${option.lastName}` || ''}
    value={operators?.find((o: any) => o._id === formData.regularOperatorId) || null}
    onChange={(event, newValue) => {
      setFormData({
        ...formData,
        regularOperatorId: newValue ? newValue._id : ''
      });
    }}
    renderInput={(params) => (
      <TextField {...params} label="מפעיל קבוע" fullWidth />
    )}
    isOptionEqualToValue={(option, value) => option._id === value._id}
  />
</Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSubmit} variant="contained">הוספה</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClassDialog;
