import React from 'react';
import { Box, Grid } from '@mui/material';
import AllDocumentsTable from '../components/documents/AllDocumentsTable';

const DocumentManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 4, height: '100%' }}>
      <Grid item xs={12} >
        <AllDocumentsTable />
      </Grid>
    </Box>
  );
};

export default DocumentManagementPage; 