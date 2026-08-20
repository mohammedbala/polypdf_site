import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaWindows,
  FaDownload,
  FaShieldAlt,
  FaSyncAlt,
  FaCheckCircle
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

import { fetchWindowsRelease } from './VersionHistory';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

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
      'The installer and the app are code-signed by Euclidean Software, LLC, so Windows can verify who published them.',
      'A brand-new release can still trigger a SmartScreen notice while it builds reputation with Microsoft. Click "More info", then "Run anyway".',
      'As on Mac, your PDFs and measurements stay on your device.'
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
      'About 500 MB of free disk space.',
      'Same free tier as Mac: full markup and review tools, up to 3 hand-created measurements per document, and uncapped Symbol Search auto-count.'
    ]
  }
];

const WindowsPreview = () => {
  const [release, setRelease] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
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
            <img src={parrotIcon} alt="PolyPDF" width="1024" height="1024" />
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
              PolyPDF ships for Windows 10 and 11 as a signed installer. It is the same drawing-review
              app as on the Mac — open sheets, mark up review comments, calibrate scale, and measure — and it
              keeps itself up to date automatically.
            </p>
            <div className="cta-download-row" style={{ marginTop: '1.5rem' }}>
              <a href={windowsInstallerURL} className="primary-btn large" download onClick={() => trackEvent('download_click', { source: 'windows_page', platform: 'windows' })}>
                <FaWindows /> Download PolyPDF for Windows
              </a>
            </div>
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
          </div>

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
                  <h2>{section.title}</h2>
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
