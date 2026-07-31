const STORAGE_KEY = 'polypdf.attribution.v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const KEYS = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const SAFE_VALUE = /^[a-z0-9][a-z0-9._~-]*$/;

const normalizeValue = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().slice(0, 80);
  return normalized && SAFE_VALUE.test(normalized) ? normalized : null;
};

export const normalizeAttribution = (input = {}) => {
  const attribution = {};
  KEYS.forEach((key) => {
    const value = normalizeValue(input[key]);
    if (value) attribution[key] = value;
  });
  return attribution;
};

const attributionFromSearch = (search = '') => {
  const params = new URLSearchParams(search);
  return normalizeAttribution(Object.fromEntries(KEYS.map((key) => [key, params.get(key)])));
};

const readStored = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored || !Number.isFinite(stored.capturedAt) || Date.now() - stored.capturedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return normalizeAttribution(stored.attribution);
  } catch {
    return {};
  }
};

export const captureAttribution = (search = window.location.search) => {
  const incoming = attributionFromSearch(search);
  const stored = readStored();
  if (Object.keys(incoming).length > 0) {
    const startsNewCampaign = KEYS.some((key) => key.startsWith('utm_') && incoming[key]);
    const attribution = startsNewCampaign ? incoming : { ...stored, ...incoming };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        attribution,
        capturedAt: Date.now()
      }));
    } catch {
      // Checkout still works when storage is unavailable.
    }
    return attribution;
  }
  return stored;
};

export const checkoutAttribution = (search = window.location.search) => {
  const attribution = captureAttribution(search);
  return {
    source: attribution.source || 'buy_page',
    utm_source: attribution.utm_source || 'website',
    utm_medium: attribution.utm_medium || 'owned',
    utm_campaign: attribution.utm_campaign || 'founder_launch',
    ...attribution
  };
};

export const buyPath = (source) => (
  `/buy?source=${encodeURIComponent(source)}`
);
