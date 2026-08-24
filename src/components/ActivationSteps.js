import React from 'react';
import { primaryPlatform } from '../lib/platform';

// What happens between paying and measuring — the part of the funnel the site never described.
//
// Until now the only place these instructions existed was inside the licence email
// (Website/license-api/src/server.js), which a buyer cannot read before deciding to buy. "How hard
// is this to set up?" was an open question at the moment of payment.
//
// Every string here is checked against the app:
//   key shape          PPM-XXXX-XXXX-XXXX   generateLicenseKey(), server.js
//   macOS menu path    PolyPDF ▸ Upgrade to PolyPDF Pro…    menus.ts (⌘⇧L)
//   Windows menu path  Help ▸ Upgrade to PolyPDF Pro…       menus.ts (Ctrl+⇧+L)
//   button label       Activate                             license-messages.ts
// If the app renames that menu item, this file changes with it.

export const LICENSE_KEY_MASK = 'PPM-XXXX-XXXX-XXXX';

const MENU_PATHS = {
  mac: { label: 'On a Mac', path: 'PolyPDF ▸ Upgrade to PolyPDF Pro…', shortcut: '⌘⇧L' },
  windows: { label: 'On Windows', path: 'Help ▸ Upgrade to PolyPDF Pro…', shortcut: 'Ctrl+⇧+L' }
};

// Detected platform first, the other one still visible — people buy on one machine and activate on
// another, and the licence covers three.
const orderedMenuPaths = () =>
  primaryPlatform.key === 'windows'
    ? [MENU_PATHS.windows, MENU_PATHS.mac]
    : [MENU_PATHS.mac, MENU_PATHS.windows];

const ActivationSteps = ({ heading = 'Activating takes about a minute' }) => (
  <div className="activation-steps">
    {heading && <p className="activation-heading">{heading}</p>}
    <ol className="activation-list">
      <li>
        <span className="activation-step-index" aria-hidden="true">1</span>
        <div>
          <strong>Check your email for the key.</strong> It is sent as soon as Stripe confirms the
          payment and looks like <code className="license-mask">{LICENSE_KEY_MASK}</code>.
        </div>
      </li>
      <li>
        <span className="activation-step-index" aria-hidden="true">2</span>
        <div>
          <strong>Open the upgrade window in PolyPDF.</strong>
          <span className="activation-paths">
            {orderedMenuPaths().map((entry) => (
              <span className="activation-path" key={entry.label}>
                {entry.label}: <code>{entry.path}</code> <span className="activation-shortcut">{entry.shortcut}</span>
              </span>
            ))}
          </span>
        </div>
      </li>
      <li>
        <span className="activation-step-index" aria-hidden="true">3</span>
        <div>
          <strong>Paste the key and click Activate.</strong> No restart, no reinstall. The
          measurement cap lifts and Symbol Search plus plugins unlock as soon as the key is accepted.
          The drawing you had open keeps every measurement and markup already on it.
        </div>
      </li>
    </ol>
  </div>
);

export default ActivationSteps;
