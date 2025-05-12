import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Autocomplete, FormControl, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DateTime } from 'luxon';
import { Activity, Class, Operator } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperators } from '../../../queries/operatorQueries';
import { useFetchActivitiesByOperator } from '../../../queries/activitiesQueries';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';



interface PDFFormActivityProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  defaultOperatorId?: string;
}

interface PDFRow {
  date: string;
  day: string;
  symbols: string[];
  readOnly?: boolean;
}

const PDFFormActivity: React.FC<PDFFormActivityProps> = ({ onAdd, onClose, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const [rows, setRows] = useState<PDFRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(DateTime.now().toFormat('yyyy-MM'));
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');
  const { data: operators = [] } = useFetchOperators();
  const [isLoading, setIsLoading] = useState(false);
  const { data: activities = [] } = useFetchActivitiesByOperator(operatorId);

  const generateMonthDays = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = (monthNum === 1)
    ? DateTime.local(year - 1, 12, 26) 
    : DateTime.local(year, monthNum - 1, 26);

    const endDate = DateTime.local(year, monthNum, 25);
    const startWeekday = startDate.weekday;
    const firstWeekStartDate = (startWeekday === 7 || startWeekday === 6)
        ? startDate
        : startDate.minus({ days: startWeekday });

        
    const activitiesInRange = activities.filter(a => {
        const activityDate = DateTime.fromJSDate(new Date(a.date));
        return activityDate >= firstWeekStartDate && activityDate <= endDate;
    });

    const existingActivities: { [date: string]: string[] } = {};
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
      const dayOfWeek = date.weekday;
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;

      const formattedDate = date.toFormat('dd/MM/yyyy');
      const readOnlySymbols = existingActivities[formattedDate];
      const previousPeriodEnd = DateTime.local(year, monthNum - 1, 25);
      const isPreviousMonth = date <= previousPeriodEnd;

      tempRows.push({
        date: formattedDate,
        day: date.setLocale('he').toFormat('cccc'),
        symbols: readOnlySymbols ? readOnlySymbols : [''],
        readOnly: isPreviousMonth
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

  const handleSubmit = async () => {
    if (!operatorId) {
      alert('יש לבחור מפעיל');
      return;
    }

    const activities: Activity[] = [];
    rows.forEach(row => {
      if (row.readOnly) return;
      row.symbols
        .filter(symbol => symbol !== '')
        .forEach(symbol => {
          activities.push({
            classId: symbol,
            operatorId,
            date: DateTime.fromFormat(row.date, 'dd/MM/yyyy').toJSDate(),
            description: 'הפעלה',
            monthPayment: selectedMonth ? `${selectedMonth.split('-')[1]}-${selectedMonth.split('-')[0].slice(2)}` : '',
          });
        });
    });

    try {
      setIsLoading(true);
      await onAdd(activities);
      setIsLoading(false);
      onClose();
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('שגיאה בשמירת הפעילויות');
    }
  };

  useEffect(() => {
    if (!operatorId || !activities) return;
    generateMonthDays(selectedMonth);
}, [selectedMonth, operatorId, activities]);

  return (
    <Box>
      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && (
        <>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CalendarTodayIcon color="action" sx={{ fontSize: 30 }} />
            <TextField
              label="בחר חודש תשלום"
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                generateMonthDays(e.target.value);
              }}
              sx={{ minWidth: 200 }}
              InputLabelProps={{ shrink: true }}
            />

            <PersonIcon color="action" sx={{ fontSize: 30 }} />
            <Autocomplete
              sx={{ minWidth: 250 }}
              options={[...operators].sort((a, b) => a.lastName.localeCompare(b.lastName))}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName} (${option.id})`}
              value={operators.find((op: Operator) => op._id === operatorId) || null}
              onChange={(event, newValue) => setOperatorId(newValue ? newValue._id : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="בחר מפעיל"
                  error={!operatorId}
                />
              )}
            />
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>תאריך</TableCell>
                <TableCell>יום</TableCell>
                <TableCell>סמלים</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const isNewWeek = rowIndex > 0 && rows[rowIndex - 1].day === 'חמישי';
                return (
                  <TableRow key={rowIndex} sx={isNewWeek ? { '& > td': { borderTop: '4px solid black' } } : {}}>
                    <TableCell sx={row.readOnly ? { color: 'grey.600' } : {}}>
                      {row.date}
                    </TableCell>
                    <TableCell sx={row.readOnly ? { color: 'grey.600' } : {}}>
                      {row.day}
                    </TableCell>
                    <TableCell>
                      {row.readOnly ? (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {row.symbols.map((symbol, index) => {
                            const cls = classes.find((cls: Class) => cls.uniqueSymbol === symbol);
                            return (
                              <Typography key={index} variant="body2" sx={{ color: 'grey.600' }}>
                                {cls ? `${cls.name} (${cls.uniqueSymbol})` : symbol}
                              </Typography>
                            );
                          })}
                        </Box>
                      ) : (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {row.symbols.map((symbol, symbolIndex) => (
                            <Autocomplete
                              key={symbolIndex}
                              options={classes}
                              getOptionLabel={(option) => `${option.name} (${option.uniqueSymbol})`}
                              value={classes.find((cls: Class) => cls._id === symbol) || null}
                              onChange={(e, newValue) =>
                                handleChangeSymbol(rowIndex, symbolIndex, (newValue as Class)?._id || '')
                              }
                              renderInput={(params) => <TextField {...params} label="סמל" size="small" />}
                              sx={{ width: 150 }}
                            />
                          ))}
                          <IconButton size="small" onClick={() => addSymbolField(rowIndex)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button onClick={onClose}>ביטול</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              שמור
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PDFFormActivity;
