import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import Navbar from './components/Navbar';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { CacheProvider } from '@emotion/react';
import rtlCache from './theme/mui-rtl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot } from 'recoil';
import queryClient from './queryClient';
import './App.css';


const App: React.FC = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Navbar />
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
  </CacheProvider>
  </QueryClientProvider>
  </RecoilRoot>
);

export default App;
