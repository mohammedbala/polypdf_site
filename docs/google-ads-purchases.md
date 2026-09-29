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
