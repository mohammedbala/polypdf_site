# PolyPDF.com conversion audit

Generated 2026-08-10. Scope: the path from a stranger landing on polypdf.com to a paid, activated
PolyPDF Pro licence.

Every claim below was verified against source — this repo, the app repo
(`~/Projects/polypdfmac`), and the **live** licence API at `https://www.polypdf.com/api/`. Where a
number appears here it came from a file or an HTTP response, not from an assumption. Paths are
absolute where they leave this repo.

---

## 1. The funnel as it actually exists

| # | Step | Where it happens | Owner |
|---|---|---|---|
| 1 | Land | `/` (`src/components/Home.js`) | site |
| 2 | Download Free | `<a download>` → `/downloads/PolyPDFMac.dmg` or `/downloads/windows/PolyPDFSetup.exe` | site → nginx |
| 3 | Install, open own drawings | desktop app | app |
| 4 | Hit the free measurement cap (3 hand-created measurements per document) | `FREE_TIER_MEASUREMENT_LIMIT = 3`, `polypdf/apps/desktop/src/renderer/tool-sets.ts:21` | app |
| 5 | Upgrade dialog → "Buy Founder License · $49.99" | `polypdf/apps/desktop/src/renderer/dialogs/license-dialogs.ts:210` | app |
| 6 | Browser opens **`/buy?source=free_measurement_limit&utm_source=desktop_app&utm_medium=product&utm_campaign=free_to_pro`** | site | site |
| 7 | "Continue to Secure Checkout" → `POST /api/checkout/session` → Stripe Checkout | `src/components/Buy.js:54` | site + API |
| 8 | Pay → redirect to **`/account?checkout=success`** | `Website/license-api/src/commercial-offer.js:73` | API |
| 9 | Licence key emailed (`PPM-XXXX-XXXX-XXXX`) | `Website/license-api/src/server.js:929` | API |
| 10 | Paste key in app: **PolyPDF ▸ Upgrade to PolyPDF Pro…** (⌘⇧L) / **Help ▸ Upgrade to PolyPDF Pro…** (Ctrl+⇧+L) | `polypdf/apps/desktop/src/main/menus.ts:377,837` | app |

Two structural facts drive most of this audit:

- **Step 6 is the highest-intent click in the business.** The visitor already installed the app,
  used it on real drawings, and hit a wall. They arrive with intent no ad can buy — and land on
  the same generic `/buy` page a cold visitor sees, whose second panel tells them to *download the
  app*. They already have it open.
- **Steps 8–10 are where the site stops helping.** The buyer pays and is redirected to a page that
  asks them to sign in. Nothing on the site has ever told them how to activate a key.

---

## 2. Friction map

Severity: **P0** costs revenue or breaks a promise · **P1** measurably leaks intent ·
**P2** avoidable doubt · **P3** polish.

### P0-1 — The founder deadline on the site is 12 days later than the server honours

`src/lib/commercialOffer.js` renders, under every buy button and in the pricing card:

> Founder pricing is available until **September 10, 2026 at 11:59 p.m. ET** or after 100 fulfilled
> licenses, whichever comes first.

The live API disagrees. `GET https://www.polypdf.com/api/commercial-offer` returned, on
2026-08-10:

```json
"founder":{"available":true,"reason":null,"remainingLicenses":100,
          "maximumFulfilledLicenses":100,"endsAt":"2026-08-30T03:59:59.000Z"}
```

`2026-08-30T03:59:59Z` is **August 29, 2026 at 11:59:59 p.m. ET**. This is not a display value —
`Website/license-api/src/commercial-offer.js:22-49` refuses to create a checkout session past it,
and `POST /api/checkout/session` returns HTTP 409 `founder_offer_ended`. The app repo's
`docs/RELEASE-STATUS.md` states the same date independently.

So between **Aug 30 and Sep 10** the site would advertise an offer that checkout refuses, and the
buyer would meet the error string already written in `Buy.js:75`: *"The founder offer has ended."*
That is the exact bait-and-switch the owner's copy rules exist to prevent, and it is 20 days away.

Root cause is a split source of truth: commit `30ebc6b "Move founder pricing to the September 10
deadline"` changed the site's constant; the API's `config/commercial-offer.json` was never moved
with it.

**Fixed structurally** (§3.1) — the page now derives the deadline from the API. **The business
question of which date is correct is the owner's, not mine, and is flagged in the final report.**

### P0-2 — The trust copy under the buy button fails AA contrast

`.plan-note` is `--gray-500 #8f8978`: **3.49:1** on white, **3.25:1** on `--gray-100`. AA body text
needs 4.5:1. What is set in that colour is not decoration — it is every promise the page makes at
the moment of payment: the perpetual-licence rights, the founder deadline, "Secure Stripe
checkout. Refund requests follow PolyPDF's policy.", and "Your license key is delivered by email
after checkout."

The page whispers precisely the sentences that answer "is this safe?".

### P1-1 — The in-app upgrade click lands on a page written for someone who has not downloaded

`/buy?source=free_measurement_limit` renders `Buy.js` unchanged. Its second panel, level with the
purchase card, is headed **"Before you buy"** and reads:

> Download PolyPDF free first if you want to test it on real drawings.

followed by a full-width **"Download free first for macOS"** button. The visitor has PolyPDF open
behind the browser window with a drawing in it. The page's most prominent secondary action is to
re-download software they are running, and its framing ("before you buy", "if you want to test it")
argues them *back down* the funnel at the one moment they had decided to come up it.

The `source=` parameter that identifies them is already in the URL, already sanitised
(`license-dialogs.ts:209`), already stored by `src/lib/attribution.js`, and already forwarded to
Stripe. It just was never read to change a single word.

### P1-2 — Nothing on the site explains activation, anywhere

The purchase promise ends at "Your license key is delivered by email." The site never says what
arrives, what it looks like, or what to do with it. Searching this repo for the menu path that
activates a licence returns nothing: not on `/buy`, not on `/account`, not on `/support`.

The only place the instruction exists is inside the licence email itself
(`server.js:1010`) — which the buyer cannot read *before* deciding to buy. "How hard is this to set
up?" is an unanswered question at the point of payment, and an unanswered question is a delay.

The facts are cheap and verifiable: key shape `PPM-XXXX-XXXX-XXXX`
(`server.js:1324`), macOS **PolyPDF ▸ Upgrade to PolyPDF Pro…** ⌘⇧L, Windows **Help ▸ Upgrade to
PolyPDF Pro…** Ctrl+⇧+L (`menus.ts:377,837`), paste, **Activate**.

### P1-3 — The post-payment landing is a sign-in wall

Stripe returns the buyer to `/account?checkout=success`. That page shows a green notice, then —
because `/api/account/me` is cookie-gated and they have no cookie — an email form asking them to
request a magic link.

The buyer's actual next question is "where is my key and what do I do with it?". The page's most
prominent control asks them to start a *second* authentication flow whose only purpose is receipts.
The 90 seconds after payment is when a customer decides whether they trust the purchase; spending
it on an unexpected login is a support ticket waiting to happen.

The key is genuinely fast — `sendLicenseEmail` is called inline in the webhook before it returns
200 (`server.js:929`), no queue — so the honest message is a good one. It just is not being told.
(Note for copy: the Resend call is wrapped in `try/catch` and the webhook still returns 200, so
there is **no automatic retry**. "Guaranteed" is not available; "within a minute, and here is what
to do if it does not arrive" is.)

### P2-1 — The free tier's limit is disclosed, but never at the download button

The 3-per-document cap appears in the hero stat tiles, the pricing card, the FAQ, and `/buy`. It
does **not** appear next to any Download button — the exact control a visitor presses before
forming an expectation. The hero button's subline is currently only OS requirements
(`macOS 14+ · Apple silicon & Intel`).

This is the difference the owner named: a limit read before downloading is a fair deal; the same
limit met after twenty minutes of work feels like bait. The information exists; it is 200 pixels
from where it earns trust.

### P2-2 — The download → first-run gap is one sentence wide

`DownloadCTA` already shows a next-step line on click (`src/components/DownloadCTA.js:24`) — good
instinct, and the SmartScreen warning for Windows is genuinely thoughtful. But it is one sentence,
it is the *only* bridge, and it stops at "drag PolyPDF to Applications".

There is no post-download destination, no getting-started content, no email capture, and no deep
link back. Between the download click and the moment the user hits the cap — the single most
important window in the funnel — the site has no presence at all. The user must independently
discover calibration, which is the feature that makes measurements mean anything.

### P2-3 — Refund terms are stated three times, in three strengths

- Home pricing card: "Refund requests follow PolyPDF's policy."
- `/buy`: "generally non-refundable; discretionary refund requests may be reviewed within 14 days"
- `/refund`: the full policy.

A buyer who reads the short version and then the long version experiences the second as a
walk-back. The policy is what it is — the fix is to say the same true sentence everywhere, at the
button, rather than a soft version near the money and a hard version one click away.

### P2-4 — The site's accent is not the product's accent

Site `--accent: #087456` (green). App `--accent: #0D6E76` (petrol), per
`polypdf/apps/desktop/src/renderer/styles/01-base-and-dialogs.css:30`. A visitor downloads a green
website and opens a teal app. Nothing breaks, but the two surfaces stop reading as one company at
exactly the moment the product has to feel established enough to take $49.99.

Petrol also measures better: **5.98:1** on white versus the incumbent's 5.76:1.

### P3-1 — Developer surface promised in shipped docs, 404 in production

`polypdf/docs/plugins/PLUGIN-AUTHORING.md:54` tells plugin authors to run:

```
curl -O https://www.polypdf.com/plugins/polypdf-plugin-pack.mjs
```

That URL 404s. The site's SPA fallback (`try_files $uri $uri/ /index.html`) makes it worse than a
404: `curl -O` writes a file full of HTML and the developer's next command fails confusingly. The
packer exists at `polypdf/docs/plugins/tools/polypdf-plugin-pack.mjs`; a finished developer
landing page has been staged and parked at `polypdf/Website/site-pages/BuildYourOwnPlugin.js`
since before 1.3.1.

Its release gate — "do not publish before 1.3.1 ships" (`Website/site-pages/README.md:64`) — is now
**satisfied**: `docs/RELEASE-STATUS.md` records the appcast live-serving 1.3.1 on 2026-08-10.

### P3-2 — Checkout itself is already short

For completeness, since the brief asked for a click count. From `/buy` it is **one** site click:
`handleBuyClick` → `POST /api/checkout/session` → `window.location.assign` straight to Stripe.
The Stripe form asks for email, card, name, country and postal code — the last two are not
optional, because `automatic_tax: { enabled: true }` and `billing_address_collection: 'auto'`
require them (`Website/license-api/src/commercial-offer.js:51-76`). `allow_promotion_codes` is off
by default, so there is no promo field inviting a hunt for a code.

**There is no fat to cut here.** See §4 for what I recommend against.

---

## 3. What was implemented

Full change log with rationale is in the final report; this is the audit-to-fix mapping.

| Fix | Addresses |
|---|---|
| 3.1 `src/lib/useCommercialOffer.js` — deadline and availability read from `GET /api/commercial-offer` on `/`, `/buy`, `/upgrade` and the five workflow pages; static constant corrected to the server's date and demoted to a pre-JavaScript fallback | P0-1 |
| 3.2 `.plan-note` and `.showcase-source` raised from `--gray-500` to `--gray-600` | P0-2 |
| 3.3 `Buy.js` renders an in-app variant when `source`/`utm_source` says the desktop app; `/upgrade` added as a stable alias | P1-1 |
| 3.4 `src/components/ActivationSteps.js` — menu path per OS, key shape, Activate — on `/upgrade`, `/buy`, `/account?checkout=success`, `/support`, and as a new FAQ entry | P1-2, P1-3 |
| 3.5 `/account?checkout=success` leads with what to do next; sign-in demoted to "receipts and invoices (optional)" | P1-3 |
| 3.6 `FREE_TIER_LIMIT_TEXT` under every download control | P2-1 |
| 3.7 "While it installs" strip — install step plus three steps to a first takeoff — shown in place after a download click | P2-2 |
| 3.8 `refundSummaryText`, one sentence, at every buy button | P2-3 |
| 3.9 Accent aligned to the product's petrol `#0D6E76` | P2-4 |
| 3.10 `/build-a-plugin` page + packer published at `/plugins/polypdf-plugin-pack.mjs`, with a deploy-smoke guard against the SPA HTML fallback | P3-1 |

Two additions that were not friction but were needed to keep these honest:

- **`/buy?checkout=cancelled`** — Stripe's cancel URL already pointed here and the page ignored it.
  It now says nothing was charged, which is the only thing a returning abandoner wants to know.
- **Offer-closed state** — when the API reports `founder.available: false`, the buy button is
  replaced by the reason. Previously the button stayed live and the buyer discovered the closure by
  meeting a checkout error.

### Residual risk, for the owner

The **business** question behind P0-1 is not mine to settle. Commit `30ebc6b` moved the site to
September 10 on purpose; the API config was not moved with it, and the API is what refuses the
payment. This branch makes the site tell the server's truth, whatever it is — but if the intent was
that founder pricing runs to **September 10**, the fix belongs in
`Website/license-api/config/commercial-offer.json` (`founderEndsAt`) and a licence-API redeploy,
**before Aug 29**. Nothing on the site needs to change again either way; it reads the live value.

---

## 4. Recommended against

**Displaying "N of 100 founder licences remaining."** The API exposes `remainingLicenses` and the
cap is real, so this would not be a fake scarcity timer — it would be honest. It is still wrong to
ship: on 2026-08-10 the live value is `100` of `100`. Rendering it publishes "nobody has bought
this yet" on the buy button. Honest scarcity requires scarcity; this is a number to display only
if it ever drops far enough to mean pressure, and never automatically.

**Shortening Stripe Checkout.** The address fields come from `automatic_tax`, which exists so the
seller charges correct VAT/sales tax. Trading tax compliance for one form field is not a conversion
optimisation.

**A countdown timer on the founder deadline.** The deadline is real, but a ticking clock is the
house style of exactly the subscription products this page positions against. The deadline is
stated in words, once, near the price.

**Email capture on the download.** It is the standard answer to P2-2 and it would work. It also
converts a frictionless "download the real app, no signup, no trial timer" promise — the strongest
thing this product says — into a form. The three-step strip solves the same gap without taking
anything from the visitor.
