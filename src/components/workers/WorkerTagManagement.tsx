import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAddWorkerTag, useDeleteWorkerTag, useFetchWorkerTags, useUpdateWorkerTag } from '../../queries/workerTagQueries';

const WorkerTagManagement: React.FC = () => {
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: tags = [], isLoading } = useFetchWorkerTags();
  const addTagMutation = useAddWorkerTag();
  const updateTagMutation = useUpdateWorkerTag();
  const deleteTagMutation = useDeleteWorkerTag();

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await addTagMutation.mutateAsync({ name: newTagName.trim() });
      setNewTagName('');
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleEditClick = (id: string, name: string) => {
    setEditingTag({ id, name });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingTag) return;

    try {
      await updateTagMutation.mutateAsync({
        id: editingTag.id,
        data: { name: editingTag.name }
      });
      setIsEditDialogOpen(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תגית זו?')) {
      try {
        await deleteTagMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  if (isLoading) {
    return <Typography>טוען...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleAddTag}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              label="שם התגית"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!newTagName.trim() || addTagMutation.isPending}
            >
              הוסף
            </Button>
          </Box>
        </form>
      </Paper>

      <List>
        {tags.map((tag) => (
          <ListItem
            key={tag._id}
            sx={{
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <ListItemText primary={tag.name} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleEditClick(tag._id, tag.name)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDelete(tag._id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
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
          <Button onClick={() => setIsEditDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleEditSave} variant="contained">
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerTagManagement; 