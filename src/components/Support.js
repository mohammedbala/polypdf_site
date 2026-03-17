import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaApple,
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
      'Support email: support@polypdf.app',
      'Use this address for purchase questions, restore issues, license activation problems, and general product support.',
      'When possible, include your app version, purchase channel, macOS or iPadOS/iOS version, and a short description of the problem.'
    ]
  },
  {
    icon: <FaDownload />,
    title: 'Direct Mac download',
    content: [
      'The current live commercial offer on PolyPDF.com is the direct Mac download.',
      'Direct Mac purchases are processed through Lemon Squeezy at buy.polypdf.com and unlocked with a license key sent by email.',
      'If you need help with activation, deactivation, or refund requests for the direct Mac version, contact support@polypdf.app.'
    ]
  },
  {
    icon: <FaApple />,
    title: 'Future App Store release',
    content: [
      'PolyPDF is being prepared for an App Store buy-once unlock across iPhone, iPad, and Mac, but that release is not live today.',
      'Once an App Store build is available, restore purchases will happen inside the app and Apple will handle billing and refund requests through your Apple account.',
      'If you hit product or feature issues in a future App Store build, contact PolyPDF support with your device, OS version, and screenshots if relevant.'
    ]
  },
  {
    icon: <FaReceipt />,
    title: 'Refunds and billing',
    content: [
      'Direct Mac purchases: 30-day refund window through the direct purchase channel, subject to the terms on this site.',
      'App Store purchases: billing and refund handling are managed by Apple under Apple policies.',
      'If you are unsure which channel you used, send the receipt email or order details to support.'
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
            <p className="legal-subtitle">Purchase, licensing, restore, and product help for PolyPDF</p>
            <p className="last-updated">Last updated: March 16, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              Use this page for support contact details and purchase-channel guidance.
              If you are writing in, include which version you are using: the direct Mac download from PolyPDF.com or a future App Store build.
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
              <li>Confirm whether you are using the direct Mac build from PolyPDF.com or a future App Store build.</li>
              <li>Include the app version and build number if you can.</li>
              <li>For purchase issues, attach the receipt email or order confirmation.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Support email</h2>
            <div className="contact-info">
              <a href="mailto:support@polypdf.app" className="contact-link">
                <FaEnvelope /> support@polypdf.app
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
