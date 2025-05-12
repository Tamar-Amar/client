// components/Activities/AddActivity/SingleForm.tsx
import React, { useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Typography, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { heIL } from '@mui/x-date-pickers/locales/heIL';
import { Activity, Class, Operator } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperators } from '../../../queries/operatorQueries';
import { useQueryClient } from '@tanstack/react-query';

interface SingleFormProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  defaultOperatorId?: string;
}

const SingleForm: React.FC<SingleFormProps> = ({ onAdd, onClose, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const [singleActivities, setSingleActivities] = useState<{ classId: string; dates: (Date | null)[]; description: string }[]>([
    { classId: '', dates: [null, null, null, null, null], description: '' },
  ]);
  const [singlePaymentMonth, setSinglePaymentMonth] = useState<Date | null>(new Date());
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');
  const [isLoading, setIsLoading] = useState(false); 
  const queryClient = useQueryClient();



  const handleSingleChange = (index: number, field: 'classId' | 'dates' | 'description', value: any) => {
    const updated = [...singleActivities];
    updated[index][field] = value;
    setSingleActivities(updated);
  };

  const getMonthPayment = (date: Date | null): string => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const year = date.getFullYear() % 100;
    return `${month.toString().padStart(2, '0')}-${year.toString().padStart(2, '0')}`;
  };

  const monthPayment = getMonthPayment(singlePaymentMonth);

  const handleSubmit = async () => {
    if (!operatorId) {
      alert('יש לבחור מפעיל');
      return;
    }

    if (!singlePaymentMonth) {
      alert('יש לבחור חודש תשלום');
      return;
    }

    let newActivities: Activity[] = [];

    for (const activity of singleActivities) {
      if (!activity.classId) continue;

      const validDates = activity.dates.filter((d) => d !== null);
      if (validDates.length === 0) continue;

      validDates.forEach((date) => {
        newActivities.push({
          classId: activity.classId,
          operatorId,
          date: date!,
          description: activity.description,
          monthPayment,
        });
      });
    }

    try {
      setIsLoading(true);  
      await onAdd(newActivities);  
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsLoading(false); 
      onClose();
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('שגיאה בשמירת ההפעלות');
    }
  };

  const addSingleRow = () => setSingleActivities([...singleActivities, { classId: '', dates: [null, null, null, null, null], description: '' }]);

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
            <Autocomplete
              options={[...operators].sort((a, b) => a.lastName.localeCompare(b.lastName))}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName} (${option.id})`}
              value={operators.find((op: Operator) => op._id === operatorId) || null}
              onChange={(event, newValue) => setOperatorId(newValue ? newValue._id : '')}
              renderInput={(params) => <TextField {...params} label="בחר מפעיל" />}
              fullWidth
            />

            <Box>
              <DatePicker
                views={['year', 'month']}
                label="בחר חודש תשלום"
                value={singlePaymentMonth}
                onChange={(newMonth) => setSinglePaymentMonth(newMonth)}
              />
              <Typography mt={1}><strong>חודש תשלום:</strong> {monthPayment}</Typography>
            </Box>

            {singleActivities.map((activity, index) => (
              <Box key={index} display="flex" flexDirection="column" gap={1} p={2} border="1px solid #ccc" borderRadius={2}>
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
                <Box display="flex" gap={1} sx={{ overflowX: 'auto' }}>
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
                      sx={{ minWidth: 120 }}
                    />
                  ))}
                </Box>
              </Box>
            ))}

            <Button onClick={addSingleRow} variant="outlined">הוסף שורה</Button>

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

export default SingleForm;
