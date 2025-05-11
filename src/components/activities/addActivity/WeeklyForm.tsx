// components/Activities/AddActivity/WeeklyForm.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { heIL } from '@mui/x-date-pickers/locales/heIL';
import { addDays, getDay } from 'date-fns';
import { Activity, Class, Operator } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperators } from '../../../queries/operatorQueries';

interface WeeklyFormProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  defaultOperatorId?: string;
}

const WeeklyForm: React.FC<WeeklyFormProps> = ({ onAdd, onClose, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();

  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [excludeHanukkah, setExcludeHanukkah] = useState(false);
  const [weeklyActivities, setWeeklyActivities] = useState<{ classId: string; dayOfWeek: string; description: string }[]>([
    { classId: '', dayOfWeek: '', description: 'הפעלה' },
  ]);
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');
  const [isLoading, setIsLoading] = useState(false);   // ✅ חדש

  const handleWeeklyChange = (index: number, field: 'classId' | 'dayOfWeek' | 'description', value: string) => {
    const updated = [...weeklyActivities];
    updated[index][field] = value;
    setWeeklyActivities(updated);
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

  const getMonthPayment = (date: Date | null): string => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const year = date.getFullYear() % 100;
    return `${month.toString().padStart(2, '0')}-${year.toString().padStart(2, '0')}`;
  };

  const monthPayment = getMonthPayment(selectedMonth);

  const handleSubmit = async () => {
    if (!operatorId) {
      alert('יש לבחור מפעיל');
      return;
    }

    let newActivities: Activity[] = [];

    for (const activity of weeklyActivities) {
      if (!activity.classId || activity.dayOfWeek === '') {
        alert('יש למלא את כל השדות בכל השורות');
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

    try {
      setIsLoading(true);  // ✅ התחלת טעינה
      await onAdd(newActivities);  // מחכה ל-onAdd
      setIsLoading(false);         // ✅ סיום טעינה
      onClose();
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('שגיאה בשמירת ההפעלות');
    }
  };

  const addWeeklyRow = () => setWeeklyActivities([...weeklyActivities, { classId: '', dayOfWeek: '', description: 'הפעלה' }]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} localeText={heIL.components.MuiLocalizationProvider.defaultProps.localeText}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading && (
          <>
            <FormControl fullWidth disabled={!!defaultOperatorId}>
              <Autocomplete
                options={[...operators].sort((a, b) => a.lastName.localeCompare(b.lastName))}
                getOptionLabel={(option) => `${option.lastName} ${option.firstName} (${option.id})`}
                value={operators.find((op: Operator) => op._id === operatorId) || null}
                onChange={(event, newValue) => setOperatorId(newValue ? newValue._id : '')}
                renderInput={(params) => <TextField {...params} label="בחר מפעיל" />}
                fullWidth
              />
            </FormControl>

            <Box>
              <DatePicker
                views={['year', 'month']}
                label="בחר חודש לדיווח"
                value={selectedMonth}
                onChange={(newMonth) => setSelectedMonth(newMonth)}
              />
              <Typography mt={1}><strong>חודש תשלום:</strong> {monthPayment}</Typography>
            </Box>

            {selectedMonth?.getMonth() === 0 && (
              <FormControlLabel
                control={<Checkbox checked={excludeHanukkah} onChange={(e) => setExcludeHanukkah(e.target.checked)} />}
                label="אין לרשום פעילויות בחג החנוכה"
              />
            )}

            {weeklyActivities.map((activity, index) => (
              <Box key={index} display="flex" gap={2} alignItems="center">
                <Autocomplete
                  options={classes}
                  getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                  value={classes.find((cls: Class) => cls._id === activity.classId) || null}
                  onChange={(e, newValue) =>
                    handleWeeklyChange(index, 'classId', (newValue as Class)?._id || '')
                  }
                  renderInput={(params) => <TextField {...params} label="בחר סמל" />}
                  sx={{ minWidth: 200 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>יום בשבוע</InputLabel>
                  <Select
                    value={activity.dayOfWeek}
                    onChange={(e) => handleWeeklyChange(index, 'dayOfWeek', e.target.value)}
                    label="יום בשבוע"
                  >
                    {['0', '1', '2', '3', '4'].map((day) => (
                      <MenuItem value={day} key={day}>
                        {'אבגדה'.charAt(Number(day))}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="תיאור פעילות"
                  value={activity.description}
                  onChange={(e) => handleWeeklyChange(index, 'description', e.target.value)}
                  sx={{ minWidth: 200 }}
                />
              </Box>
            ))}

            <Button onClick={addWeeklyRow} variant="outlined">הוסף שורה</Button>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button onClick={onClose}>ביטול</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                שמור
              </Button>
            </Box>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default WeeklyForm;
