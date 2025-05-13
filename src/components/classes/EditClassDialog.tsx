import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Autocomplete } from '@mui/material';
import { useUpdateClass } from '../../queries/classQueries';
import { useFetchContacts } from '../../queries/contactQueries';
import { useFetchStores } from '../../queries/storeQueries';
import { useFetchOperators } from '../../queries/operatorQueries';

const EditClassDialog = ({ classData, onClose }: any) => {
  const updateClassMutation = useUpdateClass();
  const { data: contacts } = useFetchContacts();
  const { data: stores } = useFetchStores();
  const { data: operators } = useFetchOperators();
  const [formData, setFormData] = useState({ ...classData });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    updateClassMutation.mutate({ id: classData._id, updatedClass: formData });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>עריכת כיתה</DialogTitle>
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
            name="isSpecialEducation"
            value={formData.isSpecialEducation ? 'מיוחד' : 'רגיל'}
            onChange={(e) => setFormData({
              ...formData,
              isSpecialEducation: e.target.value === 'מיוחד'
            })}
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
          <Grid item xs={12}><TextField fullWidth label="תיאור" name="description" value={formData.description} onChange={handleChange} /></Grid>
          <Grid item xs={12}>
            <TextField select fullWidth label="איש קשר" name="contactsId" value={formData.contactsId?.[0] || ''} onChange={(e) => setFormData({ ...formData, contactsId: [e.target.value] })}>
              {contacts?.map((c: any) => (<MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>))}
            </TextField>
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
    value={formData.regularOperatorId}
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
        <Button onClick={handleSubmit} variant="contained">שמירה</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClassDialog;
