import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import InvoiceCreate from "../components/other/InvoiceCreate";
import InvoiceList from "../components/other/InvoicesList";

const InvoicesPage: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <h1>ניהול חשבוניות</h1>

      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ marginBottom: "20px" }}
      >
        הוספת חשבונית חדשה
      </Button>
      

      <InvoiceList />


      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>הוספת חשבונית חדשה</DialogTitle>
        <DialogContent>
          <InvoiceCreate />
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

export default InvoicesPage;
