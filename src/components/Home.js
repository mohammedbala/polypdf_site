import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaBars,
  FaBolt,
  FaCheckCircle,
  FaInfinity,
  FaLock,
  FaTimes
} from 'react-icons/fa';
import {
  HiOutlineCloudDownload,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineSparkles
} from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';

const macDownloadURL = '/downloads/PolyPDFMac.dmg';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const freeFeatures = [
  'Download the full Mac app free and start with the real product',
  'Open PDF drawings, calibrate scale, and use markup tools with no trial countdown',
  'Take up to 3 measurements in every open document to verify fit on your own plans',
  'Decide after real use, not from a watered-down demo'
];

const proFeatures = [
  'Unlock unlimited measurements across all of your documents',
  'Pay $49.99 once for a direct Mac license you can use on up to 3 Macs',
  'Keep the same markup and review workflow with public one-click app updates',
  'Secure Stripe checkout with license delivery by email'
];

const benefits = [
  {
    title: 'Measure PDF drawings with confidence',
    description: 'Set the scale once and take distance, area, and angle measurements directly on the PDFs your team already uses.'
  },
  {
    title: 'Mark up reviews without tool switching',
    description: 'Add callouts, highlights, shapes, and notes so site issues, design comments, and decisions are easier to communicate.'
  },
  {
    title: 'Buy only after it proves itself',
    description: 'The free Mac download lets you test PolyPDF on live work before you unlock unlimited measurements.'
  }
];

const steps = [
  {
    title: 'Download the Mac app free',
    description: 'Install the DMG and open the full product, not a time-limited trial.'
  },
  {
    title: 'Test it on a real drawing',
    description: 'Calibrate scale and place up to 3 measurements in each document to confirm it fits your workflow.'
  },
  {
    title: 'Unlock unlimited when ready',
    description: 'If PolyPDF saves you time, buy once for $49.99 and keep using it without a yearly fee.'
  }
];

const faqs = [
  {
    question: 'What can I do before I pay?',
    answer: 'You can download the Mac app free, open your own PDFs, calibrate scale, use the markup tools, and place up to 3 measurements in every open document. That gives you a real-world test before you buy.'
  },
  {
    question: 'What does the $49.99 license unlock?',
    answer: 'The direct Mac license removes the measurement limit so you can keep measuring across all of your documents. It is a one-time purchase, keeps Pro active across app updates, and can be used on up to 3 Macs.'
  },
  {
    question: 'Is this a subscription?',
    answer: 'No. PolyPDF for Mac is sold as a one-time $49.99 direct license. There is no annual renewal, no recurring maintenance bill, and no subscription timer.'
  },
  {
    question: 'What happens after I buy?',
    answer: 'Checkout is handled securely by Stripe. Your license key is delivered by email, and you paste it into the Mac app once to unlock unlimited measurements.'
  },
  {
    question: 'How do refunds work?',
    answer: 'Direct Mac purchases are handled through Stripe and PolyPDF support. Unless required by law, transactions are generally non-refundable; discretionary refund requests may be reviewed within 14 days.'
  }
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleDownloadClick = (source) => {
    trackEvent('download_click', { source, platform: 'mac' });
    closeMobileMenu();
  };

  return (
    <div className="Home">
      <motion.header
        className={`header ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="nav container">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <img src={parrotIcon} alt="PolyPDF logo" />
            <span>PolyPDF</span>
          </Link>

          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
            <a href="#faq" onClick={closeMobileMenu}>FAQ</a>
            <Link to="/support" onClick={closeMobileMenu}>Support</Link>
            <Link to="/buy" className="nav-buy" onClick={closeMobileMenu}>Buy Once</Link>
            <a href={macDownloadURL} className="nav-download" download onClick={() => handleDownloadClick('nav')}>
              <HiOutlineCloudDownload /> Download Free
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
        <div className="container hero-layout">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge">
              <FaLock /> Built for drawing review and takeoff on Mac
            </div>

            <h1>Measure and mark up PDF drawings on Mac without another subscription.</h1>

            <p className="hero-subtitle">
              PolyPDF helps architects, engineers, contractors, estimators, and reviewers calibrate
              scale, take precise measurements, and mark up the PDFs they already receive. Download it
              free, test 3 measurements in every document, then unlock unlimited measurements for a
              one-time $49.99 only if it earns a place in your workflow.
            </p>

            <div className="hero-cta">
              <a href={macDownloadURL} className="primary-btn" download onClick={() => handleDownloadClick('hero')}>
                <HiOutlineCloudDownload /> Download Free for Mac
              </a>
              <Link to="/buy" className="secondary-btn">
                <FaInfinity /> Unlock Unlimited for $49.99
              </Link>
            </div>

            <p className="hero-note">Start free on your own drawings. Upgrade only when you need unlimited measurements.</p>

            <div className="hero-stats compact-stats">
              <div className="stat">
                <h3>3</h3>
                <p>Free measurements per document</p>
              </div>
              <div className="stat">
                <h3>$49.99</h3>
                <p>One-time Mac license</p>
              </div>
              <div className="stat">
                <h3>3 Macs</h3>
                <p>Included per license</p>
              </div>
              <div className="stat">
                <h3>Stripe</h3>
                <p>Secure checkout</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-summary-card"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <img src={parrotIcon} alt="PolyPDF app icon" className="hero-icon" />
            <p className="summary-heading">What you can do on day one</p>
            <div className="summary-list">
              <div className="summary-item">
                <HiOutlineDocumentText />
                <span>Calibrate scale and measure distances, areas, and angles on real PDF drawings.</span>
              </div>
              <div className="summary-item">
                <HiOutlineShieldCheck />
                <span>Mark up punch items, design comments, and review notes without bouncing between tools.</span>
              </div>
              <div className="summary-item">
                <HiOutlineSparkles />
                <span>Try the full Mac app free, then buy once only if unlimited measurements will save you time.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="benefits">
        <div className="container">
          <motion.div
            className="section-header benefits-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>What PolyPDF helps you do faster</h2>
            <p>Designed for architects, engineers, contractors, estimators, and reviewers working from PDF drawings.</p>
          </motion.div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <motion.article
                key={benefit.title}
                className="benefit-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="benefits bluebeam-alternative">
        <div className="container">
          <motion.div
            className="section-header benefits-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>A Bluebeam Revu for Mac alternative for drawing review.</h2>
            <p>
              Revu no longer gives Mac-first AEC teams a native path. PolyPDF focuses on the everyday
              review, markup, calibration, and takeoff workflows Mac users still need on construction PDFs.
            </p>
          </motion.div>

          <div className="benefits-grid">
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3>Native Mac workflow</h3>
              <p>Open drawings directly, mark up review comments, calibrate scale, and measure without a Windows VM or browser-only workaround.</p>
            </motion.article>
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
              <h3>AEC takeoff basics</h3>
              <p>Distance, area, perimeter, angle, count, and dimension tools are built around the PDFs architects, contractors, and estimators already exchange.</p>
            </motion.article>
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
              <h3>No annual seat timer</h3>
              <p>Try real documents for free, then unlock unlimited measurements with a one-time direct Mac license.</p>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Start free. Upgrade only when you need unlimited measurements.</h2>
            <p>The free Mac download handles review and markup. Pro removes the measurement cap for $49.99 once.</p>
          </motion.div>

          <div className="pricing-grid">
            <motion.article
              className="pricing-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="plan-pill">Free</div>
              <h3>Use PolyPDF on real drawings</h3>
              <p className="plan-price">$0</p>
              <ul className="plan-list">
                {freeFeatures.map((feature) => (
                  <li key={feature}>
                    <FaCheckCircle /> {feature}
                  </li>
                ))}
              </ul>
              <a href={macDownloadURL} className="secondary-btn full-width" download onClick={() => handleDownloadClick('pricing_free')}>
                <HiOutlineCloudDownload /> Download Free
              </a>
            </motion.article>

            <motion.article
              className="pricing-card pricing-card-pro"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="plan-pill plan-pill-dark">Pro Lifetime</div>
              <h3>Unlock unlimited measurements</h3>
              <p className="plan-price">$49.99</p>
              <ul className="plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <FaBolt /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/buy" className="primary-btn full-width">
                <FaInfinity /> Buy Once for $49.99
              </Link>
              <p className="plan-note">One-time direct Mac license for up to 3 Macs. Secure Stripe checkout. Refund requests follow PolyPDF's policy.</p>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Try it on your workflow before you buy.</h2>
            <p>Download free, test it on your own drawings, and pay once only if you want unlimited measurements.</p>
          </motion.div>

          <div className="step-grid">
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                className="step-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="step-number">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>FAQ</h2>
            <p>Short answers to the buying questions that usually block a download.</p>
          </motion.div>

          <div className="faq-grid">
            {faqs.map((item, index) => (
              <motion.article
                key={item.question}
                className="faq-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </motion.article>
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
            <h2>Start free. Upgrade only if PolyPDF earns it.</h2>
            <p>Download the Mac app, test it on your own drawings, and unlock unlimited measurements for $49.99 only when you want to remove the cap.</p>
            <div className="cta-download-row">
              <a href={macDownloadURL} className="primary-btn large" download onClick={() => handleDownloadClick('bottom_cta')}>
                <HiOutlineCloudDownload /> Download Free for Mac
              </a>
              <Link to="/buy" className="secondary-btn cta-mac-btn">
                <FaInfinity /> Buy Once for $49.99
              </Link>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <HiOutlineCloudDownload />
                <span>Direct Mac download today</span>
              </div>
              <div className="indicator">
                <FaCheckCircle />
                <span>Up to 3 Macs per license</span>
              </div>
              <div className="indicator">
                <HiOutlineShieldCheck />
                <span>Secure Stripe checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src={parrotIcon} alt="PolyPDF logo" loading="lazy" />
              <p>Measure and mark up PDF drawings on Mac without the yearly bill.</p>
            </div>
            <div className="footer-links">
              <a href={macDownloadURL} download onClick={() => handleDownloadClick('footer')}>Download Free</a>
              <Link to="/buy">Buy Once</Link>
              <Link to="/support">Support</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
