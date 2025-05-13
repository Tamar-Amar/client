// components/Activities/AddActivity/AddActivity.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, RadioGroup,
  FormControlLabel, Radio, Box, Button
} from '@mui/material';
import { Activity, Operator } from '../../../types';
import WeeklyForm from './WeeklyForm';
import SingleForm from './SingleForm';
import PDFFormActivity from './PDFFormActivity';
import { useFetchOperators } from '../../../queries/operatorQueries';
import MonthAndOperatorPickers from './MonthAndOperatorPickers';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => Promise<void>;
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd }) => {
  const [selectedOption, setSelectedOption] = useState<'weekly' | 'single' | 'pdf'>('pdf');
  
  // ✅ state מרוכז:
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [paymentMonth, setPaymentMonth] = useState<Date | null>(new Date());
  const [operatorId, setOperatorId] = useState<string>('');
  const { data: operators = [] } = useFetchOperators();

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>דיווח נוכחות</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <RadioGroup
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value as 'weekly' | 'single' | 'pdf')}
            row
          >
            <FormControlLabel value="pdf" control={<Radio />} label="מילוי דוח PDF" />
            <FormControlLabel value="weekly" control={<Radio />} label="דיווח שבועי" />
            <FormControlLabel value="single" control={<Radio />} label="דיווח יחיד" />
          </RadioGroup>
        </Box>

        <MonthAndOperatorPickers
          selectedMonth={selectedMonth}
          onSelectedMonthChange={setSelectedMonth}
          paymentMonth={paymentMonth}
          setPaymentMonth={setPaymentMonth}
          operators={operators}
          operatorId={operatorId}
          setOperatorId={setOperatorId}
        />

        {selectedOption === 'weekly' && (
          <WeeklyForm
            onAdd={onAdd}
            onClose={onClose}
            selectedMonth={selectedMonth}
            paymentMonth={paymentMonth}
            operatorId={operatorId}
          />
        )}
        {selectedOption === 'single' && (
          <SingleForm
            onAdd={onAdd}
            onClose={onClose}
            selectedMonth={selectedMonth}
            paymentMonth={paymentMonth}
            operatorId={operatorId}
          />
        )}
        {selectedOption === 'pdf' && (
          <PDFFormActivity
            onAdd={onAdd}
            onClose={onClose}
            selectedMonth={selectedMonth}
            paymentMonth={paymentMonth}
            operatorId={operatorId}
          />
        )}
      </DialogContent>

      <Box display="flex" justifyContent="flex-end" m={2}>
        <Button onClick={onClose}>סגור</Button>
      </Box>
    </Dialog>
  );
};

export default AddActivity;
