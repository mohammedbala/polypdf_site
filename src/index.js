import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/outfit';
import './index.css';
import App from './App';
import { loadToolLanguage } from './toolkit/load-language';

// Production routes arrive with their complete prerendered page already inside #root. Hydration
// preserves those pixels while React attaches interactivity; the development shell still starts
// from an empty root. Platform-specific download controls intentionally detect the OS after the
// first client render so server and client markup agree during hydration.
const container = document.getElementById('root');
const start = async () => {
const toolkitStrings = await loadToolLanguage(document);
const app = (
  <React.StrictMode>
    <App toolkitStrings={toolkitStrings}/>
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
};
start().catch(() => {
  // Preserve translated server content on a failed language request; offer a localized retry.
  const payload = document.getElementById('pdf-tool-language');
  const data = payload ? JSON.parse(payload.textContent) : {};
  const retry = document.createElement('button');
  retry.textContent = data.retryLabel || 'Reload tools';
  retry.className = 'pdf-language-retry';
  retry.onclick = () => window.location.reload();
  retry.setAttribute('role','alert');
  container.prepend(retry);
});
