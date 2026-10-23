import { trackEvent } from '../lib/analytics';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaWindows,
  FaDownload,
  FaShieldAlt,
  FaSyncAlt,
  FaCheckCircle
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon-96.png';
import siteRelease from '../lib/siteRelease.json';
import { commercialOffer, licenseRightsText, refundSummaryText } from '../lib/commercialOffer';
import PlanComparison from './PlanComparison';
import './WindowsPreview.css';

import { fetchWindowsRelease } from './VersionHistory';


const windowsInstallerURL = '/downloads/windows/PolyPDFSetup.exe';

const sections = [
  {
    icon: <FaDownload />,
    title: 'Download and install',
    content: [
      'Download PolyPDFSetup.exe and run it.',
      'The installer sets PolyPDF up for your user account — no administrator password needed — and you can pick the install folder if you like.',
      'PolyPDF opens when the installer finishes. To remove it later, uninstall from Windows Settings like any other app.'
    ]
  },
  {
    icon: <FaShieldAlt />,
    title: 'Signed for Windows',
    content: [
      'The installer and the app are code-signed by Euclidean Software LLC, so Windows can verify who published them.',
      'A new release can still trigger a SmartScreen notice while it builds reputation with Microsoft. Before continuing, choose "More info" and confirm the publisher is Euclidean Software LLC; do not run an installer that shows an unknown or different publisher.',
      'Core PDF viewing, measurement, and markup run locally. Sharing and connected workflows can send documents off the device.'
    ]
  },
  {
    icon: <FaSyncAlt />,
    title: 'Updates itself',
    content: [
      'PolyPDF for Windows checks for updates automatically and installs them when you quit the app — no manual downloads.',
      'It is the same PolyPDF engine the Mac app ships, at the same version.',
      'Running an earlier Windows build from an unzipped folder? Run the installer, then delete the old folder.'
    ]
  },
  {
    icon: <FaCheckCircle />,
    title: 'Requirements',
    content: [
      'Windows 10 or 11, 64-bit (x64).',
      'About 500 MB of free disk space.'
    ]
  }
];

const WindowsPreview = () => {
  const [release, setRelease] = useState({
    platform: 'Windows',
    version: siteRelease.version,
    build: Number(siteRelease.build),
    date: ''
  });

  useEffect(() => {
    let active = true;
    if (!window.location.hash) window.scrollTo(0, 0);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && window.location.hash) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  // Read straight from the updater feed so the page cannot fall behind a release.
  useEffect(() => {
    let cancelled = false;
    fetchWindowsRelease()
      .then((current) => {
        if (!cancelled) setRelease(current);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="legal-page windows-preview">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="" width="96" height="96" />
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
            <h1>PolyPDF for <span className="gradient-text">Windows</span></h1>
            <p className="legal-subtitle">A signed installer with automatic updates</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF is desktop PDF measurement, takeoff, and markup software for Windows 10 and 11
              on 64-bit (x64) PCs. Calibrate a drawing, measure distances and areas, review quantities,
              and compare drawing revisions. Core PDF work runs locally on your computer.
            </p>
            <p className="windows-download-facts">Start free with markup, review, scale calibration, and up to 3 hand-created measurements per document. No trial timer. Pro unlocks unlimited hand-created measurements and additional workflows.</p>
            <div className="cta-download-row" style={{ marginTop: '1.5rem' }}>
              <a href={windowsInstallerURL} className="primary-btn large" download onClick={() => trackEvent('download_click', { source: 'windows_page', platform: 'windows' })}>
                <FaWindows /> Download PolyPDF for Windows
              </a>
            </div>
            <p className="windows-download-facts">Windows 10 or 11 · 64-bit (x64) · About 500 MB free disk space. Signed by Euclidean Software LLC.</p>
            <p className="last-updated" style={{ marginTop: '0.9rem' }}>
              {release && (
                <>
                  Current version {release.version}
                  {release.build ? ` (build ${release.build})` : ''}
                  {release.date ? `, released ${release.date}` : ''}.{' '}
                </>
              )}
              <Link to="/versions/">See what changed in every release</Link>.
            </p>
            <nav className="windows-jump-links" aria-label="Windows download guide">
              <a href="#measure-pdf-on-windows">Try PDF measurement</a>
              <a href="#windows-free-vs-pro">Compare Free and Pro</a>
              <a href="#windows-installation">Installation and updates</a>
            </nav>
          </div>

          <section className="windows-workflow" aria-labelledby="measure-pdf-on-windows">
            <h2 id="measure-pdf-on-windows">How do I measure a PDF on Windows?</h2>
            <p>Open a drawing in PolyPDF, calibrate a known dimension, and check the scale before measuring. A PDF page size or a printed scale label alone does not establish accurate measurements.</p>
            <ol className="windows-measure-steps">
              <li><strong>Set the scale.</strong> Choose a clearly dimensioned span and enter its real length and units. Calibrate the relevant page or drawing region, especially when a sheet contains views at different scales.</li>
              <li><strong>Check a different dimension.</strong> Measure an independent known span before taking off quantities. On a scanned plan, check both horizontal and vertical references. Resolve mismatches before continuing.</li>
              <li><strong>Measure, review, and save.</strong> Measure the required lengths or net areas, review quantities and units in the worksheet, and save a separate PDF copy. Reopen it and check the output you need to share.</li>
            </ol>
            <p><Link to="/blog/calibrate-pdf-drawing-scale/">Read the calibration guide</Link> · <Link to="/tools/pdf-scale-checker/">Check reference measurements</Link> · <Link to="/pdf-measuring-tool/">Explore the measurement workflow</Link></p>
            <div className="windows-practice">
              <h3>Try a small drawing before buying.</h3>
              <p>The flooring practice workflow fits an independent check and two net room areas within the three-measurement Free limit. Use the drawing and reference quantities to evaluate your Windows installation.</p>
              <p><Link to="/pdf-takeoff-software/#try-a-takeoff">Get the practice drawing and steps →</Link></p>
              <p className="windows-fine-print">The published sample exports were verified in PolyPDF 1.6.6 build 38 on Mac. They do not establish Windows or current-release parity. Check your own saved PDF and worksheet before relying on them.</p>
            </div>
          </section>

          <section className="windows-plans" aria-labelledby="windows-free-vs-pro">
            <h2 id="windows-free-vs-pro">Is PolyPDF for Windows free?</h2>
            <p>Yes. Free includes markup, review, calibration, up to 3 hand-created measurements per document, and Revision Package viewing. Choose Pro for unlimited hand-created measurements, Symbol Search, PDF content editing, and the other Pro workflows below.</p>
            <div className="windows-plan-grid">
              <div>
                <h3>One personal license for Mac and Windows.</h3>
                <p className="windows-pro-price">{commercialOffer.price} USD, one payment.</p>
                <p>No subscription. Applicable taxes are shown at checkout.</p>
                <p>{licenseRightsText}</p>
                <p><Link to="/buy/?source=windows_plan_comparison" className="secondary-btn">Review Pro pricing and purchase →</Link></p>
                <p className="windows-fine-print">{refundSummaryText} <Link to="/refund/">Refund policy</Link>.</p>
                <p className="windows-fine-print">A personal license's computer allowance is not a team seat allocation. <Link to="/teams/">Review organization-managed licensing</Link>.</p>
              </div>
              <PlanComparison />
            </div>
          </section>

          <section className="windows-connectivity" aria-labelledby="windows-local-processing">
            <h2 id="windows-local-processing">Does PolyPDF upload my drawings to measure them?</h2>
            <p>Core PDF viewing, measurement, markup, and editing run locally. Documents can leave your computer when you choose to share, export, or use a connected workflow.</p>
            <p>Activation and license validation, updates, purchases, account access, and optional connected services use network connections. <Link to="/product-facts/#local-processing">Review local processing and network exceptions</Link> or read the <Link to="/privacy/">privacy policy</Link>.</p>
          </section>

          <h2 id="windows-installation" className="windows-installation-heading">Installation and updates</h2>
          <div className="legal-sections">
            {sections.map((section, index) => (
              <motion.section
                key={section.title}
                className="legal-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="section-header">
                  <div className="section-icon">{section.icon}</div>
                  <h3>{section.title}</h3>
                </div>
                <ul className="section-content">
                  {section.content.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>

          <div className="legal-footer-note">
            <p>
              Questions or a bug to report? Email <a href="mailto:support@polypdf.com">support@polypdf.com</a>{' '}
              and mention you are on Windows, with the version and build number above.{' '}
              <Link to="/versions/">Version history</Link>. Prefer Mac? <Link to="/">Get the Mac app</Link>.
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default WindowsPreview;
