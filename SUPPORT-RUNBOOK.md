# PolyPDF Direct License Support Runbook

Use this for direct Mac and Windows licensing with Stripe Checkout and the PolyPDF license API.

## Quick Lookup

```bash
cd /var/www/polypdf-site/Website/license-api
npm run admin -- lookup PPM-AB12-CD34-EF56
npm run admin -- lookup cs_...
npm run admin -- lookup pi_...
npm run admin -- lookup buyer@example.com
```

Ask the customer for their Stripe receipt email, app version, OS and version, and the last 4 characters of the license key.

## Activation Fails

1. Confirm the key format is `PPM-XXXX-XXXX-XXXX`.
2. Run `lookup` by key or buyer email.
3. If no license exists, search Stripe for the receipt and confirm the checkout completed for the configured `STRIPE_PRICE_ID`.
4. If the license exists and status is `active`, ask the user to retry activation after checking their network or VPN.
5. If the app shows server unavailable, check:
   - `systemctl status polypdf-license-api`
   - `/var/log/nginx/polypdf-site.error.log`
   - Stripe webhook delivery logs

## Activation Limit Reached

The direct license allows up to 3 active computers in any Mac and Windows combination.

```bash
npm run admin -- lookup PPM-AB12-CD34-EF56
npm run admin -- reset-activations PPM-AB12-CD34-EF56
```

Reset activations when the user replaced a computer, migrated hardware, or cannot access an old installation. Add a support note with the reason.

## Purchase Rights

- New founder purchases: perpetual PolyPDF 1.x use, every public 1.x update, and up to 3 Mac or Windows computers.
- Purchases without founder metadata from before the July 30, 2026 policy cutoff: grandfathered perpetual Pro use with all future public updates.
- Future major versions may be optional paid upgrades for founder purchases; PolyPDF 1.x continues to work.
- Never describe the current offer as a one-year license or as including only one year of updates.

## Refunds And Chargebacks

Refunds are handled in Stripe. Completed refund events should set the PolyPDF license status to `refunded`.

1. Locate the Stripe checkout session or payment intent.
2. Confirm the refund status in Stripe.
3. Run `lookup pi_...` or `lookup cs_...` and confirm the local license status is `refunded`.
4. If a webhook was missed, replay the Stripe webhook event.

## Duplicate Purchases

1. Look up both Stripe checkout sessions or payment intents.
2. Confirm whether both generated licenses.
3. Offer refund of the accidental duplicate through Stripe.
4. Keep the license tied to the transaction the customer wants to retain.

## Manual License Resend

```bash
npm run admin -- resend PPM-AB12-CD34-EF56 buyer@example.com
```

The command prints the decrypted key and writes an audit entry. Send the key from `support@polypdf.com` until automatic resend is added.

## Launch Smoke Checklist

- `curl -fsS https://www.polypdf.com/api/licenses/healthz`
- Stripe test checkout completes and produces exactly one license.
- Duplicate webhook delivery does not create a second license.
- App activation succeeds, validation succeeds, deactivation frees an activation.
- Refunded sandbox transaction revokes/suspends access.
