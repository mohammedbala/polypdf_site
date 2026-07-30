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
import DownloadCTA from './DownloadCTA';
import { primaryPlatform } from '../lib/platform';
import shotVisualSearch from '../assets/screenshots/shot-visual-search-web.png';
import shotCountCommitted from '../assets/screenshots/shot-count-committed-web.png';
import shotMeasureTakeoff from '../assets/screenshots/shot-measure-takeoff-web.png';
import shotMarkup from '../assets/screenshots/shot-markup-web.png';
import shotSearch from '../assets/screenshots/shot-search-web.png';

// Real screenshots of PolyPDF 1.1.3 on a fictional demonstration drawing (the sheet itself carries a
// "FICTIONAL DRAWING" stamp). Every caption states only what the app actually did in the capture.
const screenshots = [
  {
    image: shotVisualSearch,
    title: 'Find every fixture from one example',
    caption: 'Visual Search: drag a box around one troffer symbol and PolyPDF finds the matches across the sheet — here 29 at 84% confidence, each boxed for review before counting.'
  },
  {
    image: shotCountCommitted,
    title: 'One click later, they are a count series',
    caption: 'Committing the matches turns them into a single numbered Count series — ready to adjust, restyle, or pull into the takeoff worksheet.'
  },
  {
    image: shotMeasureTakeoff,
    title: 'Calibrate once, measure in real units',
    caption: 'The sheet is calibrated to its printed scale (1/8" = 1\'-0"), so the corridor dimension reads 40\'-0" and the waiting-room area reads 579 sq ft — and both feed the takeoff worksheet with CSV and PDF export.'
  },
  {
    image: shotMarkup,
    title: 'Markup that reads like a drawing',
    caption: 'A revision cloud around the storage room, a callout with a leader, and live measurements — every tool one keystroke away.'
  },
  {
    image: shotSearch,
    title: 'Search the sheet, see it in context',
    caption: 'Text search finds "NURSE STATION" in the drawing\'s own text and highlights it right on the sheet.'
  }
];

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const freeFeatures = [
  'Download the full app free — Mac or Windows — and start with the real product',
  'Open PDF drawings, calibrate scale, and use markup tools with no trial countdown',
  'Verify fit on your own plans with up to 3 hand-placed measurements per document, plus unlimited Visual Search auto-counts',
  'Decide after real use, not from a watered-down demo'
];

const proFeatures = [
  'Unlock unlimited measurements across all of your documents',
  'Pay $49.99 once for a license you can use on up to 3 computers — Mac or Windows',
  'Keep the same markup and review workflow with signed automatic app updates',
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
    description: 'The free download — Mac or Windows — lets you test PolyPDF on live work before you unlock unlimited measurements.'
  }
];

const steps = [
  {
    title: 'Download the app free',
    description: 'Grab the Mac DMG or the signed Windows installer and open the full product, not a time-limited trial.'
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
    answer: 'You can download the app free on Mac or Windows, open your own PDFs, calibrate scale, use the markup tools, and place up to 3 measurements in every open document. That gives you a real-world test before you buy.'
  },
  {
    question: 'Does one license cover both Mac and Windows?',
    answer: 'Yes. A license activates PolyPDF on up to 3 computers in any mix — three Macs, three Windows PCs, or any combination.'
  },
  {
    question: 'What does the $49.99 license unlock?',
    answer: 'The license removes the measurement limit so you can keep measuring across all of your documents. It is a one-time purchase, keeps Pro active across app updates, and can be used on up to 3 computers.'
  },
  {
    question: 'Is this a subscription?',
    answer: 'No. PolyPDF is sold as a one-time $49.99 direct license. There is no annual renewal, no recurring maintenance bill, and no subscription timer.'
  },
  {
    question: 'What happens after I buy?',
    answer: 'Checkout is handled securely by Stripe. Your license key is delivered by email, and you paste it into the app once — on Mac or Windows — to unlock unlimited measurements.'
  },
  {
    question: 'How do refunds work?',
    answer: 'Purchases are handled through Stripe and PolyPDF support. Refund requests are reviewed under the refund policy, which also covers your statutory rights.'
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
    trackEvent('download_click', { source, platform: primaryPlatform.key });
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
            <a href={primaryPlatform.url} className="nav-download" download onClick={() => handleDownloadClick('nav')}>
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
              <FaLock /> Drawing review and takeoff · Mac &amp; Windows
            </div>

            <h1>Measure and mark up PDF drawings without another subscription.</h1>

            <p className="hero-subtitle">
              Calibrate scale, measure precisely, and mark up the drawings you already receive —
              built for architects, engineers, contractors, and estimators. Free on Mac and Windows;
              unlimited measurements are a one-time $49.99.
            </p>

            <div className="hero-cta">
              <DownloadCTA source="hero" onDownload={closeMobileMenu} />
              <Link to="/buy" className="secondary-btn hero-buy">
                <FaInfinity /> Unlock Unlimited for $49.99
              </Link>
            </div>

            <p className="hero-note">Signed, notarized builds. Start free on your own drawings — upgrade only when you need unlimited measurements.</p>

            <div className="hero-stats compact-stats">
              <div className="stat">
                <h3>3</h3>
                <p>Free measurements per document</p>
              </div>
              <div className="stat">
                <h3>$49.99</h3>
                <p>One-time license, no renewal</p>
              </div>
              <div className="stat">
                <h3>Mac+PC</h3>
                <p>One license covers 3 computers</p>
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
                <span>Try the full app free on Mac or Windows, then buy once only if unlimited measurements will save you time.</span>
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

      <section className="showcase">
        <div className="container">
          <motion.div
            className="section-header benefits-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>See it on a real sheet</h2>
            <p>A demonstration lighting plan — captured from the shipping app, not mocked up.</p>
          </motion.div>

          {/* Lead shot gets the full-width stage; the rest alternate text/image so the section
              reads as a story instead of a stack of identical cards. */}
          <motion.figure
            className="showcase-hero"
            initial={{ opacity: 0, y: 36, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.21, 0.65, 0.32, 1] }}
          >
            <div className="shot-stage stage-accent">
              <img src={screenshots[0].image} alt={screenshots[0].title} loading="eager" />
            </div>
            <figcaption>
              <h3>{screenshots[0].title}</h3>
              <p>{screenshots[0].caption}</p>
            </figcaption>
          </motion.figure>

          <div className="showcase-rows">
            {screenshots.slice(1).map((shot, index) => (
              <motion.figure
                key={shot.title}
                className={`showcase-row ${index % 2 === 0 ? '' : 'flip'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.21, 0.65, 0.32, 1] }}
              >
                <figcaption className="showcase-text">
                  <span className="showcase-index">0{index + 2}</span>
                  <h3>{shot.title}</h3>
                  <p>{shot.caption}</p>
                </figcaption>
                <motion.div
                  className={`shot-stage ${index % 2 === 0 ? 'stage-paper' : 'stage-accent'}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? 28 : -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.21, 0.65, 0.32, 1] }}
                >
                  <img src={shot.image} alt={shot.title} loading="lazy" />
                </motion.div>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <section className="benefits mac-native-review">
        <div className="container">
          <motion.div
            className="section-header benefits-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Native on your desktop — Mac and Windows.</h2>
            <p>
              AEC teams deserve tools built for the machine in front of them. PolyPDF runs the same
              engine as a real desktop app on macOS and Windows, focused on the everyday review, markup,
              calibration, and takeoff workflows construction PDFs demand.
            </p>
          </motion.div>

          <div className="benefits-grid">
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3>One app, both platforms</h3>
              <p>The Mac DMG and the signed Windows installer ship the same engine at the same version — open drawings directly, no VM or browser-only workaround on either side.</p>
            </motion.article>
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
              <h3>AEC takeoff basics</h3>
              <p>Distance, area, perimeter, angle, count, and dimension tools are built around the PDFs architects, contractors, and estimators already exchange.</p>
            </motion.article>
            <motion.article className="benefit-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
              <h3>No annual seat timer</h3>
              <p>Try real documents for free, then unlock unlimited measurements with one direct license that covers up to 3 computers.</p>
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
            <p>The free download — Mac or Windows — handles review and markup. Pro removes the measurement cap for $49.99 once.</p>
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
              <a href={primaryPlatform.url} className="secondary-btn full-width" download onClick={() => handleDownloadClick('pricing_free')}>
                <HiOutlineCloudDownload /> Download free for {primaryPlatform.name}
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
              <p className="plan-note">One-time license for up to 3 computers — Mac or Windows. Secure Stripe checkout. Refund requests follow PolyPDF's policy.</p>
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
            <p>Download the app on Mac or Windows, test it on your own drawings, and unlock unlimited measurements for $49.99 only when you want to remove the cap.</p>
            <div className="cta-download-row">
              <DownloadCTA source="bottom_cta" size="large" />
              <Link to="/buy" className="secondary-btn cta-mac-btn">
                <FaInfinity /> Buy Once for $49.99
              </Link>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <HiOutlineShieldCheck />
                <span>Signed builds — notarized on Mac, Authenticode on Windows</span>
              </div>
              <div className="indicator">
                <FaCheckCircle />
                <span>Up to 3 computers per license</span>
              </div>
              <div className="indicator">
                <FaLock />
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
              <p>Measure and mark up PDF drawings on Mac and Windows without the yearly bill.</p>
            </div>
            <div className="footer-links">
              <a href={primaryPlatform.url} download onClick={() => handleDownloadClick('footer')}>Download Free</a>
              <Link to="/buy">Buy Once</Link>
              <Link to="/windows">Windows</Link>
              <Link to="/support">Support</Link>
              <Link to="/versions">Version History</Link>
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
