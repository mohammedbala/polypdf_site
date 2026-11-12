'use strict';
const languages = require('./websiteDownloadLanguages.json');
const ORIGIN = 'https://www.polypdf.com';
const paths = { mac: '/downloads/PolyPDFMac.dmg', windows: '/downloads/windows/PolyPDFSetup.exe' };
const localizedPath = (platform, tag) => platform === 'mac'
  ? `/downloads/PolyPDFMac-${tag}.dmg` : `/downloads/windows/PolyPDFSetup-${tag}.exe`;

function downloadPlatform(raw) {
  if (typeof raw !== 'string') return null;
  let url;
  try { url = new URL(raw, ORIGIN); } catch { return null; }
  if (url.origin !== ORIGIN) return null;
  return Object.keys(paths).find(platform => url.pathname === paths[platform]
    || Object.values(languages).some(tag => url.pathname === localizedPath(platform, tag))) || null;
}

function websiteDownloadHref(raw, localeId) {
  const platform = downloadPlatform(raw), tag = languages[localeId];
  if (!platform || typeof tag !== 'string') return raw;
  const url = new URL(raw, ORIGIN);
  const result = localizedPath(platform, tag) + url.search + url.hash;
  return raw.startsWith('/') && !raw.startsWith('//') ? result : ORIGIN + result;
}

function downloadFilename(raw) {
  return downloadPlatform(raw) ? new URL(raw, ORIGIN).pathname.split('/').pop() : undefined;
}

const DESKTOP_SETUP_URL = ORIGIN + '/#download';
const desktopSetupUrl = localeId => typeof languages[localeId] === 'string'
  ? `${ORIGIN}/${localeId}/#download` : DESKTOP_SETUP_URL;
const safeDesktopSetupUrl = value => Object.keys(languages).map(desktopSetupUrl).includes(value)
  ? value : DESKTOP_SETUP_URL;

module.exports = { websiteDownloadHref, downloadPlatform, downloadFilename, desktopSetupUrl, safeDesktopSetupUrl, DESKTOP_SETUP_URL };
