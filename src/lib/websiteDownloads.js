'use strict';
const siteRelease = require('./siteRelease.json');
const localizedRelease = require('./websiteDownloadLanguages.json');
const { languages } = localizedRelease;
const siteLocales = require('./locales.json');
// Language-specific installers are published separately from the stable download URLs.
const localizedInstallersCurrent = localizedRelease.version === siteRelease.version
  && localizedRelease.build === siteRelease.build;
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
  if (!platform) return raw;
  const url = new URL(raw, ORIGIN);
  const pathname = localizedInstallersCurrent && typeof tag === 'string' ? localizedPath(platform, tag) : paths[platform];
  const result = pathname + url.search + url.hash;
  return raw.startsWith('/') && !raw.startsWith('//') ? result : ORIGIN + result;
}

function downloadFilename(raw) {
  return downloadPlatform(raw) ? new URL(raw, ORIGIN).pathname.split('/').pop() : undefined;
}

const DESKTOP_SETUP_URL = ORIGIN + '/#download';
const setupLinks = new Map(siteLocales.map(({ id }) => [id, `${ORIGIN}/${id}/#download`]));
const desktopSetupUrl = localeId => setupLinks.get(localeId) || DESKTOP_SETUP_URL;
const safeDesktopSetupUrl = value => [...setupLinks.values()].includes(value) ? value : DESKTOP_SETUP_URL;

module.exports = { websiteDownloadHref, downloadPlatform, downloadFilename, desktopSetupUrl, safeDesktopSetupUrl, DESKTOP_SETUP_URL };
