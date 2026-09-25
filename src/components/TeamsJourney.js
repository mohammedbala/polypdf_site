import React, { useEffect, useState } from 'react';

const messages = {
  teams_tax_setup_required: 'Purchasing needs a billing configuration update. Contact PolyPDF support. No new payment has been started.',
  teams_tax_validation_unavailable: 'The payment provider is unavailable. Try again shortly. No new payment has been started.',
  teams_checkout_disabled: 'Purchasing is temporarily unavailable for this company. Existing licenses continue to work.',
  teams_not_available: 'The Teams service is unavailable. Please try again shortly or contact support.',
  checkout_already_open: 'This company already has an unfinished purchase. Continue it or cancel the unpaid checkout before changing the quantity.',
  checkout_initializing_retry_original_purchase: 'Your checkout is still being prepared. Retry the original quantity; do not create another purchase.',
  checkout_processing_refresh_account: 'Payment is being verified. Refresh your purchases shortly. Do not pay again.',
  payment_processing_refresh_account: 'Payment is being verified and cannot be cancelled here. Refresh your purchases shortly.',
  checkout_expired_retry: 'That checkout expired. Review your quantity and start a new payment.',
  checkout_not_cancelled: 'The payment could not be cancelled. Refresh purchases and contact support before starting another payment.',
  invalid_seat_quantity: 'Enter a whole number from 3 to 10,000 users. Teams purchases require at least 3 licenses.',
  sign_in_required: 'Your account session expired. Sign in again to continue.',
  invalid_origin: 'Reload this page on www.polypdf.com and try again.',
  organization_not_found: 'This company is not available to your billing account. Sign in with its billing-owner email.',
  order_not_found: 'This order is not available to your billing account.',
  order_documents_pending: 'Your invoice and receipt are not ready yet. Wait for payment confirmation, then try again.',
  order_documents_unavailable: 'Invoices are temporarily unavailable. Please try again shortly.',
  confirm_manager_replacement: 'Confirm that you want to replace the active company manager before generating a code.',
  no_paid_seats: 'This company has no paid seats to connect. Complete a purchase first.',
  invalid_company_name: 'Enter a company name between 2 and 160 characters.',
  teams_terms_required: 'Review and accept the Teams terms before continuing.',
  teams_price_mismatch: 'Purchasing needs a pricing configuration update. Contact PolyPDF support before trying again.',
  teams_price_not_configured: 'Purchasing needs a pricing configuration update. Contact PolyPDF support before trying again.',
};
export function teamError(result = {}) {
  const reference = String(result.reference || result.error || 'teams-connection').replace(/[^a-z0-9_-]/gi, '').slice(0, 80);
  return `${messages[result.error] || 'We could not complete this action. Retry, or contact PolyPDF support if it continues. For payments, refresh your orders before trying again.'} Support reference: ${reference}.`;
}
export const orderLabels = { creating: 'Preparing checkout', open: 'Awaiting payment', processing: 'Payment pending', paid: 'Paid', payment_failed: 'Payment failed', expired: 'Checkout expired', refunded: 'Refunded', configuration_failed: 'Checkout unavailable' };
export function paymentMessage(orders = [], returned = false) {
  const latest = orders[0];
  if (!latest) return returned ? 'We are waiting for payment confirmation. This page does not grant seats. Refresh purchases shortly; do not pay again.' : '';
  if (latest.status === 'processing') return 'Payment is pending with your payment provider. New seats become available after confirmation. Do not pay again.';
  if (latest.status === 'creating') return 'Your checkout is being prepared. Continue with the same quantity if you need to retry.';
  if (latest.status === 'open') return returned ? 'Payment confirmation has not arrived. Refresh purchases shortly; do not pay again.' : 'This company has an unpaid checkout. Continue it with the same quantity, or cancel it before changing the quantity.';
  if (latest.status === 'payment_failed') return 'The payment failed and added no seats. Review your payment details before trying again.';
  if (latest.status === 'expired') return 'The unpaid checkout expired. Review your quantity and start a new payment.';
  if (latest.status === 'refunded') return 'This order was refunded. Its returned seats are no longer available.';
  if (latest.status === 'configuration_failed') return 'Checkout could not start. Contact support; this order added no seats.';
  return '';
}
export function safeDocumentUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') && ['invoice.stripe.com', 'pay.stripe.com', 'receipt.stripe.com'].includes(u.hostname) ? u.href : null; } catch { return null; }
}
export function OrderDocuments({ organizationId, order, request }) {
  const [documents, setDocuments] = useState(), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  if (!['paid', 'refunded'].includes(order.status)) return <span>After payment</span>;
  const load = async () => { setBusy(true); setMessage(''); try { const result = await request(`/api/teams/v1/organizations/${encodeURIComponent(organizationId)}/orders/${encodeURIComponent(order.id)}/documents`); setDocuments(result); if (result.pending) setMessage('Documents are being prepared. Try again shortly.'); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  return <><button disabled={busy} onClick={load}>{busy ? 'Loading…' : 'View receipt / invoice'}</button>{documents && <div className="teams-document-links">{[['receiptUrl', 'Receipt'], ['invoiceUrl', 'Invoice'], ['invoicePdfUrl', 'Invoice PDF']].map(([key, label]) => safeDocumentUrl(documents[key]) && <a key={key} href={safeDocumentUrl(documents[key])} target="_blank" rel="noopener noreferrer">{label}</a>)}</div>}<span role="status">{message}</span></>;
}
export function EnrollmentCode({ enrollment, connected }) {
  const [now, setNow] = useState(Date.now()), [message, setMessage] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const seconds = Math.max(0, Math.ceil((enrollment.expiresAt - now) / 1000));
  if (connected) return <p role="status">Your company manager is connected. Continue in the manager to assign people and download employee instructions.</p>;
  return <div className="teams-code"><label>Single-use enrollment code<input readOnly value={seconds ? enrollment.code : ''} autoComplete="off" /></label><p>{seconds ? `Expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}. Paste this into Service health in your company manager.` : 'This code expired. Generate a new code for the same manager public key.'}</p><button disabled={!seconds} onClick={async () => { try { await navigator.clipboard.writeText(enrollment.code); setMessage('Enrollment code copied.'); } catch { setMessage('Select the code above and copy it manually.'); } }}>Copy enrollment code</button><p role="status">{message}</p><p>Treat this code as private. Generating another code invalidates the earlier one.</p></div>;
}
export function ManagerDownload() {
  const [release, setRelease] = useState();
  useEffect(() => { let active = true; fetch('/teams-release.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => { if (active) setRelease(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const manager = release?.manager;
  let url;
  try { const candidate = new URL(manager?.url); if (candidate.origin === 'https://www.polypdf.com' && candidate.pathname.startsWith('/downloads/') && !candidate.username && !candidate.password) url = candidate.href; } catch { /* No qualified artifact yet. */ }
  const available = release?.available === true && url && /^[a-f0-9]{64}$/i.test(manager?.sha256 || '') && /^\d+\.\d+\.\d+$/.test(manager?.version || '');
  return available ? <div className="teams-download"><h3>License Manager {manager.version}</h3><p>Signed installer for Windows Server 2022 and 2025 x64.</p><a className="teams-setup-link" href={url}>Download Windows license manager</a><p>SHA-256: <code>{manager.sha256}</code></p></div> : <p>The signed manager installer will appear here after release qualification. Purchasing remains limited until the complete release checks pass.</p>;
}
