import React, { useState } from 'react';
import { Container, Box, Typography, Divider, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import WorkerList from '../components/workers/WorkerList';
import WorkerCreate from '../components/workers/WorkerCreate';
import WorkersList from '../components/WorkersList';

const WorkersPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            {isCreating ? 'הוספת עובד חדש' : 'ניהול עובדים'}
          </Typography>
          <IconButton 
            color="primary" 
            onClick={() => setIsCreating(!isCreating)}
            size="large"
          >
            {isCreating ? <CloseIcon /> : <AddIcon />}
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {isCreating ? (
          <WorkerCreate onSuccess={() => setIsCreating(false)} />
        ) : (
          <WorkersList />
        )}
      </Box>
    </Container>
  );
};

export default WorkersPage; 