'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const build = path.resolve(process.env.BUILD_PATH || 'build');
function page(signal = false) {
  const html = fs.readFileSync(path.join(build, 'es/pdf-takeoff-software/index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://www.polypdf.com/es/pdf-takeoff-software/?private=never-send', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  if (signal) Object.defineProperty(w.navigator, 'globalPrivacyControl', { value: true });
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
  assert.equal(event[2].platform, 'mac'); assert.equal(event[2].source, 'localized_content');
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
