import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUserShield
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon-96.png';

const sections = [
  {
    icon: <FaShieldAlt />,
    title: 'Information we collect',
    content: [
      'When you browse the website, we may receive basic technical information such as IP address, browser type, and page requests from our hosting and security providers.',
      'The website stores short campaign codes such as source and UTM parameters for up to 30 days so a checkout can be attributed to the page or app placement that led to it. These codes do not contain document names or document content.',
      'Google Analytics and Google Ads measure website visits, acquisition sources, and completed purchases. A completed-purchase event contains a Stripe transaction identifier, order value, currency, and product name, but not your email address, license key, document name, or document content.',
      'The Try Now browser preview reads the PDF you choose and creates markups within your browser. PolyPDF does not upload the chosen PDF, its filename, or its markup content to our servers. Content-free events may record that a local file was opened, calibrated, or exported, together with a broad page-count or markup-count bucket.',
      'When you purchase or activate a direct license, we may receive your email address, order identifiers, license status, app version, activation timestamps, and device or instance identifiers needed to manage the license.',
      'The desktop app sends diagnostics only when you explicitly opt in. This may include a compact redacted error report and fixed product milestones such as opening the sample drawing, setting page scale, making a first measurement, or exporting results. Milestones contain no free-text field; diagnostics do not intentionally include PDF contents or filenames.',
      'AEC OCR, structured table recognition, measurement, and Revision Package analysis run locally. Revision Packages copy source evidence into the project location you choose and write published outputs there; PolyPDF does not upload that project to a PolyPDF cloud service.',
      'Collaboration Beta exchanges approved review data through the customer-owned host and mounted company share configured by the organization. PolyPDF does not host the drawing room for that workflow.',
      'PolyPDF is designed so that your PDF documents and measurement content stay on your device unless you explicitly export, share, or sync them through a service you choose. Closing or refreshing Try Now clears its unsaved in-browser session.'
    ]
  },
  {
    icon: <FaLock />,
    title: 'How we use information',
    content: [
      'Provide the Try Now browser preview, downloads, license reactivation, license activation, updates, order lookup, and customer support.',
      'Protect the service against fraud, abuse, and failed or duplicated activations.',
      'Measure whether advertising and website pages lead to completed purchases, without using that data for ad personalization.',
      'Understand crashes, app version adoption, and content-free activation milestones needed to improve the first-use experience.'
    ]
  },
  {
    icon: <FaUserShield />,
    title: 'Sharing and processors',
    content: [
      'Payments for direct purchases are processed by Stripe.',
      'Transactional license emails may be sent through Resend or another email provider.',
      'Infrastructure providers such as our web host, CDN, update host, analytics or crash tools, and payment tools may process data on our behalf to deliver the service.',
      'We do not sell your personal information.'
    ]
  }
];

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page privacy">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="96" height="96" />
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
            <h1>Privacy Policy</h1>
            <p className="legal-subtitle">How PolyPDF handles website and direct-download data</p>
            <p className="last-updated">Last updated: September 3, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              This Privacy Policy explains what information PolyPDF collects, how it is used,
              and how it is shared when you use the website or Try Now preview, buy a direct license, or use the app.
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
            <h2>Retention</h2>
            <ul className="section-content">
              <li>License records are retained while needed to provide a perpetual license, prevent fraud, handle refunds, and meet legal obligations. Financial records are retained for applicable tax and accounting obligations.</li>
              <li>Diagnostic error reports and opt-in activation milestones stored by PolyPDF are deleted after 90 days. Expired PolyPDF magic links and account sessions are removed automatically.</li>
              <li>Website campaign attribution codes are stored in your browser for up to 30 days and may be cleared at any time through your browser settings.</li>
              <li>Try Now does not create a server-side copy of your PDF or markups. Its working session remains in browser memory until you replace the document, refresh, or close the page.</li>
              <li>Google Analytics and Google Ads may store browser identifiers used to attribute a visit and a completed purchase. You can clear or block these identifiers through your browser settings.</li>
              <li>Web-server and provider logs are retained for operational and security purposes under the applicable host or processor retention schedule.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Your choices</h2>
            <ul className="section-content">
              <li>You can choose not to purchase Pro and continue using the free tier within its limits where available.</li>
              <li>You can keep diagnostic sharing off; it is off by default and can be changed in app settings.</li>
              <li>You can request deletion of support or account-related records where deletion is legally permitted and operationally possible.</li>
              <li>You can stop using the app at any time by uninstalling it and deactivating the license on that computer if needed.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Third-party terms</h2>
            <p>
              Payment, order management, license email, analytics, and infrastructure functions
              may be subject to the privacy terms of the provider handling that function, including
              Stripe, Resend, analytics providers, crash-reporting providers, and our hosting providers.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>If you have questions about this policy, contact:</p>
            <div className="contact-info">
              <a href="mailto:support@polypdf.com" className="contact-link">
                <FaEnvelope /> support@polypdf.com
              </a>
            </div>
          </section>
        </div>
      </motion.main>

    </div>
  );
};

export default Privacy;
