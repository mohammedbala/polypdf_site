import { useSyncExternalStore } from 'react';

// Platform detection + the one place download facts live. Every download button on the site goes
// through this module so the primary CTA always offers the visitor's own OS (the VS Code / Cursor
// pattern) and the other platform stays one click away — never platform copy hardcoded per page.

export const DOWNLOADS = {
  mac: {
    key: 'mac',
    name: 'macOS',
    url: '/downloads/PolyPDFMac.dmg',
    requirements: 'macOS 14+ · Apple silicon & Intel',
    kind: 'DMG'
  },
  windows: {
    key: 'windows',
    name: 'Windows',
    url: '/downloads/windows/PolyPDFSetup.exe',
    requirements: 'Windows 10/11 · 64-bit',
    kind: 'signed installer'
  }
};

// 'mac' | 'windows' | null (null = unknown: mobile, Linux, bots). Checked once at module load for
// event-time helpers. Rendered controls use `usePlatform` below so their first client render stays
// identical to the platform-neutral prerender; detection is applied immediately after hydration.
export function detectPlatform() {
  if (typeof navigator === 'undefined') return null;
  const uaData = navigator.userAgentData;
  const source = `${uaData?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
  // iPhones/iPads report Mac-like strings but cannot run the app; treat mobile as unknown.
  if (/iphone|ipad|android/i.test(source)) return null;
  if (/mac/i.test(source)) return 'mac';
  if (/win/i.test(source)) return 'windows';
  return null;
}

const detected = detectPlatform();

// The visitor's platform (Mac when unknown — PolyPDF is Mac-first and desktop visitors on Linux/bots
// still get a working link) and the other one, for the "Also on …" line.
export const primaryPlatform = DOWNLOADS[detected ?? 'mac'];
export const otherPlatform = primaryPlatform.key === 'mac' ? DOWNLOADS.windows : DOWNLOADS.mac;
export const platformKnown = detected !== null;

const subscribeToStablePlatform = () => () => {};
const serverPlatformSnapshot = () => null;

export function usePlatform() {
  const detectedKey = useSyncExternalStore(
    subscribeToStablePlatform,
    detectPlatform,
    serverPlatformSnapshot
  );

  const detectedPlatform = DOWNLOADS[detectedKey ?? 'mac'];
  return {
    primaryPlatform: detectedPlatform,
    otherPlatform: detectedPlatform.key === 'mac' ? DOWNLOADS.windows : DOWNLOADS.mac,
    platformKnown: detectedKey !== null
  };
}
