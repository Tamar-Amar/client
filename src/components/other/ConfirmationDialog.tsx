import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  contentText: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 5,
        },
      }}
    >
      <DialogTitle id="confirmation-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <WarningAmberIcon color="warning" sx={{ fontSize: '2rem' }}/>
        <Box>
            {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          {contentText}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 20px 24px' }}>
        <Button onClick={onClose} color="inherit" variant="outlined">
          ביטול
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          אישור מחיקה
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 