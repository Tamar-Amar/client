import React, { useState } from 'react';
import { Box, Button, Typography, Dialog } from '@mui/material';
import ExcelImport from './ExcelImport';

const WorkerList: React.FC = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">רשימת עובדים</Typography>
        <Button
          variant="outlined"
          onClick={() => setIsImportDialogOpen(true)}
          sx={{
            color: '#2e7d32',
            borderColor: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              color: '#1b5e20',
              backgroundColor: 'transparent'
            },
          }}
        >
          ייבא עובדים מאקסל
        </Button>
      </Box>

      {/* תוכן הדף הקיים */}

      <Dialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>ייבוא עובדים מאקסל</Typography>
          <ExcelImport />
        </Box>
      </Dialog>
    </Box>
  );
};

export default WorkerList; 