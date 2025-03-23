import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  TextField,
} from '@mui/material';
import { Activity, Operator } from '../../types';
import { eachWeekOfInterval, isSaturday } from 'date-fns';

interface Props {
  activities: Activity[];
}

interface ExcludedWeek {
  weekStart: string;
  reasons: {
    day: string;
    reason: string;
  }[];
}

const TOTAL_GROUPS = 292;
const START_DATE = new Date('2024-11-01');
const TODAY = new Date('2025-06-01');

const ActivationsDashboard: React.FC<Props> = ({ activities }) => {
  const [excludedWeeks, setExcludedWeeks] = useState<ExcludedWeek[]>([]);
  const [validWeeks, setValidWeeks] = useState<Date[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>( []);
  const [attendanceMonth, setAttendanceMonth] = useState<string>("");
  const [operatorId, setOperatorId] = useState<string>("");
  const [operator, setOperator] = useState<Operator | null>(null);


  useEffect(() => {
    const fetchHolidays = async () => {
      const response = await fetch(
        `https://www.hebcal.com/hebcal/?v=1&start=2024-11-01&end=2025-12-31&cfg=json&maj=on&mod=on&nx=on&ss=on&mf=on&c=on&geo=none`
      );
      const data = await response.json();

      const holidayList = data.items.map((item: any) => ({
        date: item.date,
        name: item.title,
      }));

      console.log('📅 חגים שנשלפו עם שמות:', holidayList);
      setHolidays(holidayList);
    };

    fetchHolidays();
  }, []);

  useEffect(() => {
    if (holidays.length === 0) return;

    const allWeeks = eachWeekOfInterval({ start: START_DATE, end: TODAY });
    const valid: Date[] = [];
    const excluded: ExcludedWeek[] = [];
    const dayNames = [
      'ראשון',
      'שני',
      'שלישי',
      'רביעי',
      'חמישי',
      'שישי',
      'שבת',
    ];

    allWeeks.forEach((weekStart) => {
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      });

      const isAllHolidaysOrShabbat = weekDays.every((day) => {
        const iso = day.toLocaleDateString('en-CA'); 
        const isHoliday = holidays.some((h) => h.date === iso);
        return isHoliday || isSaturday(day);
      });

      if (isAllHolidaysOrShabbat) {
        const reasons = weekDays
        .map((day) => {
          const iso = day.toLocaleDateString('en-CA');
          const dayIndex = day.getDay();
          const dayName = dayNames[dayIndex];
      
          const dayHolidays = holidays
            .filter((h) => h.date === iso)
            .map((h) => h.name);
      
          if (dayHolidays.length > 0) {
            return { day: dayName, reason: dayHolidays.join(', ') };
          }
      
          if (isSaturday(day)) {
            return { day: dayName, reason: 'שבת' };
          }
      
          return null;
        })
        .filter(Boolean) as { day: string; reason: string }[];

        excluded.push({
          weekStart: weekStart.toLocaleDateString('he-IL'),
          reasons,
        });
      } 
      else {
        valid.push(weekStart);
      }
    });

    console.log('🔴 שבועות שנפסלו:', excluded);
    console.log('✅ שבועות תקפים:', valid.length);

    setValidWeeks(valid);
    setExcludedWeeks(excluded);
  }, [holidays]);

  useEffect(() => {
    const fetchOperator = async () => {
      if (!operatorId) return;
      const res = await fetch(`http://localhost:5000/api/operators/${operatorId}`);
      const data = await res.json();
      setOperator(data);
      console.log('�� העו��כים:', operator);
    };
    fetchOperator();
  }, [operatorId]);

  const actualActivationsCount = useMemo(() => {
    return activities.filter((act) => new Date(act.date) >= START_DATE).length;
  }, [activities]);

  const totalPossibleActivations = useMemo(() => {
    return validWeeks.length * TOTAL_GROUPS;
  }, [validWeeks]);

  const downloadAttendanceReport = async () => {
    console.log('attendanceReport:', attendanceMonth, operatorId);
    if (!attendanceMonth || !operatorId) return;
     console.log('attendanceReport:', attendanceMonth, operatorId);
  
    const response = await fetch("http://localhost:5000/api/generate-pdf-by-op", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: attendanceMonth,
        operatorId, 
      }),
    });
  
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const namePart = operator
      ? `_${operator.firstName}_${operator.lastName}`
      : "";

    link.download = `דוח_נוכחות_${attendanceMonth}${namePart}.pdf`;
    link.click();
  };

  return (
    <Box sx={{ m: 4 }}>
      <Typography variant="h5" gutterBottom>
        לוח בקרה לניצול הפעלות שנתיות
      </Typography>

      <TextField
        label="בחר חודש לדוח נוכחות"
        type="month"
        value={attendanceMonth}
        onChange={(e) => setAttendanceMonth(e.target.value)}
        sx={{ width: '200px' }}
        InputLabelProps={{ shrink: true }}
      />

      <Button
        variant="contained"
        color="secondary"
        onClick={downloadAttendanceReport}
        disabled={!attendanceMonth}
      >
        הורד דוח נוכחות (PDF)
      </Button>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography>
          <strong>סה"כ שבועות שניתן היה להפעיל בהם:</strong> {validWeeks.length}
        </Typography>
        <Typography>
          <strong>סה"כ הפעלות אפשריות (292 קבוצות):</strong>{' '}
          {totalPossibleActivations}
        </Typography>
        <Typography>
          <strong>סה"כ הפעלות שבוצעו בפועל:</strong>{' '}
          {actualActivationsCount}
        </Typography>
        <Typography>
          <strong>אחוז ניצול:</strong>{' '}
          {((actualActivationsCount / totalPossibleActivations) * 100).toFixed(1)}
          %
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom>
        שבועות שלא נחשבו (נפסלו):
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>תאריך תחילת שבוע</TableCell>
            <TableCell>יום</TableCell>
            <TableCell>סיבה</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {excludedWeeks.map((week, idx) =>
            week.reasons.map((r, i) => (
              <TableRow key={`${idx}-${i}`}>
                <TableCell>{i === 0 ? week.weekStart : ''}</TableCell>
                <TableCell>{r.day}</TableCell>
                <TableCell>{r.reason}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default ActivationsDashboard;
