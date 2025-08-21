import React, { useState } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select,
  TextField, Autocomplete, Checkbox, FormControlLabel, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { addDays, getDay } from 'date-fns';
import { Activity, Class } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useQueryClient } from '@tanstack/react-query';
import PendingActivitiesDialog from './PendingActivitiesDialog';

interface WeeklyFormProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  selectedMonth: Date | null;
  paymentMonth: Date | null;
  operatorId: string;
}

const WeeklyForm: React.FC<WeeklyFormProps> = ({
  onAdd, onClose, selectedMonth, paymentMonth, operatorId
}) => {
  const { data: classes = [] } = useFetchClasses();
  const queryClient = useQueryClient();
  const [excludeHanukkah, setExcludeHanukkah] = useState(false);
  const [weeklyActivities, setWeeklyActivities] = useState([{ classId: '', dayOfWeek: '', description: 'הפעלה' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const calculateWeeklyDates = (day: string) => {
    if (!selectedMonth) return [];
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 26);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 25);
    const dates: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (
        getDay(d).toString() === day &&
        (!excludeHanukkah || d < new Date(selectedMonth.getFullYear() - 1, 11, 29) || d > new Date(selectedMonth.getFullYear(), 0, 2))
      ) {
        dates.push(new Date(d));
      }
    }
    return dates;
  };

  const handleSubmit = () => {
    if (!operatorId) return alert('יש לבחור מפעיל');
    const monthPayment = paymentMonth
      ? `${(paymentMonth.getMonth() + 1).toString().padStart(2, '0')}-${(paymentMonth.getFullYear() % 100).toString().padStart(2, '0')}`
      : '';
    const newActs: Activity[] = [];
    weeklyActivities.forEach(a => {
      if (!a.classId || !a.dayOfWeek) return;
      calculateWeeklyDates(a.dayOfWeek).forEach(date =>
        newActs.push({
          classId: a.classId,
          operatorId,
          date,
          description: a.description,
          monthPayment
        })
      );
    });
    if (!newActs.length) return alert('אין פעילויות לשמירה');
    setPendingActivities(newActs);
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
    } catch {
      setIsLoading(false);
      alert('שגיאה בשמירה');
    }
  };

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
        {isLoading ? <CircularProgress /> : (
          <>
            {selectedMonth?.getMonth() === 0 && (
              <FormControlLabel
                control={<Checkbox checked={excludeHanukkah} onChange={(e) => setExcludeHanukkah(e.target.checked)} />}
                label="ללא חנוכה"
              />
            )}
            {weeklyActivities.map((a, i) => (
              <Box key={i} display="flex" gap={2} flexWrap="wrap">
                <Autocomplete
                  options={classes}
                  getOptionLabel={(o) => `${o.name} (${o.uniqueSymbol})`}
                  value={classes.find((c: Class) => c._id === a.classId) ?? null}
                  onChange={(e, v) => setWeeklyActivities(wa => {
                    const n = [...wa];
                    n[i].classId = v ? v._id : '';
                    return n;
                  })}
                  renderInput={(p) => <TextField {...p} label="בחר סמל כיתה" />}
                  sx={{ minWidth: 200 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>יום</InputLabel>
                  <Select
                    value={a.dayOfWeek}
                    onChange={(e) => setWeeklyActivities(wa => {
                      const n = [...wa];
                      n[i].dayOfWeek = e.target.value;
                      return n;
                    })}
                  >
                    <MenuItem value=""><em>בחר</em></MenuItem>
                    {['0', '1', '2', '3', '4'].map(d =>
                      <MenuItem key={d} value={d}>{'אבגדה'.charAt(Number(d))}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  label="תיאור"
                  value={a.description}
                  onChange={(e) => setWeeklyActivities(wa => {
                    const n = [...wa];
                    n[i].description = e.target.value;
                    return n;
                  })}
                  sx={{ minWidth: 200 }}
                />
              </Box>
            ))}
            <Button variant="outlined" onClick={() =>
              setWeeklyActivities(wa => [...wa, { classId: '', dayOfWeek: '', description: 'הפעלה' }])
            }>
              הוסף שורה
            </Button>

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

export default WeeklyForm;
