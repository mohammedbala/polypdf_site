import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import Buy, { isSecureStripeCheckoutUrl } from './Buy';

class TestIntersectionObserver {
  observe() {}
  disconnect() {}
}

const renderBuy = async (url, founder) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  window.scrollTo = jest.fn();
  window.IntersectionObserver = TestIntersectionObserver;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ founder })
  });
  await act(async () => {
    root.render(
      <MemoryRouter
        initialEntries={[url]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Buy />
      </MemoryRouter>
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    }
  };
};

afterEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  delete global.fetch;
  delete window.IntersectionObserver;
  window.localStorage.clear();
});

test('accepts only secure Stripe-hosted checkout URLs', () => {
  expect(isSecureStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123')).toBe(true);
  expect(isSecureStripeCheckoutUrl('http://checkout.stripe.com/c/pay/cs_test_123')).toBe(false);
  expect(isSecureStripeCheckoutUrl('https://checkout.stripe.com.evil.example/c/pay/cs_test_123')).toBe(false);
  expect(isSecureStripeCheckoutUrl('https://example.com/checkout')).toBe(false);
  expect(isSecureStripeCheckoutUrl('not a URL')).toBe(false);
});

test('removes the free-download detour for measurement-limit traffic', async () => {
  const view = await renderBuy('/buy/?source=free_measurement_limit&utm_source=desktop_app', {
    available: true,
    reason: null,
    endsAt: null,
    maximumFulfilledLicenses: 100
  });
  expect(view.container.querySelector('.buy-plan a.primary-btn')?.textContent).toContain('Checkout with Stripe');
  expect(view.container.textContent).not.toContain('Prefer to test it first?');
  view.unmount();
});

test('shows an explicit price anchor and the real money-back guarantee beside checkout', async () => {
  const view = await renderBuy('/buy/', {
    available: true,
    reason: null,
    endsAt: null,
    maximumFulfilledLicenses: 100
  });
  expect(view.container.querySelector('.offer-price-reference del')?.textContent).toBe('$99');
  expect(view.container.querySelector('.offer-price-current strong')?.textContent).toBe('$49.99');
  expect(view.container.querySelector('.offer-price-savings')?.textContent).toBe('Save $49.01');
  expect(view.container.querySelector('.offer-guarantee')?.textContent).toContain(
    '14-day money-back guarantee'
  );
  view.unmount();
});

test('disables checkout with an honest complete state at the fulfilled cap', async () => {
  const view = await renderBuy('/buy/', {
    available: false,
    reason: 'sold_out',
    endsAt: null,
    maximumFulfilledLicenses: 100
  });
  expect(view.container.textContent).toContain(
    'Founder offer complete. All 100 licenses have been claimed, so checkout is closed.'
  );
  expect(view.container.querySelector('.buy-plan a.primary-btn')).toBeNull();
  view.unmount();
});
