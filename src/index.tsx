import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import App from './App';
import { AppProvider } from './context/AppContext';

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App/>
//   </React.StrictMode>
// );

// ReactDOM.render(
//   <RecoilRoot>
//     <AppProvider>
//     <App />
//     </AppProvider>
//   </RecoilRoot>,
//   document.getElementById('root')
// );

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <RecoilRoot>
    <AppProvider>
    <App />
    </AppProvider>
  </RecoilRoot>,
 );
