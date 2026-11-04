// Small progressive enhancement for static translations; never hydrate the English app.
import { CONSENT_CHANGED, CONSENT_KEY, CONSENT_MAX_AGE, readConsent, saveConsent, privacySignalEnabled } from './consent';
import { syncTracking } from './tracking';
import { trackEvent } from './analytics';
import { captureAttribution } from './attribution';
import { attachDesktopSetup } from './desktopSetup';
document.querySelectorAll('[data-desktop-setup]').forEach(attachDesktopSetup);
const root = document.querySelector('[data-local-consent]');
if (root) {
  const banner = root.querySelector('[data-consent-banner]');
  const dialog = root.querySelector('dialog');
  const analytics = root.querySelector('[name=analytics]');
  const marketing = root.querySelector('[name=marketing]');
  let timer;
  const update = () => {
    const choice = readConsent();
    const signal = privacySignalEnabled();
    banner.hidden = !!choice;
    root.querySelector('[data-privacy-signal]').hidden = !signal;
    analytics.disabled = marketing.disabled = signal;
    analytics.checked = !!choice?.analytics && !signal;
    marketing.checked = !!choice?.marketing && !signal;
    root.querySelectorAll('[data-consent-action=accept]').forEach(button => { button.disabled = signal; });
    syncTracking();
    if(choice?.marketing) captureAttribution();
    clearTimeout(timer);
    if(choice) timer = setTimeout(update, Math.min(2147483647, Math.max(1, choice.savedAt + CONSENT_MAX_AGE - Date.now())));
  };
  root.addEventListener('click', e => {
    const action = e.target.closest('[data-consent-action]')?.dataset.consentAction;
    if(!action) return;
    if(action === 'settings') { update(); dialog.showModal(); return; }
    if(action === 'close') { dialog.close(); return; }
    dialog.close();
    if(action === 'accept') saveConsent({analytics:true,marketing:true});
    if(action === 'reject') saveConsent({});
    if(action === 'save') saveConsent({analytics:analytics.checked,marketing:marketing.checked});
  });
  window.addEventListener(CONSENT_CHANGED, update);
  window.addEventListener('storage', e => { if(e.key === CONSENT_KEY || e.key === null) update(); });
  document.addEventListener('visibilitychange',update);
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(!link) return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin) return;
    const platform = url.pathname === '/downloads/PolyPDFMac.dmg' ? 'mac' : url.pathname === '/downloads/windows/PolyPDFSetup.exe' ? 'windows' : null;
    if(platform) {
      trackEvent('download_click',{source:'localized_content',platform});
      link.closest('.dl-cta')?.querySelector('.dl-evaluation details')?.setAttribute('open','');
    }
    else if(url.pathname.startsWith('/samples/') && /\.(pdf|csv)$/.test(url.pathname)) trackEvent('sample_download',{source:'localized_content',feature:link.closest('.dl-evaluation') ? 'download_evaluation' : 'practice_file'});
    else if(link.closest('.dl-evaluation') && ['guide','evidence','plans'].includes(link.dataset.evaluationTarget)) trackEvent('download_evaluation_click',{source:'localized_content',target:link.dataset.evaluationTarget});
  });
  document.addEventListener('toggle', e => {
    if(e.target.matches?.('.dl-evaluation details') && e.target.open)
      trackEvent('download_evaluation_open',{source:'localized_content'});
  },true);
  update();
}
