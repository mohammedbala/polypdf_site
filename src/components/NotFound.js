import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Compass } from '@phosphor-icons/react';
import parrotIcon from '../assets/polypdf_icon-96.png';

const NotFound = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page not-found-page">
      <header className="legal-header">
        <nav className="nav container" aria-label="Main navigation">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="" width="96" height="96" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <ArrowLeft aria-hidden="true" weight="bold" /> Back to Home
          </Link>
        </nav>
      </header>

      <main className="legal-content not-found-content">
        <div className="container">
          <div className="not-found-mark" aria-hidden="true"><Compass weight="duotone" /></div>
          <p className="section-kicker">404 · Page not found</p>
          <h1>This page is not part of the current PolyPDF site.</h1>
          <p>
            The address may be outdated or mistyped. Start from the product overview, browse the
            practical guides, or open support if you were following setup instructions.
          </p>
          <div className="not-found-actions">
            <Link className="primary-btn" to="/">PolyPDF home</Link>
            <Link className="secondary-btn" to="/blog/">Guides</Link>
            <Link className="secondary-btn" to="/support/">Support</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
