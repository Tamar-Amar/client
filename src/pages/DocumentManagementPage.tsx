import React from 'react';
import { Box, Grid, Paper } from '@mui/material';
import PendingDocuments from '../components/documents/PendingDocuments';
import MissingDocuments from '../components/documents/MissingDocuments';
import DocumentUpload from '../components/documents/DocumentUpload';
import ApprovedDocuments from '../components/documents/ApprovedDocuments';
import AllDocumentsTable from '../components/documents/AllDocumentsTable';

const DocumentManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 8, height: '100%' }}>
      <Grid container spacing={2}>
      <Grid item xs={12} >
        <AllDocumentsTable />
      </Grid>
        {/* <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '300px' }}>
            <PendingDocuments />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '300px' }}>
            <ApprovedDocuments />
          </Paper>
        </Grid> */}
        {/* <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '300px' }}>
            <MissingDocuments />
          </Paper>
        </Grid> */}
        <Grid item xs={12} >
            <DocumentUpload />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentManagementPage; 