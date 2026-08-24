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

  await expect(createStripeCheckoutSession(attribution, fetchImpl)).resolves.toBe(
    'https://checkout.stripe.com/c/pay/cs_test_123'
  );
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ attribution });
});

test('fails closed when the server returns a non-Stripe URL', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://example.com/fake-checkout' })
  });
  await expect(createStripeCheckoutSession({}, fetchImpl)).rejects.toThrow('checkout_unavailable');
});
