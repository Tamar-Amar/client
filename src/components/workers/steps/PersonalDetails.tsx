import React from 'react';
import { Grid, TextField } from '@mui/material';
import { FormikProps } from 'formik';

interface FormValues {
  firstName: string;
  lastName: string;
  id: string;
  status: string;
}

interface Props {
  formik: FormikProps<FormValues>;
}

const PersonalDetails: React.FC<Props> = ({ formik }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="שם פרטי"
          name="firstName"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          error={formik.touched.firstName && Boolean(formik.errors.firstName)}
          helperText={formik.touched.firstName && formik.errors.firstName}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="שם משפחה"
          name="lastName"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          error={formik.touched.lastName && Boolean(formik.errors.lastName)}
          helperText={formik.touched.lastName && formik.errors.lastName}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="תעודת זהות"
          name="id"
          value={formik.values.id}
          onChange={formik.handleChange}
          error={formik.touched.id && Boolean(formik.errors.id)}
          helperText={formik.touched.id && formik.errors.id}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="סטטוס"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          error={formik.touched.status && Boolean(formik.errors.status)}
          helperText={formik.touched.status && formik.errors.status}
        />
      </Grid>
    </Grid>
  );
};

export default PersonalDetails; 