import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Button
} from '@mui/material';
import { FormikProps } from 'formik';
import AddIcon from '@mui/icons-material/Add';

interface FormValues {
  firstName: string;
  lastName: string;
  id: string;
  phone: string;
  paymentMethod: 'חשבונית' | 'תלוש';
  tags: string[];
}

interface Props {
  formik: FormikProps<FormValues>;
}

const Finish: React.FC<Props> = ({ formik }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            סיכום
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  שם מלא
                </Typography>
                <Typography>
                  {formik.values.firstName} {formik.values.lastName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  תעודת זהות
                </Typography>
                <Typography>{formik.values.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  טלפון
                </Typography>
                <Typography>{formik.values.phone}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  אופן תשלום
                </Typography>
                <Typography>{formik.values.paymentMethod}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Finish; 