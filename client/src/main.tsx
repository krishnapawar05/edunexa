import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { SchoolBrandingProvider } from './context/SchoolBrandingContext.js';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SchoolBrandingProvider>
      <App />
    </SchoolBrandingProvider>
  </React.StrictMode>
);
