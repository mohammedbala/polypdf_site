import React, { useState } from 'react';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import { FaApple, FaWindows } from 'react-icons/fa';
import { DOWNLOADS, primaryPlatform, otherPlatform, platformKnown } from '../lib/platform';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const PlatformIcon = ({ platform }) => (platform.key === 'mac' ? <FaApple /> : <FaWindows />);

// What to do while the file lands. This is the moment most download funnels leak — the visitor has
// committed, the browser is quiet, and nothing tells them the next step (or warns Windows users
// about SmartScreen before it startles them).
const NEXT_STEPS = {
  mac: 'Downloading the DMG — open it and drag PolyPDF to Applications, then launch it from there.',
  windows:
    'Downloading the signed installer — run PolyPDFSetup.exe when it finishes. If SmartScreen shows a notice on a brand-new release, choose "More info", then "Run anyway".'
};

// The one download control: a primary button for the visitor's detected OS with the requirements
// line under it, and the other platform one click away. On phones and unknown platforms it offers
// BOTH desktop builds instead of pushing a 228 MB DMG at a device that cannot run it. `source`
// feeds the download_click analytics event so the funnel can tell which section converts.
const DownloadCTA = ({ source, size = '', onDownload }) => {
  const [started, setStarted] = useState(null);

  const click = (platform) => {
    trackEvent('download_click', { source, platform: platform.key });
    setStarted(platform.key);
    if (onDownload) onDownload();
  };

  if (!platformKnown) {
    return (
      <div className="dl-cta">
        <div className="dl-both">
          {[DOWNLOADS.mac, DOWNLOADS.windows].map((platform) => (
            <a key={platform.key} href={platform.url} className={`primary-btn ${size}`.trim()} download onClick={() => click(platform)}>
              <PlatformIcon platform={platform} /> Download for {platform.name}
            </a>
          ))}
        </div>
        <p className="dl-meta">PolyPDF runs on Mac and Windows desktops — grab the build for the machine you work on.</p>
        {started && <p className="dl-next">{NEXT_STEPS[started]}</p>}
      </div>
    );
  }

  return (
    <div className="dl-cta">
      <a
        href={primaryPlatform.url}
        className={`primary-btn ${size}`.trim()}
        download
        onClick={() => click(primaryPlatform)}
      >
        <HiOutlineCloudDownload /> Download free for {primaryPlatform.name}
      </a>
      <p className="dl-meta">
        {primaryPlatform.requirements}
        <span className="dl-meta-sep" aria-hidden="true">·</span>
        <a href={otherPlatform.url} className="dl-alt" download onClick={() => click(otherPlatform)}>
          <PlatformIcon platform={otherPlatform} /> Also on {otherPlatform.name}
        </a>
      </p>
      {started && <p className="dl-next">{NEXT_STEPS[started]}</p>}
    </div>
  );
};

// Explicit two-button variant for pages where the visitor may be grabbing the app for a DIFFERENT
// machine than the one they are browsing on (the post-purchase account page, most of all).
export const DownloadBoth = ({ source }) => (
  <div className="dl-both">
    {[DOWNLOADS.mac, DOWNLOADS.windows].map((platform) => (
      <a
        key={platform.key}
        href={platform.url}
        className="secondary-btn"
        download
        onClick={() => trackEvent('download_click', { source, platform: platform.key })}
      >
        <PlatformIcon platform={platform} /> Download for {platform.name}
      </a>
    ))}
  </div>
);

export default DownloadCTA;
