import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { useAddContact } from "../queries/contactQueries";

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { _id: string; label: string }[];
  selectedItem: string;
  onSelect: (itemId: string) => void;
  onSave: () => void; // ✅ נוסיף את הפונקציה לשמירה!
  isContactAssignment?: boolean;
  institutions?: { _id: string; institutionCode: string; name: string }[];
  stores?: { _id: string; name: string }[];
  classes?: { _id: string; name: string; uniqueSymbol: string }[];
}

const AssignDialog: React.FC<AssignDialogProps> = ({
  open,
  onClose,
  title,
  items,
  selectedItem,
  onSelect,
  onSave, // ✅ נוסיף את הפרופס כדי שנוכל לקרוא ל-handleSubmitDialog
  isContactAssignment = false,
  institutions = [],
  stores = [],
  classes = [],
}) => {
  const addContactMutation = useAddContact();
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    entityType: "Institution",
    entityId: "",
  });

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.email || !newContact.entityType || !newContact.entityId)
      return;

    addContactMutation.mutate(
      {
        ...newContact,
        entityType: newContact.entityType as "Institution" | "Store" | "Class",
      },
      {
        onSuccess: (newlyCreatedContact) => {
          onSelect(newlyCreatedContact._id);
          setAddingContact(false);
          setNewContact({ name: "", phone: "", email: "", description: "", entityType: "Institution", entityId: "" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <InputLabel>בחר {title}</InputLabel>
          <Select value={selectedItem} onChange={(e) => onSelect(e.target.value as string)}>
            {items
              .slice()
              .sort((a, b) => a.label.localeCompare(b.label, "he"))
              .map((item) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.label}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {isContactAssignment && (
          <>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              לא מצאת? צור איש קשר חדש:
            </Typography>
            <Button onClick={() => setAddingContact(true)} color="primary">
              ➕ צור איש קשר חדש
            </Button>
          </>
        )}

        {addingContact && isContactAssignment && (
          <Box mt={2}>
            <TextField fullWidth margin="normal" label="שם" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            <TextField fullWidth margin="normal" label="טלפון" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
            <TextField fullWidth margin="normal" label="אימייל" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
            <TextField fullWidth margin="normal" label="תיאור חופשי" value={newContact.description} onChange={(e) => setNewContact({ ...newContact, description: e.target.value })} />

            <FormControl fullWidth margin="normal">
              <InputLabel>סוג ישות</InputLabel>
              <Select value={newContact.entityType} onChange={(e) => setNewContact({ ...newContact, entityType: e.target.value as "Institution" | "Store" | "Class" })}>
                <MenuItem value="Institution">מוסד</MenuItem>
                <MenuItem value="Store">חנות</MenuItem>
                <MenuItem value="Class">קבוצה</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>בחר ישות</InputLabel>
              <Select value={newContact.entityId} onChange={(e) => setNewContact({ ...newContact, entityId: e.target.value })}>
                {newContact.entityType === "Institution" &&
                  institutions?.map((i) => (
                    <MenuItem key={i._id} value={i._id}>
                      {i.institutionCode} - {i.name}
                    </MenuItem>
                  ))}
                {newContact.entityType === "Store" &&
                  stores?.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                {newContact.entityType === "Class" &&
                  classes?.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name} - {c.uniqueSymbol}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Button onClick={handleAddContact} color="success" variant="contained">
              שמור איש קשר
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          סגור
        </Button>
        <Button onClick={onSave} color="primary" variant="contained">
          שמירה
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDialog;
