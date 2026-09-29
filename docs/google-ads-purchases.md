# PolyPDF Google Ads purchases

The Google Ads account contains more than one business. PolyPDF must use its own
conversion action and campaign-specific custom goal; it must not inherit the
account's LicenseStamps purchases or phone-call goals.

Configured on September 28, 2026:

- Campaign: `PolyPDF Campaign One` (`24143077419`).
- Custom goal: `PolyPDF paid purchases`, containing only the action below.
- Conversion action: `PolyPDF Pro - Paid Purchase`.
- Event destination: `AW-449436603/SnB-CKSb6okdELu3p9YB`.
- Category: Purchase; every order; actual transaction value and currency;
  fallback USD 74.95; 30-day click window; data-driven attribution.
- The action is secondary at account level so it does not become a bidding
  goal for unrelated campaigns. The PolyPDF custom goal explicitly selects it.
- Enhanced conversions are disabled for this action. No customer email, license
  key, document data, or account token is supplied to Google by this integration.

## Payment verification and consent

The account page reads `/api/checkout/conversion` after a Checkout return and
optional-measurement consent. That first-party endpoint reads the payment record
created by Stripe's signature-verified webhook. A success URL is not payment
proof. Pending responses are retried; unknown and unpaid orders do not generate
an event.

The client requires `status: paid`, a positive numeric value, a valid currency,
and a transaction ID. It uses the verified payment ID for Google's transaction
deduplication and a provider-specific 30-day local deduplication record. GA4 and
Google Ads each require their own consent category. The Ads destination above
replaces the old shared action, with its own local deduplication version.

Google Ads configuration retains only valid `gclid`, `gbraid`, and `wbraid`
parameters on recognized public landing pages, after advertising consent.
Analytics page URLs and all account-page URLs remain query-free. Ad
personalization, Google signals, and URL passthrough remain disabled.

## Verification

`src/components/Account.purchase.test.js` covers the Checkout-return flow with
mocked first-party responses: no consent, consent granted after arrival, pending
then paid, failures, actual value/currency, and duplicate suppression. Library
tests also cover invalid/free orders, separate consent categories, sanitized
URLs, and the exact dedicated Ads destination. These tests send no live
conversions and make no payments.

The production smoke check requires the new destination and rejects a bundle
containing the retired destination. Static deployment verifies the hashes of
every public resource against the built commit.

An actual attributed purchase still needs a real ad click, advertising consent,
a completed paid order, and a return to the account page in that browser.
Customers who reject tracking or close Stripe before returning can be missing
from Google Ads; Stripe's payment records remain the sales source of truth.
Do not interpret an unverified/new-action status as evidence of a real sale, or
send fabricated paid orders to clear it. Reconcile real paid orders and Google
Ads after reporting has processed them.

## Rollout record — September 28, 2026

- Published website source: `df81c3226e4b3ec87cc4c21988f524e58d241af1`.
  The static deployment helper verified all 419 published files. The complete
  production smoke passed 92 checks, including the new conversion destination,
  checkout API, marketing routes, and download endpoints. No real payment or
  fabricated live purchase conversion was made.
- Automated validation: 40 focused application tests in six suites, 13
  post-deploy smoke fixture tests, and 10 deployment-helper tests passed; the
  full site build and localized-page validation passed.
- Google Search campaign `24143077419` was enabled at the user-approved existing
  USD 30/day average budget. Its status selector showed Enabled and Eligible.
  Newly edited ads/assets can remain under review while the campaign is enabled.
- Maximize clicks remains the bidding strategy; its CPC cap was reduced from
  USD 3.50 to USD 2.50. Search partners and Display Network remain off.
- Mobile phones and tablets each have a verified campaign bid adjustment of
  -100%; computers remain eligible. United States and Canada remain targeted.
  The additional location-presence settings did not load, so they were not
  changed or represented as verified. Account auto-tagging was already enabled.
- Both responsive search ads now disclose the current USD 74.95 one-time price,
  with the price description pinned to position 1. Their final URLs point to
  `/pdf-takeoff-software/` and `/measure-pdf-on-mac/`, with campaign UTMs.
  Six PolyPDF campaign sitelinks and four campaign callouts were added.
- Eighteen campaign negative keywords were added: broad negatives `free`,
  `jobs`, `tutorial`, `crack`, `training`, `cracked`, `tutorials`, `salary`,
  `earthwork`, `earthworks`, `torrent`, `rsmeans`; phrase negatives `rs means`,
  `how to`, `pdf size`, `bluebeam revu 21 download`,
  `bluebeam change measurement units`, and `pdf dimension checker`.
- Two Google-AI-created, account-level sitelinks, `Contact Us` and
  `Stamp Requirements`, were paused because they belonged to LicenseStamps and
  appeared among PolyPDF's inherited assets. Google rejected adding these
  automatic assets to a specific campaign. Their account-level pause also
  removes their eligibility for other campaigns; it does not pause or alter
  LicenseStamps campaign bids, budget, ads, or conversion goals. Existing
  generic automatic callouts were left enabled.
- LinkedIn ad set `899354034` in account `558037257` was paused and the success
  message and Paused status were verified.

This is a newly instrumented acquisition test, not evidence of profitable
customer acquisition. Reconcile paid Stripe orders with this dedicated action,
inspect search terms and cost per paid purchase, and avoid raising the budget
based only on clicks or the Google optimization score. A real attributed paid
purchase is still needed to verify the full live attribution path.

The documentation-only source-sync commit intentionally skips the legacy
push-to-master server build: the exact application code above has already been
built, deployed atomically, and verified through the static deployment helper.
