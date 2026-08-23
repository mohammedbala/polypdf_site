import React, { useState } from 'react';
import {
  AppleLogo,
  DownloadSimple,
  WindowsLogo
} from '@phosphor-icons/react';
import { DOWNLOADS, primaryPlatform, otherPlatform, platformKnown } from '../lib/platform';
import MagneticLink from './MagneticLink';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const PlatformIcon = ({ platform }) => (
  platform.key === 'mac'
    ? <AppleLogo aria-hidden="true" weight="bold" />
    : <WindowsLogo aria-hidden="true" weight="bold" />
);

// The free tier's one limit, stated at the control that commits to it.
//
// It was already on the page — in the stat tiles, the pricing card, the FAQ and /buy — but never
// beside a Download button. A cap read before downloading is a fair deal; the same cap met after
// twenty minutes of work on a real drawing feels like bait. Same fact, different feeling, and the
// difference is 200 pixels.
export const FREE_TIER_LIMIT_TEXT =
  'Free with no trial timer. Hand-created measurements are capped at 3 per document.';

// What to do while the file lands. This is the moment most download funnels leak — the visitor has
// committed, the browser is quiet, and nothing tells them the next step (or warns Windows users
// about SmartScreen before it startles them).
const INSTALL_STEPS = {
  mac: 'Open the DMG and drag PolyPDF to Applications, then launch it from there.',
  windows:
    'Run PolyPDFSetup.exe when it finishes. If SmartScreen shows a notice on a brand-new release, choose "More info", then "Run anyway".'
};

// Three steps to a first real measurement. Calibration is step two because a measurement taken
// before it is a number without a unit — it is the one thing a new user must not skip, and the one
// thing nothing on the site used to mention until after the download was already forgotten.
const FIRST_TAKEOFF_STEPS = [
  'Open one of the PDF drawings you already have.',
  'Calibrate the scale once — pick a standard architectural scale, or draw along a known dimension and type what it should read.',
  'Measure a length or an area. Results land in the takeoff worksheet, ready to export as CSV or PDF.'
];

// Shown in place after a download click: no popup, no timer, no email gate. It is the only thing
// standing in the gap between the download and the moment the user meets the measurement cap.
const WhileItInstalls = ({ platformKey, tone }) => (
  <div className={`dl-next ${tone}`}>
    <p className="dl-next-install">{INSTALL_STEPS[platformKey]}</p>
    <p className="dl-next-heading">Then, three steps to your first takeoff</p>
    <ol className="dl-next-steps">
      {FIRST_TAKEOFF_STEPS.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
    <p className="dl-next-foot">
      Everything above is free, for as long as you want it. The one cap is 3 hand-created
      measurements per document; PolyPDF Pro removes it for $49.99 once, on up to 3 computers.
    </p>
  </div>
);

// The one download control: a primary button for the visitor's detected OS with the requirements
// line under it, and the other platform one click away. On phones and unknown platforms it offers
// BOTH desktop builds instead of pushing a 228 MB DMG at a device that cannot run it. `source`
// feeds the download_click analytics event so the funnel can tell which section converts.
const DownloadCTA = ({ source, size = '', onDownload, tone = '', adjacentAction = null }) => {
  const [started, setStarted] = useState(null);

  const click = (platform) => {
    trackEvent('download_click', { source, platform: platform.key });
    setStarted(platform.key);
    if (onDownload) onDownload();
  };

  if (!platformKnown) {
    return (
      <div className="dl-cta">
        <div className="dl-primary-row">
          <div className="dl-both">
            {[DOWNLOADS.mac, DOWNLOADS.windows].map((platform) => (
              <MagneticLink key={platform.key} href={platform.url} className={`primary-btn ${size}`.trim()} download onClick={() => click(platform)}>
                <PlatformIcon platform={platform} /> Download for {platform.name}
              </MagneticLink>
            ))}
          </div>
          {adjacentAction}
        </div>
        <p className="dl-meta">PolyPDF runs on Mac and Windows desktops — pick the download for the machine you work on.</p>
        <p className="dl-terms">{FREE_TIER_LIMIT_TEXT}</p>
        {started && <WhileItInstalls platformKey={started} tone={tone} />}
      </div>
    );
  }

  return (
    <div className="dl-cta">
      <div className="dl-primary-row">
        <MagneticLink
          href={primaryPlatform.url}
          className={`primary-btn ${size}`.trim()}
          download
          onClick={() => click(primaryPlatform)}
        >
          <DownloadSimple aria-hidden="true" weight="bold" /> Download free for {primaryPlatform.name}
        </MagneticLink>
        {adjacentAction}
      </div>
      <p className="dl-meta">
        {primaryPlatform.requirements}
        <span className="dl-meta-sep" aria-hidden="true">·</span>
        <a href={otherPlatform.url} className="dl-alt" download onClick={() => click(otherPlatform)}>
          <PlatformIcon platform={otherPlatform} /> Also on {otherPlatform.name}
        </a>
      </p>
      <p className="dl-terms">{FREE_TIER_LIMIT_TEXT}</p>
      {started && <WhileItInstalls platformKey={started} tone={tone} />}
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
