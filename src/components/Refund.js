import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaClock,
  FaEnvelope,
  FaKey,
  FaReceipt,
  FaShieldAlt,
  FaUndo
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const sections = [
  {
    icon: <FaUndo />,
    title: 'PolyPDF refund policy applies',
    content: [
      'Direct PolyPDF Mac purchases made through the website are processed by Stripe, and refund eligibility is governed by this policy.',
      'Unless required by applicable law, transactions are generally non-refundable and non-exchangeable.',
      'PolyPDF may review discretionary refund requests submitted within 14 days of the transaction date, but submitting a request in that period does not guarantee a refund.'
    ]
  },
  {
    icon: <FaReceipt />,
    title: 'How to request a refund',
    content: [
      'Contact PolyPDF support from the email address used at checkout and include your Stripe receipt or order details.',
      'Include your app version, macOS version, license key suffix, and a short description of the issue.',
      'If you experience a persistent technical issue or material product defect, contact PolyPDF support first so we can try to resolve it.'
    ]
  },
  {
    icon: <FaKey />,
    title: 'License access after a refund',
    content: [
      'Access to a refunded product ceases under this policy.',
      'Refunded PolyPDF Pro licenses may be deactivated after the refund is approved or completed.',
      'Refunds will not be issued where there is evidence of fraud, refund abuse, or other manipulative behavior.'
    ]
  }
];

const Refund = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page refund">
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
            <h1>Refund Policy</h1>
            <p className="legal-subtitle">Refunds for direct PolyPDF Mac purchases</p>
            <p className="last-updated">Last updated: April 19, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF is designed so you can download the Mac app free, test it on your own
              documents, and only purchase Pro when you want unlimited measurements. This policy
              explains refund handling for direct Mac purchases processed by Stripe.
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
              <div className="section-icon"><FaClock /></div>
              <h2>Statutory rights and timing</h2>
            </div>
            <ul className="section-content">
              <li>Nothing in this policy limits refund or withdrawal rights that cannot be waived under applicable law.</li>
              <li>Local law may provide statutory withdrawal or cancellation periods for certain consumers.</li>
              <li>For digital content, statutory withdrawal rights may not apply after the product has started to be downloaded, streamed, used, or otherwise made available when the buyer consented to access before the withdrawal period ended.</li>
              <li>If eligible, refunds are processed to the original payment method where possible.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaShieldAlt /></div>
              <h2>Purchase channels and legal rights</h2>
            </div>
            <ul className="section-content">
              <li>This policy applies to direct PolyPDF website purchases processed by Stripe.</li>
              <li>Purchases made through another storefront or platform must be refunded through that storefront or platform's own refund process.</li>
              <li>Business buyers seeking a sales-tax correction should contact PolyPDF support with the receipt and any required exemption details where permitted by law.</li>
              <li>Contact PolyPDF support before raising a chargeback or payment dispute; access to the relevant product may be suspended while a dispute is reviewed.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>
              Refund and product support questions can be sent to:
            </p>
            <div className="contact-info">
              <a href="mailto:support@polypdf.com" className="contact-link">
                <FaEnvelope /> support@polypdf.com
              </a>
            </div>
            <p>
              Include your Stripe receipt email, app version, macOS version, and license key suffix when possible.
            </p>
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
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Refund;
