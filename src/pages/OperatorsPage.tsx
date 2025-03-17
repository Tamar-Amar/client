import React, { useState } from "react";
import { Container, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";

const OperatorsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* כותרת עם כפתור מתחתיה */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">ניהול מפעילים</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenDialog}
          sx={{ mt: 2, px: 4, py: 1.5, fontSize: "1.1rem" }}
        >
          הוסף מפעיל
        </Button>
      </Box>

      <OperatorList />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>הוסף מפעיל</DialogTitle>
        <DialogContent>
          <OperatorCreate />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OperatorsPage;
