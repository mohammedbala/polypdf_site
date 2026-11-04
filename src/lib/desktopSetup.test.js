import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import DesktopSetupLink from '../components/DesktopSetupLink';
import { attachDesktopSetup, DESKTOP_SETUP_URL, performDesktopSetupAction } from './desktopSetup';
import { saveConsent } from './consent';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
let box;
beforeEach(() => {
  window.localStorage.clear(); window.sessionStorage.clear();
  window.gtag = jest.fn();
  box = document.createElement('div'); document.body.appendChild(box);
});
afterEach(() => {
  box.remove(); delete window.gtag;
  for (const [key, descriptor] of [['clipboard', originalClipboard], ['share', originalShare]]) {
    if (descriptor) Object.defineProperty(navigator, key, descriptor); else delete navigator[key];
  }
});
const setBrowser = (clipboard, share) => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
};
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('static and no-JavaScript markup contains the selectable canonical URL and no hidden identifiers', () => {
  box.innerHTML = renderToStaticMarkup(<DesktopSetupLink source="hero" />);
  expect(box.querySelector('details').open).toBe(false);
  const input = box.querySelector('input');
  expect(input.readOnly).toBe(true);
  expect(input.value).toBe('https://www.polypdf.com/#download');
  expect(input.hidden).toBe(false);
  expect([...box.querySelectorAll('button')].every(b => b.hidden)).toBe(true);
  expect(box.textContent).not.toMatch(/email address|sign in|utm_/i);
});

test('copy and share receive only the constant public URL', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined), share = jest.fn().mockResolvedValue(undefined);
  expect(await performDesktopSetupAction('copy', { browser: { clipboard: { writeText } } })).toBe('copied');
  expect(writeText).toHaveBeenCalledWith(DESKTOP_SETUP_URL);
  expect(await performDesktopSetupAction('share', { browser: { share } })).toBe('shared');
  expect(share).toHaveBeenCalledWith({ title: 'PolyPDF', url: DESKTOP_SETUP_URL });
  expect(JSON.stringify([writeText.mock.calls, share.mock.calls])).not.toMatch(/utm_|source=|session|document/);
});

test('denied clipboard and unsupported APIs focus and select the manual fallback', async () => {
  const input = { focus: jest.fn(), select: jest.fn() };
  expect(await performDesktopSetupAction('copy', {
    browser: { clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) } }, input
  })).toBe('manual');
  expect(input.select).toHaveBeenCalledTimes(1);
  expect(await performDesktopSetupAction('share', { browser: {}, input })).toBe('manual');
  expect(input.focus).toHaveBeenCalledTimes(2);
});

test('cancelling native share does not invoke clipboard or claim the link was shared', async () => {
  const input = { focus: jest.fn(), select: jest.fn() };
  const error = Object.assign(new Error('cancelled'), { name: 'AbortError' });
  const clipboard = { writeText: jest.fn() };
  expect(await performDesktopSetupAction('share', {
    browser: { share: jest.fn().mockRejectedValue(error), clipboard }, input
  })).toBe('cancelled');
  expect(input.select).not.toHaveBeenCalled();
  expect(clipboard.writeText).not.toHaveBeenCalled();
});

test('progressive controls report link actions only after consent, preserve keyboard buttons, and clean up listeners', async () => {
  setBrowser({ writeText: jest.fn().mockResolvedValue(undefined) }, undefined);
  box.innerHTML = renderToStaticMarkup(<DesktopSetupLink source="hero" />);
  const container = box.querySelector('[data-desktop-setup]');
  const cleanup = attachDesktopSetup(container);
  const copy = container.querySelector('[data-desktop-link-action="copy"]');
  expect(copy.hidden).toBe(false);
  expect(copy.type).toBe('button');
  expect(container.querySelector('[data-desktop-link-action="share"]').hidden).toBe(true);
  copy.click(); await flush();
  expect(container.querySelector('[data-desktop-link-status="copied"]').hidden).toBe(false);
  expect(window.gtag).not.toHaveBeenCalled();
  saveConsent({ analytics: true });
  copy.click(); await flush();
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag.mock.calls[0]).toEqual(['event', 'desktop_link_action', expect.objectContaining({
    cta_source: 'hero', target: 'copy', reason: 'copied'
  })]);
  cleanup(); copy.click(); await flush();
  expect(window.gtag).toHaveBeenCalledTimes(1);
});
