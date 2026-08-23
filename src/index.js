import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeOpenAIAdsMeasurement } from './lib/openaiAds';

// Initialize before React renders so the SDK can capture the oppref click reference from the
// landing-page URL and queue later conversion events while its network script is loading.
initializeOpenAIAdsMeasurement();

// The build prerenders each route's markup into #root (scripts/prerender.js) so crawlers that do
// not run JavaScript still receive the full page. In the browser we deliberately render() rather
// than hydrateRoot(): the download CTA and attribution UI are platform/URL-dependent, so the
// prerendered platform-neutral markup would mismatch hydration. render() replaces it cleanly.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
