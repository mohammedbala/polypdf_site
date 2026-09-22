import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import Buy, { isSecureStripeCheckoutUrl } from './Buy';

class TestIntersectionObserver {
  constructor(callback) { this.callback = callback; TestIntersectionObserver.instances.push(this); }
  observe(target) { this.target = target; }
  disconnect() {}
}
TestIntersectionObserver.instances = [];

const renderBuy = async (url, founder) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  window.scrollTo = jest.fn();
  window.IntersectionObserver = TestIntersectionObserver;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "polypdf_pro_1x_2026", kind: "standard", available: founder.available, price: 74.95, currency: "USD", founder: { available: false, reason: "ended" } })
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
  TestIntersectionObserver.instances = [];
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
  expect(view.container.querySelector('.offer-price-reference')).toBeNull();
  expect(view.container.querySelector('.offer-price-current strong')?.textContent).toBe('$74.95');
  expect(view.container.querySelector('.offer-price-savings')).toBeNull();
  expect(view.container.textContent).not.toContain('Founder price');
  expect(view.container.textContent).toContain('PDF content editing');
  expect(view.container.querySelector('.offer-guarantee')?.textContent).toContain(
    '14-day money-back guarantee'
  );
  view.unmount();
});

test('disables checkout when the standard offer is unavailable', async () => {
  const view = await renderBuy('/buy/', {
    available: false,
    reason: 'sold_out',
    endsAt: null,
    maximumFulfilledLicenses: 100
  });
  expect(view.container.textContent).toContain(
    'Checkout is temporarily unavailable. Please refresh or contact support@polypdf.com.'
  );
  expect(view.container.querySelector('.buy-plan a.primary-btn')).toBeNull();
  view.unmount();
});

test('keeps the offscreen checkout shortcut available after purchase review is cancelled', async () => {
  const view = await renderBuy('/buy/', { available: true });
  const observer = TestIntersectionObserver.instances.find((entry) => entry.target?.matches('.buy-plan .primary-btn'));
  await act(async () => observer.callback([{ isIntersecting: false }]));
  const shortcut = view.container.querySelector('.buy-sticky-checkout button');
  expect(shortcut).not.toBeNull();
  // Without a review provider the purchase review resolves null; this is the same cancellation
  // result used by the live provider and must never strand an offscreen buyer.
  await act(async () => shortcut.click());
  expect(view.container.querySelector('.buy-sticky-checkout button')).not.toBeNull();
  expect(view.container.querySelector('.buy-plan .primary-btn').getAttribute('aria-busy')).toBe('false');
  view.unmount();
});

test.each([
  ['pdf_editing', 'PDF content editing requires PolyPDF Pro'],
  ['toolsets', 'Place preset tools with PolyPDF Pro'],
  ['overlay', 'Compare PDF revisions with PolyPDF Pro']
])('explains the requested workflow for %s upgrade traffic', async (source, message) => {
  const view = await renderBuy(`/buy/?source=${source}&utm_source=desktop_app`, { available: true });
  expect(view.container.querySelector('.buy-hero .hero-badge')?.textContent).toContain(message);
  expect(view.container.querySelector('.buy-hero > p')?.textContent).toContain('$74.95 once');
  expect(view.container.querySelector('.buy-plan a.primary-btn')?.textContent).toContain('Checkout with Stripe');
  expect(view.container.textContent).not.toContain('Prefer to test it first?');
  view.unmount();
});
