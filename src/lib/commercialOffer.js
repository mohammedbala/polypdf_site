export const commercialOffer = Object.freeze({
  id: 'polypdf_pro_founder_1x_2026',
  name: "PolyPDF Pro Founder's License",
  checkoutLineItemName: "PolyPDF Pro Founder's License — Perpetual 1.x",
  price: '$49.99',
  activationLimit: 3,
  termsVersion: '2026-07-30',
  founderEndsAt: 'September 10, 2026 at 11:59 p.m. ET',
  founderMaximumLicenses: 100
});

export const founderLimitText =
  `Founder pricing is available until ${commercialOffer.founderEndsAt} or after ${commercialOffer.founderMaximumLicenses} fulfilled licenses, whichever comes first.`;

export const founderRightsText =
  'Use PolyPDF 1.x forever on up to 3 Mac or Windows computers. Every PolyPDF 1.x update is included. Future major versions may be optional paid upgrades.';

export const licensePolicyLabel = (license) => {
  if (license?.license_policy === 'perpetual_all_versions') {
    return 'Grandfathered: perpetual Pro use with all future public updates';
  }
  if (license?.license_policy === 'perpetual_1x') {
    return 'Perpetual PolyPDF 1.x use with every 1.x update';
  }
  return 'Perpetual Pro license';
};
