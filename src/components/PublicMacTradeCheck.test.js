import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import PublicMacTradeCheck from './PublicMacTradeCheck';
import { trackEvent } from '../lib/analytics';

jest.mock('../lib/analytics', () => ({ trackEvent: jest.fn() }));

const BASE = '/samples/evaluation/public-mac-1.6.27-99';

test('flooring evidence keeps the dimension-boundary basis next to its quantities', () => {
  const html = renderToStaticMarkup(<PublicMacTradeCheck kind="flooring" />);
  expect(html).toContain('5,184 sq ft of F1 resilient flooring');
  expect(html).toContain('576 sq ft of F2 porcelain tile');
  expect(html).toContain('not net installed flooring');
  expect(html).toContain('no wall-thickness deductions and no waste');
  expect(html).toContain(`${BASE}/willow-creek-i101-measured.pdf`);
  expect(html).toContain(`${BASE}/willow-creek-i101-takeoff.csv`);
  expect(html).toContain(`${BASE}/flooring-verification.html`);
  expect(html).toContain('public Mac 1.6.27 build 99');
});

test('electrical evidence separates the drawn route from conduit and device counts', () => {
  const html = renderToStaticMarkup(<PublicMacTradeCheck kind="electrical" />);
  expect(html).toContain('<strong>46 ft</strong>');
  expect(html).toContain('the saved drawing labels its 8 ft and 38 ft segments');
  expect(html).toContain('not conduit or wire to order');
  expect(html).toContain('counts were not run');
  expect(html).toContain('Symbol Search, Pro workflows and Windows were not part of this check');
  expect(html).toContain(`${BASE}/electrical-verification.html`);
});

test.each(['flooring', 'electrical'])('%s evidence says the drawing is synthetic and avoids self-praise', (kind) => {
  const html = renderToStaticMarkup(<PublicMacTradeCheck kind={kind} />);
  expect(html).toContain('is a synthetic practice drawing, not for construction');
  expect(html).not.toMatch(/\b(real|honest|genuine|truthful)\b/i);
});

test('evidence downloads are counted like every other sample download', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.addEventListener('click', (event) => event.preventDefault());
  const root = createRoot(container);
  act(() => { root.render(<PublicMacTradeCheck kind="flooring" />); });
  const links = [...container.querySelectorAll('a[download]')];
  expect(links).toHaveLength(2);
  act(() => { links[0].click(); });
  act(() => { links[1].click(); });
  expect(trackEvent).toHaveBeenCalledWith('sample_download', { source: 'flooring_public_mac_check', feature: 'saved_measured_pdf' });
  expect(trackEvent).toHaveBeenCalledWith('sample_download', { source: 'flooring_public_mac_check', feature: 'worksheet_csv' });
  act(() => { root.unmount(); });
  container.remove();
});

test('renders nothing for pages without a verified trade record', () => {
  expect(renderToStaticMarkup(<PublicMacTradeCheck kind="measurement" />)).toBe('');
});
