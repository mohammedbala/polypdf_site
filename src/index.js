import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/outfit';
import './index.css';
import App from './App';

// Production routes arrive with their complete prerendered page already inside #root. Hydration
// preserves those pixels while React attaches interactivity; the development shell still starts
// from an empty root. Platform-specific download controls intentionally detect the OS after the
// first client render so server and client markup agree during hydration.
const container = document.getElementById('root');
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
