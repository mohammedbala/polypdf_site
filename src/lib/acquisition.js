import { hasConsent } from './consent';
import { canonicalAnalyticsPath } from './analyticsPath';

const STORAGE_KEY = 'polypdf.analytics-visit.v1';
const MAX_IDLE_MS = 30 * 60 * 1000;
const AI = {
  'chatgpt.com': 'chatgpt', 'chat.openai.com': 'chatgpt',
  'perplexity.ai': 'perplexity', 'claude.ai': 'claude',
  'gemini.google.com': 'gemini', 'copilot.microsoft.com': 'copilot'
};
const TAGGED_AI = { ...AI, chatgpt: 'chatgpt', perplexity: 'perplexity', claude: 'claude', gemini: 'gemini', copilot: 'copilot' };
const GOOGLE = new Set(['com', 'co.uk', 'co.in', 'de', 'fr', 'es', 'com.br', 'ca', 'com.au', 'co.jp', 'co.il', 'co.id', 'co.th', 'co.kr', 'pl', 'nl', 'se', 'com.tr', 'com.ua'].map(tld => 'google.' + tld));
const SOURCES = {
  ai_referral: ['chatgpt', 'perplexity', 'claude', 'gemini', 'copilot'],
  google_referral: ['google'], other_referral: ['other'],
  campaign: ['other'], direct_or_unknown: ['unknown']
};
const safeEntry = path => path !== '/404/' && path !== '/account/';
const host = value => {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.hostname.toLowerCase().replace(/^www\./, '') : '';
  } catch { return ''; }
};

export function classifyAcquisition({ search = '', referrer = '', origin = '' } = {}) {
  const params = new URLSearchParams(search);
  const source = (params.get('utm_source') || '').trim().toLowerCase();
  const medium = (params.get('utm_medium') || '').trim().toLowerCase();
  const paid = /^(?:cpc|ppc|paid|display|paid_social)$/.test(medium)
    || ['gclid', 'gbraid', 'wbraid'].some(key => /^[A-Za-z0-9_-]{1,512}$/.test(params.get(key) || ''));
  if (paid) return { acquisition_channel: 'campaign', acquisition_source: 'other', acquisition_basis: 'campaign' };
  if (Object.prototype.hasOwnProperty.call(TAGGED_AI, source)) return { acquisition_channel: 'ai_referral', acquisition_source: TAGGED_AI[source], acquisition_basis: 'campaign' };
  if (source || medium || params.has('utm_campaign')) return { acquisition_channel: 'campaign', acquisition_source: 'other', acquisition_basis: 'campaign' };
  const from = host(referrer);
  if (from && from !== host(origin)) {
    if (Object.prototype.hasOwnProperty.call(AI, from)) return { acquisition_channel: 'ai_referral', acquisition_source: AI[from], acquisition_basis: 'referrer' };
    if (GOOGLE.has(from)) return { acquisition_channel: 'google_referral', acquisition_source: 'google', acquisition_basis: 'referrer' };
    return { acquisition_channel: 'other_referral', acquisition_source: 'other', acquisition_basis: 'referrer' };
  }
  return { acquisition_channel: 'direct_or_unknown', acquisition_source: 'unknown', acquisition_basis: 'none' };
}

// Analytics consent only. Never store raw URLs, campaign codes, document data, or an identity.
// This describes observed referrals; it does not identify an AI citation, install, or activation.
export function acquisitionContext() {
  if (typeof window === 'undefined' || !hasConsent('analytics')) {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Unavailable storage. */ }
    return {};
  }
  const now = Date.now();
  let context;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
    const entry = stored?.context;
    if (Number.isFinite(stored?.lastSeen) && stored.lastSeen <= now && now - stored.lastSeen < MAX_IDLE_MS
      && SOURCES[entry?.acquisition_channel]?.includes(entry?.acquisition_source)
      && ['referrer', 'campaign', 'none'].includes(entry?.acquisition_basis)
      && safeEntry(entry?.entry_page) && canonicalAnalyticsPath(entry?.entry_page) === entry?.entry_page) {
      context = { acquisition_channel: entry.acquisition_channel, acquisition_source: entry.acquisition_source, acquisition_basis: entry.acquisition_basis, entry_page: entry.entry_page };
    } else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Browsing and checkout do not depend on storage. */ }
  if (!context) {
    const entry = canonicalAnalyticsPath(window.location.pathname);
    if (!safeEntry(entry)) return {};
    context = { ...classifyAcquisition({ search: window.location.search, referrer: document.referrer, origin: window.location.origin }), entry_page: entry };
  }
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeen: now, context })); } catch { /* Page-only measurement. */ }
  return context;
}
