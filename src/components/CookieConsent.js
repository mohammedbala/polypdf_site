import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  CONSENT_CHANGED, CONSENT_KEY, CONSENT_MAX_AGE, OPEN_COOKIE_SETTINGS,
  privacySignalEnabled, readConsent, saveConsent
} from '../lib/consent';
import { syncTracking } from '../lib/tracking';
import { captureAttribution } from '../lib/attribution';
import './PrivacyControls.css';

export default function CookieConsent() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialog = useRef(null);
  const banner = useRef(null);
  const signal = ready && privacySignalEnabled();

  useEffect(() => {
    let timer;
    const update = () => {
      const current = readConsent();
      setChoice(current);
      setReady(true);
      syncTracking();
      if (current?.marketing) captureAttribution();
      clearTimeout(timer);
      if (current) timer = setTimeout(update,
        Math.min(2147483647, Math.max(1, current.savedAt + CONSENT_MAX_AGE - Date.now())));
    };
    const storageChanged = (event) => {
      if (event.key === CONSENT_KEY || event.key === null) update();
    };
    const show = () => {
      const current = readConsent();
      setAnalytics(current?.analytics || false);
      setMarketing(current?.marketing || false);
      setOpen(true);
    };
    update();
    window.addEventListener(CONSENT_CHANGED, update);
    window.addEventListener(OPEN_COOKIE_SETTINGS, show);
    window.addEventListener('storage', storageChanged);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CONSENT_CHANGED, update);
      window.removeEventListener(OPEN_COOKIE_SETTINGS, show);
      window.removeEventListener('storage', storageChanged);
      document.removeEventListener('visibilitychange', update);
    };
  }, [pathname]);

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  useEffect(() => {
    if (!ready || choice || !banner.current) return;
    const element = banner.current;
    const updateHeight = () => document.documentElement.style.setProperty(
      '--cookie-bar-height', `${Math.ceil(element.getBoundingClientRect().height)}px`
    );
    updateHeight();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateHeight);
    observer?.observe(element);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.removeProperty('--cookie-bar-height');
    };
  }, [ready, choice]);

  const save = (next) => {
    setOpen(false);
    saveConsent(next);
  };
  const show = () => {
    setAnalytics(choice?.analytics || false);
    setMarketing(choice?.marketing || false);
    setOpen(true);
  };
  const buttons = (compact = false) => <>
    <button type="button" aria-label="Reject optional cookies" onClick={() => save({})}>{compact ? 'Reject' : 'Reject optional cookies'}</button>
    <button type="button" aria-label="Accept optional cookies" onClick={() => save({ analytics: true, marketing: true })} disabled={signal}>{compact ? 'Accept' : 'Accept optional cookies'}</button>
  </>;
  return <>
    {ready && !choice && <aside className="cookie-banner" ref={banner} aria-label="Cookie choices">
      <div className="container cookie-banner-inner">
        <p className="cookie-banner-copy">{signal
          ? 'Your browser privacy signal keeps optional tracking off.'
          : 'Google cookies measure visits and ad results, only with your permission.'}{' '}<Link to="/cookies/" aria-label="Cookie details">Details</Link></p>
        <div className="cookie-banner-actions">{buttons(true)}<button type="button" className="cookie-banner-settings" aria-label="Cookie settings" onClick={show}>Settings</button></div>
      </div>
    </aside>}
    <dialog className="privacy-dialog" ref={dialog} aria-labelledby="cookie-settings-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <h2 id="cookie-settings-title">Cookie settings</h2>
      <p>Choose how this browser shares information. You can change your choice here at any time.</p>
      <p><strong>Necessary:</strong> remembering these choices, secure account sign-in, and payment functions you request. Always available.</p>
      {signal && <p role="status">Your Global Privacy Control or Do Not Track signal keeps optional tracking off, including advertising sharing.</p>}
      <label className="privacy-option"><input type="checkbox" checked={analytics && !signal} disabled={signal} onChange={(event) => setAnalytics(event.target.checked)} /><span><strong>Analytics</strong>Google Analytics receives browser and visit information and, after a verified payment, order ID, value, currency and product. No email address or license key is included.</span></label>
      <label className="privacy-option"><input type="checkbox" checked={marketing && !signal} disabled={signal} onChange={(event) => setMarketing(event.target.checked)} /><span><strong>Advertising measurement</strong>Google Ads receives browser and verified order information to measure advertising results. PolyPDF also remembers campaign codes for 30 days. Ad personalization is disabled.</span></label>
      <p><Link to="/cookies/" onClick={() => setOpen(false)}>Cookie details and durations</Link> · <Link to="/privacy/" onClick={() => setOpen(false)}>Privacy policy and your rights</Link></p>
      <div className="privacy-actions">{buttons()}<button type="button" onClick={() => save({ analytics, marketing })}>Save choices</button><button type="button" onClick={() => setOpen(false)}>Close without saving</button></div>
      <p className="privacy-small">Changing a previously allowed category to off reloads this page to stop already loaded tracking. If browser storage is blocked, your choice lasts for this page only.</p>
    </dialog>
  </>;
}
