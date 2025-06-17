import React from 'react';
import { Box, Grid } from '@mui/material';
import DocumentUpload from '../components/documents/DocumentUpload';
import AllDocumentsTable from '../components/documents/AllDocumentsTable';

const DocumentManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 8, height: '100%' }}>
      <Grid container spacing={2}>
      <Grid item xs={12} >
        <AllDocumentsTable />
      </Grid>
        <Grid item xs={12} >
            <DocumentUpload />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentManagementPage; 