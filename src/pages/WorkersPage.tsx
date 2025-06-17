import React, { useState } from 'react';
import { Container, Box, Typography, Divider, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, CircularProgress, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import WorkersList from '../components/workers/WorkersList';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDeleteWorkerAfterNoon, useFetchAllWorkersAfterNoon } from '../queries/workerAfterNoonQueries';
import ExcelImport from '../components/workers/ExcelImport';

const WorkersPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const deleteWorkerMutation = useDeleteWorkerAfterNoon();
  const { data: workers = [] } = useFetchAllWorkersAfterNoon();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      setDeleteProgress(0);

      const totalWorkers = workers.length;
      for (let i = 0; i < workers.length; i++) {
        await deleteWorkerMutation.mutateAsync(workers[i]._id);
        setDeleteProgress(((i + 1) / totalWorkers) * 100);
      }

      alert(`נמחקו ${workers.length} עובדים בהצלחה`);
    } catch (error) {
      console.error('Error deleting workers:', error);
      alert('שגיאה במחיקת העובדים');
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            {isCreating ? 'הוספת עובד חדש' : 'ניהול עובדים'}
          </Typography>
          <Box display="flex" gap={1}>
            {!isCreating && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsImportDialogOpen(true)}
                  startIcon={<UploadFileIcon />}
                  sx={{
                    color: '#2e7d32',
                    borderColor: '#2e7d32',
                    '&:hover': {
                      borderColor: '#1b5e20',
                      color: '#1b5e20',
                      backgroundColor: 'rgba(46, 125, 50, 0.04)'
                    }
                  }}
                >
                  ייבוא מאקסל
                </Button>
                <Tooltip title="מחק את כל העובדים מהמערכת">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={isDeleting || workers.length === 0}
                    onClick={() => setShowDeleteConfirm(true)}
                    startIcon={<DeleteForeverIcon />}
                  >
                    {isDeleting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="error" />
                        <span>מוחק... {Math.round(deleteProgress)}%</span>
                      </Box>
                    ) : (
                      'מחק הכל'
                    )}
                  </Button>
                </Tooltip>
              </>
            )}
            <IconButton 
              color="primary" 
              onClick={() => setIsCreating(!isCreating)}
              size="large"
            >
              {isCreating ? <CloseIcon /> : <AddIcon />}
            </IconButton>
          </Box>
        </Box>

        {isDeleting && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={deleteProgress} 
              color="error"
              sx={{
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mt: 0.5 }}
            >
              {`מוחק ${Math.round(deleteProgress)}% מהעובדים...`}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />
        <WorkersList />
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>
          אישור מחיקת כל העובדים
        </DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את כל העובדים מהמערכת?
            <br />
            פעולה זו תמחק {workers.length} עובדים ולא ניתן יהיה לשחזר אותם.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteAll} 
            color="error" 
            variant="contained"
            startIcon={<DeleteForeverIcon />}
          >
            מחק הכל
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel import dialog */}
      <Dialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>ייבוא עובדים מאקסל</Typography>
          <ExcelImport onSuccess={() => setIsImportDialogOpen(false)} />
        </Box>
      </Dialog>
    </Container>
  );
};

export default WorkersPage; 