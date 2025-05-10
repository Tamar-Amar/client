import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { heIL } from '@mui/x-date-pickers/locales/heIL';
import { Activity } from '../../types';
import { Class } from '../../types';
import { Operator } from '../../types';
import { useFetchClasses } from '../../queries/classQueries';
import { useFetchOperators } from '../../queries/operatorQueries';
import { addDays, getDay } from 'date-fns';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => void;
  defaultOperatorId?: string;
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const [excludeHanukkah, setExcludeHanukkah] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'weekly' | 'single'>('weekly');
  const [weeklyActivities, setWeeklyActivities] = useState<{ classId: string; dayOfWeek: string; description: string }[]>([
    { classId: '', dayOfWeek: '', description: 'הפעלה' },
  ]);
  const [singleActivities, setSingleActivities] = useState<{ classId: string; dates: (Date | null)[]; description: string }[]>([
    { classId: '', dates: [null, null, null, null, null], description: '' },
  ]);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');
  const [singlePaymentMonth, setSinglePaymentMonth] = useState<Date | null>(null);


  const handleWeeklyChange = (index: number, field: 'classId' | 'dayOfWeek' | 'description', value: string) => {
    const updated = [...weeklyActivities];
    updated[index][field] = value;
    setWeeklyActivities(updated);
  };

  const handleSingleChange = (index: number, field: 'classId' | 'dates' | 'description', value: any) => {
    const updated = [...singleActivities];
    updated[index][field] = value;
    setSingleActivities(updated);
  };

  const calculateWeeklyDates = (dayOfWeek: string): Date[] => {
    if (!selectedMonth) return [];
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 26);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 25);
    const dates: Date[] = [];

    for (let date = start; date <= end; date = addDays(date, 1)) {
      if (getDay(date).toString() === dayOfWeek) {
        if (
          excludeHanukkah &&
          date >= new Date(selectedMonth.getFullYear() - 1, 11, 29) &&
          date <= new Date(selectedMonth.getFullYear(), 0, 2)
        ) {
          continue;
        }
        dates.push(new Date(date));
      }
    }
    return dates;
  };

  const getMonthPayment = (date: Date): string => {
  const month = date.getMonth() + 1; 
  const year = date.getFullYear() % 100;
  return `${month.toString().padStart(2, '0')}-${year.toString().padStart(2, '0')}`;
};
 const monthPayment = selectedMonth ? getMonthPayment(selectedMonth) : getMonthPayment(new Date());

  const handleSubmit = () => {
    let newActivities: Activity[] = [];
  
    if (!operatorId) {
      alert('יש לבחור מפעיל');
      return;
    }
  
    if (selectedOption === 'weekly') {
      for (const activity of weeklyActivities) {
        if (!activity.classId || activity.dayOfWeek === '' ) {
          alert('יש למלא את כל השדות בכל השורות (סמל, יום, תיאור)');
          return;
        }
  
        const calculatedDates = calculateWeeklyDates(activity.dayOfWeek);
       
        const activitiesForClass = calculatedDates.map((date) => ({
          classId: activity.classId,
          operatorId,
          date,
          description: activity.description,
          monthPayment,
        }));

  
        newActivities = [...newActivities, ...activitiesForClass];
      }
    } else if (selectedOption === 'single') {
      for (const activity of singleActivities) {
        if (!activity.classId ) {
          alert('יש לבחור סמל מוסד בכל השורות');
          return;
        }
  
        const validDates = activity.dates.filter((d) => d !== null);
        if (validDates.length === 0) {
          alert('יש לבחור לפחות תאריך אחד לכל שורה בדיווח יחיד');
          return;
        }
  
        validDates.forEach((date) => {
          newActivities.push({
            classId: activity.classId,
            operatorId,
            date: date!,
            description: activity.description,
            monthPayment: monthPayment,
          });
        });

      }
    }
  
    if (selectedOption === 'single' && !singlePaymentMonth) {
        alert('יש לבחור חודש תשלום בדיווח יחיד');
        return;
      }

    onAdd(newActivities);
    setWeeklyActivities([{ classId: '', dayOfWeek: '', description: 'פעילות' }]);
    setSingleActivities([{ classId: '', dates: [null, null, null, null, null], description: 'פעילות' }]);
    setOperatorId('');
    setSelectedMonth(new Date());
    setSelectedOption('weekly');
    onClose();
  };
  
  const addWeeklyRow = () => setWeeklyActivities([...weeklyActivities, { classId: '', dayOfWeek: '', description: 'פעילות' }]);
  const addSingleRow = () => setSingleActivities([...singleActivities, { classId: '', dates: [null, null, null, null, null], description: 'פעילות' }]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} localeText={heIL.components.MuiLocalizationProvider.defaultProps.localeText}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>דיווח נוכחות</DialogTitle>
        <DialogContent>
        <FormControl fullWidth margin="normal" disabled={!!defaultOperatorId}>
          <Autocomplete
            options={[...operators].sort((a, b) => a.lastName.localeCompare(b.lastName))}
            getOptionLabel={(option) => `${option.lastName}  ${option.firstName} (${option.id})`} 
            value={operators.find((op:Operator) => op._id === operatorId) || null} 
            onChange={(event, newValue) => setOperatorId(newValue ? newValue._id : '')} 
            renderInput={(params) => <TextField {...params} label="בחר מפעיל" />}
            fullWidth
          />
        </FormControl>

          <Box mb={2}>
            <RadioGroup
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value as 'weekly' | 'single')}
              row
            >
              <FormControlLabel value="weekly" control={<Radio />} label="דיווח שבועי" />
              <FormControlLabel value="single" control={<Radio />} label="דיווח יחיד" />
            </RadioGroup>
          </Box>

          {selectedOption === 'weekly' && (
            <>
            <p>שים לב- בדיווח שבועי ידווחו הפעלות בסמלים הנבחרים, לפי היום הנבחר, בכל שבוע לאורך חודש הנוכחות</p>
              <FormControl fullWidth margin="normal">
                <DatePicker
                  views={['year', 'month']}
                  label="בחר חודש לדיווח נוכחות"
                  value={selectedMonth}
                  onChange={(newMonth) => setSelectedMonth(newMonth)}
                />
                {selectedMonth && (
                  <Box mt={1}>
                    <strong>חודש תשלום:</strong> {getMonthPayment(selectedMonth)}
                  </Box>
                )}
              </FormControl>
              {selectedMonth?.getMonth() === 0 && (
            <FormControlLabel
              control={<Checkbox checked={excludeHanukkah} onChange={(e) => setExcludeHanukkah(e.target.checked)} />}
              label="אין לרשום פעילויות בחג החנוכה"
            />
          )}
              {weeklyActivities.map((activity, index) => (
                <Box display="flex" gap={2} mb={2} key={index}>
                  <Autocomplete
                    options={classes}
                    getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                    value={classes.find((cls:Class) => cls._id === activity.classId) || null}
                    onChange={(e, newValue) =>
                      handleWeeklyChange(index, 'classId', (newValue as Class)?._id || '')
                    }
                    
                    renderInput={(params) => <TextField {...params} label="בחר סמל" />}
                    fullWidth
                    sx={{ width: '170%' }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>יום בשבוע</InputLabel>
                    <Select
                      value={activity.dayOfWeek}
                      onChange={(e) => handleWeeklyChange(index, 'dayOfWeek', e.target.value)}
                    >
                      {['א', 'ב', 'ג', 'ד', 'ה'].map((day, idx) => (
                        <MenuItem value={idx.toString()} key={idx}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="תיאור פעילות"
                    value={activity.description}
                    onChange={(e) => handleWeeklyChange(index, 'description', e.target.value)}
                    fullWidth
                  />
                </Box>
              ))}
              <Button onClick={addWeeklyRow} variant="outlined">
                הוסף שורה
              </Button>
            </>
          )}

          {selectedOption === 'single' && (
            <>
            <FormControl fullWidth margin="normal">
            <DatePicker
              views={['year', 'month']}
              label="בחר חודש תשלום"
              value={singlePaymentMonth}
              onChange={(newMonth) => setSinglePaymentMonth(newMonth)}
            />
          </FormControl>
          {singlePaymentMonth && (
            <Box mt={1}>
              <strong>חודש תשלום שנבחר:</strong> {getMonthPayment(singlePaymentMonth)}
            </Box>
          )}

             {singleActivities.map((activity, index) => (
              <Box key={index} display="flex" flexDirection="column" gap={2} mb={2}>
                {/* שורה ראשונה - בחירת סמל */}
                <Box display="flex" justifyContent="center">
                  <Autocomplete
                    options={classes}
                    getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                    value={classes.find((cls: Class) => cls._id === activity.classId) || null}
                    onChange={(e, newValue) =>
                      handleSingleChange(index, 'classId', (newValue as Class)?._id || '')
                    }
                    renderInput={(params) => <TextField {...params} label="בחר סמל" />}
                    fullWidth
                  />
                </Box>

                <Box display="flex" gap={2} justifyContent="center">
                  {activity.dates.map((date, dateIndex) => (
                    <DatePicker
                      key={dateIndex}
                      label={`תאריך ${dateIndex + 1}`}
                      value={date}
                      onChange={(newDate) => {
                        const updatedDates = [...activity.dates];
                        updatedDates[dateIndex] = newDate;
                        handleSingleChange(index, 'dates', updatedDates);
                      }}
                      sx={{ minWidth: 150, flexGrow: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            ))}

              <Button onClick={addSingleRow} variant="outlined">
                הוסף שורה
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>ביטול</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddActivity;
