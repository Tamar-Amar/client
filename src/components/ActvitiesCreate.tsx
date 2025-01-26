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

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => void; // Updated to handle multiple activities
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const [inputValue, setInputValue] = useState('');

  const [formData, setFormData] = useState<{
    classId: string;
    operatorId: string;
    dates: (Date | null)[]; // Array of dates
    description: string;
  }>({
    classId: '',
    operatorId: '',
    dates: [null, null, null, null, null], // Five date fields
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

  const handleSubmit = () => {
    const newActivities: Activity[] = formData.dates
      .filter((date) => date !== null) // Filter out null dates
      .map((date) => ({
        classId: formData.classId,
        operatorId: formData.operatorId,
        date: date!,
        description: formData.description,
      }));

    onAdd(newActivities);
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
    options={classes.sort((a: Class, b: Class) => a.uniqueSymbol.localeCompare(b.uniqueSymbol))} // ממיין לפי uniqueSymbol
    getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`} // תווית להצגה
    value={classes.find((cls: Class) => cls._id === formData.classId) || null} // הערך הנבחר
    onChange={(event, newValue) => {
      if (newValue) {
        setFormData((prev) => ({ ...prev, classId: newValue._id }));
      }
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="בחר קבוצה"
        variant="outlined"
        fullWidth
        margin="normal"
      />
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
