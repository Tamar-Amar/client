import React, { useState } from 'react';
import { Container, Box, Typography, Divider, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, CircularProgress, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import EditIcon from '@mui/icons-material/Edit';
import { useDeleteAllWorkersAfterNoon, useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import ExcelImport from '../../components/workers/ExcelImport';
import WorkersDocumentsList from '../../components/workers/WorkersDocumentsList';
import WorkerAfterNoonForm from '../../components/workers/CreateWorkerAfterNoonForm';
import { useNavigate } from 'react-router-dom';


const WorkersPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const deleteAllWorkersMutation = useDeleteAllWorkersAfterNoon();
  const { data: workers = [] } = useFetchAllWorkersAfterNoon();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const navigate = useNavigate();


  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      setDeleteProgress(0);

      await deleteAllWorkersMutation.mutateAsync();
      setDeleteProgress(100);
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
    <Box sx={{ p: 4, mt: 1}}>

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

        {isCreating ? (
          <WorkerAfterNoonForm onSuccess={() => setIsCreating(false)} />
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <WorkersDocumentsList />
            </Box>
            <Box sx={{ width: 200, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/workers/update')}
                startIcon={<EditIcon />}
                sx={{
                  color: '#ed6c02',
                  borderColor: '#ed6c02',
                  height: '50px',
                  '&:hover': {
                    borderColor: '#e65100',
                    color: '#e65100',
                    backgroundColor: 'rgba(237, 108, 2, 0.04)'
                  }
                }}
              >
                עדכון עובדים
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/workers/import')}
                startIcon={<ImportExportIcon />}
                sx={{
                  color: '#1976d2',
                  borderColor: '#1976d2',
                  height: '50px',
                  '&:hover': {
                    borderColor: '#1565c0',
                    color: '#1565c0',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                ייבוא מתקדם
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsImportDialogOpen(true)}
                startIcon={<UploadFileIcon />}
                sx={{
                  color: '#2e7d32',
                  borderColor: '#2e7d32',
                  height: '50px',
                  '&:hover': {
                    borderColor: '#1b5e20',
                    color: '#1b5e20',
                    backgroundColor: 'rgba(46, 125, 50, 0.04)'
                  }
                }}
              >
                ייבוא מהיר
              </Button>
              <Tooltip title="מחק את כל העובדים מהמערכת">
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={isDeleting || workers.length === 0}
                  onClick={() => setShowDeleteConfirm(true)}
                  startIcon={<DeleteForeverIcon />}
                  sx={{
                    height: '50px',
                  }}
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
            </Box>
          </Box>
        )}

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
    </Box>
  );
};

export default WorkersPage; 