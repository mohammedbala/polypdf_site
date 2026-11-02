import { acquisitionContext, classifyAcquisition } from './acquisition';
import { clearOptionalStorage, saveConsent } from './consent';
import { canonicalAnalyticsPath } from './analyticsPath';
import catalog from '../toolkit/catalog.json';
import toolkitLocales from '../toolkit/locales.json';

beforeEach(() => {
  window.localStorage.clear(); window.sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
});
afterEach(() => { jest.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

test.each(toolkitLocales)('every published $id tool route has its real analytics path', locale => {
  for (const route of ['/tools', '/tools/automation', ...catalog.map(tool => '/tools/' + tool.id)]) {
    expect(canonicalAnalyticsPath('/' + locale.id + route + '/')).toBe('/' + locale.id + route + '/');
  }
  expect(canonicalAnalyticsPath('/' + locale.id + '/tools/private-document/')).toBe('/404/');
});
test.each(['/he/buy/', '/bn/pdf-takeoff-software/', '/es/product-facts/', '/es/tools/flooring-waste-calculator/', '/unknown/private/', '/tools/merge-pdf/?private=1'])('unpublished or private routes stay hidden: %s', path => {
  expect(canonicalAnalyticsPath(path)).toBe('/404/');
});
test('distinguishes AI referrals and Google without assuming all Google visits are organic or AI', () => {
  expect(classifyAcquisition({ referrer: 'https://chatgpt.com/c/private?token=secret' })).toEqual({ acquisition_channel: 'ai_referral', acquisition_source: 'chatgpt', acquisition_basis: 'referrer' });
  expect(classifyAcquisition({ referrer: 'https://www.google.com/search?q=private' })).toEqual({ acquisition_channel: 'google_referral', acquisition_source: 'google', acquisition_basis: 'referrer' });
  expect(classifyAcquisition({ referrer: 'https://www.bing.com/search?q=private' }).acquisition_channel).toBe('other_referral');
  expect(classifyAcquisition({ search: '?utm_source=chatgpt.com' }).acquisition_basis).toBe('campaign');
  expect(classifyAcquisition({ search: '?utm_source=chatgpt.com&utm_medium=cpc' }).acquisition_channel).toBe('campaign');
  expect(classifyAcquisition({ search: '?gclid=Click_123', referrer: 'https://www.google.com' }).acquisition_channel).toBe('campaign');
});
test.each(['https://chatgpt.com.evil.test/', 'https://evilchatgpt.com/', 'https://perplexity.ai.evil.test/', 'https://google.evil/'])('rejects misleading referring domains: %s', referrer => {
  expect(classifyAcquisition({ referrer }).acquisition_channel).toBe('other_referral');
});
test('absent or internal referrers remain unknown; a missing AI referrer is never guessed', () => {
  expect(classifyAcquisition().acquisition_channel).toBe('direct_or_unknown');
  expect(classifyAcquisition({ referrer: 'https://www.polypdf.com/tools/', origin: 'https://www.polypdf.com' }).acquisition_channel).toBe('direct_or_unknown');
  expect(classifyAcquisition({ referrer: 'javascript:private' }).acquisition_channel).toBe('direct_or_unknown');
});
test('requires analytics consent, independent of advertising, and forgets context on rejection', () => {
  expect(acquisitionContext()).toEqual({});
  saveConsent({ marketing: true }); expect(acquisitionContext()).toEqual({});
  expect(window.sessionStorage.length).toBe(0);
  saveConsent({ analytics: true }); expect(acquisitionContext().entry_page).toBe('/');
  saveConsent({}); clearOptionalStorage();
  expect(window.sessionStorage.length).toBe(0); expect(acquisitionContext()).toEqual({});
});
test('retains the known entry and provider across tools, downloads, and checkout without retaining private data', () => {
  saveConsent({ analytics: true });
  Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://perplexity.ai/search/private-question?secret=value' });
  window.history.replaceState({}, '', '/bn/tools/merge-pdf/?email=private@example.com#secret');
  expect(acquisitionContext()).toEqual({ acquisition_channel: 'ai_referral', acquisition_source: 'perplexity', acquisition_basis: 'referrer', entry_page: '/bn/tools/merge-pdf/' });
  window.history.replaceState({}, '', '/buy/?source=website_hero');
  expect(acquisitionContext().entry_page).toBe('/bn/tools/merge-pdf/');
  window.history.replaceState({}, '', '/account/?session_id=cs_secret');
  expect(acquisitionContext().acquisition_source).toBe('perplexity');
  expect(JSON.stringify(window.sessionStorage)).not.toMatch(/private|secret|email|session_id|source=|search\//);
});
test('expires after 30 idle minutes and rejects corrupt, future, or untrusted stored context', () => {
  saveConsent({ analytics: true });
  const now = Date.now();
  for (const record of [
    '{', JSON.stringify({ lastSeen: now + 10000, context: { entry_page: '/private/' } }),
    JSON.stringify({ lastSeen: now, context: { entry_page: '/?email=private', acquisition_channel: 'ai_referral', acquisition_source: 'chatgpt', acquisition_basis: 'referrer' } })
  ]) {
    window.sessionStorage.setItem('polypdf.analytics-visit.v1', record);
    expect(acquisitionContext().entry_page).toBe('/');
  }
  window.history.replaceState({}, '', '/tools/merge-pdf/');
  jest.spyOn(Date, 'now').mockReturnValue(now + 30 * 60000 + 1);
  expect(acquisitionContext().entry_page).toBe('/tools/merge-pdf/');
});
test('storage blocking does not stop browsing and account-only entries are not captured', () => {
  saveConsent({ analytics: true });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(acquisitionContext().entry_page).toBe('/');
  window.history.replaceState({}, '', '/account/?session_id=private');
  expect(acquisitionContext()).toEqual({});
});

test.each(['constructor', '__proto__', 'toString'])('campaign values never resolve inherited object properties: %s', source => {
  expect(classifyAcquisition({ search: '?utm_source=' + source })).toEqual({
    acquisition_channel: 'campaign', acquisition_source: 'other', acquisition_basis: 'campaign'
  });
  expect(classifyAcquisition({ referrer: 'https://' + source + '/' }).acquisition_channel).not.toBe('ai_referral');
});
