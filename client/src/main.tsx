import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { SchoolBrandingProvider } from './context/SchoolBrandingContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import './styles/tokens.css';
import './styles/examinations.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="EduNexa Application Error">
      <ThemeProvider>
        <SchoolBrandingProvider>
          <App />
        </SchoolBrandingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
