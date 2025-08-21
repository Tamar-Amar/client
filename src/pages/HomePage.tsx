import React from 'react';
import { Button, Typography, Container, Box, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useRecoilValue } from 'recoil';
import { userRoleState } from '../recoil/storeAtom';

const HomePage = () => {
  const navigate = useNavigate();
  const role = useRecoilValue(userRoleState);

  const features = [
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'ניהול עובדים',
      description: 'מעקב אחר מסמכים ופעילויות'
    },
    {
      icon: <AssignmentIndIcon sx={{ fontSize: 40 }} />,
      title: 'טפסים דיגיטליים',
      description: 'העלאה וניהול מסמכים באופן מקוון'
    },
    {
      icon: <EventNoteIcon sx={{ fontSize: 40 }} />,
      title: 'דוחות ומעקב',
      description: 'מעקב אחר פעילויות והפקת דוחות'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        pt: 8,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={8}>
          <Typography
            component="h1"
            variant="h3"
            color="primary"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 2
            }}
          >
            מערכת צעירון
          </Typography>
          
          {!role && (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                mt: 4,
                mb: 6,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 2,
                boxShadow: 3
              }}
            >
              התחברות למערכת
            </Button>
          )}
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 4,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box
                  sx={{
                    mb: 2,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    opacity: 0.8
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;
