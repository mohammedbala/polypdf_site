import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { PdfDrawingHandoff } from './PdfTools';
import { ToolkitLanguageProvider, localizedHref } from '../toolkit/language';
import { DOWNLOADS } from '../lib/platform';
import { saveConsent } from '../lib/consent';
import catalog from '../toolkit/catalog.json';
import locales from '../toolkit/locales.json';

let node, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear(); window.sessionStorage.clear();
  window.gtag = jest.fn();
  node = document.createElement('div'); document.body.appendChild(node);
  root = createRoot(node);
});
afterEach(() => { act(() => root.unmount()); node.remove(); delete window.gtag; });
function render(id, compact = false, language = null) {
  const tool = catalog.find(t => t.id === id);
  act(() => root.render(<MemoryRouter><ToolkitLanguageProvider value={language}>
    <PdfDrawingHandoff tool={tool} compact={compact}/>
  </ToolkitLanguageProvider></MemoryRouter>));
}

test.each([
  ['compare-pdf-text', '/compare-pdf-drawings/'],
  ['resize-pdf', '/pdf-measuring-tool/'],
  ['add-text-to-pdf', '/construction-pdf-markup/'],
  ['merge-pdf', '/pdf-takeoff-software/']
])('%s offers the relevant drawing workflow without moving files', (id, path) => {
  render(id);
  expect(node.querySelector('.pdf-desktop-links a').getAttribute('href')).toBe(path);
  expect(node.textContent).toContain('up to 3 hand-created measurements per document');
  expect(node.textContent).toContain('Files are not transferred automatically');
  expect(node.textContent).toContain('do not run on phones or tablets');
  expect([...node.querySelectorAll('a[download]')].map(a => a.getAttribute('href')))
    .toEqual(Object.values(DOWNLOADS).map(p => p.url));
});

test('the result handoff is optional and leaves installer and pricing controls in the guide', () => {
  render('compare-pdf-text', true);
  expect(node.querySelector('aside').textContent).toContain('Working with construction drawings?');
  expect(node.querySelectorAll('a')).toHaveLength(1);
  expect(node.querySelector('a').getAttribute('href')).toBe('/compare-pdf-drawings/');
  expect(node.querySelector('a[download]')).toBeNull();
});

test('handoff clicks require analytics consent and do not report a purchase or browser result', () => {
  render('merge-pdf');
  const links = [...node.querySelectorAll('a')];
  for (const a of links) a.addEventListener('click', e => e.preventDefault());
  act(() => links.forEach(a => a.click()));
  expect(window.gtag).not.toHaveBeenCalled();
  saveConsent({ analytics: true });
  act(() => links.forEach(a => a.click()));
  const calls = window.gtag.mock.calls;
  expect(calls.filter(c => c[1] === 'download_click').map(c => c[2].platform)).toEqual(['mac', 'windows']);
  expect(calls.filter(c => c[1] === 'desktop_workflow_click').map(c => c[2].target))
    .toEqual(['workflow', 'measured_example', 'pricing']);
  expect(calls.every(c => c[2].feature === 'merge-pdf' && c[2].send_to === 'G-GB6LW050TM')).toBe(true);
  expect(calls.some(c => ['purchase', 'conversion', 'browser_tool_complete'].includes(c[1]))).toBe(false);
  window.gtag.mockClear();
  render('compare-pdf-text', true);
  node.querySelector('a').addEventListener('click', e => e.preventDefault());
  act(() => node.querySelector('a').click());
  expect(window.gtag).toHaveBeenCalledWith('event', 'desktop_workflow_click', expect.objectContaining({
    section: 'result', feature: 'compare-pdf-text', target: 'workflow'
  }));
});

test.each(locales)('$id keeps downloads intact, translates limits and labels English-only destinations', locale => {
  const strings = require(`../toolkit/translations/${locale.id}.json`).strings;
  const language = { locale, strings };
  render('compare-pdf-text', false, language);
  const [guide, proof, pricing] = node.querySelectorAll('.pdf-desktop-links a');
  expect(guide.getAttribute('href')).toBe(localizedHref('/compare-pdf-drawings/', language));
  expect(guide.getAttribute('hreflang')).toBe(guide.getAttribute('href').startsWith(`/${locale.id}/`) ? null : 'en');
  expect(guide.textContent).toContain(strings['Visual drawing comparison']);
  expect(node.querySelector('h2').textContent).toBe(strings['Measure, take off, and review in PolyPDF.']);
  expect(node.querySelector('h2').textContent).not.toBe('Measure, take off, and review in PolyPDF.');
  expect(proof.getAttribute('href')).toBe(localizedHref('/product-facts/#verified-construction-example', language));
  expect(pricing.getAttribute('href')).toContain(`source=intl_${locale.id}_browser_tools`);
  expect(pricing.getAttribute('hreflang')).toBe('en');
  expect(pricing.textContent).toContain(strings.English);
  expect(node.textContent).toContain(strings['Free: calibration, markup, and up to 3 hand-created measurements per document.']);
  expect([...node.querySelectorAll('a[download]')].map(a => a.getAttribute('href')))
    .toEqual(Object.values(DOWNLOADS).map(p => p.url));
});
