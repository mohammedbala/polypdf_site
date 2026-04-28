import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEnvelope,
  FaExternalLinkAlt,
  FaKey,
  FaLock,
  FaReceipt,
  FaSignOutAlt
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

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

  const notice = useMemo(() => {
    if (searchParams.get('checkout') === 'success') {
      return {
        tone: 'success',
        title: 'Purchase complete',
        body: 'Your license key is sent by email. Sign in with the checkout email to view purchase history and receipt links.'
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
        title: 'Sign-in link expired',
        body: 'Request a fresh link below. Magic links are intentionally short-lived.'
      };
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadAccount();
  }, []);

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
            <img src={parrotIcon} alt="PolyPDF" />
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
              Sign in with the email used at checkout to view your direct Mac purchase,
              receipt links, and activation status. License keys are still delivered by email.
            </p>
          </div>

          {notice && (
            <div className={`account-notice ${notice.tone}`}>
              <strong>{notice.title}</strong>
              <span>{notice.body}</span>
            </div>
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
                <button type="button" className="secondary-btn" onClick={logout}>
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>

              {account.licenses.length === 0 ? (
                <div className="account-empty">
                  <FaReceipt />
                  <h3>No purchases found</h3>
                  <p>Use the same email address entered at Stripe checkout, or contact support if your purchase is missing.</p>
                  <Link to="/buy" className="primary-btn">
                    Buy PolyPDF Pro
                  </Link>
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
                          <h3>PolyPDF Pro for Mac</h3>
                          <p>
                            License ending in <strong>{license.license_key_last4 || '----'}</strong>
                            {' '}created {dateFormatter(license.created_at)}
                          </p>
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
                  <h2>Email sign-in link</h2>
                </div>
                <p>
                  Enter the email used at Stripe checkout. If it has PolyPDF purchases,
                  you will receive a short-lived sign-in link.
                </p>
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

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/buy">Buy</Link>
              <Link to="/support">Support</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Account;
