import React from 'react';
import { Grid, TextField, MenuItem, Paper, Typography, Box, Autocomplete } from '@mui/material';
import { FormikProps } from 'formik';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import ClassIcon from '@mui/icons-material/Class';
import { useFetchClasses } from '../../../queries/classQueries';
import { Class } from '../../../types';

interface FormValues {
  paymentMethod: 'חשבונית' | 'תלוש';
  accountantId: string;
  notes: string;
  workingSymbols: string[];
  bankDetails: {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
    accountOwner: string;
  };
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
                label="אופן תשלום"
                name="paymentMethod"
                value={formik.values.paymentMethod}
                onChange={formik.handleChange}
                error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
              >
                <MenuItem value="חשבונית">חשבונית</MenuItem>
                <MenuItem value="תלוש">תלוש</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="חשב שכר"
                name="accountantId"
                value={formik.values.accountantId || ''}
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
          <ClassIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">סמלי כיתות</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Autocomplete
            multiple
            options={classes}
            getOptionLabel={(option: Class) => `${option.uniqueSymbol} - ${option.name}`}
            value={classes.filter((cls: Class) => cls._id && formik.values.workingSymbols.includes(cls._id))}
            onChange={(_, newValue) => {
              formik.setFieldValue(
                'workingSymbols',
                newValue.map((cls: Class) => cls._id || '')
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר סמלי כיתות"
                error={formik.touched.workingSymbols && Boolean(formik.errors.workingSymbols)}
                helperText={formik.touched.workingSymbols && formik.errors.workingSymbols}
              />
            )}
          />
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">פרטי בנק</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="שם בנק"
                name="bankDetails.bankName"
                value={formik.values.bankDetails?.bankName}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="מספר סניף"
                name="bankDetails.branchNumber"
                value={formik.values.bankDetails?.branchNumber}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="מספר חשבון"
                name="bankDetails.accountNumber"
                value={formik.values.bankDetails?.accountNumber}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="שם בעל החשבון"
                name="bankDetails.accountOwner"
                value={formik.values.bankDetails?.accountOwner}
                onChange={formik.handleChange}
              />
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