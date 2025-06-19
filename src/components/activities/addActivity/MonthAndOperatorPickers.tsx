import React from 'react';
import { Box, Autocomplete, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { Operator } from '../../../types';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface MonthAndOperatorPickersProps {
  selectedMonth: Date | null;
  onSelectedMonthChange: (newDate: Date | null) => void;
  paymentMonth: Date | null;
  setPaymentMonth: (newDate: Date | null) => void;
  operators: Operator[];
  operatorId: string;
  setOperatorId: (newId: string) => void;
  isOperatorFixed?: boolean;
}

const MonthAndOperatorPickers: React.FC<MonthAndOperatorPickersProps> = ({
  selectedMonth,
  onSelectedMonthChange,
  paymentMonth,
  setPaymentMonth,
  operators,
  operatorId,
  setOperatorId,
  isOperatorFixed
}) => {
  const operator = operators.find((op) => op._id === operatorId);

  return (
    <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
      {isOperatorFixed ? (
        <Box sx={{ minWidth: 250, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircleIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            {operator ? `${operator.lastName} ${operator.firstName}` : 'מפעיל לא נמצא'}
          </Typography>
        </Box>
      ) : (
        <Autocomplete
          sx={{ minWidth: 250 }}
          options={operators}
          getOptionLabel={(o: Operator) => `${o.lastName} ${o.firstName}`}
          value={operator ?? null}
          onChange={(e, v) => setOperatorId(v?._id ?? '')}
          renderInput={(params) => (
            <TextField {...params} label="בחר מפעיל" error={!operatorId} />
          )}
        />
      )}

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

      {!isOperatorFixed && (
        <DatePicker
          views={['year', 'month']}
          label="חודש תשלום"
          value={paymentMonth}
          onChange={(newDate) => setPaymentMonth(newDate)}
          sx={{ minWidth: 200 }}
        />
      )}
    </Box>
  );
};

export default MonthAndOperatorPickers;
