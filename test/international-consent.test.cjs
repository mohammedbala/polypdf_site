'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const build = path.resolve(process.env.BUILD_PATH || 'build');
function page(signal = false, referrer = '', clipboard) {
  const html = fs.readFileSync(path.join(build, 'es/pdf-takeoff-software/index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://www.polypdf.com/es/pdf-takeoff-software/?private=never-send', referrer: referrer || undefined, runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  if (signal) Object.defineProperty(w.navigator, 'globalPrivacyControl', { value: true });
  if (clipboard) Object.defineProperty(w.navigator, 'clipboard', { value: clipboard });
  const script = w.document.querySelector('script[src]').getAttribute('src');
  w.eval(fs.readFileSync(path.join(build, script), 'utf8'));
  return dom;
}
test('localized pages default to no tracking; rejecting stores a refusal without loading Google', () => {
  const dom = page(); const w = dom.window, d = w.document;
  assert.equal(d.querySelector('[data-consent-banner]').hidden, false);
  assert.equal(d.querySelector('#polypdf-google-tag'), null);
  d.querySelector('[data-consent-action=reject]').click();
  assert.equal(d.querySelector('[data-consent-banner]').hidden, true);
  assert.equal(JSON.parse(w.localStorage.getItem('polypdf.cookie-consent.v1')).analytics, false);
  assert.equal(d.querySelector('#polypdf-google-tag'), null);
  dom.window.close();
});
test('analytics-only consent uses the shared safe page context and controlled download event', () => {
  const dom = page(); const w = dom.window, d = w.document;
  d.querySelector('[data-consent-action=settings]').click();
  assert.equal(d.querySelector('dialog').open, true);
  d.querySelector('[name=analytics]').checked = true;
  d.querySelector('[data-consent-action=save]').click();
  assert.equal(d.querySelector('dialog').open, false);
  assert.match(d.querySelector('#polypdf-google-tag').src, /G-GB6LW050TM/);
  const config = w.dataLayer.find(item => item[0] === 'config');
  assert.equal(config[1], 'G-GB6LW050TM');
  assert.equal(config[2].page_location, 'https://www.polypdf.com/es/pdf-takeoff-software/');
  const download = d.querySelector('a[href="/downloads/PolyPDFMac.dmg"]');
  download.addEventListener('click', event => event.preventDefault()); download.click();
  const event = w.dataLayer.find(item => item[1] === 'download_click');
  assert.equal(event[2].platform, 'mac'); assert.equal(event[2].cta_source, 'localized_content');
  assert.equal(JSON.stringify(w.dataLayer).includes('private=never-send'), false);
  d.querySelector('[data-consent-action=reject]').click();
  assert.equal(d.querySelector('#polypdf-google-tag'), null);
  assert.equal(w.gtag, undefined);
  dom.window.close();
});
test('GPC disables optional categories and the accept button', () => {
  const dom = page(true); const d = dom.window.document;
  assert.equal(d.querySelector('[name=analytics]').disabled, true);
  assert.equal(d.querySelector('[name=marketing]').disabled, true);
  assert.equal(d.querySelector('[data-consent-action=accept]').disabled, true);
  assert.equal(d.querySelector('[data-privacy-signal]').hidden, false);
  assert.equal(d.querySelector('#polypdf-google-tag'), null);
  dom.window.close();
});

test('built translated tracking carries safe AI referral context into a download and purges it on rejection', () => {
  const dom = page(false, 'https://perplexity.ai/search/private-question?token=secret');
  const w = dom.window, d = w.document;
  d.querySelector('[data-consent-action=settings]').click();
  d.querySelector('[name=analytics]').checked = true;
  d.querySelector('[data-consent-action=save]').click();
  const view = w.dataLayer.find(item => item[1] === 'page_view');
  assert.equal(view[2].entry_page, '/es/pdf-takeoff-software/');
  assert.equal(view[2].acquisition_source, 'perplexity');
  assert.equal(view[2].acquisition_channel, 'ai_referral');
  assert.equal(view[2].acquisition_basis, 'referrer');
  const download = d.querySelector('a[href="/downloads/PolyPDFMac.dmg"]');
  download.addEventListener('click', event => event.preventDefault()); download.click();
  const event = w.dataLayer.find(item => item[1] === 'download_click');
  assert.equal(event[2].entry_page, '/es/pdf-takeoff-software/');
  assert.equal(event[2].acquisition_source, 'perplexity');
  assert.doesNotMatch(JSON.stringify(w.dataLayer), /private-question|token=secret|private=never-send/);
  assert.equal(JSON.parse(w.sessionStorage.getItem('polypdf.analytics-visit.v1')).context.acquisition_source, 'perplexity');
  d.querySelector('[data-consent-action=reject]').click();
  assert.equal(w.sessionStorage.getItem('polypdf.analytics-visit.v1'), null);
  assert.equal(w.gtag, undefined);
  dom.window.close();
});

test('translated primary evaluation keeps installer, sample and guide events distinct', () => {
  const dom = page(); const w = dom.window, d = w.document;
  try {
    const download = d.querySelector('a[href="/downloads/PolyPDFMac.dmg"]');
    const exercise = download.closest('.dl-cta').querySelector('.dl-evaluation');
    const sample = d.querySelector('#construction-example-takeoff a[href="/samples/construction/02-Architectural-Revision-A.pdf"]');
    const guide = exercise.querySelector('[data-evaluation-target="guide"]');
    for (const a of [download, sample, guide]) a.addEventListener('click', e => e.preventDefault());
    assert.equal(exercise.querySelector('details'), null);
    assert.equal(guide.getAttribute('href'), '#try-a-takeoff');
    assert(d.querySelector(guide.getAttribute('href')));
    assert.equal(d.querySelectorAll('#construction-example-takeoff').length, 1);
    download.click(); sample.click(); guide.click();
    assert.equal(w.dataLayer, undefined);
    d.querySelector('[data-consent-action=settings]').click();
    d.querySelector('[name=analytics]').checked = true;
    d.querySelector('[data-consent-action=save]').click();
    download.click(); sample.click(); guide.click();
    assert.equal(w.dataLayer.filter(c => c[1] === 'download_click').length, 1);
    assert.equal(w.dataLayer.find(c => c[1] === 'sample_download')[2].feature, 'practice_file');
    assert.equal(w.dataLayer.find(c => c[1] === 'download_evaluation_click')[2].target, 'guide');
    assert.equal(w.dataLayer.some(c => ['purchase', 'conversion', 'browser_tool_complete'].includes(c[1])), false);
  } finally { dom.window.close(); }
});

test('built static desktop link works without tracking and reports only a consented copy outcome', async () => {
  const copied = [];
  const dom = page(false, 'https://chatgpt.com/c/private', { writeText: async value => copied.push(value) });
  const w = dom.window, d = w.document;
  const setup = d.querySelector('[data-desktop-setup]');
  assert(setup);
  const input = setup.querySelector('input'), copy = setup.querySelector('[data-desktop-link-action="copy"]');
  assert.equal(input.readOnly, true);
  assert.equal(input.value, 'https://www.polypdf.com/#download');
  assert.equal(copy.hidden, false);
  assert.equal(setup.querySelector('[data-desktop-link-action="share"]').hidden, true);
  copy.click(); await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(copied, ['https://www.polypdf.com/#download']);
  assert.equal(w.dataLayer, undefined);
  assert.equal(setup.querySelector('[data-desktop-link-status="copied"]').hidden, false);
  d.querySelector('[data-consent-action=settings]').click();
  d.querySelector('[name=analytics]').checked = true;
  d.querySelector('[data-consent-action=save]').click();
  copy.click(); await new Promise(resolve => setTimeout(resolve, 0));
  const event = w.dataLayer.find(item => item[1] === 'desktop_link_action');
  assert.equal(event[2].reason, 'copied');
  assert.equal(event[2].target, 'copy');
  assert.equal(event[2].cta_source, setup.dataset.desktopLinkSource);
  assert.equal(event[2].acquisition_source, 'chatgpt');
  assert(!Object.hasOwn(event[2], 'source'));
  assert.doesNotMatch(JSON.stringify(w.dataLayer), /c\/private|private=never-send/);
  assert.equal(w.dataLayer.filter(item => ['download_click','purchase','conversion'].includes(item[1])).length,0);
  dom.window.close();
});
