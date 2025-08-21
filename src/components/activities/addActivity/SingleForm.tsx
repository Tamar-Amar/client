import React, { useState } from 'react';
import {
  Box, Button, TextField, Autocomplete, Typography, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import { Activity, Class } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useQueryClient } from '@tanstack/react-query';
import PendingActivitiesDialog from './PendingActivitiesDialog';

interface SingleFormProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  selectedMonth: Date | null;
  paymentMonth: Date | null;
  operatorId: string;
}

interface SingleActivity {
  classId: string;
  dates: (Date | null)[];
  description: string;
}

const SingleForm: React.FC<SingleFormProps> = ({
  onAdd, onClose, selectedMonth, paymentMonth, operatorId
}) => {
  const { data: classes = [] } = useFetchClasses();
  const [singleActivities, setSingleActivities] = useState<SingleActivity[]>([
    { classId: '', dates: [null, null, null, null, null], description: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const queryClient = useQueryClient();

  const handleSingleChange = (index: number, field: keyof SingleActivity, value: any) => {
    const updated = [...singleActivities];
    updated[index][field] = value;
    setSingleActivities(updated);
  };

  const getMonthPayment = (date: Date | null) =>
    date ? `${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getFullYear() % 100).toString().padStart(2, '0')}` : '';

  const monthPayment = getMonthPayment(paymentMonth);

  const handleSubmit = () => {
    if (!operatorId || !paymentMonth) {
      alert('יש לבחור מפעיל וחודש תשלום');
      return;
    }
    const newActivities: Activity[] = [];
    singleActivities.forEach(a => {
      if (!a.classId) return;
      a.dates.filter(d => d !== null).forEach(d => {
        newActivities.push({
          classId: a.classId,
          operatorId,
          date: d!,
          description: a.description || 'הפעלה',
          monthPayment
        });
      });
    });
    setPendingActivities(newActivities);
    setShowSummary(true);
  };

  const confirmAdd = async () => {
    try {
      setIsLoading(true);
      await onAdd(pendingActivities);
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsLoading(false);
      setShowSummary(false);
      onClose();
    } catch (error) {
      setIsLoading(false);
      alert('שגיאה בשמירה');
    }
  };

  const addSingleRow = () =>
    setSingleActivities([...singleActivities, { classId: '', dates: [null, null, null, null, null], description: '' }]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <PendingActivitiesDialog
        open={showSummary}
        pendingActivities={pendingActivities}
        classes={classes}
        operators={[]} 
        operatorId={operatorId}
        onClose={() => setShowSummary(false)}
        onConfirm={confirmAdd}
      />
      <Box display="flex" flexDirection="column" gap={2}>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            {singleActivities.map((a, i) => (
              <Box key={i} p={2} border="1px solid #ccc" borderRadius={2}>
                <Autocomplete
                  options={classes}
                  getOptionLabel={(o: Class) => `${o.name} (${o.uniqueSymbol})`}
                  value={classes.find((c: Class) => c._id === a.classId) ?? null}
                  onChange={(e, v) =>
                    handleSingleChange(i, 'classId', v?._id ?? '')
                  }
                  renderInput={(p) => <TextField {...p} label="בחר סמל כיתה" />}
                />
                <Box display="flex" gap={1} overflow="auto" mt={2}>
                  {a.dates.map((d, j) => (
                    <DatePicker
                      key={j}
                      label={`תאריך ${j + 1}`}
                      value={d}
                      onChange={(nd) => {
                        const updated = [...a.dates];
                        updated[j] = nd;
                        handleSingleChange(i, 'dates', updated);
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
            <Button onClick={addSingleRow} variant="outlined">הוסף שורה</Button>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button onClick={onClose}>ביטול</Button>
              <Button variant="contained" onClick={handleSubmit}>שמור</Button>
            </Box>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default SingleForm;
