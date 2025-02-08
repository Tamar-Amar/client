import React, { useState, useEffect } from 'react';
import { useUpdateOperator } from '../queries/operatorQueries';
import { TextField, Button, Box, CircularProgress } from '@mui/material';
//import { fetchOperatorById } from '../queries/operatorQueries';
import { Operator } from '../types/Operator';
import { fetchCurrentOperator } from '../services/OperatorService';

const PersonalDetails: React.FC = () => {
  const [operator, setOperator] = useState<Operator | null>(null);
  const { mutate: updateOperator, status } = useUpdateOperator();
  const isLoading = status === 'pending';

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        const data = await fetchCurrentOperator();
        setOperator(data);
      } catch (error) {
        console.error('Failed to fetch operator details:', error);
      }
    };

    fetchOperator();
  }, []);

  const handleSave = () => {
    if (!operator) return;

    updateOperator(operator); // שליחת הבקשה לעדכון
  };

  if (!operator) return <CircularProgress />; // הצגת טעינה אם אין נתונים

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', p: 3 }}>
      <TextField
        label="שם פרטי"
        value={operator.firstName || ''}
        onChange={(e) => setOperator({ ...operator, firstName: e.target.value })}
        fullWidth
        margin="normal"
      />
      <TextField
        label="שם משפחה"
        value={operator.lastName || ''}
        onChange={(e) => setOperator({ ...operator, lastName: e.target.value })}
        fullWidth
        margin="normal"
      />
      <TextField
        label="תעודת זהות"
        value={operator.id || ''}
        fullWidth
        margin="normal"
        disabled
      />
      <TextField
        label="טלפון"
        value={operator.phone || ''}
        onChange={(e) => setOperator({ ...operator, phone: e.target.value })}
        fullWidth
        margin="normal"
      />
      <TextField
        label="אימייל"
        value={operator.email || ''}
        onChange={(e) => setOperator({ ...operator, email: e.target.value })}
        fullWidth
        margin="normal"
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'שמור'}
        </Button>
      </Box>
    </Box>
  );
};

export default PersonalDetails;
