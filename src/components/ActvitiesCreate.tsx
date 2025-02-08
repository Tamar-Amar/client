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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { heIL } from '@mui/x-date-pickers/locales/heIL';
import { Activity } from '../types/Activity';
import { Class } from '../types/Class';
import { Operator } from '../types/Operator';
import { useFetchClasses } from '../queries/classQueries';
import { useFetchOperators } from '../queries/operatorQueries';
import { startOfMonth, endOfMonth, addDays, getDay } from 'date-fns';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => void;
  defaultOperatorId?: string;
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const [selectedOption, setSelectedOption] = useState<'weekly' | 'single'>('weekly');
  const [weeklyActivities, setWeeklyActivities] = useState<{ classId: string; dayOfWeek: string; description: string }[]>([
    { classId: '', dayOfWeek: '', description: '' },
  ]);
  const [singleActivities, setSingleActivities] = useState<{ classId: string; date: Date | null; description: string }[]>([
    { classId: '', date: null, description: '' },
  ]);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');

  const handleWeeklyChange = (index: number, field: 'classId' | 'dayOfWeek' | 'description', value: string) => {
    const updated = [...weeklyActivities];
    updated[index][field] = value;
    setWeeklyActivities(updated);
  };

  const handleSingleChange = (index: number, field: 'classId' | 'date' | 'description', value: any) => {
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
        dates.push(new Date(date));
      }
    }
    return dates;
  };

  const handleSubmit = () => {
    let newActivities: Activity[] = [];
    if (selectedOption === 'weekly') {
      weeklyActivities.forEach((activity) => {
        const calculatedDates = calculateWeeklyDates(activity.dayOfWeek);
        const activitiesForClass = calculatedDates.map((date) => ({
          classId: activity.classId,
          operatorId,
          date,
          description: activity.description,
        }));
        newActivities = [...newActivities, ...activitiesForClass];
      });
    } else if (selectedOption === 'single') {
      singleActivities.forEach((activity) => {
        if (activity.date) {
          newActivities.push({
            classId: activity.classId,
            operatorId,
            date: activity.date,
            description: activity.description,
          });
        }
      });
    }
    onAdd(newActivities);
    onClose();
  };

  const addWeeklyRow = () => setWeeklyActivities([...weeklyActivities, { classId: '', dayOfWeek: '', description: '' }]);
  const addSingleRow = () => setSingleActivities([...singleActivities, { classId: '', date: null, description: '' }]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} localeText={heIL.components.MuiLocalizationProvider.defaultProps.localeText}>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>דיווח נוכחות</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" disabled={!!defaultOperatorId}>
            <InputLabel>בחר מפעיל</InputLabel>
            <Select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  color: 'black',
                  backgroundColor: 'rgba(117, 214, 252, 0.37)',
                  WebkitTextFillColor: 'black',
                },
              }}
            >
              {operators.map((op: Operator) => (
                <MenuItem key={op._id} value={op._id}>
                  {op.firstName} {op.lastName}
                </MenuItem>
              ))}
            </Select>
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
              </FormControl>
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
              {singleActivities.map((activity, index) => (
                <Box display="flex" gap={2} mb={2} key={index}>
                  <Autocomplete
                    options={classes}
                    getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                    value={classes.find((cls:Class) => cls._id === activity.classId) || null}
                    onChange={(e, newValue) =>
                      handleSingleChange(index, 'classId', (newValue as Class)?._id || '')
                    }
                    renderInput={(params) => <TextField {...params} label="בחר סמל" />}
                    fullWidth
                  />
                  <DatePicker
                    label="בחר תאריך"
                    value={activity.date}
                    onChange={(newDate) => handleSingleChange(index, 'date', newDate)}
                  />
                  <TextField
                    label="תיאור פעילות"
                    value={activity.description}
                    onChange={(e) => handleSingleChange(index, 'description', e.target.value)}
                    fullWidth
                  />
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
