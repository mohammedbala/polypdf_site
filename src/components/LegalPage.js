import React from 'react';
import { Link } from 'react-router';
import parrotIcon from '../assets/polypdf_icon-96.png';

export default function LegalPage({ title, subtitle, children }) {
  return <div className="legal-page">
    <header className="legal-header"><nav className="nav container" aria-label="Legal page navigation">
      <Link to="/" className="logo" aria-label="PolyPDF home"><img src={parrotIcon} alt="" width="96" height="96" /><span>PolyPDF</span></Link>
      <Link to="/" className="back-link">Back to Home</Link>
    </nav></header>
    <main className="legal-content"><div className="container">
      <div className="legal-hero"><h1>{title}</h1><p className="legal-subtitle">{subtitle}</p><p className="last-updated">Last updated: September 6, 2026</p></div>
      <nav className="legal-jump-links" aria-label="Policies"><Link to="/privacy/">Privacy</Link><Link to="/cookies/">Cookies</Link><Link to="/terms/">Terms of use</Link><Link to="/refund/">Refunds</Link><Link to="/accessibility/">Accessibility</Link></nav>
      {children}
    </div></main>
  </div>;
}
