import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaApple,
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

const macDownloadURL = '/downloads/PolyPDF-mac.dmg';
const buyURL =
  process.env.REACT_APP_POLYPDF_BUY_URL ||
  'https://buy.polypdf.com/checkout/buy/25095331-d3ee-4ae8-bccd-31b565bcd624';
const appStoreURL = 'https://apps.apple.com/app/polypdf';

const freeFeatures = [
  'Download the full Mac app free today',
  'Open, review, and mark up PDFs',
  'Calibrate scale on real drawings',
  '3 free measurements per open document before you decide'
];

const proFeatures = [
  'Buy it once. Own your Mac license.',
  'No subscription. No yearly renewal fee.',
  'Unlimited measurements with direct in-app updates.',
  'Secure checkout and billing are handled through buy.polypdf.com.'
];

const steps = [
  {
    title: 'Download Free',
    description: 'Install the Mac DMG and start with the real app, not a crippled demo.'
  },
  {
    title: 'Test It on a Real Drawing',
    description: 'Calibrate scale and place up to 3 measurements in every open document before the paywall appears.'
  },
  {
    title: 'Buy Once, Own It',
    description: 'Pay $99 one time for the direct Mac app today through secure checkout at buy.polypdf.com. An App Store release is planned later, but it is not live yet.'
  }
];

const faqs = [
  {
    question: 'Do I have to pay again next year?',
    answer: 'No. PolyPDF is being sold as a buy-once product. The direct Mac license is a one-time $99 purchase with no annual renewal, subscription timer, or recurring maintenance fee.'
  },
  {
    question: 'What is live today?',
    answer: 'Today, the live commercial offer is the direct Mac download from PolyPDF.com. You can download the DMG free, use the app, and unlock the Mac build with a one-time $99 purchase through secure checkout at buy.polypdf.com.'
  },
  {
    question: 'Will one App Store purchase unlock iPhone, iPad, and Mac?',
    answer: 'That is the current plan, but it is not live today. Until the App Store build ships, the website checkout remains a Mac-only direct license.'
  },
  {
    question: 'What happens after I buy from the website?',
    answer: 'You receive a license key by email. Paste it into the Mac app once to unlock unlimited measurements, then use that Pro license on up to 3 Macs.'
  },
  {
    question: 'Can I try it before paying?',
    answer: 'Yes. The Mac app downloads free, includes the core viewer and markup tools, and gives you 3 free measurements per open document so you can test it on real work.'
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
            <a href={appStoreURL} onClick={closeMobileMenu}>iPhone/iPad app</a>
            <a href={buyURL} className="nav-buy" onClick={closeMobileMenu}>Buy Once</a>
            <a href={macDownloadURL} className="nav-download" download onClick={closeMobileMenu}>
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
              <FaLock /> Built for people tired of yearly PDF license fees
            </div>

            <h1>Sick of paying every year just to measure PDFs? Buy PolyPDF once and own it.</h1>

            <p className="hero-subtitle">
              Download PolyPDF for Mac free today. Review drawings, calibrate scale, and place up to 3
              free measurements in every open document before you pay. When you are ready, unlock
              unlimited measurements for $99 once through secure checkout at buy.polypdf.com.
              No subscription. No annual renewal. An App Store release is planned later, but the
              direct Mac checkout is the live commercial path today.
            </p>

            <div className="hero-cta">
              <a href={macDownloadURL} className="primary-btn" download>
                <HiOutlineCloudDownload /> Download Free DMG
              </a>
              <a href={buyURL} className="secondary-btn">
                <FaInfinity /> Buy Once for $99
              </a>
            </div>

            <div className="hero-stats compact-stats">
              <div className="stat">
                <h3>3</h3>
                <p>Free measurements</p>
              </div>
              <div className="stat">
                <h3>$99</h3>
                <p>One-time purchase</p>
              </div>
              <div className="stat">
                <h3>0</h3>
                <p>Annual renewals</p>
              </div>
              <div className="stat">
                <h3>Mac now</h3>
                <p>Checkout at buy.polypdf.com</p>
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
            <div className="summary-list">
              <div className="summary-item">
                <HiOutlineDocumentText />
                <span>Try it on a real PDF before you spend anything.</span>
              </div>
              <div className="summary-item">
                <HiOutlineShieldCheck />
                <span>If you are done with subscription fatigue, this is the direct Mac alternative live today.</span>
              </div>
              <div className="summary-item">
                <HiOutlineSparkles />
                <span>Secure checkout is handled separately at buy.polypdf.com so the main site stays focused on downloads, support, and product details.</span>
              </div>
            </div>
          </motion.div>
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
            <h2>One price. No renewal trap.</h2>
            <p>Direct Mac license available today. The App Store release is planned later, but the live buy flow is the direct Mac checkout.</p>
          </motion.div>

          <div className="pricing-grid">
            <motion.article
              className="pricing-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="plan-pill">Free</div>
              <h3>Try PolyPDF on Mac</h3>
              <p className="plan-price">$0</p>
              <ul className="plan-list">
                {freeFeatures.map((feature) => (
                  <li key={feature}>
                    <FaCheckCircle /> {feature}
                  </li>
                ))}
              </ul>
              <a href={macDownloadURL} className="secondary-btn full-width" download>
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
              <h3>Buy it once. Own it.</h3>
              <p className="plan-price">$99</p>
              <ul className="plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <FaBolt /> {feature}
                  </li>
                ))}
              </ul>
              <a href={buyURL} className="primary-btn full-width">
                <FaInfinity /> Buy Once for $99
              </a>
              <p className="plan-note">Perpetual direct Mac license today. Secure checkout at buy.polypdf.com with a 30-day refund window.</p>
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
            <h2>Use it first. Pay once only if it earns its place.</h2>
            <p>The paywall appears after real value, not before.</p>
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
            <p>Direct answers for people trying to stop another annual software bill.</p>
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
            <h2>Stop renting your PDF measurement tool every year.</h2>
            <p>Mac direct download is live today. The checkout flow is on buy.polypdf.com, while the App Store release remains future work.</p>
            <div className="cta-download-row">
              <a href={macDownloadURL} className="primary-btn large" download>
                <HiOutlineCloudDownload /> Download Free DMG
              </a>
              <a href={buyURL} className="secondary-btn cta-mac-btn">
                <FaInfinity /> Buy Once for $99
              </a>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <HiOutlineCloudDownload />
                <span>Direct Mac download today</span>
              </div>
              <div className="indicator">
                <FaCheckCircle />
                <span>No yearly fee</span>
              </div>
              <div className="indicator">
                <FaApple />
                <span>App Store release not live yet</span>
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
              <p>Buy-once PDF measurement tools for people done with yearly license fees.</p>
            </div>
            <div className="footer-links">
              <a href={macDownloadURL} download>Download Free</a>
              <a href={buyURL}>Buy Once</a>
              <Link to="/support">Support</Link>
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
