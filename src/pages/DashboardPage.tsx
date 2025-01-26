import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  CssBaseline,
  Container,
  Box,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import PersonalDetails from '../components/PersonalDetails';
import ActivityHistory from '../components/ActivityHistory';
import { useFetchOperator } from '../queries/operatorQueries';

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  // שליפת נתוני המפעיל המחובר
  const { data: operator, isLoading, error } = useFetchOperator();

  const handleLogout = () => {
    localStorage.removeItem('token'); // מחיקת הטוקן
    window.location.href = '/login'; // הפניה לעמוד הכניסה
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <div>שגיאה בטעינת הנתונים</div>;

  return (
    <>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            דשבורד למפעיל
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            יציאה
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="פרטים אישיים" />
            <Tab label="היסטוריית הפעלות" />
          </Tabs>
        </Paper>
        <Box sx={{ mt: 4 }}>
          {tab === 0 && operator && <PersonalDetails operator={operator} />}
          {tab === 1 && <ActivityHistory />}
        </Box>
      </Container>
    </>
  );
};

export default DashboardPage;
