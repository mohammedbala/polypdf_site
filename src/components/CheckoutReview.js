import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { commercialOffer } from '../lib/commercialOffer';
export const WEBSITE_TERMS_VERSION = '2026-09-09';
const Context = createContext(null);
export function useCheckoutReview() {
  const review = useContext(Context);
  // An unwrapped control cannot silently bypass the review.
  return review || (() => Promise.resolve(null));
}
export default function CheckoutReviewProvider({ children }) {
  const dialog = useRef(null);
  const pending = useRef(null);
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const finish = (value) => {
    const resolve = pending.current;
    pending.current = null;
    setOpen(false);
    resolve?.(value);
  };
  const review = () => new Promise((resolve) => {
    pending.current?.(null);
    pending.current = resolve;
    setAccepted(false);
    setOpen(true);
  });
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  useEffect(() => () => pending.current?.(null), []);
  return <Context.Provider value={review}>{children}
    <dialog ref={dialog} className="privacy-dialog" aria-labelledby="checkout-review-title" onCancel={() => finish(null)}>
      <h2 id="checkout-review-title">Review your purchase</h2>
      <p><strong>PolyPDF Pro — {commercialOffer.price} USD once.</strong> Applicable taxes and the final total appear in Stripe before you pay. No subscription.</p>
      <ul><li>Perpetual use of PolyPDF 1.x on up to 3 Mac or Windows computers.</li><li>Every public 1.x update included; future major upgrades are optional.</li><li>14-day money-back guarantee for direct purchases.</li><li>License delivery by email after successful payment.</li></ul>
      <p>Seller: Euclidean Software LLC · <a href="mailto:support@polypdf.com">support@polypdf.com</a></p>
      <form onSubmit={(event) => { event.preventDefault(); if (accepted) finish({ accepted: true, version: WEBSITE_TERMS_VERSION }); }}>
        <label className="privacy-option"><input type="checkbox" required checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I agree to the <a href="/terms/" target="_blank" rel="noreferrer">Terms of Use (opens a new tab)</a> and have read the <a href="/refund/" target="_blank" rel="noreferrer">Refund Policy (opens a new tab)</a>.</span></label>
        <p>The <a href="/privacy/" target="_blank" rel="noreferrer">Privacy Policy (opens a new tab)</a> explains payment and licensing data. Agreement here does not enable optional cookies or waive statutory cancellation rights.</p>
        <div className="privacy-actions"><button type="submit" disabled={!accepted}>Continue to Stripe</button><button type="button" onClick={() => finish(null)}>Cancel</button></div>
      </form>
    </dialog>
  </Context.Provider>;
}
