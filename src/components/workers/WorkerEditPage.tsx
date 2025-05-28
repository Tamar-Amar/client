import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import { styled } from '@mui/material/styles';
import {
  Work,
  LocationOn,
  Phone,
  Email,
  CalendarMonth,
  AccountBalance,
  Badge,
  Schedule,
  Save,
  ArrowBack,
} from '@mui/icons-material';
import { Worker } from '../../types';
import { updateWorker } from '../../services/WorkerService';
import WeeklyScheduleSelect from '../WeeklyScheduleSelect';
import { Class } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useFetchClasses } from '../../queries/classQueries';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  height: '100%',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.warning.light,
    borderRadius: 1.5,
  },
}));

interface WorkerEditPageProps {
  worker: Worker | null;
}

const API_BASE_URL = 'http://localhost:5000/api';

const WorkerEditPage: React.FC<WorkerEditPageProps> = ({ worker }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: classes = [] } = useFetchClasses();
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
      isActive: true,
      registrationDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
      status: 'לא נבחר',
      jobType: 'לא נבחר',
      jobTitle: 'לא נבחר',
    }
  );

  useEffect(() => {
    if (worker) {
      setFormData(worker);
    }
  }, [worker]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const updatedWorker = {
        ...formData,
        _id: worker?._id || '',
        bankDetails: formData.bankDetails || {
          bankName: '',
          branchNumber: '',
          accountNumber: '',
          accountOwner: '',
        },
      };
      await updateWorker(worker?._id || '', updatedWorker);
      navigate('/workers');
    } catch (error) {
      console.error('Error updating worker:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value,
      },
    }));
  };

  const handleWeeklyScheduleChange = (day: string, selectedClasses: string[]) => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: [
        ...(prev.weeklySchedule || []).filter((schedule) => schedule.day !== day),
        { day: day as any, classes: selectedClasses },
      ].sort((a, b) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
        return days.indexOf(a.day) - days.indexOf(b.day);
      }),
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/workers')} sx={{ color: theme.palette.primary.main }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            עריכת פרטי עובד
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Row 1: Personal and Contact Info */}
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <SectionTitle>
                  <Badge />
                  פרטים אישיים
                </SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="תעודת זהות"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="שם משפחה"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="שם פרטי"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
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
              </StyledPaper>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledPaper>
                <SectionTitle>
                  <Phone />
                  פרטי התקשרות
                </SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="טלפון"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="אימייל"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </StyledPaper>
            </Grid>

            {/* Row 2: Address and Bank Details */}
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <SectionTitle>
                  <LocationOn />
                  כתובת
                </SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="עיר"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="רחוב"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      required
                      label="מספר בית"
                      name="buildingNumber"
                      value={formData.buildingNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="מספר דירה"
                      name="apartmentNumber"
                      value={formData.apartmentNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </StyledPaper>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledPaper>
                <SectionTitle>
                  <AccountBalance />
                  פרטי בנק
                </SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="שם בנק"
                      name="bankName"
                      value={formData.bankDetails?.bankName}
                      onChange={handleBankDetailsChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="מספר סניף"
                      name="branchNumber"
                      value={formData.bankDetails?.branchNumber}
                      onChange={handleBankDetailsChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="מספר חשבון"
                      name="accountNumber"
                      value={formData.bankDetails?.accountNumber}
                      onChange={handleBankDetailsChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="שם בעל החשבון"
                      name="accountOwner"
                      value={formData.bankDetails?.accountOwner}
                      onChange={handleBankDetailsChange}
                    />
                  </Grid>
                </Grid>
              </StyledPaper>
            </Grid>

            {/* Row 3: Employment Details and Weekly Schedule */}
            <Grid item xs={12}>
              <StyledPaper>
                <SectionTitle>
                  <Work />
                  פרטי העסקה וסמלי כיתות
                </SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
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
                  <Grid item xs={12} sm={8}>
                    <Autocomplete
                      multiple
                      size="small"
                      options={classes}
                      value={classes.filter((cls: Class) =>
                        formData.workingSymbols?.includes(cls._id || '')
                      )}
                      onChange={(_, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          workingSymbols: newValue.map((cls) => cls._id || ''),
                        }));
                      }}
                      getOptionLabel={(option) =>
                        `${option.uniqueSymbol || ''} - ${option.name}`
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="סמלי כיתות קבועים" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            size="small"
                            label={`${option.uniqueSymbol || ''} - ${option.name}`}
                            {...getTagProps({ index })}
                            sx={{
                              backgroundColor: theme.palette.primary.light,
                              color: theme.palette.primary.contrastText,
                            }}
                          />
                        ))
                      }
                    />
                  </Grid>
                </Grid>
              </StyledPaper>
            </Grid>

            <Grid item xs={12}>
              <StyledPaper>
                <SectionTitle>
                  <Schedule />
                  מערכת שעות שבועית
                </SectionTitle>
                <Grid container spacing={2}>
                  {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'].map((day) => (
                    <Grid item xs={12} sm={6} md={2.4} key={day}>
                      <WeeklyScheduleSelect
                        day={day}
                        selectedClasses={
                          formData.weeklySchedule?.find(
                            (schedule) => schedule.day === day
                          )?.classes || []
                        }
                        allClasses={classes}
                        workerClasses={classes.filter((cls: Class) =>
                          formData.workingSymbols?.includes(cls._id || '')
                        )}
                        onChange={handleWeeklyScheduleChange}
                      />
                    </Grid>
                  ))}
                </Grid>
              </StyledPaper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/workers')}
              startIcon={<ArrowBack />}
            >
              חזרה
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Save />}
            >
              שמירת שינויים
            </Button>
          </Box>
        </form>
      </Container>
    </Box>
  );
};

export default WorkerEditPage; 