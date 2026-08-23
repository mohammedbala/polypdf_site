import { trackVerifiedPurchase } from './analytics';

beforeEach(() => {
  window.localStorage.clear();
  window.gtag = jest.fn();
});

afterEach(() => {
  delete window.gtag;
  delete window.oaiq;
});

test('reports one deduplicated OpenAI Ads order after the verified Stripe purchase', () => {
  window.oaiq = jest.fn();
  const purchase = {
    transaction_id: 'pi_paid_456',
    value: 49.99,
    currency: 'usd',
    items: [{ item_id: 'price_founder', item_name: 'PolyPDF Pro', price: 49.99, quantity: 1 }]
  };

  expect(trackVerifiedPurchase(purchase)).toBe(true);
  expect(window.oaiq).toHaveBeenCalledWith(
    'measure',
    'order_created',
    {
      type: 'contents',
      amount: 4999,
      currency: 'USD',
      contents: [{
        id: 'price_founder',
        name: 'PolyPDF Pro',
        content_type: 'product',
        quantity: 1,
        amount: 4999,
        currency: 'USD'
      }]
    },
    { event_id: 'pi_paid_456' }
  );

  expect(trackVerifiedPurchase(purchase)).toBe(false);
  expect(window.oaiq).toHaveBeenCalledTimes(1);
});

test('reports one standard GA4 purchase with value and transaction identity', () => {
  const purchase = {
    transaction_id: 'pi_paid_123',
    value: 49.99,
    currency: 'usd',
    items: [{ item_id: 'price_founder', item_name: 'PolyPDF Pro', price: 49.99, quantity: 1 }]
  };

  expect(trackVerifiedPurchase(purchase)).toBe(true);
  expect(window.gtag).toHaveBeenCalledWith('event', 'purchase', {
    ...purchase,
    currency: 'USD'
  });
  expect(window.gtag).toHaveBeenCalledWith('event', 'conversion', {
    send_to: 'AW-449436603/xb7JCMbVseMcELu3p9YB',
    transaction_id: 'pi_paid_123',
    value: 49.99,
    currency: 'USD'
  });

  expect(trackVerifiedPurchase(purchase)).toBe(false);
  expect(window.gtag).toHaveBeenCalledTimes(2);
});

test('refuses malformed or unverified purchase payloads', () => {
  expect(trackVerifiedPurchase({ transaction_id: '', value: 49.99, currency: 'USD' })).toBe(false);
  expect(trackVerifiedPurchase({ transaction_id: 'pi_123', value: -1, currency: 'USD' })).toBe(false);
  expect(trackVerifiedPurchase({ transaction_id: 'pi_123', value: 49.99, currency: 'dollars' })).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
});
