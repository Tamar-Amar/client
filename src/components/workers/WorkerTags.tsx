import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  styled,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useFetchWorker, useUpdateWorker } from '../../queries/workerQueries';
import { useWorkerTags } from '../../queries/useTags';
import { Tag, Worker } from '../../types';

interface Props {
  workerId: string;
  existingTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const WorkerTags: React.FC<Props> = ({ workerId, existingTags, onTagsChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags || []);
  const { availableTags, isLoading: isLoadingTags, updateTags, isUpdating } = useWorkerTags(workerId);
  const { data: worker, isLoading: isLoadingWorker } = useFetchWorker(workerId);

  useEffect(() => {
    if (worker) {
      setSelectedTags(worker.tags || []);
    }
  }, [worker]);

  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? [value] : value);
  };

  const handleSave = async () => {
    try {
      updateTags(selectedTags);
      setIsEditing(false);
      if (onTagsChange) {
        onTagsChange(selectedTags);
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  if (isLoadingTags || isLoadingWorker) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
<>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          color="primary"
          disabled={isUpdating}
        >
          {isEditing ? (
            isUpdating ? <CircularProgress size={24} /> : <SaveIcon />
          ) : (
            <EditIcon />
          )}
        </IconButton>
      </Box>

      <FormControl fullWidth disabled={!isEditing || isUpdating}>
        <InputLabel id="tags-select-label">תגיות</InputLabel>
        <Select
          labelId="tags-select-label"
          multiple
          value={selectedTags}
          onChange={handleTagChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const tag = availableTags.find((t) => t._id === value);
                return (
                  <Chip 
                    key={value} 
                    label={tag ? tag.name : value} 
                    size="small" 
                  />
                );
              })}
            </Box>
          )}
        >
          {availableTags.map((tag) => (
            <MenuItem key={tag._id} value={tag._id}>
              {tag.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      </>
  );
};

export default WorkerTags; 