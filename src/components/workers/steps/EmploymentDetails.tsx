import React from 'react';
import { Grid, TextField, MenuItem, Paper, Typography, Box } from '@mui/material';
import { FormikProps } from 'formik';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import { useFetchClasses } from '../../../queries/classQueries';

interface FormValues {
  accountantCode: string;
  notes: string;
  project: string;    
}

// Mock accountants data
const mockAccountants = [
  { id: '1', name: 'חשב שכר 1' },
  { id: '2', name: 'חשב שכר 2' },
  { id: '3', name: 'חשב שכר 3' },
];

interface Props {
  formik: FormikProps<FormValues>;
}

const EmploymentDetails: React.FC<Props> = ({ formik }) => {
  const { data: classes = [] } = useFetchClasses();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">פרטי העסקה</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="חשב שכר"
                name="accountantCode"
                value={formik.values.accountantCode || ''}
                onChange={formik.handleChange}
              >
                {mockAccountants.map((accountant) => (
                  <MenuItem key={accountant.id} value={accountant.name}>
                    {accountant.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">הערות</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="הערות נוספות"
            name="notes"
            value={formik.values.notes}
            onChange={formik.handleChange}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EmploymentDetails; 