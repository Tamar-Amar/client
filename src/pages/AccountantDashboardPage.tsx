import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Container,
  Paper
} from '@mui/material';
import {
  Description as DocumentIcon,
  People as WorkersIcon,
  Assessment as MatsevetIcon,
  Schedule as AttendanceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AccountantDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'ניהול מסמכים',
      description: 'צפייה ואישור מסמכים',
      icon: <DocumentIcon sx={{ fontSize: 40 }} />,
      path: '/documents',
      color: '#1976d2'
    },
    {
      title: 'מצבת',
      description: 'ניהול מצבת',
      icon: <MatsevetIcon sx={{ fontSize: 40 }} />,
      path: '/matsevet',
      color: '#388e3c'
    },
    {
      title: 'עובדים',
      description: 'ניהול רשימת עובדים',
      icon: <WorkersIcon sx={{ fontSize: 40 }} />,
      path: '/workers',
      color: '#f57c00'
    },
    {
      title: 'נוכחות עובדים',
      description: 'צפייה בנוכחות עובדים',
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      path: '/worker-attendance',
      color: '#7b1fa2'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 6, mb: 3}}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          דשבורד חשב שכר
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Box sx={{ color: item.color, mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AccountantDashboardPage; 