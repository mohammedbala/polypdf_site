import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaTag } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

// Every entry is derived from the release notes actually shipped with that version (the canonical
// files served under /downloads/) and the Sparkle feed's publication dates. Add new versions at the
// TOP; link `notes` to the full release-notes page when one exists.
const releases = [
  {
    version: '1.1.3',
    date: 'July 28, 2026',
    notes: '/downloads/PolyPDFMac-v1.1.3-8.html',
    highlights: [
      'Saved style defaults, per tool: set highlight color, pen color, font and more once — every new markup uses them, even after quitting and reopening. Right-click a markup and choose "Set as Tool Default", or adjust the style bar with nothing selected.',
      'Text boxes and callouts start empty, so you can place and type straight away.',
      'The Callout keyboard shortcut is now Q, matching the key most estimators already use.',
      'Fixed: on Macs without Xcode, PolyPDF could trigger a macOS prompt to install the command line developer tools. They were never needed, and the prompt is gone.'
    ]
  },
  {
    version: '1.1.2',
    date: 'July 28, 2026',
    notes: '/downloads/PolyPDFMac-v1.1.2-7.html',
    highlights: [
      'Visual Search and automatic counting: select a symbol on a drawing and PolyPDF finds the other instances on the page, ready to commit as a Count series in one step.',
      'A dedicated search panel with results in context and highlighting across the document.',
      'Fixed: Command-X/C/V/A did nothing in text fields — including the license key box. All four shortcuts work everywhere now.',
      'Fixed: a temporary network problem could reset an activated Pro copy to the Free tier.',
      'Fixed: edits to markups imported from 1.0.x-era files could be silently undone on reopen.',
      'Fixed: saving certain large CAD and plan-set PDFs could produce a file other viewers reported as damaged.'
    ]
  },
  {
    version: '1.1.1',
    date: 'July 23, 2026',
    notes: '/downloads/PolyPDFMac-v1.1.1-6.html',
    highlights: [
      'Fixed: after closing the last window, opening a PDF from the Finder did nothing. It now opens in a new window as expected.',
      'Fill and hatch opacity controls are now steppers with 10% increments.'
    ]
  },
  {
    version: '1.1.0',
    date: 'July 19, 2026',
    notes: '/downloads/PolyPDFMac-v1.1.0-5.html',
    highlights: [
      'A major new foundation for PolyPDF, verified against the ISO 32000-2 PDF standard.',
      'Measurements and takeoff: calibrate a sheet once, measure lengths, areas, and counts, and pull totals into a takeoff worksheet.',
      'Full markup set: clouds, callouts, hatches, industry line styles, stamps, snapshots, and built-in symbol tool sets.',
      'Compare Documents: differences between two revisions arrive as editable revision-cloud markups.',
      'OCR for scanned sheets, including rotated labels on plan sets.',
      'Forms and digital signatures, Bates numbering, watermarks, flatten, page operations, and true content-removing redaction.'
    ]
  },
  {
    version: '1.0.1 – 1.0.3',
    date: 'April 27, 2026',
    notes: null,
    highlights: [
      'Maintenance releases for the original native Mac app.'
    ]
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    notes: null,
    highlights: [
      'Initial release of PolyPDF for Mac.'
    ]
  }
];

const VersionHistory = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page version-history">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
        </nav>
      </header>

      <motion.main
        className="legal-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="legal-hero">
            <h1>Version History</h1>
            <p className="legal-subtitle">What has shipped in PolyPDF for Mac, release by release</p>
            <p className="last-updated">Current version: 1.1.3</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF updates itself: choose PolyPDF &gt; Check for Updates in the app, or accept the
              update prompt when it appears. Existing Pro activations always carry over — an update
              never costs you your license.
            </p>
          </div>

          <div className="legal-sections">
            {releases.map((release, index) => (
              <motion.section
                key={release.version}
                className="legal-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <div className="section-header">
                  <div className="section-icon"><FaTag /></div>
                  <h2>{release.version}</h2>
                </div>
                <p className="last-updated">{release.date}</p>
                <ul className="section-content">
                  {release.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {release.notes && (
                  <p>
                    <a href={release.notes} target="_blank" rel="noopener noreferrer">
                      Full release notes
                    </a>
                  </p>
                )}
              </motion.section>
            ))}
          </div>
        </div>
      </motion.main>

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/support">Support</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VersionHistory;
