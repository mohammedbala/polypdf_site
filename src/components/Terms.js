import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaFileContract,
  FaGavel,
  FaHandshake,
  FaLock
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const sections = [
  {
    icon: <FaFileContract />,
    title: 'Scope',
    content: [
      'PolyPDF is operated by Euclidean Software LLC.',
      'These terms apply to the PolyPDF website, the direct Mac download, and related support, licensing, and update services.',
      'By downloading, installing, purchasing, or using PolyPDF, you agree to these terms.',
      'If you do not agree, do not use the service or install the app.'
    ]
  },
  {
    icon: <FaHandshake />,
    title: 'Free and paid access',
    content: [
      'The Mac app may be offered as a free download with limited free measurement usage before purchase is required for additional measurement workflows.',
      'PolyPDF Pro is intended to be sold as a one-time purchase rather than a recurring subscription.',
      'The current direct Mac offer includes free markup and review tools, 3 measurements per document, and an optional $49.99 lifetime Pro license.'
    ]
  },
  {
    icon: <FaLock />,
    title: 'Direct Mac purchases and license use',
    content: [
      'The current direct Mac purchase flow is processed through Stripe and unlocked with a PolyPDF license key.',
      'A direct Pro purchase grants a personal, non-transferable license to use the Mac app.',
      'Each direct license may be activated on up to 3 Macs unless PolyPDF states otherwise at checkout.',
      'You may not resell, sublicense, share, or distribute your license key.',
      'PolyPDF may suspend or revoke a license for fraud, chargebacks, abuse, or material violation of these terms.'
    ]
  }
];

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page terms">
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
            <h1>Terms of Use</h1>
            <p className="legal-subtitle">Terms for the PolyPDF website and direct Mac download</p>
            <p className="last-updated">Last updated: April 19, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              These Terms of Use are between you and Euclidean Software LLC, and govern your use
              of PolyPDF, including the PolyPDF website, the direct-download Mac application,
              and related purchasing, licensing, support, and update services.
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

          <section className="legal-section">
            <h2>Refunds</h2>
            <ul className="section-content">
              <li>Direct Mac purchases are processed by Stripe and are subject to PolyPDF's refund policy.</li>
              <li>Unless required by applicable law, transactions are generally non-refundable and non-exchangeable.</li>
              <li>PolyPDF may review discretionary refund requests submitted within 14 days of the transaction date, but a request in that period does not guarantee a refund.</li>
              <li>Refunded direct licenses may be suspended or revoked after the refund is completed.</li>
              <li>See the <Link to="/refund">Refund Policy</Link> for request steps and purchase-channel details.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaGavel /></div>
              <h2>Updates, support, and discontinuation</h2>
            </div>
            <ul className="section-content">
              <li>The direct Mac app may include in-app update delivery through Sparkle or a similar updater.</li>
              <li>Public app updates may be available to free and paid installs; Pro access stays tied to the license unless it is revoked, refunded, or otherwise suspended under these terms.</li>
              <li>Future features, future OS compatibility, and continued operation of online services are not guaranteed.</li>
              <li>If PolyPDF stops operating, already-downloaded software may keep working to the extent technically possible, but ongoing online services, new downloads, and reactivation are not guaranteed.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Acceptable use</h2>
            <ul className="section-content">
              <li>You must not use PolyPDF for illegal, fraudulent, or abusive activity.</li>
              <li>You remain responsible for the documents and data you process with the app.</li>
              <li>You must respect the intellectual property rights of others when using the app.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Disclaimers and limitation of liability</h2>
            <ul className="section-content">
              <li>PolyPDF is provided on an “as is” and “as available” basis.</li>
              <li>To the maximum extent allowed by law, PolyPDF disclaims implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.</li>
              <li>To the maximum extent allowed by law, PolyPDF is not liable for indirect, incidental, special, consequential, or punitive damages.</li>
              <li>If liability cannot be excluded, PolyPDF’s total liability is limited to the amount you paid for the applicable purchase.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>Questions for Euclidean Software LLC about these terms can be sent to:</p>
            <div className="contact-info">
              <a href="mailto:support@polypdf.app" className="contact-link">support@polypdf.app</a>
            </div>
          </section>
        </div>
      </motion.main>

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 Euclidean Software LLC. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/support">Support</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
