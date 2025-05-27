import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  useTheme,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import WorkIcon from '@mui/icons-material/Work';
import LabelIcon from '@mui/icons-material/Label';

const steps = [
  {
    label: 'פרטים אישיים',
    icon: <PersonIcon />,
    description: 'שם, תעודת זהות ופרטים בסיסיים'
  },
  {
    label: 'פרטי קשר',
    icon: <ContactMailIcon />,
    description: 'כתובת, טלפון ואימייל'
  },
  {
    label: 'פרטי העסקה',
    icon: <WorkIcon />,
    description: 'תשלום, חשב שכר ופרטי בנק'
  },
  {
    label: 'תגיות וסיום',
    icon: <LabelIcon />,
    description: 'תגיות ואישור סופי'
  }
];

interface Props {
  activeStep: number;
  handleBack: () => void;
  handleNext: () => void;
  isLastStep: boolean;
  isValid: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

const WorkerCreateStepper: React.FC<Props> = ({
  activeStep,
  handleBack,
  handleNext,
  isLastStep,
  isValid,
  isSubmitting = false,
  children
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel
              icon={step.icon}
              sx={{
                '& .MuiStepLabel-label': {
                  mt: 1,
                  color: 'text.primary'
                }
              }}
            >
              <Typography variant="subtitle1" component="span">
                {step.label}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
        <Button
          color="inherit"
          onClick={handleBack}
          disabled={activeStep === 0 || isSubmitting}
        >
          חזור
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isValid || isSubmitting}
          sx={{ minWidth: 100 }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : isLastStep ? (
            'סיום'
          ) : (
            'הבא'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default WorkerCreateStepper; 