import React from 'react';
import { RecoilRoot } from 'recoil';
import App from './App';


import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <RecoilRoot>
    <App />
  </RecoilRoot>,
 );
