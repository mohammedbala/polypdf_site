import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Account from './components/Account';
import Blog from './components/Blog';
import BlogPost from './components/BlogPost';
import Buy from './components/Buy';
import Home from './components/Home';
import Privacy from './components/Privacy';
import Refund from './components/Refund';
import RouteMetadata from './components/RouteMetadata';
import Support from './components/Support';
import WindowsPreview from './components/WindowsPreview';
import Terms from './components/Terms';
import VersionHistory from './components/VersionHistory';
import WorkflowLanding from './components/WorkflowLanding';
import { landingPages } from './lib/landingPages';
import './App.css';

// Everything inside the router lives here so the same tree can be rendered two ways:
// - src/App.js wraps it in BrowserRouter for the real site, and
// - scripts/prerender.js wraps it in StaticRouter to write each route's static HTML at build time.
const AppRoutes = () => {
  return (
    <div className="App">
      <RouteMetadata />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/account" element={<Account />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/support" element={<Support />} />
        <Route path="/windows" element={<WindowsPreview />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/versions" element={<VersionHistory />} />
        <Route path={landingPages.bluebeamAlternativeMac.path} element={<WorkflowLanding page={landingPages.bluebeamAlternativeMac} />} />
        <Route path={landingPages.pdfTakeoffSoftware.path} element={<WorkflowLanding page={landingPages.pdfTakeoffSoftware} />} />
        <Route path={landingPages.measurePdfOnMac.path} element={<WorkflowLanding page={landingPages.measurePdfOnMac} />} />
        <Route path={landingPages.constructionPdfMarkup.path} element={<WorkflowLanding page={landingPages.constructionPdfMarkup} />} />
        <Route path={landingPages.visualSearchPdfCount.path} element={<WorkflowLanding page={landingPages.visualSearchPdfCount} />} />
        <Route path={landingPages.comparePdfDrawings.path} element={<WorkflowLanding page={landingPages.comparePdfDrawings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default AppRoutes;
