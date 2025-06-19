// components/PDFFormActivity/PDFFormActivity.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Autocomplete, TextField, Button, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DateTime } from 'luxon';
import { Activity, Class } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperatorById, useFetchOperators } from '../../../queries/operatorQueries';
import { useFetchActivitiesByOperator } from '../../../queries/activitiesQueries';
import { useQueryClient } from '@tanstack/react-query';
import PendingActivitiesDialog from './PendingActivitiesDialog';
import { holidays } from '../../../utils/holidays';

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

type ExtendedClass = Class & { disabled?: boolean };

const PublicPDFFormActivity: React.FC<PDFFormActivityProps> = ({
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
  const { data: operator } = useFetchOperatorById(operatorId);

  const holidayMap = holidays.reduce((acc, item) => {
    acc[item.date] = item.reason;
    return acc;
  }, {} as Record<string, string>);

  const generateMonthDays = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = (monthNum === 1)
      ? DateTime.local(year - 1, 12, 26)
      : DateTime.local(year, monthNum - 1, 26);
    const endDate = DateTime.local(year, monthNum, 25);
    const startWeekday = startDate.weekday;
    const firstWeekStartDate = (startWeekday === 7)
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
      const dayOfWeek = date.setLocale('he').toFormat('cccc').replace('יום ', '');
      const existing = existingActivities[formattedDate] ?? [];
      const readOnly = date < startDate;

      let regularSymbols: string[] = [];

      if (operatorId && operator && operator.weeklySchedule) {
        const currentDaySchedule = operator.weeklySchedule.find(d => d.day === dayOfWeek);
        if (currentDaySchedule) {
          regularSymbols = currentDaySchedule.classes.map((id: any) => {
            const classIdStr = typeof id === 'string' ? id : id?.$oid || `${id}`;
            const cls = classes.find((c: Class) => `${c._id}` === classIdStr);
            return cls?.uniqueSymbol ?? '';
          }).filter(Boolean);
        }
      }

      const symbols = readOnly
        ? existing
        : [...new Set([...existing, ...regularSymbols])];

      tempRows.push({
        date: formattedDate,
        day: dayOfWeek,
        symbols,
        readOnly
      });
    }

    setRows(tempRows);
  };

  const allowedClassIds = operator?.weeklySchedule?.flatMap(day =>
    day.classes.map((id: any) => typeof id === 'string' ? id : id?.$oid || `${id}`)
  ) ?? [];

  const filteredClasses = classes.filter((cls: Class) =>
    allowedClassIds.includes(`${cls._id}`)
  );

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
    const rowDateISO = DateTime.fromFormat(row.date, 'dd/MM/yyyy').toISODate();
    if (!rowDateISO || holidayMap[rowDateISO]) return;

    row.symbols.forEach(symbol => {
      const classObj = classes.find((c:Class) => c.uniqueSymbol === symbol);
      if (!classObj) return; // אם לא נמצאה קבוצה עם הסמל הזה — דלג

      const isExisting = activities.some(a =>
        DateTime.fromJSDate(new Date(a.date)).toFormat('dd/MM/yyyy') === row.date &&
        ((typeof a.classId === 'string' && a.classId === classObj._id.toString()) ||
          (typeof a.classId === 'object' && a.classId._id === classObj._id.toString()))
      );

      if (!isExisting) {
        newActivities.push({
          classId: classObj._id, // 🟢 כאן במקום symbol
          operatorId,
          date: DateTime.fromFormat(row.date, 'dd/MM/yyyy').toJSDate(),
          description: 'הפעלה',
          monthPayment
        });
      }
    });
  });

  setPendingActivities(newActivities);
  setShowSummary(true);
};


const confirmAdd = async () => {
  setShowSummary(false);
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
    if (!selectedMonth || !activities || !classes.length) return;
    if (operatorId && !operator) return;
    generateMonthDays(DateTime.fromJSDate(selectedMonth).toFormat('yyyy-MM'));
  }, [selectedMonth, operatorId, activities, operator, classes]);

  const totalActivities = rows.reduce((acc, row) => {
    const rowDateISO = DateTime.fromFormat(row.date, 'dd/MM/yyyy').toISODate();
    if (rowDateISO && holidayMap[rowDateISO]) return acc;
    return acc + row.symbols.filter(s => s && s.trim() !== '').length;
  }, 0);

  const getWeekKey = (dateStr: string) => {
    const date = DateTime.fromFormat(dateStr, 'dd/MM/yyyy');
    const weekday = date.weekday;
    const daysToSubtract = weekday === 7 ? 0 : weekday;
    const sunday = date.minus({ days: daysToSubtract });
    return sunday.toFormat('yyyy-MM-dd');
  };

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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>תאריך</b></TableCell>
                <TableCell><b>יום</b></TableCell>
                <TableCell><b>סמלים</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const isNextSunday = rows[rowIndex + 1]?.day === 'ראשון';
                const date = DateTime.fromFormat(row.date, 'dd/MM/yyyy');
                const rowDateISO = date.isValid ? date.toISODate() : '';
                const holidayReason = rowDateISO ? holidayMap[rowDateISO] : undefined;

                return (
                  <TableRow
                    key={rowIndex}
                    sx={{
                      borderBottom: isNextSunday ? '3px solid black' : undefined,
                      backgroundColor: holidayReason ? '#f5f5f5' : undefined,
                    }}
                  >
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.day}</TableCell>
                    <TableCell>
                      {holidayReason ? (
                        <Typography variant="body2" color="text.secondary">
                          {holidayReason} -לא מתקיימת פעילות צהרון
                        </Typography>
                      ) : (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {row.symbols.map((symbol, symbolIndex) => {
                            const weekKey = getWeekKey(row.date);
                            const usedSymbolsThisWeek = rows
                              .filter((r) => getWeekKey(r.date) === weekKey)
                              .flatMap((r) => r.symbols)
                              .filter((s) => s && s !== symbol);

                            const isExisting = classes.find((c: Class) => c.uniqueSymbol === symbol) && activities.some((a) =>
                              DateTime.fromJSDate(new Date(a.date)).toFormat('dd/MM/yyyy') === row.date &&
                              ((typeof a.classId === 'string' && a.classId === symbol) ||
                                (typeof a.classId === 'object' && a.classId.uniqueSymbol === symbol))
                            );

                            if (isExisting) {
                              const cls = classes.find((c: Class) => c.uniqueSymbol === symbol);
                              return (
                                <Typography
                                  key={symbolIndex}
                                  variant="body2"
                                  sx={{
                                    color: 'grey.600',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {cls ? `${cls.uniqueSymbol}` : symbol}
                                </Typography>
                              );
                            }

                            return (
                              <Autocomplete<ExtendedClass>
                                key={symbolIndex}
                                options={filteredClasses.map((c: Class): ExtendedClass => ({
                                  ...c,
                                  disabled: usedSymbolsThisWeek.includes(c.uniqueSymbol),
                                }))}
                                getOptionDisabled={(option) => option.disabled ?? false}
                                getOptionLabel={(option) => `${option.uniqueSymbol} ${option.name ?? ''}`.trim()}
                                value={
                                  !symbol
                                    ? null
                                    : filteredClasses.find((c: Class) => c.uniqueSymbol === symbol) ??
                                      classes.find((c: Class) => c.uniqueSymbol === symbol) ??
                                      { _id: '', uniqueSymbol: symbol, name: 'סמל לא מזוהה' }
                                }
                                onChange={(e, newValue) =>
                                  handleChangeSymbol(rowIndex, symbolIndex, (newValue as Class)?.uniqueSymbol ?? '')
                                }
                                sx={{ minWidth: 200, maxWidth: 300 }}
                                componentsProps={{
                                  paper: { sx: { direction: 'rtl' } },
                                  popper: { modifiers: [{ name: 'offset', options: { offset: [0, 4] } }] }
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="סמל"
                                    size="small"
                                    inputProps={{
                                      ...params.inputProps,
                                      style: {
                                        ...params.inputProps.style,
                                        textOverflow: 'unset',
                                        fontSize: '0.8rem',
                                      },
                                    }}
                                    InputLabelProps={{
                                      sx: { fontSize: '0.75rem' },
                                    }}
                                  />
                                )}
                              />
                            );
                          })}
                          {!row.readOnly && row.symbols.length < 4 && (
                            <IconButton size="small" onClick={() => addSymbolField(rowIndex)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box mt={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              סה"כ פעילויות לחודש זה: {totalActivities}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button onClick={onClose}>ביטול</Button>
            <Button variant="contained" onClick={handleSubmit}>שמור</Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default PublicPDFFormActivity;
