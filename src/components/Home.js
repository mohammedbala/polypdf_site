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
import DirectCheckoutLink from './DirectCheckoutLink';
import { OfferButtonLabel, OfferGuarantee, OfferPrice } from './OfferPrice';
import { captureAttribution } from '../lib/attribution';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer, founderRightsText, refundSummaryText } from '../lib/commercialOffer';
import siteRelease from '../lib/siteRelease.json';
import { closedOfferMessage, useCommercialOffer } from '../lib/useCommercialOffer';
import shotSymbolSearch from '../assets/screenshots/symbol-search-review-v1-4-dark-web.png';
import shotTakeoff from '../assets/screenshots/takeoff-v1-4-dark-web.png';
import shotTakeoffSnapping from '../assets/screenshots/takeoff-snapping-v1-4.gif';
import shotCompare from '../assets/screenshots/compare-editable-clouds-v1-4-dark-web.png';
import shotAutoArea from '../assets/screenshots/auto-area-v1-4-dark-web.png';
import shotOcrSearch from '../assets/screenshots/ocr-uss-akron-search-hit-v1-4-light-web.png';
import shotCustomShortcuts from '../assets/screenshots/custom-shortcuts-v1-4-light-web.png';
import shotSanitize from '../assets/screenshots/sanitize-options-v1-4-light-web.png';
import shotPdfMapsMotion from '../assets/motion/pdf-map-plan-v1-4.gif';
import shotPdfMapsPoster from '../assets/motion/pdf-map-plan-v1-4-poster.png';

// Every source is a full-frame capture of the shipping PolyPDF 1.4 app. Focused cards crop only
// at presentation time so the important controls read clearly without manufacturing replacement UI.
export const homeScreenshots = [
  {
    image: shotSymbolSearch,
    motion: 'symbol-search',
    theme: 'dark',
    framing: 'focus',
    focus: 'symbol-search',
    category: 'Count',
    access: 'Pro',
    title: 'Review Symbol Search matches before counting',
    alt: 'PolyPDF Symbol Search showing five matches, all five selected, on a sample drawing',
    caption: 'Box one symbol, inspect the candidates, and commit only the matches you accept. Five reviewed matches are ready here.',
    width: 1710,
    height: 1073
  },
  {
    image: shotTakeoff,
    motion: 'takeoff-records',
    theme: 'dark',
    framing: 'context',
    category: 'Takeoff',
    title: 'Measured quantities stay tied to the sheet',
    alt: 'PolyPDF takeoff worksheet showing 14 items beside a sample plan with a 540 square foot area, a 30 foot length, and 12 supply diffusers',
    caption: 'The Records view keeps a 540 sq ft area, 30 ft length, and 12 diffuser counts beside the drawing they came from.',
    width: 1710,
    height: 1073
  },
  {
    image: shotOcrSearch,
    theme: 'light',
    framing: 'focus',
    focus: 'ocr-search',
    category: 'OCR',
    title: 'Search scanned pages after OCR',
    alt: 'PolyPDF in light mode showing OCR text search results for Akron on a scanned historical drawing',
    caption: 'Run OCR on a received scan, then search the recognized text without losing the original page image or document context.',
    width: 1710,
    height: 1073
  },
  {
    image: shotCustomShortcuts,
    theme: 'light',
    framing: 'focus',
    focus: 'shortcuts',
    category: 'Shortcuts',
    title: 'Make every command feel familiar',
    alt: 'PolyPDF light-mode Keyboard Shortcuts settings showing searchable, editable command assignments',
    caption: 'Search commands, assign the keys you already use, clear individual mappings, or reset the complete shortcut set.',
    width: 1710,
    height: 1073
  },
  {
    image: shotCompare,
    theme: 'dark',
    framing: 'focus',
    focus: 'compare',
    category: 'Compare',
    title: 'Turn drawing changes into review-ready markups',
    alt: 'PolyPDF Compare Documents showing four editable purple revision clouds and their matching Markup Table records',
    caption: 'Compare two revisions, inspect the detected changes as editable clouds, and track every result in the Markup Table.',
    width: 1710,
    height: 1073
  },
  {
    image: shotPdfMapsPoster,
    animatedImage: shotPdfMapsMotion,
    motion: 'pdf-maps',
    theme: 'dark',
    framing: 'focus',
    focus: 'pdf-maps',
    category: 'Maps',
    access: 'Pro',
    title: 'Build a signed map sheet in one workflow',
    alt: 'PolyPDF 1.4 placing a full New York map, resizing it on the PDF, then adding built-in MUTCD Stop and Yield signs',
    caption: 'Place a real map, drag it to the size the sheet needs, then layer built-in MUTCD regulatory signs directly over it.',
    width: 1710,
    height: 1073
  },
  {
    image: shotAutoArea,
    motion: 'auto-area',
    theme: 'dark',
    framing: 'focus',
    focus: 'auto-area',
    category: 'Auto Area',
    title: 'Detect enclosed rooms with Auto Area',
    alt: 'PolyPDF 1.4 Auto Area previewing the detected Assembly room boundary at 135 square feet with a Space to capture room hint',
    caption: 'Choose Area, hover inside an enclosed room, and press Space to capture the detected boundary as a measured area.',
    width: 1710,
    height: 1073
  },
  {
    image: shotSanitize,
    theme: 'light',
    framing: 'focus',
    focus: 'sanitize',
    category: 'Document prep',
    title: 'Review what sanitization will remove',
    alt: 'PolyPDF light-mode Sanitize Document dialog with document-data removal options selected',
    caption: 'Choose the supported document data to remove, review the consequences, and keep destructive options explicit before saving.',
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
  'Verify fit on your own plans with up to 3 hand-created measurements per document',
  'Decide after real use, not from a watered-down demo'
];

const proFeatures = [
  'Unlock unlimited hand-created measurements across all of your documents',
  'Use Symbol Search auto-count and installed plugins, including PDF Maps and Professional Seal Maker',
  `Pay ${commercialOffer.price} once for PolyPDF 1.x on up to 3 computers — Mac or Windows`,
  'Keep PolyPDF 1.x forever, with every public 1.x update included',
  'Secure Stripe checkout with license delivery by email'
];

export const featureFamilies = [
  {
    family: 'Measure & takeoff',
    tools: 'Distance · Area · Perimeter · Angle · Count · Dimension',
    outcome: 'Calibrated quantities that remain tied to the sheet'
  },
  {
    family: 'Automated quantities',
    tools: 'Symbol Search · Auto Area · cutouts · helper dimensions',
    outcome: 'Review candidates and geometry before committing results'
  },
  {
    family: 'Markup & coordination',
    tools: 'Callouts · notes · highlights · shapes · comments · Markup Table',
    outcome: 'RFIs, review status, and discussion directly on the PDF'
  },
  {
    family: 'Search & document prep',
    tools: 'OCR · text search · fillable forms · page organization · issued sets',
    outcome: 'Turn received files into searchable, usable deliverables'
  },
  {
    family: 'Compare & protect',
    tools: 'Page comparison · editable revision clouds · redaction · sanitization',
    outcome: 'Find changes and prepare controlled outgoing files'
  },
  {
    family: 'Libraries & standards',
    tools: 'MUTCD toolsets · signatures and seals · reusable Tool Chest markups',
    outcome: 'Place consistent project and standards content quickly'
  },
  {
    family: 'Extend & customize',
    tools: 'PDF Maps · plugins · custom keyboard shortcuts',
    outcome: 'Fit PolyPDF to the way your team already works'
  },
  {
    family: 'Desktop workflow',
    tools: 'macOS · Windows · local core PDF work · CSV and PDF takeoff export',
    outcome: 'Work in a native app and hand off familiar file formats'
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
    description: `If PolyPDF saves you time, buy the ${commercialOffer.price} Founder's License to remove the measurement cap and unlock Symbol Search plus plugins without a yearly fee.`
  }
];

// Exported for content checks and any future presentation that must match the visible answers.
export const homeFaqs = [
  {
    question: 'What can I do before I pay?',
    answer: 'You can download the app free on Mac or Windows, open your own PDFs, calibrate scale, use markup and review tools, and place up to 3 hand-created measurements in every document. Symbol Search and plugin workflows unlock with Pro.'
  },
  {
    question: 'Does one license cover both Mac and Windows?',
    answer: 'Yes. A license activates PolyPDF on up to 3 computers in any mix — three Macs, three Windows PCs, or any combination.'
  },
  {
    question: 'What does the $49.99 license unlock?',
    answer: `The Founder's License removes the hand-created measurement limit and unlocks Symbol Search plus installed plugins such as PDF Maps and Professional Seal Maker. ${founderRightsText}`
  },
  {
    question: 'Is this a subscription?',
    answer: `No. The PolyPDF Pro Founder's License is ${commercialOffer.price} once. There is no annual renewal, recurring maintenance bill, or subscription timer.`
  },
  {
    question: 'What happens after I buy?',
    answer: 'Checkout is handled securely by Stripe. Your license key is delivered by email, and you paste it into the app once — on Mac or Windows — to unlock unlimited measurements, Symbol Search, and installed plugins.'
  },
  {
    question: 'How do I activate the license key?',
    answer: 'Open PolyPDF and choose Upgrade to PolyPDF Pro — it is in the PolyPDF menu on Mac (Command-Shift-L) and the Help menu on Windows (Ctrl-Shift-L). Paste the key from your email, which looks like PPM-XXXX-XXXX-XXXX, and click Activate. There is no restart and no reinstall, and the drawing you have open keeps everything already on it.'
  },
  {
    question: 'Is there a money-back guarantee?',
    answer: 'Yes. Direct website purchases include a 14-day money-back guarantee. Request a refund within 14 days of payment and PolyPDF will return the amount paid to the original payment method where possible. The refund policy also preserves any statutory rights you have.'
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

  if (motionType === 'auto-area') {
    return (
      <svg className="shot-motion-layer shot-motion-auto-area" viewBox="0 0 1710 1073" aria-hidden="true">
        <defs>
          <linearGradient id="auto-area-detection-sheen" x1="0" x2="1">
            <stop offset="0" stopColor="#70b7ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fbf8f1" stopOpacity="0.58" />
            <stop offset="1" stopColor="#70b7ff" stopOpacity="0" />
          </linearGradient>
          <mask id="auto-area-region-mask">
            <rect width="1710" height="1073" fill="black" />
            <path fill="white" d="M412 328H820V574H412Z" />
          </mask>
        </defs>
        <rect
          className="auto-area-detection-sweep"
          x="300"
          y="328"
          width="160"
          height="246"
          fill="url(#auto-area-detection-sheen)"
          mask="url(#auto-area-region-mask)"
        />
        {[
          [412, 328], [820, 328], [820, 574], [412, 574]
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
      <img
        src={shot.animatedImage && motionActive ? shot.animatedImage : shot.image}
        alt={shot.alt}
        loading="lazy"
        width={shot.width}
        height={shot.height}
      />
      {shot.motion && !shot.animatedImage && <ShowcaseMotionLayer motionType={shot.motion} />}
    </div>
  );
});

ProductShotMedia.displayName = 'ProductShotMedia';

export const FeatureIndex = () => (
  <section className="feature-index-section" id="features">
    <div className="container">
      <motion.div
        className="section-header feature-index-header"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="section-kicker"><SquaresFour aria-hidden="true" weight="bold" /> Capability index</span>
        <h2>One PDF workspace, organized by the work.</h2>
        <p>Scan the complete product by job: measurement, review, search, document preparation, standards, protection, and extensions.</p>
      </motion.div>

      <p className="capability-scroll-hint">Swipe to compare tools and outcomes</p>
      <div
        className="capability-table-shell"
        role="region"
        aria-label="PolyPDF capability index"
        tabIndex="0"
      >
        <table className="capability-table">
          <caption className="sr-only">PolyPDF capability index organized by workflow</caption>
          <thead>
            <tr>
              <th scope="col">Workflow</th>
              <th scope="col">Included tools</th>
              <th scope="col">What it gives you</th>
            </tr>
          </thead>
          <tbody>
            {featureFamilies.map((row, index) => (
              <tr key={row.family}>
                <th scope="row">
                  <span className="capability-family">
                    <span className="capability-index">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{row.family}</strong>
                  </span>
                </th>
                <td>{row.tools}</td>
                <td>{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="feature-index-summary">
        <p><strong>Everything stays in one native desktop workspace:</strong> move from scale check to quantities, review, and final document preparation without shrinking the PDF into a browser widget.</p>
        <a href="#workflows" className="secondary-btn feature-index-action">
          <Sparkle aria-hidden="true" weight="bold" /> See the real 1.4 UI
        </a>
      </div>
    </div>
  </section>
);

export const WorkflowGrid = () => (
  <section className="showcase showcase-compact" id="workflows">
    <div className="container">
      <motion.div
        className="section-header workflow-grid-header"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> Real 1.4 UI · eight workflows</span>
        <h2>Full app context, then close enough to inspect.</h2>
        <p>The hero establishes the complete desktop window. These cards move closer to the useful controls, with authentic dark and light PolyPDF captures for each kind of work.</p>
      </motion.div>

      <p className="workflow-scroll-hint">Swipe to scan all eight workflows</p>
      <div className="workflow-grid" tabIndex="0" role="region" aria-label="PolyPDF workflow screenshots">
        {homeScreenshots.map((shot, index) => (
          <motion.figure
            key={shot.title}
            id={shot.motion ? `${shot.motion}-demo` : undefined}
            className={`workflow-card theme-${shot.theme} is-${shot.framing}${shot.focus ? ` focus-${shot.focus}` : ''}`}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.52, delay: (index % 2) * 0.07, ease: [0.21, 0.65, 0.32, 1] }}
          >
            <div className="shot-plate workflow-shot">
              <ProductShotMedia shot={shot} />
            </div>
            <figcaption>
              <div className="workflow-meta">
                <span className="showcase-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="workflow-category">{shot.category}</span>
                {shot.access && <span className="workflow-access">{shot.access} workflow</span>}
                <span className="workflow-view-mode">
                  {shot.theme === 'light' ? 'Light' : 'Dark'} UI · {shot.framing === 'focus' ? 'Feature focus' : 'Full window'}
                </span>
              </div>
              <h3>{shot.title}</h3>
              <p>{shot.caption}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  </section>
);

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
        <h2>Try the real app free. Pay once to unlock every Pro workflow.</h2>
        <p>Markup, review, calibration, and three hand-created measurements per document stay free. Pro removes the measurement cap and unlocks Symbol Search plus plugins at the $49.99 Founder price — saving $49.01 against the planned $99 standard price — with a 14-day money-back guarantee.</p>
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
          <h3>Unlock unlimited measurements, Symbol Search, and plugins</h3>
          <OfferPrice />
          <ul className="plan-list">
            {proFeatures.map((feature) => (
              <li key={feature}>
                <Lightning aria-hidden="true" weight="bold" /> {feature}
              </li>
            ))}
          </ul>
          {offer.founderAvailable ? (
            <DirectCheckoutLink
              source="website_pricing"
              pageVariant="home_pricing"
              className="primary-btn full-width offer-cta"
              aria-label={`Buy once — ${commercialOffer.price}. Planned standard price ${commercialOffer.referencePrice}.`}
            >
              <Infinity aria-hidden="true" weight="bold" /> <OfferButtonLabel />
            </DirectCheckoutLink>
          ) : (
            <p className="plan-note offer-closed">{closedOfferMessage(offer.closedReason)}</p>
          )}
          {offer.founderAvailable && <OfferGuarantee compact inverse />}
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
            <a href="#features" onClick={closeMobileMenu}>Features</a>
            <a href="#workflows" onClick={closeMobileMenu}>Workflows</a>
            <Link to="/blog/" onClick={closeMobileMenu}>Guides</Link>
            <Link to="/support/" onClick={closeMobileMenu}>Support</Link>
            <DirectCheckoutLink
              source="website_nav"
              pageVariant="home_nav"
              className="nav-buy"
              onClick={closeMobileMenu}
            >
              Buy Once
            </DirectCheckoutLink>
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
              <LockKey aria-hidden="true" weight="bold" /> PolyPDF {siteRelease.version} · Mac &amp; Windows
            </div>

            <h1>
              Measure. Mark up. <span className="hero-highlight">Skip the subscription.</span>
            </h1>

            <p className="hero-subtitle">
              Calibrate, measure, and mark up the drawings you already receive. Start free on Mac
              or Windows, then unlock unlimited measurements, Symbol Search, and plugins at the $49.99 Founder price.
            </p>

            <div className="hero-cta">
              <DownloadCTA
                source="hero"
                onDownload={closeMobileMenu}
                adjacentAction={(
                  <DirectCheckoutLink
                    source="website_hero"
                    pageVariant="home_hero"
                    className="secondary-btn hero-buy offer-cta"
                    aria-label={`Buy once — ${commercialOffer.price}. Planned standard price ${commercialOffer.referencePrice}.`}
                  >
                    <Infinity aria-hidden="true" weight="bold" /> <OfferButtonLabel />
                  </DirectCheckoutLink>
                )}
              />
            </div>

            <OfferGuarantee compact />
            <p className="hero-note">Signed, notarized builds. Start free on your own drawings — upgrade when you need unlimited measurements, Symbol Search, or plugins.</p>
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
              <span className="stat-reference"><del>$99</del> planned</span>
              <strong>$49.99</strong>
              <p>Founder price · one payment</p>
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

      <FeatureIndex />

      <WorkflowGrid />

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
              <p>Try real documents for free, then unlock unlimited measurements, Symbol Search, and plugins with one direct license that covers up to 3 computers.</p>
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
            <p>Download free, test it on your own drawings, and pay once only if you want the complete Pro workflow.</p>
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
            <p>Download the app on Mac or Windows, test it on your own drawings, and unlock unlimited measurements, Symbol Search, and plugins at the $49.99 Founder price instead of the planned $99 standard price.</p>
            <div className="cta-download-row">
              <DownloadCTA source="bottom_cta" size="large" tone="on-dark" />
              <DirectCheckoutLink
                source="website_bottom_cta"
                pageVariant="home_bottom"
                className="secondary-btn cta-mac-btn offer-cta"
                aria-label={`Buy once — ${commercialOffer.price}. Planned standard price ${commercialOffer.referencePrice}.`}
              >
                <Infinity aria-hidden="true" weight="bold" /> <OfferButtonLabel />
              </DirectCheckoutLink>
            </div>
            <OfferGuarantee compact inverse />
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
