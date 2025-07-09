import React from 'react';
import {
  FormControl,
  Autocomplete,
  TextField,
  Chip
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { Class } from '../../types';

interface WeeklyScheduleSelectProps {
  day: string;
  selectedClasses: string[];
  allClasses: Class[];
  workerClasses?: (string | Class)[]; 
  onChange: (day: string, classes: string[]) => void;
}

const WeeklyScheduleSelect: React.FC<WeeklyScheduleSelectProps> = ({
  day,
  selectedClasses,
  allClasses,
  workerClasses,
  onChange
}) => {
  
  const availableClasses = workerClasses 
    ? allClasses.filter(cls => {
        if (!workerClasses) return true;
        return workerClasses.some(wc => {
          
          if (typeof wc === 'string') return wc === cls._id;
          
          return wc._id === cls._id;
        });
      })
    : allClasses;

      
  const selectedClassObjects = selectedClasses
    .map(id => allClasses.find(c => c._id === id))
    .filter((c): c is Class => c !== undefined);

  return (
    <FormControl fullWidth>
      <Autocomplete
        multiple
        value={selectedClassObjects}
        onChange={(_, newValue) => {
          onChange(day, newValue.map(cls => cls._id || ''));
        }}
        options={availableClasses}
        getOptionLabel={(option) => `${option.uniqueSymbol || ''} - ${option.name}`}
        renderInput={(params) => (
          <TextField
            {...params}
            label={day}
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
                const newSelected = selectedClasses.filter(id => id !== option._id);
                onChange(day, newSelected);
              }}
              deleteIcon={<CancelIcon />}
            />
          ))
        }
      />
    </FormControl>
  );
};

export default WeeklyScheduleSelect; 