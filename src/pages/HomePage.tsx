import React from 'react';
import { Button, Typography, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="background.default"
        color="text.primary"
        textAlign="center"
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          ברוך הבא!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb:5 }}>
          האתר שלך לניהול מוסדות, כיתות ופעילויות. התחבר כדי להמשיך.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2 , mb: 30  }}
          onClick={() => navigate('/login')}
        >
          עבור לעמוד התחברות
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
