import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, TextField, Button, CircularProgress, Box
} from '@mui/material';
import { useUpdateOperator } from '../../queries/operatorQueries';
import { Operator } from '../../types';
import { fetchCurrentOperator } from '../../services/OperatorService';

const PersonalDetails: React.FC = () => {
  debugger;
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
    if (operator) updateOperator(operator);
  };

  if (!operator) return <CircularProgress />;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4, boxShadow: 3 }}>
        <Typography variant="h5" mb={3} color="primary">
          פרטים אישיים
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="שם פרטי"
              value={operator.firstName}
              onChange={(e) => setOperator({ ...operator, firstName: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="שם משפחה"
              value={operator.lastName}
              onChange={(e) => setOperator({ ...operator, lastName: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="תעודת זהות"
              value={operator.id}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="טלפון"
              value={operator.phone}
              onChange={(e) => setOperator({ ...operator, phone: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="אימייל"
              value={operator.email}
              onChange={(e) => setOperator({ ...operator, email: e.target.value })}
              fullWidth
            />
          </Grid>
        </Grid>
        <Box mt={4} textAlign="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isLoading}
            sx={{ minWidth: 200 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'שמור'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PersonalDetails;
