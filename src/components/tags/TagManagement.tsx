import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useWorkerTags } from '../../queries/useTags';
import BulkTagAssignment from './BulkTagAssignment';

const TagManagement = () => {
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    availableTags,
    isLoading,
    isError,
    error,
    createTag,
    deleteTag,
    updateTag,
    isCreating,
    isDeleting,
    isUpdating
  } = useWorkerTags('all'); // Using 'all' to get all tags
  console.log("Available tags:", availableTags);

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim(), {
        onSuccess: () => {
          setNewTagName('');
        }
      });
    }
  };

  const handleUpdateTag = () => {
    if (editingTag && editingTag.name.trim()) {
      updateTag(
        { id: editingTag.id, name: editingTag.name.trim() },
        {
          onSuccess: () => {
            setEditingTag(null);
            setIsDialogOpen(false);
          }
        }
      );
    }
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תגית זו?')) {
      deleteTag(tagId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          שגיאה בטעינת התגיות: {error instanceof Error ? error.message : 'שגיאה לא ידועה'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        ניהול תגיות
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="שם תגית חדשה"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleCreateTag}
            disabled={!newTagName.trim() || isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            הוסף תגית
          </Button>
        </Stack>
      </Paper>

      <BulkTagAssignment />
      
      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        תגיות קיימות
      </Typography>
      
      <Paper sx={{ mt: 2 }}>
        <List>
          {availableTags.map((tag) => (
            <ListItem key={tag._id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={tag.name} />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setEditingTag({ id: tag._id, name: tag.name });
                    setIsDialogOpen(true);
                  }}
                  disabled={isUpdating}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteTag(tag._id)}
                  disabled={isDeleting}
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {availableTags.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary" align="center">
                    אין תגיות זמינות
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <DialogTitle>עריכת תגית</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="שם התגית"
            fullWidth
            value={editingTag?.name || ''}
            onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleUpdateTag}
            disabled={!editingTag?.name.trim() || isUpdating}
            variant="contained"
          >
            {isUpdating ? <CircularProgress size={24} /> : 'שמור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagManagement; 