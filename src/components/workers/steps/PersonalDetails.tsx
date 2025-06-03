import React from 'react';
import { Grid, TextField } from '@mui/material';
import { FormikProps } from 'formik';

interface FormValues {
  firstName: string;
  lastName: string;
  id: string;
  password: string;
  birthDate: string;
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
          label="סיסמא"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="date"
          label="תאריך לידה"
          name="birthDate"
          value={formik.values.birthDate}
          onChange={formik.handleChange}
          error={formik.touched.birthDate && Boolean(formik.errors.birthDate)}
          helperText={formik.touched.birthDate && formik.errors.birthDate}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
};

export default PersonalDetails; 