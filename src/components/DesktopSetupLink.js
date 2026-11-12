import React, { useEffect, useRef } from 'react';
import { attachDesktopSetup } from '../lib/desktopSetup';
import websiteDownloads from '../lib/websiteDownloads.js';
import { localizeView, useToolkitLanguage } from '../toolkit/language';
import './DesktopSetupLink.css';
const { desktopSetupUrl } = websiteDownloads;

export default function DesktopSetupLink({ source = 'desktop_setup' }) {
  const ref = useRef(null);
  const language = useToolkitLanguage();
  useEffect(() => attachDesktopSetup(ref.current), []);
  return localizeView(<details className="desktop-setup" ref={ref}
    data-desktop-setup data-desktop-link-source={source}>
    <summary>Open this on your computer</summary>
    <div className="desktop-setup-body">
      <p>Copy this link and open it on a Mac or Windows PC.</p>
      <label>Desktop setup link
        <input type="url" readOnly value={desktopSetupUrl(language?.locale?.id)} spellCheck={false} autoComplete="off" />
      </label>
      <div className="desktop-setup-actions">
        <button type="button" data-desktop-link-action="copy" hidden>Copy link</button>
        <button type="button" data-desktop-link-action="share" hidden>Share link</button>
      </div>
      <div className="desktop-setup-status" role="status" aria-live="polite" aria-atomic="true">
        <p data-desktop-link-status="copied" hidden>Link copied.</p>
        <p data-desktop-link-status="shared" hidden>Link shared.</p>
        <p data-desktop-link-status="cancelled" hidden>Sharing cancelled. You can copy the link instead.</p>
        <p data-desktop-link-status="manual" hidden>Select and copy the link above.</p>
      </div>
    </div>
  </details>, language);
}
