import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFileContract, FaGavel, FaHandshake, FaExclamationTriangle } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

const Terms = ({ setCurrentPage }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: <FaFileContract />,
      title: "Acceptance of Terms",
      content: [
        "By downloading and using PolyPDF, you agree to these terms",
        "These terms apply to all users of the app",
        "We may update these terms from time to time",
        "Continued use constitutes acceptance of new terms"
      ]
    },
    {
      icon: <FaHandshake />,
      title: "License and Usage",
      content: [
        "PolyPDF grants you a personal, non-transferable license",
        "For commercial use, a premium subscription is required",
        "You may not reverse engineer or modify the app",
        "One license covers all your personal iOS devices"
      ]
    },
    {
      icon: <FaGavel />,
      title: "User Responsibilities",
      content: [
        "You are responsible for your use of the app",
        "You must not use PolyPDF for illegal purposes",
        "You retain ownership of all documents you create",
        "You must respect intellectual property rights"
      ]
    }
  ];

  return (
    <div className="legal-page terms">
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
            <h1>Terms of Service</h1>
            <p className="legal-subtitle">Please read these terms carefully</p>
            <p className="last-updated">Last updated: January 2024</p>
          </div>

          <div className="legal-intro">
            <p>
              These Terms of Service ("Terms") govern your use of PolyPDF, our iOS application 
              for PDF markup and measurement. By using PolyPDF, you agree to be bound by these Terms.
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
            <h2>Subscription Terms</h2>
            <h3>Premium Features</h3>
            <ul className="section-content">
              <li>Premium features require an active subscription</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Cancel anytime through your Apple ID settings</li>
              <li>No refunds for partial subscription periods</li>
            </ul>
            
            <h3>Pricing</h3>
            <ul className="section-content">
              <li>Monthly: $9.99/month</li>
              <li>Annual: $89.99/year (save 25%)</li>
              <li>Prices may vary by region</li>
              <li>7-day free trial available for new users</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaExclamationTriangle /></div>
              <h2>Disclaimers and Limitations</h2>
            </div>
            <ul className="section-content">
              <li>PolyPDF is provided "as is" without warranties</li>
              <li>We are not liable for any indirect damages</li>
              <li>Our total liability is limited to subscription fees paid</li>
              <li>Some jurisdictions don't allow limitation of liability</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              All content, features, and functionality of PolyPDF are owned by us and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <ul className="section-content">
              <li>The PolyPDF name and logo are our trademarks</li>
              <li>You may not use our trademarks without permission</li>
              <li>Your content remains yours</li>
              <li>You grant us license to display your content within the app</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Termination</h2>
            <p>We may terminate or suspend your access to PolyPDF:</p>
            <ul className="section-content">
              <li>For violations of these Terms</li>
              <li>For fraudulent or illegal activities</li>
              <li>For non-payment of subscription fees</li>
              <li>At our discretion with notice</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Governing Law</h2>
            <p>
              These Terms are governed by the laws of Delaware, USA, without regard to its 
              conflict of law provisions. Any disputes shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact Information</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <div className="contact-info">
              <a href="mailto:legal@polypdf.app" className="contact-link">
                legal@polypdf.app
              </a>
            </div>
            <p className="note">
              PolyPDF is a product of [Your Company Name]<br />
              [Your Address]
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
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('privacy'); }}>Privacy Policy</a>
              <a href="mailto:support@polypdf.app">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;