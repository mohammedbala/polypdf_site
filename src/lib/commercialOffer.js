export const commercialOffer = Object.freeze({
  id: 'polypdf_pro_founder_1x_2026',
  name: "PolyPDF Pro Founder's License",
  checkoutLineItemName: "PolyPDF Pro Founder's License — Perpetual 1.x",
  price: '$49.99',
  activationLimit: 3,
  termsVersion: '2026-07-30',
  founderMaximumLicenses: 100
});

export const founderLimitTextFor = () =>
  `The Founder offer is limited to the first ${commercialOffer.founderMaximumLicenses} fulfilled licenses.`;

export const founderLimitText = founderLimitTextFor();

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
