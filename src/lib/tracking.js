import routeMetadata from './route-metadata.json';
import { clearOptionalStorage, readConsent } from './consent';

export const GA_ID = 'G-533RWNRCFP';
export const ADS_ID = 'AW-449436603';
let active = { analytics: false, marketing: false };
let lastPage = '';

// Never send query strings, fragments, magic-link tokens, checkout session IDs or referrer paths.
export function safePageContext() {
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch { /* No referrer. */ }
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const safePath = routeMetadata[path] ? (path === '/' ? '/' : `${path}/`) : '/404/';
  return {
    page_location: window.location.origin + safePath,
    page_referrer: referrer,
    page_title: document.title
  };
}

export function syncTracking({ reload = () => window.location.reload() } = {}) {
  const choice = readConsent() || { analytics: false, marketing: false };
  clearOptionalStorage(choice);
  if ((active.analytics && !choice.analytics) || (active.marketing && !choice.marketing)) {
    // Removing a script element cannot unload its listeners. Stop dispatch immediately, then
    // reload with the saved restriction so no already-loaded provider code can keep running.
    window[`ga-disable-${GA_ID}`] = true;
    window.gtag = undefined;
    window.dataLayer = [];
    document.getElementById('polypdf-google-tag')?.remove();
    active = { analytics: false, marketing: false };
    lastPage = '';
    reload();
    return;
  }
  if (!choice.analytics && !choice.marketing) return;
  const isNew = !document.getElementById('polypdf-google-tag');
  if (isNew) {
    window.dataLayer = [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: choice.analytics ? 'granted' : 'denied',
      ad_storage: choice.marketing ? 'granted' : 'denied',
      ad_user_data: choice.marketing ? 'granted' : 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', false);
    window.gtag('set', safePageContext());
    window.gtag('js', new Date());
  } else {
    window.gtag('consent', 'update', {
      analytics_storage: choice.analytics ? 'granted' : 'denied',
      ad_storage: choice.marketing ? 'granted' : 'denied',
      ad_user_data: choice.marketing ? 'granted' : 'denied',
      ad_personalization: 'denied'
    });
  }
  if (choice.analytics && !active.analytics) {
    window[`ga-disable-${GA_ID}`] = false;
    window.gtag('config', GA_ID, {
      ...safePageContext(), send_page_view: false, cookie_expires: 60 * 60 * 24 * 180,
      cookie_update: false, allow_google_signals: false, allow_ad_personalization_signals: false
    });
  }
  if (choice.marketing && !active.marketing) {
    window.gtag('config', ADS_ID, { ...safePageContext(), send_page_view: false, allow_ad_personalization_signals: false });
  }
  active = { analytics: choice.analytics, marketing: choice.marketing };
  if (isNew) {
    const script = document.createElement('script');
    script.id = 'polypdf-google-tag';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${choice.analytics ? GA_ID : ADS_ID}`;
    document.head.appendChild(script);
  }
  const pathname = window.location.pathname;
  if (choice.analytics && pathname !== lastPage && !/^\/account(?:\/|$)/.test(pathname)) {
    window.gtag('event', 'page_view', { ...safePageContext(), send_to: GA_ID });
    lastPage = pathname;
  }
}
