import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";
import PurchaseList from "../components/other/PurchasesList";
import PurchasesCreate from "../components/other/PurchasesCreate";

const OperatorsPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <h1>ניהול רכש</h1>
      {/* כפתור לפתיחת החלון */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ marginBottom: "20px" }}
      >
        הוספת רכישה
      </Button>
      
      {/* רשימת מפעילים */}
      <PurchaseList />

      {/* פופאפ של הוספת מפעיל */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>הוספת רכישה</DialogTitle>
        <DialogContent>
          <PurchasesCreate />
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
