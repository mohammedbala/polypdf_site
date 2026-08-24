import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowCounterClockwise,
  ArrowLeft,
  CheckCircle,
  Desktop,
  DownloadSimple,
  EnvelopeSimple,
  Infinity,
  Lightning,
  LockKey,
  Receipt,
  ShieldCheck,
  Sparkle
} from '@phosphor-icons/react';
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
import {
  checkoutErrorCode,
  createStripeCheckoutSession,
  isSecureStripeCheckoutUrl
} from '../lib/checkout';
import siteRelease from '../lib/siteRelease.json';
import MagneticLink from './MagneticLink';
import { OfferButtonLabel, OfferGuarantee, OfferPrice } from './OfferPrice';

const proFeatures = [
  'Unlimited distance, area, perimeter, angle, count, and dimension measurements',
  'Symbol Search automatic counting and every installed plugin workflow',
  'PDF Maps, AISC Steel Sections, and Professional Seal Maker included',
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
const IN_APP_SOURCES = new Set(['free_measurement_limit', 'visual_search_auto_count', 'plugins', 'license_window']);

// Why they clicked, when the app told us. Named plainly — the visitor already knows what happened;
// pretending otherwise is what makes a paywall page feel like a sales page.
const IN_APP_CONTEXT = {
  free_measurement_limit: {
    kicker: 'You have used the 3 free measurements in this document',
    lede: 'The free app includes markup, calibration, review, and 3 hand-created measurements per document. Pro removes that cap and also unlocks Symbol Search plus plugins for good at the $49.99 Founder price, backed by a 14-day money-back guarantee.'
  },
  visual_search_auto_count: {
    kicker: 'Symbol Search is a PolyPDF Pro workflow',
    lede: 'Pro unlocks the complete Symbol Search workflow: capture one example, review matching candidates, and commit the accepted set as one linked Count series. The same license also removes the 3-measurement cap and unlocks installed plugins.'
  },
  plugins: {
    kicker: 'Plugins are available with PolyPDF Pro',
    lede: 'Pro unlocks installed plugin workflows for PDF Maps, AISC steel sections, professional seals, and packages you install yourself. The same license also removes the 3-measurement cap and unlocks Symbol Search.'
  },
  license_window: {
    kicker: 'Upgrade to PolyPDF Pro',
    lede: 'Unlock unlimited hand-created measurements, Symbol Search, and installed plugins on up to 3 computers at the $49.99 Founder price instead of the planned $99 standard price. No subscription, no renewal, and a 14-day money-back guarantee.'
  }
};

export { isSecureStripeCheckoutUrl };

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
      const checkoutUrl = await createStripeCheckoutSession(attribution);
      trackEvent('checkout_session_created', properties);
      trackEvent('checkout_started', properties);
      window.location.assign(checkoutUrl);
    } catch (error) {
      setCheckoutStatus('ready');
      const soldOut = [
        'founder_offer_sold_out',
        'founder_offer_ended'
      ].includes(checkoutErrorCode(error));
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
            <ArrowLeft aria-hidden="true" weight="bold" /> Back to Home
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
              {cameFromApp
                ? <Desktop aria-hidden="true" weight="bold" />
                : <LockKey aria-hidden="true" weight="bold" />}{' '}
              {cameFromApp ? context.kicker : 'Secure checkout · one license for Mac & Windows'}
            </div>
            <span className="section-kicker"><Sparkle aria-hidden="true" weight="bold" /> One clear checkout</span>
            <h1>
              {cameFromApp
                ? 'Unlock the workflow. One payment, no subscription.'
                : 'Buy PolyPDF Pro once. Unlock every Pro workflow.'}
            </h1>
            <p>
              {cameFromApp
                ? context.lede
                : 'Unlock unlimited hand-created measurements, Symbol Search, and installed plugins at the $49.99 Founder price instead of the planned $99 standard price. Use Pro on up to 3 computers and try it risk-free with a 14-day money-back guarantee.'}
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
              <span className="paper-tape pricing-card-tape" aria-hidden="true" />
              <div className="plan-pill plan-pill-dark">Founder's License</div>
              <h2>{commercialOffer.name}</h2>
              <OfferPrice />
              {offer.founderAvailable ? (
                <MagneticLink
                  ref={checkoutCtaRef}
                  href="/buy/"
                  className="primary-btn full-width"
                  onClick={handleBuyClick}
                  aria-disabled={checkoutStatus === 'loading'}
                  aria-label={checkoutStatus === 'loading'
                    ? 'Opening Stripe checkout'
                    : `Checkout with Stripe — ${commercialOffer.price}. Planned standard price ${commercialOffer.referencePrice}.`}
                >
                  <Infinity aria-hidden="true" weight="bold" />
                  {checkoutStatus === 'loading'
                    ? 'Opening Stripe checkout…'
                    : <OfferButtonLabel action="Checkout with Stripe" />}
                </MagneticLink>
              ) : (
                <p className="plan-note offer-closed">{closedOfferMessage(offer.closedReason)}</p>
              )}
              {checkoutError && <p className="plan-note checkout-error">{checkoutError}</p>}
              {offer.founderAvailable && <OfferGuarantee compact inverse />}
              <ul className="plan-list buy-plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <CheckCircle aria-hidden="true" weight="bold" /> {feature}
                  </li>
                ))}
              </ul>

              {/* The three questions asked at the button, answered at the button. */}
              <ul className="buy-assurances">
                <li><ShieldCheck aria-hidden="true" weight="bold" /> Secure Stripe checkout. PolyPDF never sees your card details.</li>
                <li><EnvelopeSimple aria-hidden="true" weight="bold" /> {licenseDeliveryText}</li>
                <li><ArrowCounterClockwise aria-hidden="true" weight="bold" /> {refundSummaryText} <Link to="/refund/">Read the policy</Link>.</li>
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
              <span className="paper-tape buy-summary-tape" aria-hidden="true" />
              <div className="section-header">
                <div className="section-icon"><Lightning aria-hidden="true" weight="bold" /></div>
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
                    <li>The free app includes markup, review, calibration, and up to 3 hand-created measurements per document.</li>
                    <li>Pro removes the measurement limit and unlocks Symbol Search plus installed plugins on both Mac and Windows.</li>
                  </ul>
                  <div className="buy-actions buy-actions-quiet">
                    <a
                      href={primaryPlatform.url}
                      className="buy-download-link"
                      download
                      onClick={() => trackEvent('download_click', { source: 'buy_page', platform: primaryPlatform.key })}
                    >
                      <DownloadSimple aria-hidden="true" weight="bold" /> Prefer to test it first? Download free for {primaryPlatform.name}
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
                  <div className="section-icon"><Receipt aria-hidden="true" weight="bold" /></div>
                  <h2>What happens after checkout</h2>
                </div>
                <ActivationSteps heading={null} />
              </section>
            )}

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><ArrowCounterClockwise aria-hidden="true" weight="bold" /></div>
                <h2>Refund policy</h2>
              </div>
              <ul className="section-content">
                <li>Direct website purchases are processed by Stripe and include PolyPDF's 14-day money-back guarantee.</li>
                <li>Request a refund within 14 days of payment and PolyPDF will return the amount paid to the original payment method where possible.</li>
                <li>Refunded Pro licenses may be deactivated after the refund is completed.</li>
                <li><Link to="/refund/">Read the refund policy</Link> for request steps and legal rights.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><ShieldCheck aria-hidden="true" weight="bold" /></div>
                <h2>Private by design</h2>
              </div>
              <ul className="section-content">
                <li>Your PDFs stay on your computer unless you export or share them, including through a separate service you choose.</li>
                <li>Checkout and license records are used to process your purchase and keep Pro activated.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><EnvelopeSimple aria-hidden="true" weight="bold" /></div>
                <h2>Need help?</h2>
              </div>
              <p>Purchase, billing, and license questions can be sent to:</p>
              <div className="contact-info">
                <a href="mailto:support@polypdf.com" className="contact-link">
                  <EnvelopeSimple aria-hidden="true" weight="bold" /> support@polypdf.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </motion.main>

      {showStickyCheckout && offer.founderAvailable && checkoutStatus !== 'loading' && (
        <div className="buy-sticky-checkout" role="region" aria-label="Checkout">
          <button
            type="button"
            className="primary-btn offer-cta"
            onClick={handleBuyClick}
            aria-label={`Checkout with Stripe — ${commercialOffer.price}. Planned standard price ${commercialOffer.referencePrice}.`}
          >
            <LockKey aria-hidden="true" weight="bold" /> <OfferButtonLabel action="Checkout with Stripe" />
          </button>
        </div>
      )}

    </div>
  );
};

export default Buy;
