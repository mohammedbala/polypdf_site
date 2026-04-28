import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUserShield
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const sections = [
  {
    icon: <FaShieldAlt />,
    title: 'Information we collect',
    content: [
      'When you browse the website, we may receive basic technical information such as IP address, browser type, and page requests from our hosting and security providers.',
      'When you purchase or activate a direct Mac license, we may receive your email address, order identifiers, license status, app version, activation timestamps, and device or instance identifiers needed to manage the license.',
      'PolyPDF is designed so that your PDF documents and measurement content stay on your device unless you explicitly export, share, or sync them through a service you choose.'
    ]
  },
  {
    icon: <FaLock />,
    title: 'How we use information',
    content: [
      'Provide downloads, license reactivation, license activation, updates, order lookup, and customer support.',
      'Protect the service against fraud, abuse, and failed or duplicated activations.',
      'Understand crashes, app version adoption, and other operational issues needed to keep the direct Mac app working.'
    ]
  },
  {
    icon: <FaUserShield />,
    title: 'Sharing and processors',
    content: [
      'Payments for direct Mac purchases are processed by Stripe.',
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
            <h1>Privacy Policy</h1>
            <p className="legal-subtitle">How PolyPDF handles website and direct-download data</p>
            <p className="last-updated">Last updated: April 19, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              This Privacy Policy explains what information PolyPDF collects, how it is used,
              and how it is shared when you use the website, buy a direct Mac license, or use the app.
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
              <li>Order, support, and license records may be retained for as long as needed to operate the service, comply with legal obligations, resolve disputes, or enforce agreements.</li>
              <li>Technical logs are retained for operational and security purposes for limited periods determined by the hosting, crash, analytics, or payment providers involved.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Your choices</h2>
            <ul className="section-content">
              <li>You can choose not to purchase Pro and continue using the free tier within its limits where available.</li>
              <li>You can request deletion of support or account-related records where deletion is legally permitted and operationally possible.</li>
              <li>You can stop using the direct Mac app at any time by uninstalling it and deactivating the license on that Mac if needed.</li>
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

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/support">Support</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/terms">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
