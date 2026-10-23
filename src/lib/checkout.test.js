import { saveConsent } from './consent';
const termsAcceptance = { accepted: true, version: '2026-09-09' };
beforeEach(() => { window.localStorage.clear(); saveConsent({ marketing: true }); });
import { createStripeCheckoutSession, isSecureStripeCheckoutUrl } from './checkout';

test('accepts only Stripe-hosted HTTPS checkout URLs', () => {
  expect(isSecureStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123')).toBe(true);
  expect(isSecureStripeCheckoutUrl('http://checkout.stripe.com/c/pay/cs_test_123')).toBe(false);
  expect(isSecureStripeCheckoutUrl('https://checkout.stripe.com.evil.example/c/pay/cs_test_123')).toBe(false);
  expect(isSecureStripeCheckoutUrl('https://example.com/checkout')).toBe(false);
  expect(isSecureStripeCheckoutUrl('not a URL')).toBe(false);
});

test('creates one Checkout Session with privacy-safe attribution', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' })
  });
  const attribution = {
    source: 'website_hero',
    utm_source: 'website',
    utm_medium: 'owned',
    utm_campaign: 'founder_launch'
  };

  await expect(createStripeCheckoutSession(attribution, fetchImpl, termsAcceptance)).resolves.toBe(
    'https://checkout.stripe.com/c/pay/cs_test_123'
  );
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ attribution, termsAcceptance });
});

test('fails closed when the server returns a non-Stripe URL', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://example.com/fake-checkout' })
  });
  await expect(createStripeCheckoutSession({}, fetchImpl, termsAcceptance)).rejects.toThrow('checkout_unavailable');
});


test('does not create checkout without explicit current terms acceptance', async () => {
  const fetchImpl = jest.fn();
  for (const agreement of [undefined, { accepted: false, version: '2026-09-09' }, { accepted: true, version: 'old' }]) {
    await expect(createStripeCheckoutSession({}, fetchImpl, agreement)).rejects.toThrow('terms_acceptance_required');
  }
  expect(fetchImpl).not.toHaveBeenCalled();
});
test('rechecks consent at the request boundary, including withdrawal during review', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/test' }) });
  saveConsent({});
  await createStripeCheckoutSession({ source: 'old_campaign', utm_campaign: 'private' }, fetchImpl, termsAcceptance);
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body).attribution).toEqual({});
});
