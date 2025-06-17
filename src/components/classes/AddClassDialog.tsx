import React, { useState } from 'react';
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
    chosenStore: 'לא נבחר',
    regularOperatorId: '',
    type: 'גן',
    institutionCode: '',
    institutionName: '',
    workerAfterNoonId1: '',
    workerAfterNoonId2: '',
    education: 'רגיל',
    hasAfternoonCare: false,
    isActive: true,
});


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
        addClassMutation.mutate(formData as Class);
        onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>הוספת כיתה</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="שם" name="name" value={formData.name} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="כתובת" name="address" value={formData.address} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="סמל קבוצה" name="uniqueSymbol" value={formData.uniqueSymbol} onChange={handleChange} /></Grid>
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
  value={formData.education ? 'מיוחד' : 'רגיל'}
  onChange={(e) => {
    const newEducation = e.target.value as 'רגיל' | 'מיוחד';
    setFormData({
      ...formData,
      education: newEducation
    });
  }}
>
  <MenuItem value="רגיל">רגיל</MenuItem>
  <MenuItem value="מיוחד">מיוחד</MenuItem>
</TextField></Grid>

          <Grid item xs={6}><TextField fullWidth label="תקציב חודשי" name="monthlyBudget" type="number" value={formData.monthlyBudget} onChange={handleChange} /></Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="מגדר" name="gender" value={formData.gender} onChange={handleChange}>
              <MenuItem value="בנים">בנים</MenuItem>
              <MenuItem value="בנות">בנות</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="תיאור" name="description" value={formData.description} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField select fullWidth label="חנות רכש" name="chosenStore" value={formData.chosenStore} onChange={handleChange}>
              {stores?.map((s: any) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
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
