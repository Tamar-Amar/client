import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Tab,
  Tabs,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Autocomplete,
  Chip
} from '@mui/material';
import { Worker } from '../types';
import { updateWorker } from '../services/WorkerService';
import WeeklyScheduleSelect from './WeeklyScheduleSelect';
import { Class } from '../types';
import CancelIcon from '@mui/icons-material/Cancel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface WorkerEditDialogProps {
  worker: Worker | null;
  open: boolean;
  onClose: () => void;
}

const WorkerEditDialog: React.FC<WorkerEditDialogProps> = ({ worker, open, onClose }) => {
  const [formData, setFormData] = useState<Worker>(
    worker || {
      _id: '',
      id: '',
      firstName: '',
      lastName: '',
      city: '',
      street: '',
      buildingNumber: '',
      paymentMethod: 'תלוש',
      phone: '',
      isActive: true
    }
  );
  const [tabValue, setTabValue] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (worker) {
      setFormData(worker);
    }
    // Load classes when component mounts
    loadClasses();
  }, [worker]);

  const loadClasses = async () => {
    try {
      // Add your API call to fetch classes here
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const updatedWorker = {
        ...formData,
        _id: worker?._id || '', // Make sure we have the correct ID
        bankDetails: formData.bankDetails || {
          bankName: '',
          branchNumber: '',
          accountNumber: '',
          accountOwner: ''
        }
      };
      await updateWorker(worker?._id || '', updatedWorker);
      onClose();
    } catch (error) {
      console.error('Error updating worker:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleWeeklyScheduleChange = (day: string, selectedClasses: string[]) => {
    setFormData(prev => ({
      ...prev,
      weeklySchedule: [
        ...(prev.weeklySchedule || []).filter(schedule => schedule.day !== day),
        { day: day as any, classes: selectedClasses }
      ].sort((a, b) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
        return days.indexOf(a.day) - days.indexOf(b.day);
      })
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>עריכת פרטי עובד</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="פרטים אישיים" />
            <Tab label="כתובת" />
            <Tab label="פרטי בנק" />
            <Tab label="פרטי תשלום" />
            <Tab label="מערכת שבועית" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="תעודת זהות"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="שם משפחה"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="שם פרטי"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="טלפון"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="אימייל"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="תאריך לידה"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate?.split('T')[0]}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="עיר"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="רחוב"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="מספר בית"
                  name="buildingNumber"
                  value={formData.buildingNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="מספר דירה"
                  name="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="שם בנק"
                  name="bankName"
                  value={formData.bankDetails?.bankName}
                  onChange={handleBankDetailsChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="מספר סניף"
                  name="branchNumber"
                  value={formData.bankDetails?.branchNumber}
                  onChange={handleBankDetailsChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="מספר חשבון"
                  name="accountNumber"
                  value={formData.bankDetails?.accountNumber}
                  onChange={handleBankDetailsChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="שם בעל החשבון"
                  name="accountOwner"
                  value={formData.bankDetails?.accountOwner}
                  onChange={handleBankDetailsChange}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>אופן תשלום</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange(e as any)}
                  >
                    <MenuItem value="חשבונית">חשבונית</MenuItem>
                    <MenuItem value="תלוש">תלוש</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  סמלי כיתות קבועים של העובד
                </Typography>
                <Autocomplete
                  multiple
                  options={classes}
                  value={classes.filter(cls => formData.workingSymbols?.includes(cls._id || ''))}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      workingSymbols: newValue.map(cls => cls._id || '')
                    }));
                  }}
                  getOptionLabel={(option) => `${option.uniqueSymbol || ''} - ${option.name}`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="בחר כיתות"
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option._id}
                        label={`${option.uniqueSymbol || ''} - ${option.name}`}
                        onDelete={() => {
                          const newSymbols = (formData.workingSymbols || []).filter(id => id !== option._id);
                          setFormData(prev => ({
                            ...prev,
                            workingSymbols: newSymbols
                          }));
                        }}
                        deleteIcon={<CancelIcon />}
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              מערכת שעות שבועית
            </Typography>
            <Grid container spacing={2}>
              {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'].map((day) => (
                <Grid item xs={12} key={day}>
                  <WeeklyScheduleSelect
                    day={day}
                    selectedClasses={
                      formData.weeklySchedule?.find(schedule => schedule.day === day)?.classes || []
                    }
                    allClasses={classes}
                    workerClasses={classes.filter(cls => formData.workingSymbols?.includes(cls._id || ''))}
                    onChange={handleWeeklyScheduleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>ביטול</Button>
          <Button type="submit" variant="contained" color="primary">
            שמירה
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WorkerEditDialog; 