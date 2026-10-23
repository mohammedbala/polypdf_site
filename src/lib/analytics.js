import { hasConsent } from './consent';
import { ADS_PURCHASE_DESTINATION, GA_ID, safeAdsPageContext, safePageContext } from './tracking';

// Keep events content-free even if a future caller passes form or URL data by mistake.
const SAFE_PROPERTIES = new Set(['source', 'platform', 'page_variant', 'offer_id', 'app_version', 'provider', 'reason', 'feature', 'section', 'target', 'position']);
export const trackEvent = (name, properties = {}) => {
  if (!hasConsent('analytics') || typeof window.gtag !== 'function') return false;
  if (!/^[a-z][a-z0-9_]{0,60}$/.test(name)) return false;
  const safe = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SAFE_PROPERTIES.has(key) && (typeof value === 'number' ||
        (typeof value === 'string' && /^[a-z0-9._~-]{1,100}$/i.test(value)))) safe[key] = value;
  }
  window.gtag('event', name, { ...safe, ...safePageContext(), send_to: GA_ID });
  return true;
};

const DEDUPE_AGE = 30 * 24 * 60 * 60 * 1000;
const normalizedPurchase = (purchase) => {
  if (purchase?.status !== 'paid' || typeof purchase.value !== 'number') return null;
  const transactionID = typeof purchase?.transaction_id === 'string' ? purchase.transaction_id.trim() : '';
  const value = Number(purchase?.value);
  const currency = typeof purchase?.currency === 'string' ? purchase.currency.trim().toUpperCase() : '';
  if (!/^[a-z0-9_-]{1,255}$/i.test(transactionID) || !Number.isFinite(value) || value <= 0 || !/^[A-Z]{3}$/.test(currency)) return null;
  // Use only the first-party payment record's Stripe price identity. Never label all current
  // purchases as the retired Founder offer, or forward arbitrary item strings to analytics.
  const verifiedItem = purchase?.items?.[0];
  const priceID = typeof verifiedItem?.item_id === 'string' && /^price_[a-z0-9]{1,80}$/i.test(verifiedItem.item_id)
    ? verifiedItem.item_id : 'polypdf_pro';
  const itemName = verifiedItem?.item_name === "PolyPDF Pro Founder's License"
    ? "PolyPDF Pro Founder's License" : 'PolyPDF Pro';
  return {
    transaction_id: transactionID, value, currency,
    items: [{ item_id: priceID, item_name: itemName, price: value, quantity: 1 }]
  };
};

const alreadySent = (key) => {
  try {
    const timestamp = Number(window.localStorage.getItem(key));
    return timestamp > 0 && timestamp <= Date.now() && Date.now() - timestamp < DEDUPE_AGE;
  } catch { return false; }
};
const rememberSent = (key) => {
  try {
    for (const storedKey of Object.keys(window.localStorage)) {
      if (/^polypdf\.(ga4|ads)\.purchase\./.test(storedKey) && !alreadySent(storedKey)) window.localStorage.removeItem(storedKey);
    }
    window.localStorage.setItem(key, String(Date.now()));
  } catch { /* Provider transaction IDs remain the deduplication fallback. */ }
};

// Call only with the first-party API's webhook-verified response, never from URL parameters.
export const trackVerifiedPurchase = (purchase) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  const normalized = normalizedPurchase(purchase);
  if (!normalized) return false;
  let sent = false;
  const providers = [
    { category: 'analytics', prefix: 'polypdf.ga4.purchase.v2.', event: 'purchase', destination: GA_ID, context: safePageContext },
    { category: 'marketing', prefix: 'polypdf.ads.purchase.v2.', event: 'conversion', destination: ADS_PURCHASE_DESTINATION, context: safeAdsPageContext }
  ];
  for (const provider of providers) {
    if (!hasConsent(provider.category)) continue;
    const key = provider.prefix + normalized.transaction_id;
    if (alreadySent(key)) continue;
    window.gtag('event', provider.event, {
      ...normalized, ...provider.context(), send_to: provider.destination
    });
    rememberSent(key);
    sent = true;
  }
  return sent;
};
