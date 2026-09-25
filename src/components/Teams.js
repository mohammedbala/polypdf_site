import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { isSecureStripeCheckoutUrl } from '../lib/checkout';
import './Teams.css';
import { teamError, orderLabels, paymentMessage, OrderDocuments, EnrollmentCode } from './TeamsJourney';
import TeamsSeatPicker, { formatTeamMoney as money } from './TeamsSeatPicker';

const TERMS = '2026-09-17';
function initialQuantity() { try { const saved = Number(localStorage.getItem('polypdf-team-quantity')); return Number.isInteger(saved) && saved > 0 && saved <= 10000 ? Math.max(3, saved) : 100; } catch { return 100; } }
async function request(path, body) {
  let r, result;
  try {
    r = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    result = await r.json();
  } catch { throw new Error(teamError()); }
  if (!r.ok) throw new Error(teamError(result));
  return result;
}
export default function Teams() {
  const [offer, setOffer] = useState(), [buyMore, setBuyMore] = useState(false), [organizations, setOrganizations] = useState([]), [organizationId, setOrganizationId] = useState(() => { try { return localStorage.getItem('polypdf-team-organization') || ''; } catch { return ''; } }), [authenticated, setAuthenticated] = useState(false), [email, setEmail] = useState(''), [name, setName] = useState(''), [quantity, setQuantity] = useState(initialQuantity), [quote, setQuote] = useState(), [accepted, setAccepted] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [publicKey, setPublicKey] = useState(''), [code, setCode] = useState(), [replace, setReplace] = useState(false);
  const organization = organizations.find(x => x.id === organizationId);
  const checkoutEnabled = Boolean(offer?.enabled || organization?.checkoutEnabled);
  const paymentNotice = paymentMessage(organization?.orders, typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('checkout') === 'success');
  useEffect(() => { setAccepted(false); setCode(undefined); setReplace(false); }, [organizationId]);
  const changeQuantity = value => { setQuantity(value); setAccepted(false); try { localStorage.setItem('polypdf-team-quantity', String(value)); } catch { /* The picker also works without browser storage. */ } };
  const checkoutReady = quantity >= 3 && quote && quote.addedSeats === quantity && quote.resultingSeats === (organization?.seatCount || 0) + quantity;
  const purchased = (organization?.seatCount || 0) > 0;
  const refresh = useCallback(async () => {
    const current = await request('/api/teams/v1/offer'); setOffer(current);
    const account = await fetch('/api/account/me', { credentials: 'same-origin' }); setAuthenticated(account.ok);
    if (!account.ok) { setOrganizations([]); setOrganizationId(''); }
    if (account.ok) { const data = await request('/api/teams/v1/organizations'); setOrganizations(data.organizations); setOrganizationId(old => data.organizations.some(item => item.id === old) ? old : data.organizations[0]?.id || ''); }
  }, []);
  useEffect(() => { if (organizationId) { try { localStorage.setItem('polypdf-team-organization', organizationId); } catch { /* Optional purchase preference. */ } } }, [organizationId]);
  useEffect(() => { refresh().catch(() => setMessage('Team purchasing is currently unavailable. Please try again later.')); }, [refresh]);
  useEffect(() => {
    // Payment webhooks and manager enrollment finish outside this page. Keep the
    // account current when the buyer returns, without asking them to reload.
    const update = () => { if (document.visibilityState === 'visible') refresh().catch(() => {}); };
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    const awaitingPayment = organization?.orders?.some(order => ['creating', 'open', 'processing'].includes(order.status)) || (new URLSearchParams(window.location.search).get('checkout') === 'success' && !organization?.orders?.length);
    const timer = (awaitingPayment || (code && (!organization?.manager || organization.manager.generation <= code.previousGeneration))) ? setInterval(update, 3000) : undefined;
    return () => { window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); clearInterval(timer); };
  }, [refresh, code, organization]);
  useEffect(() => { let active = true; setQuote(undefined); if (!organizationId || !Number.isInteger(quantity) || quantity < 3) return undefined; request('/api/teams/v1/quote', { organizationId, quantity }).then(q => { if (active) setQuote(q); }).catch(e => { if (active) setMessage(e.message); }); return () => { active = false; }; }, [organizationId, quantity, organizations]);
  const perform = async fn => { setBusy(true); setMessage(''); try { await fn(); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  return <div className="teams-page"><div className="teams-wrap">
    <Link to="/" className="teams-brand">PolyPDF <span>Teams</span></Link>
    <header className="teams-hero"><p className="teams-kicker">PolyPDF for your whole firm</p><h1>{purchased ? (organization.manager ? 'Your company is connected.' : 'Your seats are ready.') : 'Your team. One simple purchase.'}</h1><p>{purchased ? (organization.manager ? 'Add your people in the license manager, then share your company connection address.' : 'Your purchase is complete. Next, your IT administrator connects your company.') : 'Choose your seats, connect your company once, and let employees sign in with Microsoft.'}</p></header>
    <ol className="teams-steps" aria-label="Getting started"><li aria-current={!purchased ? 'step' : undefined}><span>1</span><div><strong>Choose your users</strong><small>One-time purchase</small></div></li><li aria-current={purchased && !organization?.manager ? 'step' : undefined}><span>2</span><div><strong>Connect your company</strong><small>One-time setup by IT</small></div></li><li aria-current={organization?.manager ? 'step' : undefined}><span>3</span><div><strong>Sign in and work</strong><small>Employees use their Microsoft account</small></div></li></ol>
    {(!purchased || buyMore) && <TeamsSeatPicker quantity={quantity} onChange={changeQuantity} existingSeats={organization?.seatCount || 0} tiers={offer?.tiers}>{checkoutEnabled && <a className="teams-picker-continue" href="#team-purchase">Continue with {quantity || 3} {(quantity || 3) === 1 ? 'user' : 'users'}</a>}</TeamsSeatPicker>}
    <p className="teams-rights">Includes Entra SSO, your company-hosted license manager, perpetual PolyPDF 1.x use, and all 1.x updates. Existing personal licenses keep their three-computer rights.</p>
    <details className="teams-prerequisites"><summary>Before you buy: what does IT need?</summary><p>Your IT administrator needs a Windows Server 2022 or 2025 host, a trusted HTTPS certificate, and permission to register an app in your Entra tenant. Employee and document data stay with your company. Microsoft handles sign-in; PolyPDF validates purchased capacity.</p><Link to="/teams/guide">Read the Teams setup guide</Link></details>
    <div role="status" aria-live="polite" className="teams-notice">{message || paymentNotice}</div>
    {!checkoutEnabled && <section className="teams-panel"><h2>Purchasing is not enabled yet</h2><p>The team offering is being validated. No payment or production activation is available from this page yet.</p><Link to="/support">Contact PolyPDF</Link></section>}
    {(offer?.enabled || authenticated) && <section className="teams-panel" id="team-purchase">
      <p className="teams-kicker">{purchased ? 'Your team account' : 'Next: secure checkout'}</p><h2>{purchased ? organization.name : 'Set up your purchase'}</h2>
      {!authenticated ? <form onSubmit={e => { e.preventDefault(); perform(async () => { await request('/api/account/magic-link', { email, returnTo: '/teams' }); setMessage('Check your email for a sign-in link. It will bring you back to your team purchase.'); }); }}><label>Billing-owner email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><button disabled={busy}>Send sign-in link</button><p>We’ll send you a secure sign-in link. No password to create. Your selected number of users will be waiting when you return.</p></form> : <>
        {organizations.length > 1 && <label>Organization<select value={organizationId} onChange={e => { setOrganizationId(e.target.value); setCode(undefined); setReplace(false); }}>{organizations.map(o => <option key={o.id} value={o.id}>{o.name} · {o.seatCount} paid seats</option>)}</select></label>}
        <details open={!organization}><summary>{organization ? 'Add another company' : 'Company details'}</summary><form className="teams-inline" onSubmit={e => { e.preventDefault(); perform(async () => { const result = await request('/api/teams/v1/organizations', { name }); await refresh(); setOrganizationId(result.id); setName(''); }); }}><label>Company name<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={160} required /></label><button disabled={busy || !name.trim()}>Continue</button></form></details>
        {organization && <>{purchased && <p>{organization.seatCount} paid seats · {organization.manager ? 'Manager connected' : 'Ready to connect your company'}</p>}{purchased && <button disabled={busy} onClick={() => setBuyMore(!buyMore)}>{buyMore ? 'Close seat purchase' : 'Add more users'}</button>}{(!purchased || buyMore) && <><p>{purchased ? `${organization.seatCount} seats purchased. Select more users above to add seats.` : `Your purchase will belong to ${organization.name}.`}</p>
          {checkoutReady && <p className="teams-total">{quote.addedSeats} users · <strong>{money(quote.amountTotal)}</strong> before tax</p>}
          <label className="teams-check"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />I accept the <a href="#team-terms">Teams terms below</a> and the <Link to="/terms">Terms of Service</Link>.</label>
          <button className="teams-primary" disabled={busy || !checkoutEnabled || !accepted || !checkoutReady} onClick={() => perform(async () => { const result = await request('/api/teams/v1/checkout', { organizationId, quantity, termsAcceptance: { accepted: true, version: TERMS } }); if (!isSecureStripeCheckoutUrl(result.url)) throw new Error('Invalid checkout response.'); window.location.assign(result.url); })}>Continue to payment</button>
          <button disabled={busy} onClick={() => perform(refresh)}>Refresh purchases</button>
          {organization.orders.some(o => ['open', 'creating'].includes(o.status)) && <button disabled={busy} onClick={() => perform(async () => { await request('/api/teams/v1/checkout/cancel', { organizationId }); await refresh(); setMessage('Unpaid checkout cancelled. You can choose a new quantity.'); })}>Cancel unpaid checkout</button>}</>}
          <details className="teams-order-history"><summary>Orders and receipts</summary><div className="teams-table"><table><thead><tr><th>Date</th><th>Seats</th><th>Unit price</th><th>Status</th><th>Documents</th></tr></thead><tbody>{organization.orders.map(o => <tr key={o.id}><td>{new Date(o.created_at).toLocaleDateString()}</td><td>{o.quantity}</td><td>{money(o.unit_amount)}</td><td>{orderLabels[o.status] || 'Contact support'}</td><td><OrderDocuments key={`${organization.id}:${o.id}`} organizationId={organization.id} order={o} request={request} /></td></tr>)}</tbody></table></div></details>
          {organization.seatCount > 0 && <><h3>{organization.manager ? 'Company manager connected' : 'Your seats are ready. Connect your company.'}</h3><p>Give your IT administrator the setup checklist. They install the manager once, then add your people.</p><Link className="teams-setup-link" to="/teams/guide">Open the Teams setup guide</Link><details className="teams-enrollment"><summary>{organization.manager ? 'Replace your license manager' : 'Connect an installed manager'}</summary><p>Copy the public key shown in your manager’s Service health screen. Generate a code below, then paste it back into that screen.</p><label>Manager public key<textarea value={publicKey} onChange={e => setPublicKey(e.target.value)} autoComplete="off" /></label>{organization.manager && <label className="teams-check"><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />Replace the active manager. Previously issued access may remain valid for up to seven days.</label>}<button disabled={busy || !publicKey.trim() || (organization.manager && !replace)} onClick={() => perform(async () => { const result = await request('/api/teams/v1/enrollment', { organizationId, managerPublicKey: publicKey.trim(), confirmReplacement: replace }); setCode({ ...result, previousGeneration: organization.manager?.generation || 0 }); })}>Generate enrollment code</button>{code && <EnrollmentCode enrollment={code} connected={Boolean(organization.manager && organization.manager.generation > code.previousGeneration)} />}</details>{organization.manager && <p>Next, assign employees in your manager and share its company connection address. Employees open PolyPDF, choose “Sign in with your company,” and sign in with Microsoft.</p>}</>}
        </>}
      </>}
    </section>}
    <details className="teams-panel teams-terms" id="team-terms"><summary>Teams purchase terms</summary><p>Version {TERMS}. Each seat is a perpetual PolyPDF 1.x license for one named employee on one active computer, including all 1.x updates. Future major versions may be optional paid upgrades. The license manager and Entra sign-in are included, with no recurring fee.</p><p>Each Teams purchase requires at least 3 licenses, including add-on purchases. Price tiers apply to the resulting paid seat count. New seats receive the selected unit price; earlier purchases are not repriced. Prices are in USD, before applicable tax. The <Link to="/refund">14-day money-back guarantee</Link> applies.</p><p>Company licenses require periodic online validation. Offline access lasts up to seven days. Reassignment and device replacement permit the new holder to start immediately; a disconnected former device may keep its previously issued access until expiry. The manager must remain reachable for renewals. Existing documents and unsaved work remain available to save or export if Pro access expires.</p></details>
  </div></div>;
}
