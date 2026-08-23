export const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const PURCHASE_STORAGE_PREFIX = 'polypdf.ga4.purchase.v1.';
const OPENAI_ADS_PURCHASE_STORAGE_PREFIX = 'polypdf.openai-ads.order-created.v1.';
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

const alreadySent = (storageKey) => {
  try {
    return window.localStorage.getItem(storageKey) === 'sent';
  } catch {
    return false;
  }
};

const rememberSent = (storageKey) => {
  try {
    window.localStorage.setItem(storageKey, 'sent');
  } catch {
    // Provider-side event IDs remain the authoritative deduplication fallback.
  }
};

const trackGooglePurchase = (normalized) => {
  if (typeof window.gtag !== 'function') {
    return false;
  }

  const storageKey = `${PURCHASE_STORAGE_PREFIX}${normalized.transaction_id}`;
  if (alreadySent(storageKey)) {
    return false;
  }

  window.gtag('event', 'purchase', normalized);
  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_PURCHASE_DESTINATION,
    transaction_id: normalized.transaction_id,
    value: normalized.value,
    currency: normalized.currency
  });
  rememberSent(storageKey);
  return true;
};

const openAIContents = (normalized) => (normalized.items || []).map((item) => ({
  ...(typeof item?.item_id === 'string' && item.item_id.trim()
    ? { id: item.item_id.trim().slice(0, 255) }
    : {}),
  ...(typeof item?.item_name === 'string' && item.item_name.trim()
    ? { name: item.item_name.trim().slice(0, 255) }
    : {}),
  content_type: 'product',
  ...(Number.isSafeInteger(Number(item?.quantity)) && Number(item.quantity) > 0
    ? { quantity: Number(item.quantity) }
    : {}),
  ...(Number.isFinite(Number(item?.price)) && Number(item.price) >= 0
    ? { amount: Math.round(Number(item.price) * 100), currency: normalized.currency }
    : {})
}));

const trackOpenAIAdsPurchase = (normalized) => {
  if (typeof window.oaiq !== 'function') {
    return false;
  }

  const storageKey = `${OPENAI_ADS_PURCHASE_STORAGE_PREFIX}${normalized.transaction_id}`;
  if (alreadySent(storageKey)) {
    return false;
  }

  const contents = openAIContents(normalized);
  window.oaiq(
    'measure',
    'order_created',
    {
      type: 'contents',
      amount: Math.round(normalized.value * 100),
      currency: normalized.currency,
      ...(contents.length ? { contents } : {})
    },
    { event_id: normalized.transaction_id }
  );
  rememberSent(storageKey);
  return true;
};

export const trackVerifiedPurchase = (purchase) => {
  const normalized = normalizedPurchase(purchase);
  if (!normalized) {
    return false;
  }

  const googleSent = trackGooglePurchase(normalized);
  const openAIAdsSent = trackOpenAIAdsPurchase(normalized);
  return googleSent || openAIAdsSent;
};
