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
import { buyPath, captureAttribution } from '../lib/attribution';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer, founderRightsText, refundSummaryText } from '../lib/commercialOffer';
import { useCommercialOffer } from '../lib/useCommercialOffer';
import shotSymbolSearch from '../assets/screenshots/symbol-search-review-currentdev-dark-web.png';
import shotTakeoff from '../assets/screenshots/takeoff-currentdev-dark-web.png';
import shotMarkup from '../assets/screenshots/markup-currentdev-dark-web.png';
import shotCalibration from '../assets/screenshots/calibration-verified-second-span-currentdev-dark-web.png';
import shotMutcdStop from '../assets/screenshots/mutcd-r1-1-stop-currentdev-dark-web.png';
import shotAiscPlugin from '../assets/screenshots/plugins-aisc-w24x55-result-currentdev-dark-web.png';

// Screenshots of the shipping PolyPDF app, shown full-frame.
const screenshots = [
  {
    image: shotSymbolSearch,
    title: 'Review Symbol Search matches before counting',
    alt: 'PolyPDF Symbol Search showing five matches, all five selected, on a sample drawing',
    caption: 'Box a representative symbol, inspect the candidates, and commit only the matches you accept. Here the search returns 5 matches, all 5 selected, with Count 5 ready.',
    width: 1710,
    height: 1073
  },
  {
    image: shotTakeoff,
    title: 'Measured quantities stay tied to the sheet',
    alt: 'PolyPDF takeoff worksheet showing 14 items beside a sample plan with a 540 square foot area, a 30 foot length, and 12 supply diffusers',
    caption: 'The Records view keeps measured quantities beside the drawing they came from. This takeoff shows 14 items: a 540 sq ft area, a 30 ft length, and 12 supply-diffuser counts, with matching rows in the Markup Table.',
    width: 1710,
    height: 1073
  },
  {
    image: shotMarkup,
    title: 'Reviews and RFIs, straight on the sheet',
    alt: 'PolyPDF showing an RFI callout, a revision cloud, and a green rectangle with three matching rows in the Markup Table',
    caption: 'A rounded RFI callout, an In Progress revision cloud, and a Completed verification rectangle remain connected to three matching table rows and their review comments.',
    width: 1710,
    height: 1073
  },
  {
    image: shotCalibration,
    title: 'Calibrate, then verify a second span',
    alt: 'PolyPDF Page Scale panel showing a calibrated quarter-inch equals one-foot scale and a second 12-foot verification measurement',
    caption: 'The Page Scale panel confirms 1/4 inch = 1 foot, or 18 PDF points per foot. A second known span reads 12 feet, which confirms the calibration before you start taking off quantities.',
    width: 1710,
    height: 1073
  },
  {
    image: shotMutcdStop,
    title: 'Built-in MUTCD sign toolsets',
    alt: 'PolyPDF built-in MUTCD Regulatory toolset open beside a selected R1-1 STOP sign on a sample sheet',
    caption: 'The built-in MUTCD Regulatory reference chest is open with an R1-1 STOP sign placed and selected on the sheet. Standard signs drop straight onto the drawing, then move and resize like any other markup.',
    width: 1710,
    height: 1073
  },
  {
    image: shotAiscPlugin,
    title: 'Plugin output stays editable on the PDF',
    alt: 'PolyPDF Plugins sidebar beside a selected W24×55 steel section placed on the drawing',
    caption: 'The AISC Steel Sections plugin places a W24×55 profile on the sheet as an editable vector you can move and resize. It draws the section outline — it does not run capacity or design checks.',
    width: 1710,
    height: 1073
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
  'Verify fit on your own plans with up to 3 hand-placed measurements per document, plus uncapped Symbol Search auto-counts',
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

// Exported for content checks and any future presentation that must match the visible answers.
export const homeFaqs = [
  {
    question: 'What can I do before I pay?',
    answer: 'You can download the app free on Mac or Windows, open your own PDFs, calibrate scale, use the markup tools, place up to 3 hand-created measurements in every open document, and use uncapped Symbol Search auto-count. That gives you a real-world test before you buy.'
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
    question: 'How do I activate the license key?',
    answer: 'Open PolyPDF and choose Upgrade to PolyPDF Pro — it is in the PolyPDF menu on Mac (Command-Shift-L) and the Help menu on Windows (Ctrl-Shift-L). Paste the key from your email, which looks like PPM-XXXX-XXXX-XXXX, and click Activate. There is no restart and no reinstall, and the drawing you have open keeps everything already on it.'
  },
  {
    question: 'How do refunds work?',
    answer: 'Purchases are handled through Stripe and PolyPDF support. Refund requests are reviewed under the refund policy, which also covers your statutory rights.'
  }
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const offer = useCommercialOffer();

  useEffect(() => {
    captureAttribution();
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
            <Link to="/blog/" onClick={closeMobileMenu}>Guides</Link>
            <Link to="/feature-requests/" onClick={closeMobileMenu}>Requests</Link>
            <Link to="/support/" onClick={closeMobileMenu}>Support</Link>
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
            <h2>See PolyPDF at work</h2>
            <p>Six workflows in the shipping app, shown on a sample plan — screenshots, not mockups.</p>
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
              <img src={screenshots[0].image} alt={screenshots[0].alt} loading="eager" width={screenshots[0].width} height={screenshots[0].height} />
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
                  <img src={shot.image} alt={shot.alt} loading="lazy" width={shot.width} height={shot.height} />
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
            <h2>Desktop software for Mac and Windows.</h2>
            <p>
              PolyPDF runs the same engine as a desktop app on macOS and Windows, focused on everyday review, markup,
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
            <h2>There is nothing to decide until you hit the cap.</h2>
            <p>Markup, review, calibration and Symbol Search auto-count stay free for as long as you want them. The only wall is the fourth hand-created measurement in a document. That is the moment Pro is for, and it costs $49.99 once.</p>
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
              <p className="plan-note">{founderRightsText} {offer.founderLimitText}</p>
              <p className="plan-note">Secure Stripe checkout, license key emailed on payment. {refundSummaryText}</p>
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
            {homeFaqs.map((item, index) => (
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
              <DownloadCTA source="bottom_cta" size="large" tone="on-dark" />
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

    </div>
  );
};

export default Home;
