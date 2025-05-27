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
import { useFetchWorkerTags } from '../../../queries/workerTagQueries';
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
  onManageTags: () => void;
}

const TagsAndFinish: React.FC<Props> = ({ formik, onManageTags }) => {
  const { data: tags = [], isLoading } = useFetchWorkerTags();

  const handleTagToggle = (tagId: string) => {
    const currentTags = formik.values.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    formik.setFieldValue('tags', newTags);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">תגיות</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={onManageTags}
            variant="outlined"
            size="small"
          >
            נהל תגיות
          </Button>
        </Box>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2,
            minHeight: 100,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          {tags.map((tag) => (
            <Chip
              key={tag._id}
              label={tag.name}
              onClick={() => handleTagToggle(tag._id)}
              color={(formik.values.tags || []).includes(tag._id) ? 'primary' : 'default'}
              variant={(formik.values.tags || []).includes(tag._id) ? 'filled' : 'outlined'}
              sx={{ m: 0.5 }}
            />
          ))}
          {tags.length === 0 && (
            <Typography color="text.secondary">
              לא נמצאו תגיות. לחץ על "נהל תגיות" כדי להוסיף.
            </Typography>
          )}
        </Paper>
      </Grid>

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

export default TagsAndFinish; 