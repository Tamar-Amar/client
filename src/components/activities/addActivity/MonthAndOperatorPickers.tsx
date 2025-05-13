// components/Common/MonthAndOperatorPickers.tsx
import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { Operator } from '../../../types';

interface MonthAndOperatorPickersProps {
  selectedMonth: Date | null;
  onSelectedMonthChange: (newDate: Date | null) => void;
  paymentMonth: Date | null;
  setPaymentMonth: (newDate: Date | null) => void;
  operators: Operator[];
  operatorId: string;
  setOperatorId: (newId: string) => void;
}

const MonthAndOperatorPickers: React.FC<MonthAndOperatorPickersProps> = ({
  selectedMonth,
  onSelectedMonthChange,
  paymentMonth,
  setPaymentMonth,
  operators,
  operatorId,
  setOperatorId
}) => {
  return (
    <Box display="flex" alignItems="center" gap={2} mb={2}>
      <DatePicker
        views={['year', 'month']}
        label="חודש דיווח"
        value={selectedMonth}
        onChange={(newDate) => {
          onSelectedMonthChange(newDate);
          if (newDate) {
            const selected = DateTime.fromJSDate(newDate);
            const payment = DateTime.fromObject({
              year: selected.year,
              month: selected.month
            }).toJSDate();
            setPaymentMonth(payment);
          }
        }}
        sx={{ minWidth: 200 }}
      />

      <DatePicker
        views={['year', 'month']}
        label="חודש תשלום"
        value={paymentMonth}
        onChange={(newDate) => setPaymentMonth(newDate)}
        sx={{ minWidth: 200 }}
      />

      <Autocomplete
        sx={{ minWidth: 250 }}
        options={operators}
        getOptionLabel={(o: Operator) => `${o.lastName} ${o.firstName}`}
        value={operators.find((op) => op._id === operatorId) ?? null}
        onChange={(e, v) => setOperatorId(v?._id ?? '')}
        renderInput={(params) => (
          <TextField {...params} label="בחר מפעיל" error={!operatorId} />
        )}
      />
    </Box>
  );
};

export default MonthAndOperatorPickers;
