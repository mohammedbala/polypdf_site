import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaRuler, 
  FaDrawPolygon, 
  FaPencilRuler, 
  FaTabletAlt,
  FaCheckCircle,
  FaBars,
  FaTimes,
  FaApple,
  FaArrowRight,
  FaStar
} from 'react-icons/fa';
import { 
  HiOutlineDocumentText, 
  HiOutlineCloudDownload,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineUserGroup
} from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';

const Home = ({ setCurrentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <FaDrawPolygon />,
      title: "Smart Line Detection",
      description: "AI-powered algorithms detect lines instantly",
      details: ["3 detection modes", "CAD-ready exports", "99% accuracy rate"]
    },
    {
      icon: <FaRuler />,
      title: "Precision Measurements",
      description: "Measure with confidence, export with ease",
      details: ["Custom scales", "Real-world units", "Export to CSV"]
    },
    {
      icon: <FaPencilRuler />,
      title: "Professional Markup",
      description: "Annotate like a pro with advanced tools",
      details: ["Custom callouts", "Color coding", "Apple Pencil support"]
    },
    {
      icon: <FaTabletAlt />,
      title: "Built for iPad",
      description: "Native performance, seamless experience",
      details: ["Multi-tab support", "iCloud sync", "Offline mode"]
    }
  ];

  const stats = [
    { number: "3", label: "Detection Modes" },
    { number: "100%", label: "Offline Ready" },
    { number: "1-Tap", label: "Measurements" },
    { number: "Free", label: "To Start" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Architect, Studio SC",
      content: "PolyPDF has revolutionized our drawing review process. What used to take hours now takes minutes.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Construction Manager",
      content: "The measurement accuracy is incredible. No more printing drawings for site visits.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Structural Engineer",
      content: "Best PDF markup app I've used. The line detection feature alone is worth it.",
      rating: 5
    }
  ];

  return (
    <div className="Home">
      <motion.header 
        className={`header ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="nav container">
          <a href="#" className="logo">
            <img src={parrotIcon} alt="PolyPDF" />
            <span>PolyPDF</span>
          </a>
          
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a 
              href="https://apps.apple.com/app/polypdf" 
              className="nav-download"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaApple /> Download
            </a>
          </div>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </motion.header>

      <section className="hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge">
              <FaStar /> #1 PDF App for AEC Professionals
            </div>
            
            <h1>Turn PDFs into <span className="gradient-text">Precision Tools</span></h1>
            
            <p className="hero-subtitle">
              The only PDF app built specifically for architects, engineers, and construction pros. 
              Detect lines instantly, measure accurately, markup professionally.
            </p>
            
            <div className="hero-cta">
              <a href="https://apps.apple.com/app/polypdf" className="primary-btn">
                <FaApple /> Download Free
              </a>
              <button className="secondary-btn">
                Watch Demo <FaArrowRight />
              </button>
            </div>
            
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <img src={parrotIcon} alt="PolyPDF App" className="hero-icon" />
            <div className="floating-badge badge-1">
              <HiOutlineDocumentText /> Smart Detection
            </div>
            <div className="floating-badge badge-2">
              <HiOutlineChartBar /> Measure Instantly
            </div>
            <div className="floating-badge badge-3">
              <HiOutlineClock /> Save 30% Time
            </div>
          </motion.div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Everything You Need to Work Smarter</h2>
            <p>Powerful features designed for the unique needs of AEC professionals</p>
          </motion.div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="feature-details">
                  {feature.details.map((detail, i) => (
                    <li key={i}>
                      <FaCheckCircle /> {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Loved by Professionals Worldwide</h2>
            <p>See what industry leaders say about PolyPDF</p>
          </motion.div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="testimonial-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Transform Your PDF Workflow?</h2>
            <p>Start working smarter with professional PDF tools designed for AEC</p>
            <div className="cta-buttons">
              <a href="https://apps.apple.com/app/polypdf" className="primary-btn large">
                <FaApple /> Download for Free
              </a>
              <div className="app-requirements">
                Requires iOS 16.0+ • Optimized for iPad Pro
              </div>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <HiOutlineCloudDownload />
                <span>Free to Download</span>
              </div>
              <div className="indicator">
                <HiOutlineUserGroup />
                <span>No Account Required</span>
              </div>
              <div className="indicator">
                <FaCheckCircle />
                <span>Professional Tools</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src={parrotIcon} alt="PolyPDF" />
              <p>The PDF app built for AEC professionals</p>
            </div>
            <div className="footer-links">
              <a href="https://polypdf.app/support">Support</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('privacy'); }}>Privacy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('terms'); }}>Terms</a>
              <a href="mailto:support@polypdf.app">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 PolyPDF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;