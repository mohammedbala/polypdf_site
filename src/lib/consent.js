export const CONSENT_KEY = 'polypdf.cookie-consent.v1';
export const CONSENT_VERSION = '2026-09-06';
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export const CONSENT_CHANGED = 'polypdf:consent-changed';
export const OPEN_COOKIE_SETTINGS = 'polypdf:cookie-settings';
let volatileChoice = null;

export const privacySignalEnabled = () => typeof navigator !== 'undefined' && (
  navigator.globalPrivacyControl === true || navigator.doNotTrack === '1'
);

export function readConsent() {
  if (typeof window === 'undefined') return null;
  let choice;
  try {
    choice = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null');
  } catch {
    choice = volatileChoice;
  }
  if (!choice || choice.version !== CONSENT_VERSION ||
      typeof choice.analytics !== 'boolean' || typeof choice.marketing !== 'boolean' ||
      !Number.isFinite(choice.savedAt) || choice.savedAt > Date.now() ||
      Date.now() - choice.savedAt >= CONSENT_MAX_AGE) return null;
  return privacySignalEnabled() ? { ...choice, analytics: false, marketing: false } : choice;
}

export const hasConsent = (category) => readConsent()?.[category] === true;

export function saveConsent({ analytics = false, marketing = false }) {
  const blocked = privacySignalEnabled();
  const choice = {
    version: CONSENT_VERSION, savedAt: Date.now(),
    analytics: !blocked && analytics === true,
    marketing: !blocked && marketing === true
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
    volatileChoice = null;
  } catch {
    // A blocked browser store must not prevent a choice for this page.
    volatileChoice = choice;
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED));
  return choice;
}

export function clearOptionalStorage({ analytics = false, marketing = false } = {}) {
  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (/^polypdf\.(ga4|ads)\.purchase\./.test(key)) {
        const timestamp = Number(window.localStorage.getItem(key));
        if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > Date.now() || Date.now() - timestamp >= 30 * 86400000) {
          window.localStorage.removeItem(key);
        }
      }
      if ((!marketing && key === 'polypdf.attribution.v1') ||
          (!analytics && key.startsWith('polypdf.ga4.purchase.')) ||
          (!marketing && key.startsWith('polypdf.ads.purchase.'))) {
        window.localStorage.removeItem(key);
      }
    });
  } catch { /* Browsing and checkout work without storage. */ }
  const names = document.cookie.split(';').map((cookie) => cookie.trim().split('=')[0]);
  const hosts = window.location.hostname.split('.');
  const domains = ['', ...hosts.map((_, i) => hosts.slice(i).join('.')).filter((host) => host.includes('.'))];
  const segments = window.location.pathname.split('/').filter(Boolean);
  const paths = ['/', ...segments.map((_, i) => `/${segments.slice(0, i + 1).join('/')}`)];
  names.filter((name) => (!analytics && /^(_ga(?:_|$)|_gid$|_gat)/.test(name)) ||
    (!marketing && /^(_gcl_|_gac_)/.test(name))).forEach((name) => {
    for (const domain of domains) for (const path of paths) {
      for (const suffix of ['', '/']) {
        document.cookie = `${name}=; Max-Age=0; Path=${path === '/' ? '/' : path + suffix};${domain ? ` Domain=${domain};` : ''} SameSite=Lax`;
      }
    }
  });
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
}
