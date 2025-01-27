import React from 'react';
import { Button, Typography, Container, Box, Paper } from '@mui/material';
import { useRecoilState } from 'recoil';
import { userRoleState, userTokenState } from '../recoil/storeAtom';

const HomePage = () => {

    const [userRole, setUserRole] = useRecoilState(userRoleState);
    const [userToken, setUserToken] = useRecoilState(userTokenState);

  console.log("User Role: ", userRole);
  console.log("User Token: ", userToken);

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bgcolor="background.default"
        color="text.primary"
      >
        <Typography variant="h3" component="h1" gutterBottom>
          ברוך הבא לאתר!
        </Typography>
        <Typography variant="body1" gutterBottom color="text.secondary">
          כאן תוכל לנהל מוסדות, כיתות, מפעילים ופעילויות.
        </Typography>
        <Button variant="contained" color="primary" size="large" sx={{ mb: 2 }}>
          התחבר
        </Button>
        <Button variant="outlined" color="secondary" size="large">
          עוד פרטים
        </Button>
        <Paper elevation={3} sx={{ mt: 4, p: 3, width: '100%' }}>
          <Typography>
            הדוגמה הזו מראה את ערכת הנושא החדשה שלך עם צבעי רקע, טקסט וכפתורים.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
