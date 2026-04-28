import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaLifeRing,
  FaReceipt
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const sections = [
  {
    icon: <FaEnvelope />,
    title: 'Contact',
    content: [
      'Support email: support@polypdf.com',
      'Use this address for purchase questions, license activation problems, and general product support.',
      'When possible, include your app version, macOS version, Stripe receipt email, license key suffix, and a short description of the problem.'
    ]
  },
  {
    icon: <FaDownload />,
    title: 'Direct Mac download',
    content: [
      'The current live commercial offer on PolyPDF.com is the direct Mac download.',
      'Direct Mac purchases are processed through Stripe and unlocked with a PolyPDF license key sent by email.',
      'If you need help with activation, deactivation, or refund requests for the direct Mac version, contact support@polypdf.com.'
    ]
  },
  {
    icon: <FaReceipt />,
    title: 'Refunds and billing',
    content: [
      'Direct Mac purchases are subject to PolyPDF\'s refund policy, including any non-waivable consumer rights.',
      'Unless required by law, transactions are generally non-refundable; PolyPDF may review discretionary refund requests submitted within 14 days.',
      'For billing questions, use the links in your Stripe receipt or contact PolyPDF support.',
      'Refunded licenses are deactivated after the refund is completed.'
    ]
  }
];

const Support = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page support">
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
            <h1>Support</h1>
            <p className="legal-subtitle">Purchase, licensing, and product help for the direct Mac app</p>
            <p className="last-updated">Last updated: April 19, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              Use this page for support contact details and purchase-channel guidance.
              If you are writing in, include your Mac app version and Stripe receipt details when relevant.
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
            <div className="section-header">
              <div className="section-icon"><FaLifeRing /></div>
              <h2>Before you contact support</h2>
            </div>
            <ul className="section-content">
              <li>Confirm that you are using the direct Mac build downloaded from PolyPDF.com.</li>
              <li>Include the app version and build number if you can.</li>
              <li>For purchase issues, attach the Stripe receipt email or order confirmation.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Support email</h2>
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
              <Link to="/refund">Refund Policy</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Support;
