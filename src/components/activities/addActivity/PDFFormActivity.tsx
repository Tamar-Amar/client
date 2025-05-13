// components/PDFFormActivity/PDFFormActivity.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Autocomplete, TextField, Button, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DateTime } from 'luxon';
import { Activity, Class, Operator } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperators } from '../../../queries/operatorQueries';
import { useFetchActivitiesByOperator } from '../../../queries/activitiesQueries';
import { useQueryClient } from '@tanstack/react-query';
import PendingActivitiesDialog from './PendingActivitiesDialog';

interface PDFFormActivityProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  selectedMonth: Date | null;
  paymentMonth: Date | null;
  operatorId: string;
}

interface PDFRow {
  date: string;
  day: string;
  symbols: string[];
  readOnly?: boolean;
}

const PDFFormActivity: React.FC<PDFFormActivityProps> = ({
  onAdd, onClose, selectedMonth, paymentMonth, operatorId
}) => {
  const { data: classes = [] } = useFetchClasses();
  const { data: operators = [] } = useFetchOperators();
  const { data: activities = [] } = useFetchActivitiesByOperator(operatorId);
  const [rows, setRows] = useState<PDFRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const queryClient = useQueryClient();

  const generateMonthDays = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = (monthNum === 1)
      ? DateTime.local(year - 1, 12, 26)
      : DateTime.local(year, monthNum - 1, 26);
    const endDate = DateTime.local(year, monthNum, 25);
    const startWeekday = startDate.weekday;
    const firstWeekStartDate = (startWeekday >= 6)
      ? startDate
      : startDate.minus({ days: startWeekday });

    const activitiesInRange = activities.filter(a => {
      const activityDate = DateTime.fromJSDate(new Date(a.date));
      return activityDate >= firstWeekStartDate && activityDate <= endDate;
    });

    const existingActivities: Record<string, string[]> = {};
    activitiesInRange.forEach(a => {
      const dateStr = DateTime.fromJSDate(new Date(a.date)).toFormat('dd/MM/yyyy');
      const uniqueSymbol = typeof a.classId === 'string' ? a.classId : a.classId?.uniqueSymbol;
      if (!uniqueSymbol) return;
      if (!existingActivities[dateStr]) existingActivities[dateStr] = [];
      if (!existingActivities[dateStr].includes(uniqueSymbol)) {
        existingActivities[dateStr].push(uniqueSymbol);
      }
    });

    const tempRows: PDFRow[] = [];
    for (let date = firstWeekStartDate; date <= endDate; date = date.plus({ days: 1 })) {
      if ([5, 6].includes(date.weekday)) continue;
      const formattedDate = date.toFormat('dd/MM/yyyy');
      const readOnly = date <= DateTime.local(year, monthNum - 1, 25);
      tempRows.push({
        date: formattedDate,
        day: date.setLocale('he').toFormat('cccc'),
        symbols: existingActivities[formattedDate] ?? [''],
        readOnly
      });
    }
    setRows(tempRows);
  };

  const handleChangeSymbol = (rowIndex: number, symbolIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].symbols[symbolIndex] = newValue;
    setRows(updatedRows);
  };

  const addSymbolField = (rowIndex: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].symbols.push('');
    setRows(updatedRows);
  };

  const handleSubmit = () => {
    if (!operatorId) return alert('יש לבחור מפעיל');

    const monthPayment = paymentMonth
      ? `${(paymentMonth.getMonth() + 1).toString().padStart(2, '0')}-${(paymentMonth.getFullYear() % 100).toString().padStart(2, '0')}`
      : '';

    const newActivities: Activity[] = [];
    rows.forEach(row => {
      if (row.readOnly) return;
      row.symbols.filter(symbol => symbol !== '').forEach(symbol => {
        newActivities.push({
          classId: symbol,
          operatorId,
          date: DateTime.fromFormat(row.date, 'dd/MM/yyyy').toJSDate(),
          description: 'הפעלה',
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
    } catch {
      setIsLoading(false);
      alert('שגיאה בשמירה');
    }
  };

  useEffect(() => {
    if (!selectedMonth || !operatorId || !activities) return;
    generateMonthDays(DateTime.fromJSDate(selectedMonth).toFormat('yyyy-MM'));
  }, [selectedMonth, operatorId, activities]);

  return (
    <>
      <PendingActivitiesDialog
        open={showSummary}
        pendingActivities={pendingActivities}
        classes={classes}
        onClose={() => setShowSummary(false)}
        onConfirm={confirmAdd}
        operatorId={operatorId}
        operators={operators}
      />
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}><CircularProgress /></Box>
      ) : (
        <Box sx={{ m: 4 }}>
          <Typography variant="h6" gutterBottom>סיכום פעילויות</Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>תאריך</TableCell>
                <TableCell>יום</TableCell>
                <TableCell>סמלים</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell sx={row.readOnly ? { color: 'grey.600' } : {}}>{row.date}</TableCell>
                  <TableCell sx={row.readOnly ? { color: 'grey.600' } : {}}>{row.day}</TableCell>
                  <TableCell>
                    {row.readOnly ? (
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {row.symbols.map((symbol, index) => {
                          const cls = classes.find((c: Class) => c.uniqueSymbol === symbol);
                          return <Typography key={index} variant="body2" sx={{ color: 'grey.600' }}>{cls ? `${cls.name} (${cls.uniqueSymbol})` : symbol}</Typography>;
                        })}
                      </Box>
                    ) : (
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {row.symbols.map((symbol, symbolIndex) => (
                          <Autocomplete
                            key={symbolIndex}
                            options={classes}
                            getOptionLabel={(option: Class) => `${option.name} (${option.uniqueSymbol})`}
                            value={classes.find((c: Class) => c._id === symbol) ?? null}
                            onChange={(e, newValue) => handleChangeSymbol(rowIndex, symbolIndex, (newValue as Class)?._id ?? '')}
                            renderInput={(params) => <TextField {...params} label="סמל" size="small" />}
                            sx={{ width: 150 }}
                          />
                        ))}
                        <IconButton size="small" onClick={() => addSymbolField(rowIndex)}><AddIcon fontSize="small" /></IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button onClick={onClose}>ביטול</Button>
            <Button variant="contained" onClick={handleSubmit}>שמור</Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default PDFFormActivity;
