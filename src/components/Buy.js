import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { HiOutlineCloudDownload, HiOutlineShieldCheck } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer, founderLimitText, founderRightsText } from '../lib/commercialOffer';

const proFeatures = [
  'Unlimited distance, area, perimeter, angle, count, and dimension measurements',
  `${commercialOffer.price} once with no subscription renewal`,
  'Use your license on up to 3 computers — Mac or Windows, in any mix',
  'Secure Stripe checkout with license delivery by email',
  'Every public PolyPDF 1.x update is included'
];

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const Buy = () => {
  const [checkoutStatus, setCheckoutStatus] = useState('ready');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBuyClick = async (event) => {
    event.preventDefault();
    trackEvent('buy_click', { provider: 'stripe', source: 'buy_page' });
    setCheckoutError('');
    setCheckoutStatus('loading');

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        if (payload.error === 'founder_offer_ended') {
          throw new Error('founder_offer_ended');
        }
        throw new Error(payload.error || 'checkout_unavailable');
      }
      trackEvent('checkout_started', { provider: 'stripe', source: 'buy_page' });
      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutStatus('ready');
      setCheckoutError(
        error instanceof Error && error.message === 'founder_offer_ended'
          ? 'The founder offer has ended. Checkout is temporarily closed while the next offer is prepared.'
          : 'Checkout could not load. Please refresh this page or contact support@polypdf.com.'
      );
    }
  };

  return (
    <div className="legal-page buy">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" />
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
              <FaLock /> Secure checkout · one license for Mac &amp; Windows
            </div>
            <h1>Buy PolyPDF Pro once. Measure without a subscription.</h1>
            <p>
              Unlock unlimited hand-created measurements for a one-time $49.99. Keep the free markup and
              review workflow, remove the measurement cap, and use your license on up to
              3 computers — Mac or Windows.
            </p>
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
              <ul className="plan-list">
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <FaCheckCircle /> {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/buy"
                className="primary-btn full-width"
                onClick={handleBuyClick}
                aria-disabled={checkoutStatus === 'loading'}
              >
                <FaInfinity /> {checkoutStatus === 'loading' ? 'Loading Secure Checkout...' : 'Continue to Secure Checkout'}
              </a>
              {checkoutError && <p className="plan-note checkout-error">{checkoutError}</p>}
              <p className="plan-note">{founderRightsText}</p>
              <p className="plan-note">{founderLimitText}</p>
              <p className="plan-note">Your license key is delivered by email after checkout.</p>
            </motion.section>

            <motion.section
              className="legal-section buy-summary"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <div className="section-header">
                <div className="section-icon"><FaBolt /></div>
                <h2>Before you buy</h2>
              </div>
              <ul className="section-content">
                <li>Download PolyPDF free first if you want to test it on real drawings.</li>
                <li>The free app includes markup and review tools, up to 3 hand-created measurements per document, and uncapped Visual Search auto-count.</li>
                <li>Pro removes the measurement limit on both Mac and Windows.</li>
              </ul>
              <div className="buy-actions">
                <a
                  href={primaryPlatform.url}
                  className="secondary-btn full-width"
                  download
                  onClick={() => trackEvent('download_click', { source: 'buy_page', platform: primaryPlatform.key })}
                >
                  <HiOutlineCloudDownload /> Download free first for {primaryPlatform.name}
                </a>
              </div>
            </motion.section>
          </div>

          <div className="buy-detail-grid">
            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><FaReceipt /></div>
                <h2>What happens after checkout</h2>
              </div>
              <ul className="section-content">
                <li>You receive a PolyPDF license key by email.</li>
                <li>Open PolyPDF on your Mac or Windows PC and enter the license key to unlock Pro.</li>
                <li>Contact support if your receipt or license email does not arrive.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><FaUndo /></div>
                <h2>Refund policy</h2>
              </div>
              <ul className="section-content">
                <li>Purchases are processed by Stripe and follow PolyPDF's refund policy.</li>
                <li>Unless required by law, transactions are generally non-refundable; discretionary refund requests may be reviewed within 14 days.</li>
                <li>Refunded Pro licenses may be deactivated after the refund is completed.</li>
                <li><Link to="/refund">Read the refund policy</Link> for request steps and legal rights.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-header">
                <div className="section-icon"><HiOutlineShieldCheck /></div>
                <h2>Private by design</h2>
              </div>
              <ul className="section-content">
                <li>Your PDFs stay on your computer unless you choose to export, share, or sync them.</li>
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

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/support">Support</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Buy;
