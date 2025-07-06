import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Typography,
  Box,
  Chip,
  Stack,
  Alert
} from '@mui/material';
import { Class, WorkerAfterNoon } from '../../types';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface CoordinatorAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'class' | 'worker';
  item?: Class | WorkerAfterNoon;
  onAssign: (coordinatorId: string) => void;
}

const CoordinatorAssignmentDialog: React.FC<CoordinatorAssignmentDialogProps> = ({
  open,
  onClose,
  type,
  item,
  onAssign
}) => {
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchCoordinators();
    }
  }, [open]);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=coordinator', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('שגיאה בטעינת רשימת הרכזים');
      }
      
      const data = await response.json();
      setCoordinators(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (selectedCoordinator) {
      onAssign(selectedCoordinator._id);
      onClose();
    }
  };

  const getItemName = () => {
    if (!item) return '';
    
    if (type === 'class') {
      const classItem = item as Class;
      return `${classItem.name} (${classItem.uniqueSymbol})`;
    } else {
      const workerItem = item as WorkerAfterNoon;
      return `${workerItem.firstName} ${workerItem.lastName} (${workerItem.id})`;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        שיוך {type === 'class' ? 'כיתה' : 'עובד'} לרכז
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {type === 'class' ? 'כיתה' : 'עובד'} לשיוך:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getItemName()}
            </Typography>
          </Box>

          <Autocomplete
            options={coordinators}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.username})`}
            value={selectedCoordinator}
            onChange={(_, newValue) => setSelectedCoordinator(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר רכז"
                placeholder="חפש רכז..."
                required
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack>
                  <Typography variant="body1">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.username}
                  </Typography>
                </Stack>
              </Box>
            )}
            loading={loading}
            noOptionsText="לא נמצאו רכזים"
          />

          {selectedCoordinator && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                רכז נבחר:
              </Typography>
              <Chip
                label={`${selectedCoordinator.firstName} ${selectedCoordinator.lastName}`}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button 
          onClick={handleAssign} 
          variant="contained" 
          disabled={!selectedCoordinator}
        >
          שייך לרכז
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoordinatorAssignmentDialog; 