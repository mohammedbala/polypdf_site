import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server.node';
import DownloadCTA from './DownloadCTA';
import { DOWNLOADS, detectPlatform } from '../lib/platform';
import { saveConsent } from '../lib/consent';

let node, root;
const original = {};
const setNavigator = (values) => {
  for (const [key, value] of Object.entries(values))
    Object.defineProperty(navigator, key, { configurable: true, value });
};
beforeEach(() => {
  for (const key of ['platform', 'userAgent', 'userAgentData', 'maxTouchPoints'])
    original[key] = Object.getOwnPropertyDescriptor(navigator, key);
  setNavigator({ platform: '', userAgent: '', userAgentData: undefined, maxTouchPoints: 0 });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear(); window.sessionStorage.clear();
  window.gtag = jest.fn();
  node = document.createElement('div'); document.body.appendChild(node);
  root = createRoot(node);
});
afterEach(() => {
  act(() => root.unmount()); node.remove(); delete window.gtag;
  for (const key of Object.keys(original)) {
    if (original[key]) Object.defineProperty(navigator, key, original[key]);
    else delete navigator[key];
  }
});
const render = () => act(() => root.render(<DownloadCTA source="hero" />));
const click = (link) => {
  link.addEventListener('click', e => e.preventDefault());
  act(() => link.click());
};

test.each([
  ['ordinary Mac', { platform: 'MacIntel', userAgent: 'Macintosh', maxTouchPoints: 0 }, 'mac'],
  ['Windows', { platform: 'Win32', userAgent: 'Windows NT 10.0' }, 'windows'],
  ['iPhone', { platform: 'iPhone', userAgent: 'iPhone' }, null],
  ['iPad mobile mode', { platform: 'iPad', userAgent: 'iPad' }, null],
  ['iPad desktop mode', { platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }, null],
  ['iPod', { platform: 'iPod', userAgent: 'iPod' }, null],
  ['Android', { platform: 'Linux armv8l', userAgent: 'Android' }, null],
  ['mobile client hint', { userAgentData: { platform: 'Windows', mobile: true } }, null],
  ['Windows client hint', { userAgentData: { platform: 'Windows', mobile: false } }, 'windows'],
  ['Linux', { platform: 'Linux x86_64' }, null]
])('%s selects an installable desktop platform or neutral choices', (_, values, expected) => {
  setNavigator(values);
  expect(detectPlatform()).toBe(expected);
});

test('the architectural exercise is in initial HTML, usable without JavaScript and within Free', () => {
  const html = renderToStaticMarkup(<DownloadCTA source="hero" />);
  node.innerHTML = html;
  const details = node.querySelector('.dl-evaluation details');
  expect(details.open).toBe(false);
  expect(details.querySelector('summary').textContent).toBe('Try a checked construction takeoff');
  expect([...details.querySelectorAll('ol li')]).toHaveLength(3);
  expect(details.textContent).toContain('96 ft width and 60 ft depth');
  expect(details.textContent).toContain('5,760 sq ft gross area');
  expect(details.textContent).toContain('reopen the PDF');
  expect(details.textContent).toContain('local Mac build 1.6.14 build 76');
  expect(details.textContent).toContain('not for construction');
  expect(details.querySelector('a[download]').getAttribute('href')).toBe('/samples/construction/02-Architectural-Revision-A.pdf');
  expect(node.querySelector('.dl-evaluation [role="status"]')).toBeNull();
});

test('an iPad keeps both desktop choices with an explicit desktop-only exercise', () => {
  setNavigator({ platform: 'MacIntel', userAgent: 'Macintosh', maxTouchPoints: 5 });
  render();
  expect([...node.querySelectorAll('.dl-both a')].map(a => a.getAttribute('href')))
    .toEqual(Object.values(DOWNLOADS).map(p => p.url));
  expect(node.querySelector('.dl-meta').textContent).toContain('Mac and Windows desktops');
  expect(node.querySelector('.dl-evaluation').textContent).toContain('do not run on phones or tablets');
});

test('installer intent opens the exercise and labels the request without claiming completion', () => {
  setNavigator({ platform: 'Win32', userAgent: 'Windows NT 10.0' });
  render();
  expect(node.querySelector('.dl-evaluation details').open).toBe(false);
  const installer = node.querySelector('.dl-primary-row a');
  expect(installer.getAttribute('href')).toBe(DOWNLOADS.windows.url);
  click(installer);
  expect(node.querySelector('.dl-evaluation details').open).toBe(true);
  expect(node.querySelector('.dl-evaluation [role="status"]').textContent).toContain('Download requested for Windows');
  expect(node.querySelector('.dl-evaluation [role="status"]').textContent).not.toMatch(/completed|installed|activated/i);
  expect(window.gtag).not.toHaveBeenCalled();
  node.querySelector('.dl-evaluation details').open = false;
  click(installer);
  expect(node.querySelector('.dl-evaluation details').open).toBe(true);
});

test('installer, sample and guide intent remain separate and analytics consent is required', () => {
  render();
  for (const link of node.querySelectorAll('a')) link.addEventListener('click', e => e.preventDefault());
  const installer = node.querySelector('.dl-both a');
  const sample = node.querySelector('.dl-evaluation a[download]');
  const guide = node.querySelector('.dl-evaluation a[href*="/blog/"]');
  click(installer); click(sample); click(guide);
  expect(window.gtag).not.toHaveBeenCalled();
  saveConsent({ analytics: true });
  click(installer); click(sample); click(guide);
  const events = window.gtag.mock.calls;
  expect(events.filter(c => c[1] === 'download_click')).toHaveLength(1);
  expect(events.find(c => c[1] === 'download_click')[2]).toMatchObject({ cta_source: 'hero', platform: 'mac' });
  expect(events.find(c => c[1] === 'sample_download')[2]).toMatchObject({ cta_source: 'hero', feature: 'download_evaluation' });
  expect(events.find(c => c[1] === 'download_evaluation_click')[2]).toMatchObject({ cta_source: 'hero', target: 'guide' });
  expect(events.some(c => ['purchase', 'conversion', 'browser_tool_complete'].includes(c[1]))).toBe(false);
});
