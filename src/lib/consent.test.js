import { CONSENT_KEY, CONSENT_MAX_AGE, CONSENT_VERSION, clearOptionalStorage, hasConsent, readConsent, saveConsent } from './consent';
import { captureAttribution, checkoutAttribution } from './attribution';

beforeEach(() => { window.localStorage.clear(); Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false }); });
afterEach(() => { jest.restoreAllMocks(); });
test('fails closed for missing, corrupt, old-version, future and expired choices', () => {
  for (const value of [null, '{', '{}', JSON.stringify({version:'old', savedAt:Date.now(), analytics:true,marketing:true}), JSON.stringify({version:CONSENT_VERSION,savedAt:Date.now()+10000,analytics:true,marketing:true}), JSON.stringify({version:CONSENT_VERSION,savedAt:Date.now()-CONSENT_MAX_AGE,analytics:true,marketing:true})]) {
    window.localStorage.setItem(CONSENT_KEY, value);
    expect(readConsent()).toBeNull();
    expect(hasConsent('analytics')).toBe(false);
    expect(captureAttribution('?utm_campaign=unwanted')).toEqual({});
    expect(checkoutAttribution()).toEqual({});
    expect(window.localStorage.getItem('polypdf.attribution.v1')).toBeNull();
  }
});
test('a privacy signal overrides a saved grant and future attempts to accept', () => {
  saveConsent({analytics:true,marketing:true});
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
  expect(hasConsent('marketing')).toBe(false);
  expect(hasConsent('analytics')).toBe(false);
  expect(saveConsent({analytics:true,marketing:true})).toMatchObject({analytics:false,marketing:false});
});
test('withdrawal clears only optional records and cookies, preserving account access', () => {
  window.localStorage.setItem('polypdf.attribution.v1','test');
  window.localStorage.setItem('polypdf.ga4.purchase.v1.order','sent');
  window.localStorage.setItem('polypdf.ads.purchase.v1.order',String(Date.now()));
  window.localStorage.setItem('unrelated','keep');
  document.cookie='_ga=old; Path=/'; document.cookie='_gcl_au=old; Path=/'; document.cookie='polypdf_account=keep; Path=/';
  saveConsent({}); clearOptionalStorage();
  expect(document.cookie).not.toMatch(/_ga=|_gcl_au=/);
  expect(document.cookie).toContain('polypdf_account=keep');
  expect(window.localStorage.getItem('unrelated')).toBe('keep');
  expect(Object.keys(window.localStorage).some((key)=>key.includes('purchase')||key.includes('attribution'))).toBe(false);
});
test('blocked storage preserves a page-only choice without breaking browsing', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(()=>{throw new Error('blocked');});
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(()=>{throw new Error('blocked');});
  expect(()=>saveConsent({})).not.toThrow();
  expect(readConsent()).toMatchObject({analytics:false,marketing:false});
  expect(captureAttribution('?utm_campaign=no')).toEqual({});
});
test('loads no provider before consent, separates destinations, and unloads on withdrawal', () => {
  jest.resetModules();
  const {syncTracking}=require('./tracking');
  const reload=jest.fn();
  syncTracking({reload});
  expect(document.getElementById('polypdf-google-tag')).toBeNull();
  saveConsent({analytics:true}); syncTracking({reload});
  expect(document.getElementById('polypdf-google-tag').src).toContain('id=G-533RWNRCFP');
  const queue=window.dataLayer.map((entry)=>Array.from(entry));
  expect(queue[0]).toEqual(['consent','default', expect.objectContaining({analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied'})]);
  expect(queue.some((entry)=>entry[0]==='config'&&entry[1]==='AW-449436603')).toBe(false);
  saveConsent({}); syncTracking({reload});
  expect(reload).toHaveBeenCalledTimes(1);
  expect(document.getElementById('polypdf-google-tag')).toBeNull();
  expect(window.gtag).toBeUndefined();
});
