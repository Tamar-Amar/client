// components/Activities/AddActivity/AddActivity.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, Box
} from '@mui/material';
import { Activity } from '../../../types';
import WeeklyForm from './WeeklyForm';
import SingleForm from './SingleForm';
import PDFFormActivity from './PDFFormActivity';

interface AddActivityProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newActivities: Activity[]) => Promise<void>
  defaultOperatorId?: string;
}

const AddActivity: React.FC<AddActivityProps> = ({ open, onClose, onAdd, defaultOperatorId }) => {
  const [selectedOption, setSelectedOption] = useState<'weekly' | 'single' | 'pdf'>('weekly');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>דיווח נוכחות</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <RadioGroup
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value as 'weekly' | 'single' | 'pdf')}
            row
          >
            <FormControlLabel value="pdf" control={<Radio />} label="מילוי דוח PDF" />
            <FormControlLabel value="weekly" control={<Radio />} label="דיווח שבועי" />
            <FormControlLabel value="single" control={<Radio />} label="דיווח יחיד" />
          </RadioGroup>
        </Box>

        {selectedOption === 'weekly' && (
          <WeeklyForm onAdd={onAdd} onClose={onClose} defaultOperatorId={defaultOperatorId} />
        )}
        {selectedOption === 'single' && (
          <SingleForm onAdd={onAdd} onClose={onClose} defaultOperatorId={defaultOperatorId} />
        )}
        {selectedOption === 'pdf' && (
          <PDFFormActivity onAdd={onAdd} onClose={onClose} defaultOperatorId={defaultOperatorId} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddActivity;
