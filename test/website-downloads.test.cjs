'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { websiteDownloadHref, downloadPlatform, desktopSetupUrl, safeDesktopSetupUrl } = require('../src/lib/websiteDownloads.js');
const { localizeLinks } = require('../scripts/international/content.cjs');

test('each translated page downloads the current desktop release and shares its own setup URL', () => {
  for (const id of ['de', 'fr', 'es', 'pt-br', 'ar', 'hi', 'zh-cn', 'ja']) {
    const dom = new JSDOM('<a href="/downloads/PolyPDFMac.dmg" download>Mac</a><a href="/downloads/windows/PolyPDFSetup.exe" download>Windows</a><details data-desktop-setup><input readonly type="url" value="https://www.polypdf.com/#download"></details>');
    localizeLinks(dom.window.document, { id }, s => s);
    const anchors = [...dom.window.document.querySelectorAll('a')];
    assert.deepEqual(anchors.map(a => a.getAttribute('href')), ['/downloads/PolyPDFMac.dmg', '/downloads/windows/PolyPDFSetup.exe']);
    assert.deepEqual(anchors.map(a => a.download), ['PolyPDFMac.dmg', 'PolyPDFSetup.exe']);
    assert.equal(dom.window.document.querySelector('input').value, desktopSetupUrl(id));
    assert.equal(safeDesktopSetupUrl(desktopSetupUrl(id)), desktopSetupUrl(id));
    dom.window.close();
  }
});

test('only allowlisted public downloads and setup links receive a language hint', () => {
  const generic = '/downloads/PolyPDFMac.dmg';
  for (const id of ['en', 'it', 'ja', 'unknown', '__proto__']) assert.equal(websiteDownloadHref(generic, id), generic);
  for (const href of ['https://elsewhere.test/downloads/PolyPDFMac.dmg', '/downloads/PolyPDFMac-v1.6.32-114.dmg', 'javascript:alert(1)']) {
    assert.equal(websiteDownloadHref(href, 'de'), href);
    assert.equal(downloadPlatform(href), null);
  }
  assert.equal(websiteDownloadHref('https://www.polypdf.com/downloads/PolyPDFMac-fr-FR.dmg?from=guide#mac', 'fr'),
    'https://www.polypdf.com/downloads/PolyPDFMac.dmg?from=guide#mac');
  for (const value of ['https://elsewhere.test/de/#download', 'https://www.polypdf.com/de/?private=secret#download', 'https://www.polypdf.com/it/#download']) {
    assert.equal(safeDesktopSetupUrl(value), 'https://www.polypdf.com/#download');
  }
});
