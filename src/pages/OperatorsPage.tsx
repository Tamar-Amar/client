import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";

const OperatorsPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <h1>ניהול מפעילים</h1>
      {/* כפתור לפתיחת החלון */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ marginBottom: "20px" }}
      >
        הוספת מפעיל חדש
      </Button>
      
      {/* רשימת מפעילים */}
      <OperatorList />

      {/* פופאפ של הוספת מפעיל */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>הוספת מפעיל חדש</DialogTitle>
        <DialogContent>
          <OperatorCreate />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            ביטול וחזרה
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OperatorsPage;
