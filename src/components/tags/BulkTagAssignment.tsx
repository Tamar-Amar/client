import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  ListItemText,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useWorkerTags } from '../../queries/useTags';
import { useFetchWorkers } from '../../queries/workerQueries';
import { Worker } from '../../types';

const BulkTagAssignment = () => {
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { availableTags, bulkUpdateTags, isUpdating } = useWorkerTags('all');
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchWorkers();

  const handleToggleWorker = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAllWorkers = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(worker => worker._id));
    }
  };

  const handleApplyTag = async () => {
    if (!selectedTag || selectedWorkers.length === 0) return;

    try {
      await bulkUpdateTags({ workerIds: selectedWorkers, tagId: selectedTag });
      setSelectedWorkers([]);
      setSelectedTag('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error applying tags:', error);
    }
  };

  if (isLoadingWorkers) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        הוספת תגית לעובדים
      </Button>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>הוספת תגית לעובדים</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>בחר תגית</InputLabel>
              <Select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                label="בחר תגית"
              >
                {availableTags.map((tag) => (
                  <MenuItem key={tag._id} value={tag._id}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleSelectAllWorkers}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedWorkers.length === workers.length}
                        indeterminate={selectedWorkers.length > 0 && selectedWorkers.length < workers.length}
                      />
                    </ListItemIcon>
                    <ListItemText primary="בחר הכל" />
                  </ListItemButton>
                </ListItem>
                {workers.map((worker) => (
                  <ListItem key={worker._id} disablePadding>
                    <ListItemButton onClick={() => handleToggleWorker(worker._id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedWorkers.includes(worker._id)}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${worker.firstName} ${worker.lastName}`}
                        secondary={worker.id}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleApplyTag}
            variant="contained"
            disabled={!selectedTag || selectedWorkers.length === 0 || isUpdating}
          >
            {isUpdating ? <CircularProgress size={24} /> : 'החל תגית'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkTagAssignment; 