export const commercialOffer = Object.freeze({
  id: 'polypdf_pro_founder_1x_2026',
  name: "PolyPDF Pro Founder's License",
  checkoutLineItemName: "PolyPDF Pro Founder's License — Perpetual 1.x",
  price: '$49.99',
  activationLimit: 3,
  termsVersion: '2026-07-30',
  // Matches the deadline the licence API actually enforces: config/commercial-offer.json ships
  // founderEndsAt "2026-08-30T03:59:59.000Z", and GET /api/commercial-offer returned exactly that
  // on 2026-08-10. Past it, POST /api/checkout/session answers 409 founder_offer_ended.
  //
  // This constant used to read "September 10, 2026" — twelve days past the wall — so between
  // Aug 30 and Sep 10 the page would have advertised an offer checkout refuses. Under-claiming a
  // deadline is safe; over-claiming one is the bait-and-switch the copy rules exist to prevent.
  // If the offer is genuinely extended, extend it in the API config: useCommercialOffer() reads
  // the live value, so browsers would show the later date before this line was even edited.
  founderEndsAt: 'August 29, 2026 at 11:59 p.m. ET',
  founderMaximumLicenses: 100
});

export const founderLimitTextFor = (deadline) =>
  `Founder pricing is available until ${deadline} or after ${commercialOffer.founderMaximumLicenses} fulfilled licenses, whichever comes first.`;

// The build-time fallback only. Anything user-facing should prefer the deadline returned by
// useCommercialOffer(), which reads the same /api/commercial-offer the checkout endpoint gates on —
// see docs/conversion-audit.md §P0-1 for why this constant alone is not trustworthy.
export const founderLimitText = founderLimitTextFor(commercialOffer.founderEndsAt);

export const founderRightsText =
  'Use PolyPDF 1.x forever on up to 3 Mac or Windows computers. Every PolyPDF 1.x update is included. Future major versions may be optional paid upgrades.';

// One refund sentence, used at every buy button.
//
// It used to be summarised three ways at three strengths — softest next to the money ("Refund
// requests follow PolyPDF's policy"), strictest on /refund. A buyer who read both experienced the
// second as a walk-back. This is the short form of the real policy, no softer than the real policy.
export const refundSummaryText =
  'Generally non-refundable. Discretionary requests are reviewed within 14 days, and your statutory rights always apply.';

// Delivery is genuinely fast — the licence email is sent inline in the Stripe webhook, before it
// returns (Website/license-api/src/server.js). It is deliberately not called guaranteed: a failed
// send is logged and the webhook still succeeds, so there is no automatic retry. Hence the
// what-to-do-if-not tail, which is the honest half of the promise.
export const licenseDeliveryText =
  'Your license key is emailed the moment Stripe confirms payment — normally it arrives within a minute. If it has not shown up in 15 minutes, check spam, then email support@polypdf.com.';

export const licensePolicyLabel = (license) => {
  if (license?.license_policy === 'perpetual_all_versions') {
    return 'Grandfathered: perpetual Pro use with all future public updates';
  }
  if (license?.license_policy === 'perpetual_1x') {
    return 'Perpetual PolyPDF 1.x use with every 1.x update';
  }
  return 'Perpetual Pro license';
};
