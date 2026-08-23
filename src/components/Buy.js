import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBolt,
  FaCheckCircle,
  FaEnvelope,
  FaInfinity,
  FaLock,
  FaReceipt,
  FaUndo
} from 'react-icons/fa';
import { HiOutlineCloudDownload, HiOutlineDesktopComputer, HiOutlineShieldCheck } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';
import ActivationSteps from './ActivationSteps';
import { primaryPlatform } from '../lib/platform';
import {
  commercialOffer,
  founderRightsText,
  licenseDeliveryText,
  refundSummaryText
} from '../lib/commercialOffer';
import { closedOfferMessage, useCommercialOffer } from '../lib/useCommercialOffer';
import { captureAttribution, checkoutAttribution } from '../lib/attribution';
import { trackEvent } from '../lib/analytics';
import siteRelease from '../lib/siteRelease.json';

const proFeatures = [
  'Unlimited distance, area, perimeter, angle, count, and dimension measurements',
  `${commercialOffer.price} once with no subscription renewal`,
  'Use your license on up to 3 computers — Mac or Windows, in any mix',
  'Secure Stripe checkout with license delivery by email',
  'Every PolyPDF 1.x update is included'
];

// The desktop app opens this page with source= and utm_source= already set
// (apps/desktop/src/renderer/dialogs/license-dialogs.ts). Those visitors are the highest-intent
// traffic the business gets — they installed PolyPDF, used it on real drawings, and hit a wall —
// and until now they landed on a page whose second panel told them to download the app they had
// open behind the browser. Reading the parameter that was already in the URL fixes that.
const IN_APP_SOURCES = new Set(['free_measurement_limit', 'visual_search_auto_count', 'license_window']);

// Why they clicked, when the app told us. Named plainly — the visitor already knows what happened;
// pretending otherwise is what makes a paywall page feel like a sales page.
const IN_APP_CONTEXT = {
  free_measurement_limit: {
    kicker: 'You have used the 3 free measurements in this document',
    lede: 'The free app caps hand-created measurements at 3 per document. Everything else you were doing — markup, calibration, review, Symbol Search auto-count — stays free and uncapped. Pro removes that one cap, for good, for $49.99 once.'
  },
  visual_search_auto_count: {
    kicker: 'Symbol Search auto-count is free and uncapped',
    lede: 'You do not need Pro to find, review, or commit a Symbol Search count series. Pro is only needed after you reach the separate 3-per-document limit for hand-created measurements.'
  },
  license_window: {
    kicker: 'Upgrade to PolyPDF Pro',
    lede: 'Unlimited hand-created measurements on every document, on up to 3 computers, for $49.99 once. No subscription, no renewal.'
  }
};

export const isSecureStripeCheckoutUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
  } catch {
    return false;
  }
};

const Buy = ({ forceInApp = false }) => {
  const [searchParams] = useSearchParams();
  const [checkoutStatus, setCheckoutStatus] = useState('ready');
  const [checkoutError, setCheckoutError] = useState('');
  const [showStickyCheckout, setShowStickyCheckout] = useState(false);
  const checkoutCtaRef = useRef(null);
  const offer = useCommercialOffer();

  const source = searchParams.get('source') || '';
  const cameFromApp =
    forceInApp || searchParams.get('utm_source') === 'desktop_app' || IN_APP_SOURCES.has(source);
  const context = IN_APP_CONTEXT[source] || IN_APP_CONTEXT.license_window;
  const cancelled = searchParams.get('checkout') === 'cancelled';
  const pageVariant = cameFromApp ? 'in_app' : 'cold';
  const funnelProperties = {
    source: source || (cameFromApp ? 'desktop_app' : 'buy_page'),
    page_variant: pageVariant,
    platform: primaryPlatform.key,
    offer_id: commercialOffer.id,
    app_version: siteRelease.version
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const attribution = captureAttribution();
    const properties = {
      source: attribution.source || (cameFromApp ? source || 'desktop_app' : 'buy_page'),
      page_variant: pageVariant,
      platform: primaryPlatform.key,
      offer_id: commercialOffer.id,
      app_version: siteRelease.version
    };
    trackEvent('buy_page_view', properties);
    if (cancelled) trackEvent('checkout_cancelled', properties);
  }, [cameFromApp, cancelled, pageVariant, source]);

  useEffect(() => {
    const target = checkoutCtaRef.current;
    if (!target || !offer.founderAvailable || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyCheckout(!entry.isIntersecting);
    }, { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [offer.founderAvailable]);

  const handleBuyClick = async (event) => {
    event.preventDefault();
    if (checkoutStatus === 'loading') return;
    const attribution = checkoutAttribution();
    const properties = { ...funnelProperties, source: attribution.source, provider: 'stripe' };
    trackEvent('buy_click', properties);
    trackEvent('checkout_click', properties);
    setCheckoutError('');
    setCheckoutStatus('loading');
    setShowStickyCheckout(false);

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attribution })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !isSecureStripeCheckoutUrl(payload.url)) {
        throw new Error(payload.error || 'checkout_unavailable');
      }
      trackEvent('checkout_session_created', properties);
      trackEvent('checkout_started', properties);
      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutStatus('ready');
      const soldOut = error instanceof Error && [
        'founder_offer_sold_out',
        'founder_offer_ended'
      ].includes(error.message);
      trackEvent('checkout_error', {
        ...properties,
        reason: soldOut ? 'sold_out' : 'unavailable'
      });
      setCheckoutError(
        soldOut
          ? 'Founder offer complete. All 100 licenses have been claimed, so checkout is closed.'
          : 'Checkout could not load. Please refresh this page or contact support@polypdf.com.'
      );
    }
  };

  return (
    <div className="legal-page buy">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
        </nav>
      </header>

      <motion.main
        className="legal-content buy-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="buy-hero">
            <div className="hero-badge">
              {cameFromApp ? <HiOutlineDesktopComputer /> : <FaLock />}{' '}
              {cameFromApp ? context.kicker : 'Secure checkout · one license for Mac & Windows'}
            </div>
            <h1>
              {cameFromApp
                ? 'Keep measuring. One payment, no subscription.'
                : 'Buy PolyPDF Pro once. Measure without a subscription.'}
            </h1>
            <p>
              {cameFromApp
                ? context.lede
                : 'Unlock unlimited hand-created measurements for a one-time $49.99. Keep the free markup and review workflow, remove the measurement cap, and use your license on up to 3 computers — Mac or Windows.'}
            </p>
            {cancelled && (
              <p className="buy-cancelled">
                Checkout was cancelled and nothing was charged. The free app keeps working exactly as it did.
              </p>
            )}
          </div>

          <div className="buy-grid">
            <motion.section
              className="pricing-card pricing-card-pro buy-plan"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="plan-pill plan-pill-dark">Founder's License</div>
              <h2>{commercialOffer.name}</h2>
              <p className="plan-price">$49.99</p>
              {offer.founderAvailable ? (
                <a
                  ref={checkoutCtaRef}
                  href="/buy/"
                  className="primary-btn full-width"
                  onClick={handleBuyClick}
                  aria-disabled={checkoutStatus === 'loading'}
                >
                  <FaInfinity /> {checkoutStatus === 'loading' ? 'Opening Stripe checkout…' : 'Checkout with Stripe — $49.99'}
                </a>
              ) : (
                <p className="plan-note offer-closed">{closedOfferMessage(offer.closedReason)}</p>
              )}
              {checkoutError && <p className="plan-note checkout-error">{checkoutError}</p>}
              <ul className="plan-list buy-plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <FaCheckCircle /> {feature}
                  </li>
                ))}
              </ul>

              {/* The three questions asked at the button, answered at the button. */}
              <ul className="buy-assurances">
                <li><HiOutlineShieldCheck /> Secure Stripe checkout. PolyPDF never sees your card details.</li>
                <li><FaEnvelope /> {licenseDeliveryText}</li>
                <li><FaUndo /> {refundSummaryText} <Link to="/refund/">Read the policy</Link>.</li>
              </ul>

              <p className="plan-note">{founderRightsText}</p>
              <p className="plan-note">{offer.founderLimitText}</p>
            </motion.section>

            <motion.section
              className="legal-section buy-summary"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <div className="section-header">
                <div className="section-icon"><FaBolt /></div>
                <h2>{cameFromApp ? 'After you pay' : 'Before you buy'}</h2>
              </div>

              {cameFromApp ? (
                <>
                  <ActivationSteps heading={null} />
                  <p className="buy-aside">
                    Your license covers 3 computers, Mac or Windows in any mix. Need PolyPDF on
                    another machine? <a href={primaryPlatform.url} download onClick={() => trackEvent('download_click', { source: 'buy_in_app', platform: primaryPlatform.key })}>Download it</a> and activate with the same key.
                  </p>
                </>
              ) : (
                <>
                  <ul className="section-content">
                    <li>Download PolyPDF free first if you want to test it on real drawings.</li>
                    <li>The free app includes markup and review tools, up to 3 hand-created measurements per document, and uncapped Symbol Search auto-count.</li>
                    <li>Pro removes the measurement limit on both Mac and Windows.</li>
                  </ul>
                  <div className="buy-actions buy-actions-quiet">
                    <a
                      href={primaryPlatform.url}
                      className="buy-download-link"
                      download
                      onClick={() => trackEvent('download_click', { source: 'buy_page', platform: primaryPlatform.key })}
                    >
                      <HiOutlineCloudDownload /> Prefer to test it first? Download free for {primaryPlatform.name}
                    </a>
                  </div>
                </>
              )}
            </motion.section>
          </div>

          <div className="buy-detail-grid">
            {!cameFromApp && (
              <section className="legal-section">
                <div className="section-header">
                  <div className="section-icon"><FaReceipt /></div>
                  <h2>What happens after checkout</h2>
                </div>
                <ActivationSteps heading={null} />
              </section>
            )}

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><FaUndo /></div>
                <h2>Refund policy</h2>
              </div>
              <ul className="section-content">
                <li>Purchases are processed by Stripe and follow PolyPDF's refund policy.</li>
                <li>Unless required by law, transactions are generally non-refundable; discretionary refund requests may be reviewed within 14 days.</li>
                <li>Refunded Pro licenses may be deactivated after the refund is completed.</li>
                <li><Link to="/refund/">Read the refund policy</Link> for request steps and legal rights.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><HiOutlineShieldCheck /></div>
                <h2>Private by design</h2>
              </div>
              <ul className="section-content">
                <li>Your PDFs stay on your computer unless you export or share them, including through a separate service you choose.</li>
                <li>Checkout and license records are used to process your purchase and keep Pro activated.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><FaEnvelope /></div>
                <h2>Need help?</h2>
              </div>
              <p>Purchase, billing, and license questions can be sent to:</p>
              <div className="contact-info">
                <a href="mailto:support@polypdf.com" className="contact-link">
                  <FaEnvelope /> support@polypdf.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </motion.main>

      {showStickyCheckout && offer.founderAvailable && checkoutStatus !== 'loading' && (
        <div className="buy-sticky-checkout" role="region" aria-label="Checkout">
          <button type="button" className="primary-btn" onClick={handleBuyClick}>
            <FaLock /> Checkout with Stripe — $49.99
          </button>
        </div>
      )}

    </div>
  );
};

export default Buy;
