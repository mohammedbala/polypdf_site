import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaTag, FaApple, FaWindows } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

// This page reads the same feeds the apps update from — the Sparkle appcast on Mac and
// electron-updater's latest.yml on Windows — so a release publishes itself here with no edit.
const MAC_FEED = '/downloads/polypdfmac-appcast.xml';
const WINDOWS_FEED = '/downloads/windows/latest.yml';

// The downloads directory is served immutable with a one-year max-age, so a plain fetch would keep
// showing a cached feed long after a release. Vary the URL hourly to get a fresh copy.
const feedUrl = (path) => `${path}?t=${Math.floor(Date.now() / 3600000)}`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const SHORT_MONTHS = MONTHS.map((month) => month.slice(0, 3));

// Dates are formatted from the feed's own calendar fields rather than through the viewer's
// timezone: a release published late in the evening would otherwise show the following day.
const formatFeedDate = (value) => {
  const rfc822 = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(value || '');
  if (rfc822) {
    const month = SHORT_MONTHS.indexOf(rfc822[2]);
    if (month >= 0) return `${MONTHS[month]} ${Number(rfc822[1])}, ${rfc822[3]}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`;
};

// Matched on localName so the sparkle: prefixed elements resolve without namespace juggling.
const childText = (parent, localName) => {
  const child = Array.from(parent.children).find((node) => node.localName === localName);
  return child ? child.textContent.trim() : '';
};

export const fetchMacReleases = async () => {
  const response = await fetch(feedUrl(MAC_FEED), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`appcast responded ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('appcast is not valid XML');

  const releases = Array.from(doc.getElementsByTagName('item'))
    .map((item) => {
      const build = Number(childText(item, 'version'));
      const pubDate = childText(item, 'pubDate');
      return {
        platform: 'macOS',
        version: childText(item, 'shortVersionString') || childText(item, 'title'),
        build,
        date: formatFeedDate(pubDate),
        sortKey: Date.parse(pubDate) || 0,
        notes: childText(item, 'releaseNotesLink') || null
      };
    })
    .filter((release) => release.version && Number.isFinite(release.build))
    .sort((a, b) => b.build - a.build);

  if (!releases.length) throw new Error('appcast carries no releases');
  return releases;
};

export const fetchWindowsRelease = async () => {
  const response = await fetch(feedUrl(WINDOWS_FEED), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`latest.yml responded ${response.status}`);
  const text = await response.text();

  const version = (/^version:\s*'?([^'\s]+)'?/m.exec(text) || [])[1];
  if (!version) throw new Error('latest.yml carries no version');
  // latest.yml has no build field; the build is the suffix of the versioned installer it points at.
  const build = Number((/PolyPDFSetup-v[\d.]+-(\d+)\.exe/.exec(text) || [])[1]);
  const releaseDate = (/^releaseDate:\s*'?([^'\n]+?)'?\s*$/m.exec(text) || [])[1];

  return {
    platform: 'Windows',
    version,
    build: Number.isFinite(build) ? build : null,
    date: formatFeedDate(releaseDate),
    sortKey: Date.parse(releaseDate) || 0,
    notes: null
  };
};

// Human summaries, keyed by platform, version and build. A release the feed carries without an entry
// here still renders — it just shows its date and its release-notes link.
const RELEASE_PROSE = {
  'macOS 1.1.3 (8)': [
    'Saved style defaults, per tool: set highlight color, pen color, font and more once — every new markup uses them, even after quitting and reopening. Right-click a markup and choose "Set as Tool Default", or adjust the style bar with nothing selected.',
    'Text boxes and callouts start empty, so you can place and type straight away.',
    'The Callout keyboard shortcut is now Q, matching the key most estimators already use.',
    'Fixed: on Macs without Xcode, PolyPDF could trigger a macOS prompt to install the command line developer tools. They were never needed, and the prompt is gone.'
  ],
  'macOS 1.1.2 (7)': [
    'Visual Search and automatic counting: select a symbol on a drawing and PolyPDF finds the other instances on the page, ready to commit as a Count series in one step.',
    'A dedicated search panel with results in context and highlighting across the document.',
    'Fixed: Command-X/C/V/A did nothing in text fields — including the license key box. All four shortcuts work everywhere now.',
    'Fixed: a temporary network problem could reset an activated Pro copy to the Free tier.',
    'Fixed: edits to markups imported from 1.0.x-era files could be silently undone on reopen.',
    'Fixed: saving certain large CAD and plan-set PDFs could produce a file other viewers reported as damaged.'
  ],
  'macOS 1.1.1 (6)': [
    'Fixed: after closing the last window, opening a PDF from the Finder did nothing. It now opens in a new window as expected.',
    'Fill and hatch opacity controls are now steppers with 10% increments.'
  ],
  'macOS 1.1.0 (5)': [
    'A major new foundation for PolyPDF, verified against the ISO 32000-2 PDF standard.',
    'Measurements and takeoff: calibrate a sheet once, measure lengths, areas, and counts, and pull totals into a takeoff worksheet.',
    'Full markup set: clouds, callouts, hatches, industry line styles, stamps, snapshots, and built-in symbol tool sets.',
    'Compare Documents: differences between two revisions arrive as editable revision-cloud markups.',
    'OCR for scanned sheets, including rotated labels on plan sets.',
    'Forms and digital signatures, Bates numbering, watermarks, flatten, page operations, and true content-removing redaction.'
  ],
  'macOS 1.0.3 (4)': ['Maintenance release for the original native Mac app.'],
  'macOS 1.0.2 (3)': ['Maintenance release for the original native Mac app.'],
  'macOS 1.0.1 (2)': ['Maintenance release for the original native Mac app.'],
  'Windows 1.1.3 (8)': [
    'The first signed release of PolyPDF for Windows 10 and 11: the installer and the app are code-signed by Euclidean Software, LLC.',
    'The same PolyPDF engine as the Mac app, at the same version.',
    'Updates install themselves — a new version downloads in the background and is applied when you quit.'
  ]
};

const proseKey = (release) => `${release.platform} ${release.version} (${release.build})`;

// Rendered only while the feeds are still loading, or if one cannot be reached, so the page is never
// empty. Anything the feeds return replaces it.
const FALLBACK_RELEASES = [
  { platform: 'Windows', version: '1.1.3', build: 8, date: 'July 29, 2026', notes: null },
  { platform: 'macOS', version: '1.1.3', build: 8, date: 'July 28, 2026', notes: '/downloads/PolyPDFMac-v1.1.3-8.html' },
  { platform: 'macOS', version: '1.1.2', build: 7, date: 'July 28, 2026', notes: '/downloads/PolyPDFMac-v1.1.2-7.html' },
  { platform: 'macOS', version: '1.1.1', build: 6, date: 'July 23, 2026', notes: '/downloads/PolyPDFMac-v1.1.1-6.html' },
  { platform: 'macOS', version: '1.1.0', build: 5, date: 'July 19, 2026', notes: '/downloads/PolyPDFMac-v1.1.0-5.html' },
  { platform: 'macOS', version: '1.0.3', build: 4, date: 'April 27, 2026', notes: null },
  { platform: 'macOS', version: '1.0.2', build: 3, date: 'April 27, 2026', notes: null },
  { platform: 'macOS', version: '1.0.1', build: 2, date: 'April 27, 2026', notes: null }
].map((release) => ({ ...release, sortKey: Date.parse(release.date) }));

const platformIcon = (platform) => (platform === 'Windows' ? <FaWindows /> : <FaApple />);

const platformChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  marginLeft: 'auto',
  padding: '0.2rem 0.75rem',
  borderRadius: 999,
  background: 'var(--accent-soft)',
  color: 'var(--gray-700)',
  fontSize: '0.85rem',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

const currentVersionLine = (releases) => {
  const parts = ['macOS', 'Windows']
    .map((platform) => releases.find((release) => release.platform === platform))
    .filter(Boolean)
    .map((release) => `${release.platform} ${release.version} (${release.build})`);
  return parts.length ? `Current: ${parts.join(' · ')}` : '';
};

const VersionHistory = () => {
  const [releases, setReleases] = useState(FALLBACK_RELEASES);
  const [feedFailed, setFeedFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchMacReleases(), fetchWindowsRelease()]).then(([mac, windows]) => {
      if (cancelled) return;
      const fallbackFor = (platform) => FALLBACK_RELEASES.filter((release) => release.platform === platform);
      const macReleases = mac.status === 'fulfilled' ? mac.value : fallbackFor('macOS');
      const windowsReleases = windows.status === 'fulfilled' ? [windows.value] : fallbackFor('Windows');

      setFeedFailed(mac.status === 'rejected' || windows.status === 'rejected');
      setReleases([...macReleases, ...windowsReleases].sort(
        (a, b) => (b.sortKey || 0) - (a.sortKey || 0) || (b.build || 0) - (a.build || 0)
      ));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="legal-page version-history">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
        </nav>
      </header>

      <motion.main
        className="legal-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="legal-hero">
            <h1>Version History</h1>
            <p className="legal-subtitle">What has shipped in PolyPDF for Mac and Windows, release by release</p>
            <p className="last-updated">{currentVersionLine(releases)}</p>
          </div>

          <div className="legal-intro">
            <p>
              PolyPDF updates itself. On Mac, choose Help &gt; Check for Updates in the app, or accept the
              update prompt when it appears. On Windows, an update downloads in the background and installs
              when you quit. Existing Pro activations always carry over — an update never costs you your
              license.
            </p>
            <p className="last-updated">
              Versions read as version (build); the number in parentheses is the build number support asks
              for.{feedFailed && ' The live update feed could not be reached, so this list may be behind.'}
            </p>
          </div>

          <div className="legal-sections">
            {releases.map((release, index) => {
              const highlights = RELEASE_PROSE[proseKey(release)];
              return (
                <motion.section
                  key={proseKey(release)}
                  className="legal-section"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index, 6) * 0.06 }}
                >
                  <div className="section-header">
                    <div className="section-icon"><FaTag /></div>
                    <h2>{release.build ? `${release.version} (${release.build})` : release.version}</h2>
                    <span style={platformChip}>
                      {platformIcon(release.platform)} {release.platform}
                    </span>
                  </div>
                  <p className="last-updated">{release.date}</p>
                  {highlights && (
                    <ul className="section-content">
                      {highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {release.notes && (
                    <p style={{ marginTop: '1rem' }}>
                      <a href={release.notes} target="_blank" rel="noopener noreferrer">
                        Full release notes
                      </a>
                    </p>
                  )}
                </motion.section>
              );
            })}
          </div>
        </div>
      </motion.main>

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/windows">Windows</Link>
              <Link to="/support">Support</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VersionHistory;
