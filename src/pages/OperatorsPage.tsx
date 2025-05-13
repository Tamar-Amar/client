import React, { useState } from "react";
import { Container, Box, Typography, Divider, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";

const OperatorsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">ניהול מפעילים</Typography>
          <Fab color="primary" aria-label="הוסף" onClick={handleOpenDialog} size="medium">
            <AddIcon />
          </Fab>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <OperatorList />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogContent>
          <OperatorCreate />
        </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              variant="contained"
              color="error"
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              ביטול וחזרה
            </Button>
            <Button
              type="submit"
              form="operator-create-form"
              variant="contained"
              color="primary"
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              הוספת מפעיל
            </Button>
          </DialogActions>

      </Dialog>
    </Container>
  );
};

export default OperatorsPage;
