// components/Institution/EditInstitutionDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useUpdateInstitution } from '../../queries/institutionQueries';

interface EditInstitutionDialogProps {
  open: boolean;
  institution: any;
  onClose: () => void;
}

const EditInstitutionDialog: React.FC<EditInstitutionDialogProps> = ({ open, institution, onClose }) => {
  const [name, setName] = useState(institution.name);
  const [institutionCode, setInstitutionCode] = useState(institution.institutionCode);
  const updateMutation = useUpdateInstitution();

  const handleSave = () => {
    updateMutation.mutate({
      id: institution._id,
      updatedInstitution: { name, institutionCode },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>עריכת מוסד</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="שם מוסד"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="קוד מוסד"
          fullWidth
          value={institutionCode}
          onChange={(e) => setInstitutionCode(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">ביטול</Button>
        <Button onClick={handleSave} color="primary">שמירה</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInstitutionDialog;
