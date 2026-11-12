import { trackEvent } from './analytics';

import websiteDownloads from './websiteDownloads.js';
const { safeDesktopSetupUrl } = websiteDownloads;
export const { DESKTOP_SETUP_URL } = websiteDownloads;

// No documents, campaign tags or identifiers enter the copied/shared URL.
export async function performDesktopSetupAction(action, { browser = navigator, input } = {}) {
  const url = safeDesktopSetupUrl(input?.value);
  try {
    if (action === 'copy' && typeof browser.clipboard?.writeText === 'function') {
      await browser.clipboard.writeText(url);
      return 'copied';
    }
    if (action === 'share' && typeof browser.share === 'function') {
      await browser.share({ title: 'PolyPDF', url });
      return 'shared';
    }
  } catch (error) {
    if (action === 'share' && error?.name === 'AbortError') return 'cancelled';
  }
  input?.focus();
  input?.select();
  return 'manual';
}

const attached = new WeakSet();
export function attachDesktopSetup(container) {
  if (!container || attached.has(container)) return () => {};
  attached.add(container);
  const input = container.querySelector('input');
  const handlers = [];
  for (const button of container.querySelectorAll('[data-desktop-link-action]')) {
    const action = button.dataset.desktopLinkAction;
    const available = action === 'copy'
      ? typeof navigator.clipboard?.writeText === 'function'
      : action === 'share' && typeof navigator.share === 'function';
    button.hidden = !available;
    const handler = async () => {
      if (button.disabled) return;
      button.disabled = true;
      const outcome = await performDesktopSetupAction(action, { input });
      if (!container.isConnected) return;
      button.disabled = false;
      for (const status of container.querySelectorAll('[data-desktop-link-status]')) {
        status.hidden = status.dataset.desktopLinkStatus !== outcome;
      }
      trackEvent('desktop_link_action', {
        source: container.dataset.desktopLinkSource || 'desktop_setup',
        target: action, reason: outcome
      });
    };
    button.addEventListener('click', handler);
    handlers.push([button, handler]);
  }
  return () => {
    for (const [button, handler] of handlers) button.removeEventListener('click', handler);
    attached.delete(container);
  };
}
