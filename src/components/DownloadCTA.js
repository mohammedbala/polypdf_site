import React from 'react';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import { FaApple, FaWindows } from 'react-icons/fa';
import { DOWNLOADS, primaryPlatform, otherPlatform } from '../lib/platform';

const trackEvent = (name, properties = {}) => {
  if (window.plausible) {
    window.plausible(name, { props: properties });
  }
  if (window.gtag) {
    window.gtag('event', name, properties);
  }
};

const PlatformIcon = ({ platform }) => (platform.key === 'mac' ? <FaApple /> : <FaWindows />);

// The one download control: a primary button for the visitor's detected OS with the requirements
// line under it, and the other platform one click away. `source` feeds the download_click analytics
// event so the funnel can tell which section converts.
const DownloadCTA = ({ source, size = '', onDownload }) => {
  const click = (platform) => {
    trackEvent('download_click', { source, platform: platform.key });
    if (onDownload) onDownload();
  };

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
