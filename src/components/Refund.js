import React, { useEffect } from 'react';
import { Link } from 'react-router';
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
    title: '14-day money-back guarantee',
    content: [
      'Direct PolyPDF purchases — Mac or Windows — made through the website and processed by Stripe include a 14-day money-back guarantee.',
      'Submit your request within 14 calendar days of the transaction date and PolyPDF will refund the amount paid for the license to the original payment method where possible.',
      'You do not need to prove a defect or explain why PolyPDF was not a fit. Feedback is welcome, but it is not required to receive the guarantee.'
    ]
  },
  {
    icon: <FaReceipt />,
    title: 'How to request a refund',
    content: [
      'Contact PolyPDF support from the email address used at checkout and include your Stripe receipt or order details.',
      'Include your license key suffix when possible so PolyPDF can match the purchase quickly.',
      'PolyPDF will confirm the request and process an eligible refund through Stripe. You may also include your app version, OS, and feedback if you would like help before refunding.'
    ]
  },
  {
    icon: <FaKey />,
    title: 'License access after a refund',
    content: [
      'Access to a refunded product ceases under this policy.',
      'Refunded PolyPDF Pro licenses may be deactivated after the refund is approved or completed.',
      'The guarantee does not cover fraudulent purchases, duplicate refund claims, chargeback abuse, or other manipulative behavior. Requests made after 14 days are generally not refundable unless required by law or approved by PolyPDF.'
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
            <h1>Refund Policy</h1>
            <p className="legal-subtitle">Refunds for direct PolyPDF purchases</p>
            <p className="last-updated">Last updated: September 3, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF is designed so you can download the app free — on Mac or Windows — and test it on your own
              documents, and only purchase Pro when you want unlimited measurements, Symbol Search, plugins, or Revision Package changes and publishing. This policy
              explains refund handling for direct purchases processed by Stripe.
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
              <li>The voluntary 14-day money-back guarantee is separate from, and in addition to, refund or withdrawal rights that cannot be waived under applicable law.</li>
              <li>Local law may provide statutory withdrawal or cancellation periods for certain consumers.</li>
              <li>Using or activating PolyPDF during the guarantee period does not remove the voluntary 14-day guarantee for a direct website purchase.</li>
              <li>Refunds are processed to the original payment method where possible. The bank or card issuer controls how long the credit takes to appear after Stripe processes it.</li>
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
              Include your Stripe receipt email, app version, OS version, and license key suffix when possible.
            </p>
          </section>
        </div>
      </motion.main>

    </div>
  );
};

export default Refund;
