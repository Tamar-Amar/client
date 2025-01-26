import React, { useState } from 'react';
import { useUpdateOperator } from '../queries/operatorQueries';
import { TextField, Button, Box, CircularProgress } from '@mui/material';
import { Operator } from '../types/Operator';

interface PersonalDetailsProps {
  operator: Operator;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ operator }) => {
  const [details, setDetails] = useState<Partial<Operator>>(operator);
  const { mutate: updateOperator, status } = useUpdateOperator();
  const isLoading = status === 'pending';

  const handleSave = () => {
    const completeDetails: Operator = {
      ...operator, // הנתונים המקוריים
      ...details,  // הנתונים המעודכנים
    };
    updateOperator(completeDetails);
    setIsEditing(false);
  };

  const [isEditing, setIsEditing] = useState(false);

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', p: 3 }}>
      <TextField
        label="שם פרטי"
        value={details.firstName || ''}
        onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
        fullWidth
        margin="normal"
        disabled={!isEditing}
      />
      <TextField
        label="שם משפחה"
        value={details.lastName || ''}
        onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
        fullWidth
        margin="normal"
        disabled={!isEditing}
      />
      <TextField
        label="תעודת זהות"
        value={details.id || ''}
        fullWidth
        margin="normal"
        disabled
      />
      <TextField
        label="טלפון"
        value={details.phone || ''}
        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
        fullWidth
        margin="normal"
        disabled={!isEditing}
      />
      <TextField
        label="אימייל"
        value={details.email || ''}
        onChange={(e) => setDetails({ ...details, email: e.target.value })}
        fullWidth
        margin="normal"
        disabled={!isEditing}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        {isEditing ? (
          <>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : 'שמור'}
            </Button>
            <Button variant="outlined" onClick={() => setIsEditing(false)}>
              ביטול
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={() => setIsEditing(true)}>
            ערוך
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PersonalDetails;
