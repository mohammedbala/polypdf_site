import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import axe from 'axe-core';
import Privacy from './Privacy';
import Cookies from './Cookies';
import Accessibility from './Accessibility';
import Terms from './Terms';
import Refund from './Refund';
import CookieConsent from './CookieConsent';
import { openCookieSettings } from '../lib/consent';

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  window.scrollTo = jest.fn();
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = false; delete window.IntersectionObserver; });
const scan = async (container) => axe.run(container, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  // jsdom has no layout/paint engine. Contrast, zoom, focus and native dialog behavior are
  // checked separately in the browser; do not turn this semantic scan into a conformance claim.
  rules: { 'color-contrast': { enabled: false } }
});

test.each([Privacy, Cookies, Accessibility, Terms, Refund])('%p policy page has no detected WCAG semantic violations', async (Page) => {
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><Page /></MemoryRouter>));
    const result = await scan(container);
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
    expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  } finally { act(() => root.unmount()); container.remove(); }
});

test('cookie choices and the granular settings dialog have labelled controls and no detected semantic violations', async () => {
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><CookieConsent /></MemoryRouter>));
    expect(container.querySelectorAll('aside button')).toHaveLength(3);
    expect((await scan(container)).violations).toEqual([]);
    await act(async () => openCookieSettings());
    expect(container.querySelector('dialog').open).toBe(true);
    expect([...container.querySelectorAll('input')].every((input) => input.checked === false)).toBe(true);
    expect((await scan(container)).violations.map((violation) => violation.id)).toEqual([]);
    await act(async () => container.querySelector('dialog').dispatchEvent(new Event('cancel')));
    expect(window.localStorage.length).toBe(0);
  } finally { act(() => root.unmount()); container.remove(); }
});
