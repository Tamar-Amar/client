import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#00A6FB', // תכלת כהה
      light: '#A5D8FF', // תכלת בהיר
      dark: '#003459', // כחול כהה
    },
    secondary: {
      main: '#FFD700', // צהוב
      dark: '#FF6F00', // כתום
    },
    background: {
      default: '#F5F5F5', // צבע רקע כללי (לבן רך)
      paper: '#FFFFFF', // רקע של כרטיסים
    },
    text: {
      primary: '#003459', // טקסט ראשי - כחול כהה
      secondary: '#00A6FB', // טקסט משני - תכלת כהה
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});

export default theme;
