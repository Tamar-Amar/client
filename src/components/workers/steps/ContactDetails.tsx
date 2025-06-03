import React from 'react';
import { Grid, TextField, Paper, Typography, Box, Divider } from '@mui/material';
import { FormikProps } from 'formik';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';

interface FormValues {
  city: string;
  street: string;
  buildingNumber: string;
  apartmentNumber: string;
  phone: string;
  email: string;
}

interface Props {
  formik: FormikProps<FormValues>;
}

const ContactDetails: React.FC<Props> = ({ formik }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">כתובת מגורים</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="עיר"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
                error={formik.touched.city && Boolean(formik.errors.city)}
                helperText={formik.touched.city && formik.errors.city}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="רחוב"
                name="street"
                value={formik.values.street}
                onChange={formik.handleChange}
                error={formik.touched.street && Boolean(formik.errors.street)}
                helperText={formik.touched.street && formik.errors.street}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label="מספר בית"
                name="buildingNumber"
                value={formik.values.buildingNumber}
                onChange={formik.handleChange}
                error={formik.touched.buildingNumber && Boolean(formik.errors.buildingNumber)}
                helperText={formik.touched.buildingNumber && formik.errors.buildingNumber}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label="דירה"
                name="apartmentNumber"
                value={formik.values.apartmentNumber}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <ContactPhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">פרטי התקשרות</Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="טלפון"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="אימייל"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ContactDetails; 