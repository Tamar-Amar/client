import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { useWorkerTags } from '../../queries/useTags';
import { WorkerTag } from '../../types';

interface Props {
  workerId: string;
  existingTags?: WorkerTag[];
  onTagsChange?: (tags: WorkerTag[]) => void;
}

const WorkerTags: React.FC<Props> = ({ workerId, existingTags = [], onTagsChange }) => {
  const [selectedTag, setSelectedTag] = useState<WorkerTag | null>(null);
  const [customTag, setCustomTag] = useState('');

  const {
    availableTags,
    isLoading,
    updateTags,
    isUpdating
  } = useWorkerTags(workerId);

  const handleAddTag = () => {
    if (!selectedTag && !customTag) return;

    const tagToAdd = selectedTag || { name: customTag, _id: '', isActive: true };
    if (existingTags.some(tag => tag._id === tagToAdd._id || tag.name === tagToAdd.name)) return;

    const newTags = [...existingTags, tagToAdd];
    updateTags(newTags.map(tag => tag._id), {
      onSuccess: () => {
        if (onTagsChange) onTagsChange(newTags);
        setSelectedTag(null);
        setCustomTag('');
      }
    });
  };

  const handleDeleteTag = (tagToDelete: WorkerTag) => {
    const newTags = existingTags.filter(tag => tag._id !== tagToDelete._id);
    updateTags(newTags.map(tag => tag._id), {
      onSuccess: () => {
        if (onTagsChange) onTagsChange(newTags);
      }
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        ניהול תגיות עובד
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Autocomplete
            freeSolo
            options={availableTags}
            value={selectedTag}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                setCustomTag(newValue);
                setSelectedTag(null);
              } else {
                setSelectedTag(newValue);
                setCustomTag('');
              }
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.name;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר או הוסף תגית"
                variant="outlined"
                size="small"
                onChange={(e) => {
                  if (!selectedTag) {
                    setCustomTag(e.target.value);
                  }
                }}
              />
            )}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            onClick={handleAddTag}
            disabled={(!selectedTag && !customTag) || isUpdating}
          >
            {isUpdating ? <CircularProgress size={20} /> : 'הוסף תגית'}
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          תגיות נוכחיות:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {existingTags.map((tag) => (
            <Chip
              key={tag._id || tag.name}
              label={tag.name}
              onDelete={() => handleDeleteTag(tag)}
              color="primary"
              variant="outlined"
              disabled={isUpdating}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default WorkerTags; 