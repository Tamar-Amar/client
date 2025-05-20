import React, { useState } from 'react';
import PDFFormActivity from './PDFFormActivity';
import { useAddActivity } from '../../../queries/activitiesQueries';
import { Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useFetchOperatorById } from '../../../queries/operatorQueries';
import { Activity } from '../../../types';
import PublicPDFFormActivity from './PublicPDFFormActivity';
import { DatePicker } from '@mui/x-date-pickers';

const PublicReportPage = () => {
  const { mutation: addActivity } = useAddActivity();
  const [searchParams] = useSearchParams();
  const operatorId = searchParams.get('operatorId') || ''; 
  const { data: operator } = useFetchOperatorById(operatorId);
  const monthParam = searchParams.get('month'); // למשל "2025-04"
const initialMonth = monthParam
  ? new Date(`${monthParam}-01`)
  : new Date();
const [selectedMonth, setSelectedMonth] = useState<Date | null>(initialMonth);
const [paymentMonth, setPaymentMonth] = useState<Date | null>(initialMonth);


const handleAddActivities = async (activities: Activity[]) => {
  for (const activity of activities) {
    await addActivity.mutateAsync(activity);
  }
};

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>דיווח פעילות</Typography>
      <div>
      <Typography variant="h6">
        {operator ? `דוח עבור ${operator.firstName} ${operator.lastName}` : 'טוען מפעיל...'}
    </Typography>
    <DatePicker
  views={['year', 'month']}
  label="חודש דיווח"
  value={selectedMonth}
  onChange={(newDate) => {
    setSelectedMonth(newDate);
    if (newDate) setPaymentMonth(newDate); // או לוגיקה אחרת
  }}
  sx={{ mb: 2, minWidth: 100, maxWidth:150 }}
/>
</div>

      <PublicPDFFormActivity
        selectedMonth={selectedMonth}
        paymentMonth={paymentMonth}
        operatorId={operatorId}
        onAdd={handleAddActivities}
        onClose={() => {}}
      />
    </Box>
  );
};

export default PublicReportPage;
