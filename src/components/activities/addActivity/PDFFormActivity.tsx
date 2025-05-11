// components/Activities/AddActivity/PDFFormActivity.tsx
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Autocomplete, FormControl, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DateTime } from 'luxon';
import { Activity, Class, Operator } from '../../../types';
import { useFetchClasses } from '../../../queries/classQueries';
import { useFetchOperators } from '../../../queries/operatorQueries';

interface PDFFormActivityProps {
  onAdd: (newActivities: Activity[]) => Promise<void>;
  onClose: () => void;
  defaultOperatorId?: string;
}

interface PDFRow {
  date: string;
  day: string;
  symbols: string[];
}

const PDFFormActivity: React.FC<PDFFormActivityProps> = ({ onAdd, onClose, defaultOperatorId }) => {
  const { data: classes = [] } = useFetchClasses();
  const [rows, setRows] = useState<PDFRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(DateTime.now().toFormat('yyyy-MM'));
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || '');
  const { data: operators = [] } = useFetchOperators();
  const [isLoading, setIsLoading] = useState(false);  // ✅ חדש

  useEffect(() => {
    generateMonthDays(selectedMonth);
  }, [selectedMonth]);

  const generateMonthDays = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = DateTime.local(year, monthNum - 1, 26);
    const endDate = DateTime.local(year, monthNum, 25);
    const tempRows: PDFRow[] = [];

    for (let date = startDate; date <= endDate; date = date.plus({ days: 1 })) {
      const dayOfWeek = date.weekday;
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;
      tempRows.push({
        date: date.toFormat('dd/MM/yyyy'),
        day: date.setLocale('he').toFormat('cccc'),
        symbols: ['']
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
      row.symbols
        .filter(symbol => symbol !== '')
        .forEach(symbol => {
          activities.push({
            classId: symbol,
            operatorId: operatorId,
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

  return (
    <Box>
      <Typography variant="h6">מילוי טבלת דוח PDF</Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && (
        <>
          <TextField
            label="חודש נוכחות"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />

          <FormControl fullWidth margin="normal" disabled={!!defaultOperatorId}>
            <Autocomplete
              options={[...operators].sort((a, b) => a.lastName.localeCompare(b.lastName))}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName} (${option.id})`}
              value={operators.find((op: Operator) => op._id === operatorId) || null}
              onChange={(event, newValue) => setOperatorId(newValue ? newValue._id : '')}
              renderInput={(params) => <TextField {...params} label="בחר מפעיל" />}
              fullWidth
            />
          </FormControl>

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
                const cellStyle = isNewWeek ? { borderTop: '3px solid black' } : {};
                return (
                  <TableRow key={rowIndex} sx={isNewWeek ? { '& > td': { borderTop: '4px solid black' } } : {}}>
                    <TableCell sx={cellStyle}>{row.date}</TableCell>
                    <TableCell sx={cellStyle}>{row.day}</TableCell>
                    <TableCell sx={cellStyle}>
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
