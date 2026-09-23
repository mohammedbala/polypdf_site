import { useCheckoutReview } from './CheckoutReview';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
  ShieldCheck
} from '@phosphor-icons/react';
import parrotIcon from '../assets/polypdf_icon-96.png';
import ActivationSteps from './ActivationSteps';
import { detectPlatform, usePlatform } from '../lib/platform';
import {
  commercialOffer,
  licenseRightsText,
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
import PlanComparison from './PlanComparison';
import { isEduEmail, loadStudentEligibility, requestStudentVerification } from '../lib/studentOffer';

const proFeatures = [
  'Unlimited measurements, with quantities tied to your drawings',
  'PDF content editing, preset and custom toolsets, and colored overlays',
  'Symbol Search automatic counting',
  'Installed plugins, including PDF Maps and Professional Seal Maker',
  'Create, update, reconcile, and publish Revision Packages',
  'Every public PolyPDF 1.x update included'
];

// The desktop app opens this page with source= and utm_source= already set
// (apps/desktop/src/renderer/dialogs/license-dialogs.ts). Those visitors are the highest-intent
// traffic the business gets — they installed PolyPDF, used it on real drawings, and hit a wall —
// and until now they landed on a page whose second panel told them to download the app they had
// open behind the browser. Reading the parameter that was already in the URL fixes that.
const IN_APP_SOURCES = new Set(['free_measurement_limit', 'visual_search_auto_count', 'plugins', 'pdf_editing', 'toolsets', 'overlay', 'license_window']);

// Why they clicked, when the app told us. Named plainly — the visitor already knows what happened;
// pretending otherwise is what makes a paywall page feel like a sales page.
const IN_APP_CONTEXT = {
  pdf_editing: {
    kicker: 'PDF content editing requires PolyPDF Pro',
    lede: `Edit existing PDF text and images with PolyPDF Pro for ${commercialOffer.price} once. The same license unlocks toolsets, overlays, and every other Pro workflow on up to 3 Mac or Windows computers.`
  },
  toolsets: {
    kicker: 'Place preset tools with PolyPDF Pro',
    lede: `Browse every preset in the free app. Pro unlocks placement from preset and custom toolsets, plus PDF content editing and overlays, for ${commercialOffer.price} once on up to 3 Mac or Windows computers.`
  },
  overlay: {
    kicker: 'Compare PDF revisions with PolyPDF Pro',
    lede: `Compare revisions with colored PDF overlays for ${commercialOffer.price} once. The same Pro license unlocks PDF content editing, preset and custom toolsets, and every other Pro workflow on up to 3 Mac or Windows computers.`
  },
  free_measurement_limit: {
    kicker: 'You have used the 3 free measurements in this document',
    lede: 'The free app includes markup, calibration, review, 3 hand-created measurements per document, and Revision Package viewing. Pro removes that cap and unlocks Symbol Search, plugins, and Revision Package changes and publishing for good for $74.95 once, backed by a 14-day money-back guarantee.'
  },
  visual_search_auto_count: {
    kicker: 'Symbol Search is a PolyPDF Pro workflow',
    lede: 'Pro unlocks the complete Symbol Search workflow: capture one example, review matching candidates, and commit the accepted set as one linked Count series. The same license also removes the 3-measurement cap and unlocks installed plugins plus Revision Package changes and publishing.'
  },
  plugins: {
    kicker: 'Plugins are available with PolyPDF Pro',
    lede: 'Pro unlocks installed plugin workflows for PDF Maps, professional seals, and packages you install yourself. The same license also removes the 3-measurement cap and unlocks Symbol Search plus Revision Package changes and publishing.'
  },
  license_window: {
    kicker: 'Upgrade to PolyPDF Pro',
    lede: 'Unlock unlimited hand-created measurements, Symbol Search, installed plugins, and Revision Package changes and publishing on up to 3 computers for $74.95 once. No subscription, no renewal, and a 14-day money-back guarantee.'
  }
};

export { isSecureStripeCheckoutUrl };

const Buy = ({ forceInApp = false }) => {
  const [searchParams] = useSearchParams();
  const reviewCheckout = useCheckoutReview();
  const [checkoutStatus, setCheckoutStatus] = useState('ready');
  const [checkoutError, setCheckoutError] = useState('');
  const [showStickyCheckout, setShowStickyCheckout] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentEligible, setStudentEligible] = useState(false);
  const [studentOfferAvailable, setStudentOfferAvailable] = useState(null);
  const [studentRequestStatus, setStudentRequestStatus] = useState('idle');
  const checkoutCtaRef = useRef(null);
  const offer = useCommercialOffer();
  const { primaryPlatform } = usePlatform();
  const detectedPlatformKey = detectPlatform() || 'mac';

  const source = searchParams.get('source') || '';
  const cameFromApp =
    forceInApp || searchParams.get('utm_source') === 'desktop_app' || IN_APP_SOURCES.has(source);
  const context = IN_APP_CONTEXT[source] || IN_APP_CONTEXT.license_window;
  const cancelled = searchParams.get('checkout') === 'cancelled';
  const pageVariant = cameFromApp ? 'in_app' : 'cold';
  const funnelProperties = {
    source: source || (cameFromApp ? 'desktop_app' : 'buy_page'),
    page_variant: pageVariant,
    platform: detectedPlatformKey,
    offer_id: commercialOffer.id,
    app_version: siteRelease.version
  };

  useEffect(() => {
    let cancelled = false;
    loadStudentEligibility().then(({ eligible, available }) => {
      if (!cancelled) {
        setStudentEligible(eligible);
        setStudentOfferAvailable(available);
      }
    }).catch(() => { if (!cancelled) setStudentOfferAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const attribution = captureAttribution();
    const properties = {
      source: attribution.source || (cameFromApp ? source || 'desktop_app' : 'buy_page'),
      page_variant: pageVariant,
      platform: detectedPlatformKey,
      offer_id: commercialOffer.id,
      app_version: siteRelease.version
    };
    trackEvent('buy_page_view', properties);
    if (cancelled) trackEvent('checkout_cancelled', properties);
  }, [cameFromApp, cancelled, detectedPlatformKey, pageVariant, source]);

  useEffect(() => {
    const target = checkoutCtaRef.current;
    if (!target || !offer.available || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyCheckout(!entry.isIntersecting);
    }, { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [offer.available]);

  const handleBuyClick = async (event, position = 'main') => {
    event.preventDefault();
    if (checkoutStatus === 'loading') return;
    const attribution = checkoutAttribution();
    const properties = { ...funnelProperties, source: attribution.source, provider: 'stripe', position };
    trackEvent('buy_click', properties);
    trackEvent('checkout_click', properties);
    setCheckoutError('');
    setCheckoutStatus('loading');

    try {
      const agreement = await reviewCheckout();
      if (!agreement) {
        trackEvent('checkout_review_cancelled', properties);
        setCheckoutStatus('ready');
        return;
      }
      const checkoutUrl = await createStripeCheckoutSession(attribution, undefined, agreement);
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
          ? 'Founder offer complete. Refresh this page to view the current Pro offer.'
          : 'Checkout could not load. Please refresh this page or contact support@polypdf.com.'
      );
    }
  };

  const handleStudentVerification = async (event) => {
    event.preventDefault();
    if (!isEduEmail(studentEmail)) {
      setStudentRequestStatus('invalid');
      return;
    }
    setStudentRequestStatus('sending');
    try {
      await requestStudentVerification(studentEmail);
      setStudentRequestStatus('sent');
    } catch {
      setStudentRequestStatus('failed');
    }
  };

  return (
    <div className="legal-page buy">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="96" height="96" />
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
            <span className="section-kicker">PolyPDF Pro</span>
            <h1>
              {cameFromApp
                ? 'Keep working. Unlock Pro once.'
                : 'Your full drawing toolkit. One payment.'}
            </h1>
            <p>
              {studentOfferAvailable && studentEligible
                ? 'Measure without limits, edit PDF content, use toolsets and overlays, and manage drawing revisions. Your verified .edu email gets 50% off the regular $74.95 Pro price for use on up to 3 Mac or Windows computers.'
                : cameFromApp
                  ? context.lede
                  : 'Measure without limits, edit PDF content, use toolsets and overlays, and manage drawing revisions. Get PolyPDF Pro for $74.95 once on up to 3 Mac or Windows computers.'}
            </p>
            {cancelled && (
              <p className="buy-cancelled">
                Checkout was cancelled and nothing was charged. The free app keeps working exactly as it did.
              </p>
            )}
            <section className="buy-student-offer" aria-labelledby="buy-student-title">
              <h2 id="buy-student-title">Student price: 50% off</h2>
              {studentOfferAvailable === null ? (
                <p role="status">Checking student pricing…</p>
              ) : !studentOfferAvailable ? (
                <p role="status">Student verification is temporarily unavailable. Please check back soon or contact support@polypdf.com.</p>
              ) : studentEligible ? (
                <p role="status">Your .edu email is verified. Your discount will be applied in Stripe before you pay.</p>
              ) : (
                <>
                  <p>Have a .edu email? Verify it to get 50% off the regular Pro price.</p>
                  <form onSubmit={handleStudentVerification}>
                    <label htmlFor="buy-student-email">School email</label>
                    <div className="buy-student-form-row">
                      <input id="buy-student-email" type="email" autoComplete="email" required
                        value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)}
                        placeholder="you@school.edu" />
                      <button type="submit" disabled={studentRequestStatus === 'sending'}>
                        {studentRequestStatus === 'sending' ? 'Sending…' : 'Verify .edu email'}
                      </button>
                    </div>
                  </form>
                  {studentRequestStatus === 'sent' && <p role="status">Check your school inbox for a sign-in link. Confirm it to return here with the discount ready.</p>}
                  {studentRequestStatus === 'invalid' && <p role="alert">Enter an email ending in .edu.</p>}
                  {studentRequestStatus === 'failed' && <p role="alert">We could not send the link. Please try again or contact support@polypdf.com.</p>}
                </>
              )}
            </section>
          </div>

          <div className="buy-grid">
            <motion.section
              className="pricing-card pricing-card-pro buy-plan"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <span className="paper-tape pricing-card-tape" aria-hidden="true" />
              <div className="plan-pill plan-pill-dark">Pro license</div>
              <h2>{commercialOffer.name}</h2>
              <OfferPrice regularPrice={studentOfferAvailable && studentEligible} />
              {studentOfferAvailable && studentEligible && <p className="buy-student-ready">Verified .edu student discount: 50% off at checkout.</p>}
              <p className="buy-tax-note">Applicable taxes and your final total appear in Stripe before you pay.</p>
              {offer.available ? (
                <MagneticLink
                  ref={checkoutCtaRef}
                  href="/buy/"
                  className="primary-btn full-width"
                  onClick={handleBuyClick}
                  aria-disabled={checkoutStatus === 'loading'}
                  aria-busy={checkoutStatus === 'loading'}
                >
                  <Infinity aria-hidden="true" weight="bold" />
                  {checkoutStatus === 'loading'
                    ? 'Opening Stripe checkout…'
                    : <OfferButtonLabel action="Checkout with Stripe"
                        discountPercent={studentOfferAvailable && studentEligible ? 50 : undefined} />}
                </MagneticLink>
              ) : (
                <p className="plan-note offer-closed">{closedOfferMessage(offer.closedReason)}</p>
              )}
              {checkoutError && <p className="plan-note checkout-error" role="alert">{checkoutError}</p>}
              {offer.available && <OfferGuarantee compact inverse />}
              <dl className="buy-facts">
                <div><dt>Computers</dt><dd>Up to 3</dd></div>
                <div><dt>Subscription</dt><dd>None</dd></div>
                <div><dt>Updates included</dt><dd>All 1.x</dd></div>
              </dl>
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

              <p className="plan-note">{licenseRightsText}</p>
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
                <h2>{cameFromApp ? 'After you pay' : 'Built for the full drawing workflow'}</h2>
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
                  <ul className="section-content buy-decision-copy">
                    <li><strong>Take off a complete set.</strong> Keep measuring after the 3 free hand-created measurements in each document.</li>
                    <li><strong>Work through revisions.</strong> Use colored overlays, edit PDF content, and create or publish Revision Packages.</li>
                    <li><strong>Reuse your tools.</strong> Place preset and custom toolsets, count with Symbol Search, and run installed plugins.</li>
                  </ul>
                  <p className="buy-aside">The free app keeps markup, review, calibration, and Revision Package viewing available with no trial timer.</p>
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

          {!cameFromApp && <PlanComparison />}

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

      {showStickyCheckout && offer.available && checkoutStatus !== 'loading' && (
        <div className="buy-sticky-checkout" role="region" aria-label="Checkout">
          <button
            type="button"
            className="primary-btn offer-cta"
            onClick={(event) => handleBuyClick(event, 'sticky')}
          >
            <LockKey aria-hidden="true" weight="bold" /> <OfferButtonLabel action="Checkout with Stripe"
              discountPercent={studentOfferAvailable && studentEligible ? 50 : undefined} />
          </button>
        </div>
      )}

    </div>
  );
};

export default Buy;
