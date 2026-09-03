import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Route, Routes } from 'react-router';
import Account from './components/Account';
import Blog from './components/Blog';
import BlogPost from './components/BlogPost';
import BuildYourOwnPlugin from './components/BuildYourOwnPlugin';
import Buy from './components/Buy';
import FeatureRequests from './components/FeatureRequests';
import Home from './components/Home';
import NotFound from './components/NotFound';
import Privacy from './components/Privacy';
import Refund from './components/Refund';
import RouteMetadata from './components/RouteMetadata';
import Support from './components/Support';
import SiteFooter from './components/SiteFooter';
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
      <MotionConfig reducedMotion="user">
        <a className="site-skip-link" href="#site-content">Skip to content</a>
        <div id="site-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buy" element={<Buy />} />
            {/* The app's upgrade dialog opens /buy with source=/utm_source= set, and Buy detects that
                on its own — so every already-installed copy gets the in-app view without an app
                release. /upgrade is the stable short URL for support replies and for a future build to
                point at directly; it renders the same view unconditionally. */}
            <Route path="/upgrade" element={<Buy forceInApp />} />
            <Route path="/account" element={<Account />} />
            <Route path="/build-a-plugin" element={<BuildYourOwnPlugin />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/feature-requests" element={<FeatureRequests />} />
            <Route path="/support" element={<Support />} />
            <Route path="/windows" element={<WindowsPreview />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/versions" element={<VersionHistory />} />
            <Route path={landingPages.revisionPackages.path} element={<WorkflowLanding page={landingPages.revisionPackages} />} />
            <Route path={landingPages.pdfTakeoffSoftware.path} element={<WorkflowLanding page={landingPages.pdfTakeoffSoftware} />} />
            <Route path={landingPages.measurePdfOnMac.path} element={<WorkflowLanding page={landingPages.measurePdfOnMac} />} />
            <Route path={landingPages.constructionPdfMarkup.path} element={<WorkflowLanding page={landingPages.constructionPdfMarkup} />} />
            <Route path={landingPages.visualSearchPdfCount.path} element={<WorkflowLanding page={landingPages.visualSearchPdfCount} />} />
            <Route path={landingPages.comparePdfDrawings.path} element={<WorkflowLanding page={landingPages.comparePdfDrawings} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <SiteFooter />
      </MotionConfig>
    </div>
  );
};

export default AppRoutes;
