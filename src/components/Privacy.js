import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShieldAlt, FaLock, FaUserShield, FaEnvelope } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const Privacy = ({ setCurrentPage }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: <FaShieldAlt />,
      title: "Information We Collect",
      content: [
        "Device information (iOS version, device model)",
        "App usage analytics (features used, frequency)",
        "Crash reports and performance data",
        "No personal information is collected without consent"
      ]
    },
    {
      icon: <FaLock />,
      title: "How We Use Your Data",
      content: [
        "Improve app performance and stability",
        "Develop new features based on usage patterns",
        "Fix bugs and technical issues",
        "Send important app updates (if opted in)"
      ]
    },
    {
      icon: <FaUserShield />,
      title: "Data Security",
      content: [
        "All data is encrypted in transit and at rest",
        "We never sell or share your data with third parties",
        "Your PDF documents never leave your device",
        "iCloud sync uses Apple's secure infrastructure"
      ]
    }
  ];

  return (
    <div className="legal-page privacy">
      <header className="legal-header">
        <nav className="nav container">
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }} className="logo">
            <img src={parrotIcon} alt="PolyPDF" />
            <span>PolyPDF</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }} className="back-link">
            <FaArrowLeft /> Back to Home
          </a>
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
            <p className="legal-subtitle">Your privacy is our priority</p>
            <p className="last-updated">Last updated: January 2024</p>
          </div>

          <div className="legal-intro">
            <p>
              At PolyPDF, we take your privacy seriously. This policy outlines how we collect, 
              use, and protect your information when you use our app.
            </p>
          </div>

          <div className="legal-sections">
            {sections.map((section, index) => (
              <motion.section 
                key={index}
                className="legal-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="section-header">
                  <div className="section-icon">{section.icon}</div>
                  <h2>{section.title}</h2>
                </div>
                <ul className="section-content">
                  {section.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>

          <section className="legal-section">
            <h2>Your Rights</h2>
            <p>Under GDPR and CCPA, you have the right to:</p>
            <ul className="section-content">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Opt-out of analytics</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="section-content">
              <li><strong>Apple Analytics:</strong> App usage and performance metrics</li>
              <li><strong>CloudKit:</strong> Secure document sync (optional)</li>
              <li><strong>RevenueCat:</strong> Subscription management</li>
            </ul>
            <p className="note">
              All third-party services are selected for their strong privacy practices and 
              compliance with data protection regulations.
            </p>
          </section>

          <section className="legal-section">
            <h2>Children's Privacy</h2>
            <p>
              PolyPDF is not directed to children under 13. We do not knowingly collect 
              personal information from children. If you believe we have collected information 
              from a child, please contact us immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data, please contact us:
            </p>
            <div className="contact-info">
              <a href="mailto:privacy@polypdf.app" className="contact-link">
                <FaEnvelope /> privacy@polypdf.app
              </a>
            </div>
          </section>

          <section className="legal-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </motion.main>

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Home</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('terms'); }}>Terms of Service</a>
              <a href="mailto:support@polypdf.app">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;