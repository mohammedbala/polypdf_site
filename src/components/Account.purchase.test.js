import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import Account from './Account';
import { saveConsent } from '../lib/consent';
import { trackEvent } from '../lib/analytics';

let root;
let container;
const paid = { status: 'paid', transaction_id: 'pi_verified_fixture', value: 74.95, currency: 'USD' };
const response = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const mount = async (url = '/account/?checkout=success&session_id=cs_fixture_12345') => {
  await act(async () => { root.render(<MemoryRouter initialEntries={[url]}><Account /></MemoryRouter>); });
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.gtag = jest.fn();
  window.scrollTo = jest.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.fetch = jest.fn(async (url) => url.startsWith('/api/checkout/conversion')
    ? response(200, paid) : response(200, { authenticated: false }));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete global.fetch;
  delete window.gtag;
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
  window.history.replaceState({}, '', '/');
  jest.useRealTimers();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

test('a success URL alone never reports a purchase or requests optional measurement before consent', async () => {
  await mount();
  expect(fetch.mock.calls.some(([url]) => url.startsWith('/api/checkout/conversion'))).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
});

test('after consent, a webhook-verified order reports its actual value to the PolyPDF action exactly once', async () => {
  await mount();
  await act(async () => saveConsent({ marketing: true }));
  expect(fetch).toHaveBeenCalledWith('/api/checkout/conversion?session_id=cs_fixture_12345', expect.objectContaining({ credentials: 'same-origin' }));
  expect(window.gtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
    send_to: 'AW-449436603/SnB-CKSb6okdELu3p9YB', value: 74.95,
    currency: 'USD', transaction_id: 'pi_verified_fixture'
  }));
  await act(async () => saveConsent({ marketing: true }));
  expect(window.gtag).toHaveBeenCalledTimes(1);
});

test('waits for payment verification and never counts the pending response', async () => {
  jest.useFakeTimers();
  saveConsent({ marketing: true });
  let calls = 0;
  fetch.mockImplementation(async (url) => url.startsWith('/api/checkout/conversion')
    ? (++calls === 1 ? response(202, { status: 'pending' }) : response(200, paid))
    : response(200, { authenticated: false }));
  await mount();
  expect(window.gtag).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1500));
  expect(window.gtag).toHaveBeenCalledTimes(1);
});

test.each([409, 404])('never reports a failed or unknown payment (HTTP %s)', async (status) => {
  saveConsent({ marketing: true });
  fetch.mockImplementation(async (url) => url.startsWith('/api/checkout/conversion')
    ? response(status, { error: 'payment_not_verified' }) : response(200, { authenticated: false }));
  await mount();
  expect(window.gtag).not.toHaveBeenCalled();
});

test('a fixture checkout return preserves the original acquisition and deduplicates the verified transaction after remount', async () => {
  saveConsent({ analytics: true });
  window.history.replaceState({}, '', '/pdf-takeoff-software/?private=entry');
  Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://www.google.com/search?q=private' });
  trackEvent('begin_checkout', { source: 'takeoff_plan_comparison' });
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'begin_checkout', expect.objectContaining({
    cta_source: 'takeoff_plan_comparison', entry_page: '/pdf-takeoff-software/',
    acquisition_source: 'google', acquisition_channel: 'google_referral'
  }));
  window.history.replaceState({}, '', '/account/?checkout=success&session_id=cs_fixture_12345');
  Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://checkout.stripe.com/c/pay/private' });
  await mount();
  const purchases = () => window.gtag.mock.calls.filter(call => call[1] === 'purchase');
  expect(purchases()).toHaveLength(1);
  expect(purchases()[0][2]).toEqual(expect.objectContaining({
    transaction_id: paid.transaction_id, value: 74.95, currency: 'USD',
    page_location: 'http://localhost/account/', entry_page: '/pdf-takeoff-software/',
    acquisition_source: 'google', acquisition_channel: 'google_referral', acquisition_basis: 'referrer'
  }));
  expect(JSON.stringify(window.gtag.mock.calls)).not.toMatch(/cs_fixture|private/);
  expect(purchases()[0][2].page_referrer).toBe('https://checkout.stripe.com/');
  expect(window.gtag.mock.calls.some(call => call[1] === 'conversion')).toBe(false);
  await act(async () => root.unmount());
  root = createRoot(container);
  await mount();
  expect(purchases()).toHaveLength(1);
});
