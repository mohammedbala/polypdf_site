import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaWindows,
  FaDownload,
  FaShieldAlt,
  FaBell,
  FaCheckCircle
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const windowsPreviewURL = '/downloads/windows-preview/PolyPDF-Windows-Preview-v1.1.0-x64.zip';

const sections = [
  {
    icon: <FaDownload />,
    title: 'Download and run',
    content: [
      'Download the preview (a portable .zip — there is no installer yet).',
      'Unzip it anywhere you like, then open the PolyPDF folder.',
      'Double-click PolyPDF.exe to launch. Nothing is installed — you can move or delete the folder any time.'
    ]
  },
  {
    icon: <FaShieldAlt />,
    title: 'The first-launch warning is expected',
    content: [
      'Because this preview is not code-signed yet, Windows shows a blue "Windows protected your PC" (SmartScreen) screen the first time you run it.',
      'Click "More info", then "Run anyway". You only need to do this once.',
      'A properly signed release — no warning, with automatic in-place updates — is on the way.'
    ]
  },
  {
    icon: <FaBell />,
    title: 'What "preview" means',
    content: [
      'This is an early Windows build of the same PolyPDF engine that runs on Mac.',
      'It cannot update itself, and there is no Windows update feed published yet, so a manual check will simply report that you are up to date. Check back on this page for newer preview builds.',
      'As on Mac, your PDFs and measurements stay on your device.'
    ]
  },
  {
    icon: <FaCheckCircle />,
    title: 'Requirements',
    content: [
      'Windows 10 or 11, 64-bit (x64).',
      'About 500 MB of free disk space once unzipped.',
      'Same free tier as Mac: full markup and review tools, with 3 measurements per document before Pro.'
    ]
  }
];

const WindowsPreview = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page windows-preview">
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
            <h1>PolyPDF for Windows <span className="gradient-text">(Preview)</span></h1>
            <p className="legal-subtitle">An early portable build — download, unzip, and run</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF is coming to Windows. This preview lets you try the real app today on Windows 10 or 11.
              It is a portable build (no installer) and is not code-signed yet, so expect a one-time Windows
              warning on first launch — the steps below take about a minute.
            </p>
            <div className="cta-download-row" style={{ marginTop: '1.5rem' }}>
              <a href={windowsPreviewURL} className="primary-btn large" download>
                <FaWindows /> Download Windows Preview
              </a>
            </div>
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
              and mention you are on the Windows preview. Prefer Mac? <Link to="/">Get the Mac app</Link>.
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default WindowsPreview;
