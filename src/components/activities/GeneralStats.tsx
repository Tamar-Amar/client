import React, { useState, useMemo } from 'react';
import { Box, Typography, Divider, TextField, Button } from '@mui/material';
import { getTotalMonthlyActivities, getTotalActivities, exportGeneralAnnualReport, exportDetailedAnnualReport, exportDetailedMonthlyReport, exportWeeklyReport } from '../../utils/activitiesUtils';
import { Activity, Class } from '../../types';
import { useFetchClasses } from '../../queries/classQueries';

interface GeneralStatsProps {
  activities: Activity[];
}

const GeneralStats: React.FC<GeneralStatsProps> = ({ activities }) => {
  const [selectedMonth, setSelectedMonth] = useState('');

  const totalActivities = useMemo(() => getTotalActivities(activities), [activities]);
  const { data: classes } = useFetchClasses();

  const monthlyCount = useMemo(() => {
    if (!selectedMonth) return 0;
    return getTotalMonthlyActivities(activities, selectedMonth);
  }, [activities, selectedMonth]);

  return (
    <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
      <Typography variant="h6">נתונים כלליים</Typography>
      <Divider sx={{ my: 1 }} />

      <Typography>סה"כ הפעלות שבוצעו: <strong>{totalActivities}</strong></Typography>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="בחר חודש ספציפי"
          type="month"
          fullWidth
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {selectedMonth && (
          <Typography sx={{ mt: 1 }}>
            סה"כ הפעלות שבוצעו בחודש {selectedMonth}: <strong>{monthlyCount}</strong>
          </Typography>
        )}
        <Button 
          variant="contained" 
          color="secondary" 
          disabled={!selectedMonth || !classes}
          onClick={() => exportDetailedMonthlyReport(
            activities,
            selectedMonth,
            (classes ?? []).map((c: Class) => ({
              uniqueSymbol: c.uniqueSymbol,
              name: c.name
          }))
          )}
        >
          יצירת דוח חודשי כללי
        </Button>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => exportWeeklyReport(activities)}
          >
          יצירת דוח שנתי שבועי
        </Button>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => exportGeneralAnnualReport(activities)}
          >
          יצירת דוח שנתי כללי
        </Button>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => exportDetailedAnnualReport(activities)}
          >
          יצירת דוח שנתי מפורט
        </Button>
      </Box>
    </Box>
  );
};

export default GeneralStats;
