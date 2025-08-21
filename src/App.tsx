import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { BrowserRouter } from 'react-router-dom';
import AppContent from './AppContent';
import { CacheProvider } from '@emotion/react';
import rtlCache from './theme/mui-rtl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RecoilRoot } from 'recoil';
import queryClient from './queryClient';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

const App: React.FC = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={rtlCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
