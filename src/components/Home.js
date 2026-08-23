import React, { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  DownloadSimple,
  Infinity,
  Lightning,
  List,
  LockKey,
  Ruler,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  X
} from '@phosphor-icons/react';
import parrotIcon from '../assets/polypdf_icon.png';
import DownloadCTA from './DownloadCTA';
import { buyPath, captureAttribution } from '../lib/attribution';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer, founderRightsText, refundSummaryText } from '../lib/commercialOffer';
import { closedOfferMessage, useCommercialOffer } from '../lib/useCommercialOffer';
import shotSymbolSearch from '../assets/screenshots/symbol-search-review-v1-4-dark-web.png';
import shotTakeoff from '../assets/screenshots/takeoff-v1-4-dark-web.png';
import shotTakeoffSnapping from '../assets/screenshots/takeoff-snapping-v1-4.gif';
import shotMarkup from '../assets/screenshots/markup-v1-4-dark-web.png';
import shotCalibration from '../assets/screenshots/calibration-verified-second-span-v1-4-dark-web.png';
import shotMutcdStop from '../assets/screenshots/mutcd-r1-1-stop-v1-4-dark-web.png';
import shotAiscPlugin from '../assets/screenshots/plugins-aisc-w24x55-result-v1-4-dark-web.png';
import shotPdfMaps from '../assets/screenshots/pdf-maps-v1-4-dark-web.png';
import shotAutoArea from '../assets/screenshots/auto-area-v1-4-dark-web.png';

// Screenshots of the shipping PolyPDF app, shown full-frame.
export const homeScreenshots = [
  {
    image: shotSymbolSearch,
    motion: 'symbol-search',
    title: 'Review Symbol Search matches before counting',
    alt: 'PolyPDF Symbol Search showing five matches, all five selected, on a sample drawing',
    caption: 'Box a representative symbol, inspect the candidates, and commit only the matches you accept. Here the search returns 5 matches, all 5 selected, with Count 5 ready.',
    width: 1710,
    height: 1073
  },
  {
    image: shotTakeoff,
    motion: 'takeoff-records',
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
    motion: 'calibration-check',
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
    motion: 'aisc-insert',
    title: 'Plugin output stays editable on the PDF',
    alt: 'PolyPDF Plugins sidebar beside a selected W24×55 steel section placed on the drawing',
    caption: 'The AISC Steel Sections plugin places a W24×55 profile on the sheet as an editable vector you can move and resize. It draws the section outline — it does not run capacity or design checks.',
    width: 1710,
    height: 1073
  },
  {
    image: shotPdfMaps,
    motion: 'pdf-maps',
    title: 'Frame map context before it reaches the sheet',
    alt: 'PolyPDF 1.4 PDF Maps generator previewing New York with street zoom and the Liberty base map selected',
    caption: 'Search for a location, choose the zoom and base-map treatment, and inspect the preview before insertion. PDF Maps keeps that setup beside the drawing so you can place the result without switching apps.',
    width: 1710,
    height: 1073
  },
  {
    image: shotAutoArea,
    motion: 'auto-area',
    title: 'Detect enclosed rooms with Auto Area',
    alt: 'PolyPDF 1.4 Auto Area showing an enclosed room area with a resized cutout and helper dimensions',
    caption: 'Auto Area follows enclosed plan linework, while resizable cutouts remove openings from the measured total. Optional helper dimensions make exact adjustments visible while you work.',
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

// Continuous flourishes stay inside this memoized leaf so the product page can feel alive without
// making the full homepage re-render. The screenshot remains the exact shipping PolyPDF 1.4 UI.
const HeroProductBoard = memo(() => (
  <motion.figure
    id="product-demo"
    className="hero-product-shot playful-product-board"
    initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }}
    animate={{ opacity: 1, scale: 1, rotate: 0.6 }}
    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.12 }}
  >
    <svg className="hero-sketch-line" viewBox="0 0 230 120" aria-hidden="true">
      <path d="M4 106C48 24 123 20 222 8" />
      <path d="M211 1L224 8L214 19" />
    </svg>
    <span className="paper-tape hero-paper-tape" aria-hidden="true" />
    <div className="shot-plate">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={shotTakeoff} />
        <img
          src={shotTakeoffSnapping}
          alt="PolyPDF 1.4 drawing a 30 foot dimension that snaps precisely between two plan endpoints"
          width="1710"
          height="1073"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
    </div>
    <div className="hero-sticker hero-sticker-records">
      <SquaresFour aria-hidden="true" weight="bold" />
      <span><strong>Snap lock</strong> on drawing endpoints</span>
    </div>
    <div className="hero-sticker hero-sticker-area">
      <Ruler aria-hidden="true" weight="bold" />
      <span><strong>30′-0″</strong> live dimension</span>
    </div>
    <figcaption><strong>PolyPDF 1.4</strong> · Real product UI showing endpoint snapping.</figcaption>
  </motion.figure>
));

HeroProductBoard.displayName = 'HeroProductBoard';

export const ShowcaseMotionLayer = memo(({ motionType }) => {
  if (motionType === 'symbol-search') {
    return (
      <svg className="shot-motion-layer shot-motion-symbol-search" viewBox="0 0 1710 1073" aria-hidden="true">
        {[
          [831, 221], [1006, 221], [1181, 221], [831, 397], [1006, 397]
        ].map(([x, y], index) => (
          <g key={`${x}-${y}`} className="symbol-match-glint" style={{ '--motion-index': index }}>
            <path d={`M${x - 10} ${y}H${x + 10}M${x} ${y - 10}V${y + 10}`} />
            <circle cx={x} cy={y} r="16" />
          </g>
        ))}
        <circle className="symbol-count-ripple" cx="117" cy="343" r="27" />
      </svg>
    );
  }

  if (motionType === 'takeoff-records') {
    return (
      <svg className="shot-motion-layer shot-motion-takeoff" viewBox="0 0 1710 1073" aria-hidden="true">
        <g className="takeoff-pair-glow" style={{ '--motion-index': 0 }}>
          <ellipse cx="962" cy="558" rx="80" ry="28" />
          <rect x="204" y="420" width="79" height="39" rx="9" />
        </g>
        <g className="takeoff-pair-glow" style={{ '--motion-index': 1 }}>
          <ellipse cx="962" cy="851" rx="76" ry="25" />
          <rect x="212" y="510" width="71" height="39" rx="9" />
        </g>
        <g className="takeoff-pair-glow" style={{ '--motion-index': 2 }}>
          <ellipse cx="681" cy="425" rx="78" ry="30" />
          <rect x="216" y="594" width="67" height="39" rx="9" />
        </g>
      </svg>
    );
  }

  if (motionType === 'calibration-check') {
    return (
      <svg className="shot-motion-layer shot-motion-calibration" viewBox="0 0 1710 1073" aria-hidden="true">
        <circle className="calibration-endpoint calibration-endpoint-start" cx="594" cy="401" r="18" />
        <circle className="calibration-endpoint calibration-endpoint-end" cx="594" cy="727" r="18" />
        <circle className="calibration-status-ring" cx="83" cy="267" r="24" />
        <path className="calibration-cursor" d="M574 374L606 397L591 401L584 417Z" />
      </svg>
    );
  }

  if (motionType === 'aisc-insert') {
    return (
      <svg className="shot-motion-layer shot-motion-aisc" viewBox="0 0 1710 1073" aria-hidden="true">
        {[
          [581, 464], [615, 464], [649, 464], [581, 570],
          [649, 570], [581, 674], [615, 674], [649, 674]
        ].map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            className="plugin-handle-glint"
            cx={x}
            cy={y}
            r="16"
            style={{ '--motion-index': index }}
          />
        ))}
      </svg>
    );
  }

  if (motionType === 'pdf-maps') {
    return (
      <svg className="shot-motion-layer shot-motion-map" viewBox="0 0 1710 1073" aria-hidden="true">
        <defs>
          <linearGradient id="map-preview-sheen-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="#73d9cf" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fbf8f1" stopOpacity="0.66" />
            <stop offset="1" stopColor="#73d9cf" stopOpacity="0" />
          </linearGradient>
          <clipPath id="map-preview-clip">
            <rect x="97" y="238" width="145" height="145" rx="8" />
          </clipPath>
        </defs>
        <circle className="map-tour-focus" cx="169" cy="488" r="24" />
        <rect
          className="map-preview-sheen"
          x="38"
          y="230"
          width="70"
          height="160"
          fill="url(#map-preview-sheen-gradient)"
          clipPath="url(#map-preview-clip)"
        />
      </svg>
    );
  }

  if (motionType === 'auto-area') {
    return (
      <svg className="shot-motion-layer shot-motion-auto-area" viewBox="0 0 1710 1073" aria-hidden="true">
        <defs>
          <linearGradient id="auto-area-detection-sheen" x1="0" x2="1">
            <stop offset="0" stopColor="#73d9cf" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fbf8f1" stopOpacity="0.58" />
            <stop offset="1" stopColor="#73d9cf" stopOpacity="0" />
          </linearGradient>
          <mask id="auto-area-region-mask">
            <rect width="1710" height="1073" fill="black" />
            <path fill="white" d="M560 502L685 459L827 439L980 414L1138 473Q1190 515 1190 550Q1193 596 1137 630L980 590L839 614L692 644L584 681Z" />
            <path fill="black" d="M817 518L884 518L884 578L817 578Z" />
            <path fill="black" d="M974 518L1047 518L1047 578L974 578Z" />
          </mask>
        </defs>
        <rect
          className="auto-area-detection-sweep"
          x="260"
          y="380"
          width="300"
          height="360"
          fill="url(#auto-area-detection-sheen)"
          mask="url(#auto-area-region-mask)"
        />
        {[
          [560, 502], [980, 414], [1190, 550], [1137, 630], [692, 644], [584, 681]
        ].map(([cx, cy], index) => (
          <circle
            key={`${cx}-${cy}`}
            className="auto-area-node-pulse"
            cx={cx}
            cy={cy}
            r="16"
            style={{ '--motion-index': index }}
          />
        ))}
      </svg>
    );
  }

  return null;
});

ShowcaseMotionLayer.displayName = 'ShowcaseMotionLayer';

const ProductShotMedia = memo(({ shot }) => {
  const mediaRef = useRef(null);
  const [motionActive, setMotionActive] = useState(false);

  useEffect(() => {
    if (!shot.motion || typeof IntersectionObserver === 'undefined') return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const media = mediaRef.current;
    if (!media) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      setMotionActive(entry.isIntersecting && entry.intersectionRatio >= 0.2);
    }, { threshold: [0, 0.2, 0.65] });

    observer.observe(media);
    return () => observer.disconnect();
  }, [shot.motion]);

  return (
    <div
      ref={mediaRef}
      className={`product-shot-media${shot.motion ? ` has-${shot.motion}-motion` : ''}${motionActive ? ' is-motion-active' : ''}`}
    >
      <img src={shot.image} alt={shot.alt} loading="lazy" width={shot.width} height={shot.height} />
      {shot.motion && <ShowcaseMotionLayer motionType={shot.motion} />}
    </div>
  );
});

ProductShotMedia.displayName = 'ProductShotMedia';

const PricingSection = ({ offer, onDownload }) => (
  <section className="pricing pricing-early" id="pricing">
    <div className="container">
      <motion.div
        className="section-header"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Pick your lane</span>
        <h2>Try the real app free. Pay once when you need unlimited measurements.</h2>
        <p>Markup, review, calibration, and Symbol Search auto-count stay free. Pro removes the fourth-measurement wall for $49.99 once.</p>
      </motion.div>

      <div className="pricing-grid">
        <motion.article
          className="pricing-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="paper-tape pricing-card-tape" aria-hidden="true" />
          <div className="plan-pill">Free</div>
          <h3>Use PolyPDF on real drawings</h3>
          <p className="plan-price">$0</p>
          <ul className="plan-list">
            {freeFeatures.map((feature) => (
              <li key={feature}>
                <CheckCircle aria-hidden="true" weight="bold" /> {feature}
              </li>
            ))}
          </ul>
          <a href={primaryPlatform.url} className="secondary-btn full-width" download onClick={() => onDownload('pricing_free')}>
            <DownloadSimple aria-hidden="true" weight="bold" /> Download free for {primaryPlatform.name}
          </a>
        </motion.article>

        <motion.article
          className="pricing-card pricing-card-pro"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <span className="paper-tape pricing-card-tape" aria-hidden="true" />
          <div className="plan-pill plan-pill-dark">Founder's License</div>
          <h3>Unlock unlimited hand-created measurements</h3>
          <p className="plan-price">$49.99</p>
          <ul className="plan-list">
            {proFeatures.map((feature) => (
              <li key={feature}>
                <Lightning aria-hidden="true" weight="bold" /> {feature}
              </li>
            ))}
          </ul>
          {offer.founderAvailable ? (
            <Link to={buyPath('website_pricing')} className="primary-btn full-width">
              <Infinity aria-hidden="true" weight="bold" /> Buy once — $49.99
            </Link>
          ) : (
            <p className="plan-note offer-closed">{closedOfferMessage(offer.closedReason)}</p>
          )}
          <p className="plan-note">{founderRightsText} {offer.founderLimitText}</p>
          <p className="plan-note">Secure Stripe checkout, license key emailed on payment. {refundSummaryText}</p>
        </motion.article>
      </div>
    </div>
  </section>
);

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
              <DownloadSimple aria-hidden="true" weight="bold" /> Download Free
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
            {mobileMenuOpen
              ? <X aria-hidden="true" weight="bold" />
              : <List aria-hidden="true" weight="bold" />}
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
              <LockKey aria-hidden="true" weight="bold" /> Drawing review and takeoff · Mac &amp; Windows
            </div>

            <h1>
              Measure. Mark up. <span className="hero-highlight">Skip the subscription.</span>
            </h1>

            <p className="hero-subtitle">
              Calibrate scale, measure precisely, and mark up the drawings you already receive —
              built for architects, engineers, contractors, and estimators. Free on Mac and Windows;
              unlimited hand-created measurements are a one-time $49.99.
            </p>

            <div className="hero-cta">
              <DownloadCTA
                source="hero"
                onDownload={closeMobileMenu}
                adjacentAction={(
                  <Link to={buyPath('website_hero')} className="secondary-btn hero-buy">
                    <Infinity aria-hidden="true" weight="bold" /> Buy once — $49.99
                  </Link>
                )}
              />
            </div>

            <p className="hero-note">Signed, notarized builds. Start free on your own drawings — upgrade only when you need unlimited hand-created measurements.</p>
          </motion.div>

          <HeroProductBoard />

          <motion.div
            className="hero-stats compact-stats"
            aria-label="Founder license facts"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.24 }}
          >
            <div className="stat">
              <strong>$49.99</strong>
              <p>One payment, no renewal</p>
            </div>
            <div className="stat">
              <strong>3</strong>
              <p>Computers per license</p>
            </div>
            <div className="stat">
              <strong>Mac + PC</strong>
              <p>Use either platform in any mix</p>
            </div>
            <div className="stat">
              <strong>1.x</strong>
              <p>Every public update included</p>
            </div>
          </motion.div>
        </div>
      </section>

      <PricingSection offer={offer} onDownload={handleDownloadClick} />

      <section className="benefits">
        <div className="container">
          <motion.div
            className="section-header benefits-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Made for real drawing work</span>
            <h2>What PolyPDF helps you do faster</h2>
            <p>Designed for architects, engineers, contractors, estimators, and reviewers working from PDF drawings.</p>
          </motion.div>

          <div className="benefits-board">
            {benefits.map((benefit, index) => (
              <motion.article
                key={benefit.title}
                className={`benefit-note benefit-note-${index + 1}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <span className="paper-tape benefit-tape" aria-hidden="true" />
                <span className="benefit-index">0{index + 1}</span>
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
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Shipping UI, eight workflows</span>
            <h2>See PolyPDF at work</h2>
            <p>Eight workflows in PolyPDF 1.4, shown with real shipping screenshots and restrained motion cues — never invented UI.</p>
          </motion.div>

          {/* Lead shot gets the full-width stage; the rest alternate text/image so the section
              reads as a story instead of a stack of identical cards. */}
          <motion.figure
            id={`${homeScreenshots[0].motion}-demo`}
            className="showcase-hero"
            initial={{ opacity: 0, y: 36, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.21, 0.65, 0.32, 1] }}
          >
            <span className="paper-tape showcase-tape" aria-hidden="true" />
            <div className="shot-plate">
              <ProductShotMedia shot={homeScreenshots[0]} />
            </div>
            <figcaption>
              <h3>{homeScreenshots[0].title}</h3>
              <p>{homeScreenshots[0].caption}</p>
            </figcaption>
          </motion.figure>

          <div className="showcase-rows">
            {homeScreenshots.slice(1).map((shot, index) => (
              <motion.figure
                key={shot.title}
                id={shot.motion ? `${shot.motion}-demo` : undefined}
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
                  className="shot-plate showcase-paper"
                  initial={{ opacity: 0, x: index % 2 === 0 ? 28 : -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.21, 0.65, 0.32, 1] }}
                >
                  <ProductShotMedia shot={shot} />
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
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> One engine, two desktops</span>
            <h2>Desktop software for Mac and Windows.</h2>
            <p>
              PolyPDF runs the same engine as a desktop app on macOS and Windows, focused on everyday review, markup,
              calibration, and takeoff workflows construction PDFs demand.
            </p>
          </motion.div>

          <div className="platform-ledger">
            <motion.article className="platform-ledger-row" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span>01</span>
              <h3>One app, both platforms</h3>
              <p>The Mac DMG and the signed Windows installer ship the same engine at the same version — open drawings directly, no VM or browser-only workaround on either side.</p>
            </motion.article>
            <motion.article className="platform-ledger-row" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
              <span>02</span>
              <h3>AEC takeoff basics</h3>
              <p>Distance, area, perimeter, angle, count, and dimension tools are built around the PDFs architects, contractors, and estimators already exchange.</p>
            </motion.article>
            <motion.article className="platform-ledger-row" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
              <span>03</span>
              <h3>No annual seat timer</h3>
              <p>Try real documents for free, then unlock unlimited hand-created measurements with one direct license that covers up to 3 computers.</p>
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
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Three honest steps</span>
            <h2>Try it on your workflow before you buy.</h2>
            <p>Download free, test it on your own drawings, and pay once only if you want unlimited hand-created measurements.</p>
          </motion.div>

          <div className="step-path">
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                className="step-path-item"
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
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Before you download</span>
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
            <span className="cta-sketch" aria-hidden="true" />
            <h2>Start free. Upgrade only if PolyPDF earns it.</h2>
            <p>Download the app on Mac or Windows, test it on your own drawings, and unlock unlimited hand-created measurements for $49.99 only when you want to remove the cap.</p>
            <div className="cta-download-row">
              <DownloadCTA source="bottom_cta" size="large" tone="on-dark" />
              <Link to={buyPath('website_bottom_cta')} className="secondary-btn cta-mac-btn">
                <Infinity aria-hidden="true" weight="bold" /> Buy Once for $49.99
              </Link>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <ShieldCheck aria-hidden="true" weight="bold" />
                <span>Signed builds — notarized on Mac, Authenticode on Windows</span>
              </div>
              <div className="indicator">
                <CheckCircle aria-hidden="true" weight="bold" />
                <span>Up to 3 computers per license</span>
              </div>
              <div className="indicator">
                <LockKey aria-hidden="true" weight="bold" />
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
