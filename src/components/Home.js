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
import { buyPath } from '../lib/attribution';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer, founderLimitText, founderRightsText } from '../lib/commercialOffer';
import shotCountCommitted from '../assets/screenshots/shot-count-committed-web.png';
import shotMeasureTakeoff from '../assets/screenshots/shot-measure-takeoff-web.png';
import shotMarkup from '../assets/screenshots/shot-markup-web.png';

// Real captures of PolyPDF 1.1.3 in dark mode, working on PolyPDF's own sample drawing set — three
// sheets of one fictional project, drawn by scripts/gen_sample_set.py and owned outright.
//
// This replaced three outside drawing sets. Two were defence projects and the third was Crown
// copyright under the Open Government Licence, which made an attribution line and a licence link a
// condition of use. Owning the artwork removes all of that: no credits to carry, no agency marks to
// crop, and the sheets can be redrawn whenever the UI changes.
const screenshots = [
  {
    image: shotCountCommitted,
    title: 'Counts that keep score for you',
    caption: 'Drop a marker on each symbol and the takeoff worksheet keeps a running tally per subject, right beside your areas and lengths. Number the marks as you go, then export the whole worksheet to CSV or PDF when it is time to price the job.'
  },
  {
    image: shotMeasureTakeoff,
    title: 'Real units from the PDF you were sent',
    caption: 'Calibrate to the printed scale once — presets for the common architectural scales, or dial in your own, metric or imperial — then pull areas, lengths and perimeters that land directly on the drawing. No CAD file, no re-drawing, no math on a notepad.'
  },
  {
    image: shotMarkup,
    title: 'Reviews and RFIs, straight on the sheet',
    caption: 'Revision clouds, leader callouts, stamps and highlights, with text sizing you control — so a note that reads on screen still reads on a printed half-size set. Every markup is tracked in the markups list, so nothing you flag gets lost between review rounds.'
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
  'Unlock unlimited hand-created measurements across all of your documents',
  `Pay ${commercialOffer.price} once for PolyPDF 1.x on up to 3 computers — Mac or Windows`,
  'Keep PolyPDF 1.x forever, with every public 1.x update included',
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
    description: 'The free download — Mac or Windows — lets you test PolyPDF on live work before you unlock unlimited hand-created measurements.'
  }
];

const steps = [
  {
    title: 'Download the app free',
    description: 'Grab the Mac DMG or the signed Windows installer and open the full product, not a time-limited trial.'
  },
  {
    title: 'Test it on a real drawing',
    description: 'Calibrate scale and place up to 3 hand-created measurements in each document to confirm it fits your workflow.'
  },
  {
    title: 'Unlock unlimited when ready',
    description: `If PolyPDF saves you time, buy the ${commercialOffer.price} Founder's License and keep using PolyPDF 1.x without a yearly fee.`
  }
];

const faqs = [
  {
    question: 'What can I do before I pay?',
    answer: 'You can download the app free on Mac or Windows, open your own PDFs, calibrate scale, use the markup tools, place up to 3 hand-created measurements in every open document, and use uncapped Visual Search auto-count. That gives you a real-world test before you buy.'
  },
  {
    question: 'Does one license cover both Mac and Windows?',
    answer: 'Yes. A license activates PolyPDF on up to 3 computers in any mix — three Macs, three Windows PCs, or any combination.'
  },
  {
    question: 'What does the $49.99 license unlock?',
    answer: `The Founder's License removes the hand-created measurement limit. ${founderRightsText}`
  },
  {
    question: 'Is this a subscription?',
    answer: `No. The PolyPDF Pro Founder's License is ${commercialOffer.price} once. There is no annual renewal, recurring maintenance bill, or subscription timer.`
  },
  {
    question: 'What happens after I buy?',
    answer: 'Checkout is handled securely by Stripe. Your license key is delivered by email, and you paste it into the app once — on Mac or Windows — to unlock unlimited hand-created measurements.'
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

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

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
            <img src={parrotIcon} alt="PolyPDF logo" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>

          <div id="primary-navigation" className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
            <a href="#faq" onClick={closeMobileMenu}>FAQ</a>
            <Link to="/support" onClick={closeMobileMenu}>Support</Link>
            <Link to={buyPath('website_nav')} className="nav-buy" onClick={closeMobileMenu}>Buy Once</Link>
            <a href={primaryPlatform.url} className="nav-download" download onClick={() => handleDownloadClick('nav')}>
              <HiOutlineCloudDownload /> Download Free
            </a>
          </div>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="primary-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </motion.header>

      <main>
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
              unlimited hand-created measurements are a one-time $49.99.
            </p>

            <div className="hero-cta">
              <DownloadCTA source="hero" onDownload={closeMobileMenu} />
              <Link to={buyPath('website_hero')} className="secondary-btn hero-buy">
                <FaInfinity /> Unlock Unlimited for $49.99
              </Link>
            </div>

            <p className="hero-note">Signed, notarized builds. Start free on your own drawings — upgrade only when you need unlimited hand-created measurements.</p>

            <div className="hero-stats compact-stats">
              <div className="stat">
                <strong>3</strong>
                <p>Free measurements per document</p>
              </div>
              <div className="stat">
                <strong>$49.99</strong>
                <p>One-time license, no renewal</p>
              </div>
              <div className="stat">
                <strong>Mac+PC</strong>
                <p>One license covers 3 computers</p>
              </div>
              <div className="stat">
                <strong>Stripe</strong>
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
            <img src={parrotIcon} alt="PolyPDF app icon" className="hero-icon" width="1024" height="1024" />
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
                <span>Try the full app free on Mac or Windows, then buy once only if unlimited hand-created measurements will save you time.</span>
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
            <p>Counting, measuring and drawing review — the work you actually do all day — across three disciplines of one project. Captured from the shipping app, not mocked up.</p>
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
            <div className="shot-plate">
              <img src={screenshots[0].image} alt={screenshots[0].title} loading="eager" width="2280" height="1515" />
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
                  className="shot-plate"
                  initial={{ opacity: 0, x: index % 2 === 0 ? 28 : -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.21, 0.65, 0.32, 1] }}
                >
                  <img src={shot.image} alt={shot.title} loading="lazy" width="2280" height="1515" />
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
              <p>Try real documents for free, then unlock unlimited hand-created measurements with one direct license that covers up to 3 computers.</p>
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
            <h2>Start free. Upgrade only when you need unlimited hand-created measurements.</h2>
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
              <div className="plan-pill plan-pill-dark">Founder's License</div>
              <h3>Unlock unlimited hand-created measurements</h3>
              <p className="plan-price">$49.99</p>
              <ul className="plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <FaBolt /> {feature}
                  </li>
                ))}
              </ul>
              <Link to={buyPath('website_pricing')} className="primary-btn full-width">
                <FaInfinity /> Buy Once for $49.99
              </Link>
              <p className="plan-note">{founderRightsText} {founderLimitText} Secure Stripe checkout. Refund requests follow PolyPDF's policy.</p>
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
            <p>Download free, test it on your own drawings, and pay once only if you want unlimited hand-created measurements.</p>
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
            <p>Download the app on Mac or Windows, test it on your own drawings, and unlock unlimited hand-created measurements for $49.99 only when you want to remove the cap.</p>
            <div className="cta-download-row">
              <DownloadCTA source="bottom_cta" size="large" />
              <Link to={buyPath('website_bottom_cta')} className="secondary-btn cta-mac-btn">
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
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src={parrotIcon} alt="PolyPDF logo" loading="lazy" width="1024" height="1024" />
              <p>Measure and mark up PDF drawings on Mac and Windows without the yearly bill.</p>
            </div>
            <div className="footer-links">
              <a href={primaryPlatform.url} download onClick={() => handleDownloadClick('footer')}>Download Free</a>
              <Link to={buyPath('website_footer')}>Buy Once</Link>
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
