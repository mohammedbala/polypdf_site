import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaDownload,
  FaEnvelope,
  FaExternalLinkAlt,
  FaKey,
  FaLock,
  FaReceipt,
  FaSignOutAlt
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';
import ActivationSteps from './ActivationSteps';
import { DownloadBoth } from './DownloadCTA';
import { usePlatform } from '../lib/platform';
import { licenseDeliveryText, licensePolicyLabel } from '../lib/commercialOffer';
import { trackVerifiedPurchase } from '../lib/analytics';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};


const currencyFormatter = (amount, currency) => {
  if (typeof amount !== 'number' || !currency) {
    return null;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100);
};

const dateFormatter = (value) => {
  if (!value) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
};

const statusLabel = (status) => {
  if (!status) {
    return 'Unknown';
  }
  return status.replace(/_/g, ' ');
};

const Account = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [requestStatus, setRequestStatus] = useState('idle');
  const [requestMessage, setRequestMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { primaryPlatform } = usePlatform();

  const justPurchased = searchParams.get('checkout') === 'success';
  const checkoutSessionID = searchParams.get('session_id');

  const notice = useMemo(() => {
    if (justPurchased) {
      return {
        tone: 'success',
        title: 'Payment complete',
        body: 'Nothing else is required to unlock Pro — your license key is on its way by email.'
      };
    }
    if (searchParams.get('login') === 'success') {
      return {
        tone: 'success',
        title: 'Signed in',
        body: 'Your PolyPDF account session is active on this browser.'
      };
    }
    if (searchParams.get('login') === 'expired') {
      return {
        tone: 'warning',
        title: 'That sign-in link is no longer valid',
        body: 'Links last one hour and can be used once. Request a fresh one below — it will open a page asking you to confirm before you are signed in.'
      };
    }
    return null;
  }, [searchParams, justPurchased]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadAccount();
  }, []);

  useEffect(() => {
    if (!justPurchased || !checkoutSessionID) {
      return undefined;
    }

    const controller = new AbortController();
    let retryTimer;
    let attempts = 0;
    const maxAttempts = 12;

    const loadVerifiedPurchase = async () => {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/checkout/conversion?session_id=${encodeURIComponent(checkoutSessionID)}`,
          {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }
        );

        if (response.status === 202 && attempts < maxAttempts) {
          retryTimer = window.setTimeout(loadVerifiedPurchase, 1500);
          return;
        }
        if (!response.ok) {
          return;
        }

        const purchase = await response.json();
        trackVerifiedPurchase(purchase);
      } catch (error) {
        if (error?.name !== 'AbortError' && attempts < maxAttempts) {
          retryTimer = window.setTimeout(loadVerifiedPurchase, 1500);
        }
      }
    };

    loadVerifiedPurchase();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [checkoutSessionID, justPurchased]);

  const loadAccount = async () => {
    setLoadingAccount(true);
    try {
      const response = await fetch('/api/account/me', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.authenticated) {
        setAccount(payload);
      } else {
        setAccount(null);
      }
    } catch (error) {
      setErrorMessage('Account status could not be loaded. Please refresh this page.');
    } finally {
      setLoadingAccount(false);
    }
  };

  const requestMagicLink = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setRequestMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMessage('Enter the email address used at checkout.');
      return;
    }

    setRequestStatus('loading');
    try {
      const response = await fetch('/api/account/magic-link', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'magic_link_failed');
      }
      setRequestMessage(payload.message || 'If that email has PolyPDF purchases, a sign-in link has been sent.');
      setRequestStatus('sent');
    } catch (error) {
      setRequestStatus('idle');
      setErrorMessage('The sign-in email could not be sent. Please contact support@polypdf.com.');
    }
  };

  const logout = async () => {
    await fetch('/api/account/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }).catch(() => {});
    setAccount(null);
  };

  return (
    <div className="legal-page account">
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
        className="legal-content account-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="account-hero">
            <div className="hero-badge">
              <FaLock /> Purchase history and license status
            </div>
            <h1>PolyPDF Account</h1>
            <p>
              {justPurchased
                ? 'Your license key is emailed to you — nothing on this page is needed to unlock Pro. Sign in whenever you want your receipt, invoice, and activation count.'
                : 'Sign in with the email used at checkout to view your PolyPDF purchase, receipt links, and activation status. License keys are still delivered by email.'}
            </p>
          </div>

          {notice && (
            <div className={`account-notice ${notice.tone}`}>
              <strong>{notice.title}</strong>
              <span>{notice.body}</span>
            </div>
          )}

          {/* Stripe returns every buyer here. Before, the first thing they met was a sign-in form
              for a session they did not have — a second authentication flow whose only purpose is
              receipts, at the ninety seconds when a customer is deciding whether the purchase was
              safe. The answer to "where is my key and what do I do with it?" now comes first. */}
          {justPurchased && (
            <section className="account-panel purchase-next">
              <div className="section-header">
                <div className="section-icon"><FaKey /></div>
                <h2>What to do next</h2>
              </div>
              <ActivationSteps heading={null} />
              <p className="account-aside">{licenseDeliveryText}</p>
              <div className="sign-in-download">
                <DownloadBoth source="checkout_success" />
              </div>
            </section>
          )}

          {loadingAccount ? (
            <div className="account-panel">
              <div className="account-skeleton wide" />
              <div className="account-skeleton" />
              <div className="account-skeleton short" />
            </div>
          ) : account ? (
            <section className="account-panel">
              <div className="account-panel-header">
                <div>
                  <p className="account-kicker">Signed in as</p>
                  <h2>{account.email}</h2>
                </div>
                <div className="account-panel-actions">
                  <a
                    href={primaryPlatform.url}
                    className="secondary-btn"
                    download
                    onClick={() => trackEvent('download_click', { source: 'account_header', platform: primaryPlatform.key })}
                  >
                    <FaDownload /> Download for {primaryPlatform.name}
                  </a>
                  <button type="button" className="secondary-btn" onClick={logout}>
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              </div>

              {account.licenses.length === 0 ? (
                <div className="account-empty">
                  <FaReceipt />
                  <h3>No purchases found</h3>
                  <p>Use the same email address entered at Stripe checkout, or contact support if your purchase is missing.</p>
                  <div className="account-empty-actions">
                    <a
                      href={primaryPlatform.url}
                      className="secondary-btn"
                      download
                      onClick={() => trackEvent('download_click', { source: 'account_empty', platform: primaryPlatform.key })}
                    >
                      <FaDownload /> Download for {primaryPlatform.name}
                    </a>
                    <Link to="/buy/" className="primary-btn">
                      Buy PolyPDF Pro
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="license-list">
                  {account.licenses.map((license) => {
                    const amount = currencyFormatter(license.payment?.amount_total, license.payment?.currency);
                    return (
                      <article className="license-row" key={license.id}>
                        <div className="license-row-main">
                          <div className={`license-status ${license.status || 'unknown'}`}>
                            <FaCheckCircle /> {statusLabel(license.status)}
                          </div>
                          <h3>PolyPDF Pro</h3>
                          <p>
                            License ending in <strong>{license.license_key_last4 || '----'}</strong>
                            {' '}created {dateFormatter(license.created_at)}
                          </p>
                          <p>{licensePolicyLabel(license)}</p>
                        </div>
                        <div className="license-metrics">
                          <div>
                            <span>Activations</span>
                            <strong>{license.activations_used} / {license.activation_limit}</strong>
                          </div>
                          <div>
                            <span>Payment</span>
                            <strong>{amount || statusLabel(license.payment?.status)}</strong>
                          </div>
                        </div>
                        <div className="license-actions">
                          <DownloadBoth source="account_license" />
                          {license.payment?.receipt_url && (
                            <a href={license.payment.receipt_url} target="_blank" rel="noreferrer">
                              Receipt <FaExternalLinkAlt />
                            </a>
                          )}
                          {license.payment?.invoice_url && (
                            <a href={license.payment.invoice_url} target="_blank" rel="noreferrer">
                              Invoice <FaExternalLinkAlt />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="account-panel sign-in-panel">
              <div>
                <div className="section-header">
                  <div className="section-icon"><FaKey /></div>
                  <h2>{justPurchased ? 'Receipts and invoices (optional)' : 'Email sign-in link'}</h2>
                </div>
                <p>
                  {justPurchased
                    ? 'Activation does not need an account. Sign in only if you want your receipt, invoice, and activation count — enter the email used at Stripe checkout.'
                    : 'Enter the email used at Stripe checkout. If it has PolyPDF purchases, you will receive a short-lived sign-in link.'}
                </p>
                {/* The just-purchased panel above already offers both builds; repeating them here
                    would put four download buttons on one screen. */}
                {!justPurchased && (
                  <div className="sign-in-download">
                    <DownloadBoth source="account_signin" />
                  </div>
                )}
              </div>

              <form className="account-form" onSubmit={requestMagicLink}>
                <label htmlFor="account-email">Checkout email</label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <button type="submit" className="primary-btn" disabled={requestStatus === 'loading'}>
                  <FaEnvelope /> {requestStatus === 'loading' ? 'Sending Link...' : 'Send Sign-In Link'}
                </button>
              </form>

              {requestMessage && <p className="account-message success">{requestMessage}</p>}
              {errorMessage && <p className="account-message error">{errorMessage}</p>}
            </section>
          )}
        </div>
      </motion.main>

    </div>
  );
};

export default Account;
