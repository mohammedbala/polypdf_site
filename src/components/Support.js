import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaKey,
  FaLifeRing,
  FaReceipt
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';
import ActivationSteps from './ActivationSteps';
import { founderRightsText, licenseDeliveryText } from '../lib/commercialOffer';

const sections = [
  {
    icon: <FaEnvelope />,
    title: 'Contact',
    content: [
      'Support email: support@polypdf.com',
      'Use this address for purchase questions, license activation problems, and general product support.',
      'When possible, include your app version, your OS (macOS or Windows) and its version, Stripe receipt email, license key suffix, and a short description of the problem.'
    ]
  },
  {
    icon: <FaDownload />,
    title: 'Direct download',
    content: [
      'The current live commercial offer on PolyPDF.com is the direct desktop download for macOS and Windows.',
      'Direct purchases are processed through Stripe and unlocked with a PolyPDF license key sent by email.',
      founderRightsText,
      'If you need help with activation, deactivation, or refund requests, contact support@polypdf.com.'
    ]
  },
  {
    icon: <FaReceipt />,
    title: 'Refunds and billing',
    content: [
      'Direct purchases are subject to PolyPDF\'s refund policy, including any non-waivable consumer rights.',
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
            <h1>Support</h1>
            <p className="legal-subtitle">Purchase, licensing, and product help for PolyPDF on Mac and Windows</p>
            <p className="last-updated">Last updated: July 30, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              Use this page for support contact details and purchase-channel guidance.
              If you are writing in, include your app version (shown in the About window on both platforms) and Stripe receipt details when relevant.
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

          {/* The single most-asked post-purchase question, and until now it was answered only
              inside the licence email. */}
          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaKey /></div>
              <h2>Activating your license key</h2>
            </div>
            <ActivationSteps heading={null} />
            <p className="support-aside">{licenseDeliveryText}</p>
            <p className="support-aside">
              One license activates up to 3 computers, Mac or Windows in any mix. Moving to a new
              machine when all 3 are used? Deactivate on the old one from the same window, then
              activate on the new one.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaLifeRing /></div>
              <h2>Before you contact support</h2>
            </div>
            <ul className="section-content">
              <li>Confirm that you are using the direct build downloaded from PolyPDF.com.</li>
              <li>Include the app version and build number if you can.</li>
              <li>For purchase issues, attach the Stripe receipt email or order confirmation.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Ideas and feature requests</h2>
            <p>
              Browse the public request list, follow work you care about, or submit a structured
              request describing the drawing workflow you want to improve.
            </p>
            <div className="contact-info">
              <Link to="/feature-requests" className="contact-link">
                <FaLifeRing /> Open Feature Requests
              </Link>
            </div>
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
              <Link to="/blog">Blog</Link>
              <Link to="/build-a-plugin">Build a Plugin</Link>
              <Link to="/feature-requests">Feature Requests</Link>
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
