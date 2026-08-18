export const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const PURCHASE_STORAGE_PREFIX = 'polypdf.ga4.purchase.v1.';
const GOOGLE_ADS_PURCHASE_DESTINATION = 'AW-449436603/xb7JCMbVseMcELu3p9YB';

const normalizedPurchase = (purchase) => {
  const transactionID = typeof purchase?.transaction_id === 'string'
    ? purchase.transaction_id.trim().slice(0, 255)
    : '';
  const value = Number(purchase?.value);
  const currency = typeof purchase?.currency === 'string'
    ? purchase.currency.trim().toUpperCase()
    : '';
  if (!transactionID || !Number.isFinite(value) || value < 0 || !/^[A-Z]{3}$/.test(currency)) {
    return null;
  }

  return {
    transaction_id: transactionID,
    value,
    currency,
    ...(Array.isArray(purchase.items) ? { items: purchase.items } : {})
  };
};

export const trackVerifiedPurchase = (purchase) => {
  const normalized = normalizedPurchase(purchase);
  if (!normalized || typeof window.gtag !== 'function') {
    return false;
  }

  const storageKey = `${PURCHASE_STORAGE_PREFIX}${normalized.transaction_id}`;
  try {
    if (window.localStorage.getItem(storageKey) === 'sent') {
      return false;
    }
  } catch {
    // GA4 also deduplicates repeated purchase events by transaction_id when storage is blocked.
  }

  window.gtag('event', 'purchase', normalized);
  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_PURCHASE_DESTINATION,
    transaction_id: normalized.transaction_id,
    value: normalized.value,
    currency: normalized.currency
  });
  try {
    window.localStorage.setItem(storageKey, 'sent');
  } catch {
    // The conversion has already been queued; storage is only an additional local dedupe layer.
  }
  return true;
};
