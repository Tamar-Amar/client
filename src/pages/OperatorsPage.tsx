import React, { useState } from "react";
import { Container, Box, Typography, Divider, IconButton } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";

const OperatorsPage: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            {isCreating ? 'הוספת מפעיל חדש' : 'ניהול מפעילים'}
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
          <OperatorCreate onSuccess={() => setIsCreating(false)} />
        ) : (
          <OperatorList />
        )}
      </Box>
    </Container>
  );
};

export default OperatorsPage;
