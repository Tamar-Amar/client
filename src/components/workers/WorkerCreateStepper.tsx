import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  useTheme,
  CircularProgress
} from '@mui/material';

interface Props {
  activeStep: number;
  handleBack: () => void;
  handleNext: () => void;
  isLastStep: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  children: React.ReactNode;
  steps: string[];
}

const WorkerCreateStepper: React.FC<Props> = ({
  activeStep,
  handleBack,
  handleNext,
  isLastStep,
  isValid,
  isSubmitting,
  children,
  steps
}) => {

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box>
        {children}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              חזור
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isLastStep ? (
              'סיום'
            ) : (
              'המשך'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkerCreateStepper; 