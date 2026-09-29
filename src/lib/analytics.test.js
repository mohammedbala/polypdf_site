import { trackEvent, trackVerifiedPurchase } from './analytics';
import { saveConsent } from './consent';
const purchase = { status: 'paid', transaction_id: 'pi_paid_123', value: 49.99, currency: 'usd' };
beforeEach(() => { window.localStorage.clear(); window.gtag = jest.fn(); });
afterEach(() => { delete window.gtag; });

test('sends nothing and stores no purchase record before consent or after rejection', () => {
  trackEvent('download_click', { source: 'hero' });
  expect(trackVerifiedPurchase(purchase)).toBe(false);
  saveConsent({});
  expect(trackVerifiedPurchase(purchase)).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
  expect(Object.keys(window.localStorage).filter((key) => key.includes('purchase'))).toEqual([]);
});
test('separates analytics and advertising consent and deduplicates each provider', () => {
  saveConsent({ analytics: true });
  expect(trackVerifiedPurchase(purchase)).toBe(true);
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'purchase', expect.objectContaining({ transaction_id: 'pi_paid_123', currency: 'USD', send_to: 'G-533RWNRCFP' }));
  saveConsent({ analytics: true, marketing: true });
  expect(trackVerifiedPurchase(purchase)).toBe(true);
  expect(window.gtag).toHaveBeenCalledTimes(2);
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'conversion', expect.objectContaining({ send_to: 'AW-449436603/SnB-CKSb6okdELu3p9YB' }));
  expect(trackVerifiedPurchase(purchase)).toBe(false);
});
test('rejects malformed events and excludes form, query and arbitrary item data', () => {
  saveConsent({ analytics: true, marketing: true });
  window.history.replaceState({}, '', '/account/?session_id=secret#token');
  trackEvent('download_click', { email: 'person@example.com', source: 'person@example.com', platform: 'mac' });
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'download_click', expect.objectContaining({ page_location: 'http://localhost/account/', platform: 'mac' }));
  expect(JSON.stringify(window.gtag.mock.calls)).not.toMatch(/secret|token|person@example/);
  trackVerifiedPurchase({ ...purchase, items: [{ item_name: 'private-email@example.com' }] });
  expect(JSON.stringify(window.gtag.mock.calls)).not.toContain('private-email');
  window.gtag.mockClear();
  for (const invalid of [{ transaction_id: '', value: 1, currency: 'USD' }, { ...purchase, value: -1 }, { ...purchase, currency: 'dollars' }]) expect(trackVerifiedPurchase(invalid)).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
  window.history.replaceState({}, '', '/');
});

test('attributes current and historical purchases to their verified price without guessing an offer', () => {
  saveConsent({ analytics: true });
  trackVerifiedPurchase({ status: 'paid', transaction_id: 'pi_standard', value: 74.95, currency: 'USD', items: [{ item_id: 'price_current123', item_name: 'PolyPDF Pro' }] });
  expect(window.gtag.mock.calls[0][2].items).toEqual([{ item_id: 'price_current123', item_name: 'PolyPDF Pro', price: 74.95, quantity: 1 }]);
  trackVerifiedPurchase({ ...purchase, items: [{ item_id: 'price_legacy123', item_name: "PolyPDF Pro Founder's License" }] });
  expect(window.gtag.mock.calls[1][2].items[0].item_id).toBe('price_legacy123');
  expect(window.gtag.mock.calls[1][2].items[0].item_name).toBe("PolyPDF Pro Founder's License");
  trackVerifiedPurchase({ ...purchase, transaction_id: 'pi_no_items' });
  expect(window.gtag.mock.calls[2][2].items[0].item_id).toBe('polypdf_pro');
});

test.each([undefined, 'pending', 'failed', 'refunded'])('does not report an unverified or %s purchase', (status) => {
  saveConsent({ analytics: true, marketing: true });
  expect(trackVerifiedPurchase({ ...purchase, status })).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
});

test.each([0, null, '', '74.95', NaN, Infinity])('does not count a free or invalid-value order: %s', (value) => {
  saveConsent({ marketing: true });
  expect(trackVerifiedPurchase({ ...purchase, value })).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
});

test('uses the dedicated destination once even when the old shared action was sent', () => {
  saveConsent({ marketing: true });
  window.localStorage.setItem(`polypdf.ads.purchase.v1.${purchase.transaction_id}`, String(Date.now()));
  expect(trackVerifiedPurchase(purchase)).toBe(true);
  expect(trackVerifiedPurchase(purchase)).toBe(false);
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
    send_to: 'AW-449436603/SnB-CKSb6okdELu3p9YB', transaction_id: purchase.transaction_id,
    value: 49.99, currency: 'USD'
  }));
});
