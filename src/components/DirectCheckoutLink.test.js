import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DirectCheckoutLink from './DirectCheckoutLink';
import { createStripeCheckoutSession } from '../lib/checkout';

jest.mock('../lib/checkout', () => ({
  ...jest.requireActual('../lib/checkout'),
  createStripeCheckoutSession: jest.fn()
}));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  createStripeCheckoutSession.mockResolvedValue(
    'https://checkout.stripe.com/c/pay/cs_test_direct'
  );
});

afterEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  jest.clearAllMocks();
});

test('one click creates a session and redirects directly to Stripe', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const redirect = jest.fn();

  await act(async () => {
    root.render(
      <DirectCheckoutLink
        source="website_hero"
        pageVariant="home_hero"
        redirect={redirect}
      >
        Buy once
      </DirectCheckoutLink>
    );
  });

  expect(container.querySelector('a')?.getAttribute('href')).toBe('/buy/?source=website_hero');
  await act(async () => {
    container.querySelector('a').dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(createStripeCheckoutSession).toHaveBeenCalledTimes(1);
  expect(createStripeCheckoutSession.mock.calls[0][0].source).toBe('website_hero');
  expect(redirect).toHaveBeenCalledWith(
    'https://checkout.stripe.com/c/pay/cs_test_direct'
  );

  act(() => root.unmount());
  container.remove();
});
