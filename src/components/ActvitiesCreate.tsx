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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Activity } from '../types/Activity';
import { Class } from '../types/Class';
import { Operator } from '../types/Operator';
import { useFetchClasses } from '../queries/classQueries';
import { useFetchOperators } from '../queries/operatorQueries';
import { SelectChangeEvent } from '@mui/material';
import { heIL } from '@mui/x-date-pickers/locales/heIL';
import { startOfMonth, endOfMonth, addDays, getDay } from 'date-fns';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => void;
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const [useWeekly, setUseWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    classIds: string[];
    operatorId: string;
    dates: (Date | null)[];
    description: string;
  }>({
    classIds: [],
    operatorId: '',
    dates: [null, null, null, null, null],
    description: '',
  });

  const handleChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (index: number, date: Date | null) => {
    setFormData((prev) => {
      const updatedDates = [...prev.dates];
      updatedDates[index] = date;
      return { ...prev, dates: updatedDates };
    });
  };

  const handleWeeklyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseWeekly(event.target.checked);
  };

  const handleDaySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedDays((prev) => [...prev, value]);
    } else {
      setSelectedDays((prev) => prev.filter((day) => day !== value));
    }
  };

  const calculateWeeklyDates = (): Date[] => {
    const dates: Date[] = [];
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    for (let date = start; date <= end; date = addDays(date, 1)) {
      if (selectedDays.includes(getDay(date).toString())) {
        dates.push(new Date(date));
      }
    }
    return dates;
  };

  const handleSubmit = () => {
    let newActivities: Activity[] = [];
  
    formData.classIds.forEach((classId) => {
      if (useWeekly) {
        const calculatedDates = calculateWeeklyDates();
        const activitiesForClass = calculatedDates.map((date) => ({
          classId,
          operatorId: formData.operatorId,
          date,
          description: formData.description,
        }));
        newActivities = [...newActivities, ...activitiesForClass];
      } else {
        const activitiesForClass = formData.dates
          .filter((date) => date !== null)
          .map((date) => ({
            classId,
            operatorId: formData.operatorId,
            date: date!,
            description: formData.description,
          }));
        newActivities = [...newActivities, ...activitiesForClass];
      }
    });
  
    onAdd(newActivities); // שולחים את כל הפעילויות שנוצרו
    onClose();
  };
  
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      localeText={heIL.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>הוספת פעילות חדשה</DialogTitle>
        <DialogContent>
        <FormControl fullWidth margin="normal">
  <Autocomplete
    multiple
    options={classes.sort((a: Class, b: Class) =>
      a.uniqueSymbol.localeCompare(b.uniqueSymbol)
    )}
    getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
    value={classes.filter((cls: Class) => 
      cls._id && formData.classIds.includes(cls._id)
    ) || []}
    
    onChange={(event, newValue) => {
      if (newValue.length <= 3) { // מאפשר בחירה של עד 3 סמלים
        setFormData((prev) => ({
          ...prev,
          classIds: newValue.map((cls) => cls._id as string),
        }));        
      }
    }}
    renderInput={(params) => (
      <TextField {...params} label="בחר עד 3 קבוצות" variant="outlined" fullWidth margin="normal" />
    )}
  />
</FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>בחר מפעיל</InputLabel>
            <Select name="operatorId" value={formData.operatorId} onChange={handleChange}>
              {operators
                .sort((a: Operator, b: Operator) => a.lastName.localeCompare(b.lastName))
                .map((op: Operator) => (
                  <MenuItem key={op._id} value={op._id}>
                    {op.firstName} {op.lastName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={useWeekly} onChange={handleWeeklyChange} />}
            label="בוצעה הפעלה פעם בשבוע במהלך החודש, בימי:"
          />
          {useWeekly ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['0', '1', '2', '3', '4'].map((day) => (
                <FormControlLabel
                    key={day}
                    control={
                    <Checkbox
                        checked={selectedDays.includes(day)}
                        onChange={(event) => {
                        const { value, checked } = event.target;
                        setSelectedDays(checked ? [value] : []); // מאפשר בחירה של יום אחד בלבד
                        }}
                        value={day}
                    />
                    }
                    label={['א', 'ב', 'ג', 'ד', 'ה'][parseInt(day)]} // מייצג ימים ראשון עד חמישי
                />
                ))}
            </div>
          ) : (
            <div>
                <p>או:</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {formData.dates.map((date, index) => (
                <DatePicker
                  key={index}
                  label={`תאריך ${index + 1}`}
                  value={date}
                  onChange={(date) => handleDateChange(index, date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              ))}
            </div>
            </div>
          )}
          <TextField
            name="description"
            label="תיאור הפעילות"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            fullWidth
            margin="normal"
          />
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
