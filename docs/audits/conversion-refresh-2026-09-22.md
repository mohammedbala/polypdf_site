# Conversion refresh — 2026-09-22

Pre-publication validation snapshot, based on `82b61d0`. Publication evidence is recorded by the two-phase static deployment helper under `.tmp/deploy-static/<source-sha>/`.
This is a product presentation and funnel improvement; no conversion uplift has been measured or claimed.

## What changed

- The homepage leads with the work: take off quantities, review drawings, and pay once. The Pro purchase action is prominent, with an outlined free-download action and the three-measurement allowance stated beside it.
- Three actual-app workflow demonstrations replace the old 1.4 hero and the release spotlights that previously preceded the buying decision: calibrated takeoff, colored revision overlays, and markup review. The overlay demo is explicitly Pro; it does not claim automatically generated comparison clouds.
- The price remains **$74.95 USD once**. The unsupported planned $99 strike-through was removed. The three-computer allowance, included 1.x updates, possible optional future major upgrades, tax disclosure, email activation, and direct-purchase 14-day refund terms remain visible.
- Free and Pro now have a shared semantic comparison table. It covers the measurement cap, PDF content editing, colored overlays, toolset placement, Symbol Search, installed plugins, and Revision Package permissions.
- The buy page presents a shorter benefit list, the license facts beside checkout, and activation/refund guidance. App-originated upgrade visits retain their focused flow. A cancelled purchase review leaves the offscreen checkout shortcut available for retry.
- The shared site theme uses black, white, and neutral grays. Actual product captures retain their meaningful drawing and annotation colors.
- Demo video loads only after entering view. Offscreen playback pauses without resetting the time or an explicit user pause. Reduced/paused motion receives a poster; full-size MP4 and downloadable GIF links remain available. The sample drawing downloads have no form gate.

## Evidence and boundaries

The offer and rights were checked against `src/lib/commercialOffer.js`, the website Terms and Refund pages, and the existing checkout-review flow. App access boundaries were checked against the current desktop source's `paid-feature-access.ts` and `FREE_TIER_MEASUREMENT_LIMIT = 3`. The historical conversion audit informed the work, but its old founder offer and dates were not reused.

The new media uses the current locally built Electron interface. The final manifest records **1.5.4 build 26 development**, separately from the website's advertised **1.5.5 build 27** release. Source revision `47a3312`, dirty and untracked source hashes, built renderer hashes, composition hashes, output hashes, and source PDF hashes preserve its actual identity. The workflows show 48-foot calibration, a 216-square-foot Project Room measurement, actual Overlay Pages output, and a Cloud plus Callout review. These are edited captures of authentic UI actions, with captions and camera moves.

The original, synthetic Northline Studio PDF pair is present in `public/samples/conversion/`. The drawings are labeled as samples, not for construction.

| PDF | SHA-256 |
| --- | --- |
| `northline-studio-rev-a.pdf` | `4d666ff24720f4a1bde24288e78ff19b1f4fe160f216a3ffeda314c669404bb5` |
| `northline-studio-rev-b.pdf` | `977bc9e61dc567b212a6dea6f5d284a894680beacbb3c8d75e324e3684f94405` |

`scripts/workflow-demo-evidence.mjs` requires source/renderer identity, three workflow records, all twelve GIF/MP4/WebM/WebP outputs, and the appropriate source PDF hashes. It checks file hashes, byte lengths, and format signatures. The prerender gate requires the three visible poster embeds and accessible media/sample links. The production smoke test compares deployed media and sample bytes with the verified local manifest and rejects HTML fallback responses. These checks prevent missing, stale, or misrouted assets; visual inspection is still required to establish that a demonstration communicates the real workflow clearly.

## Measurement plan

All new events use the existing analytics consent gate and safe-property allowlist. An event denied before consent does not consume a demo milestone; a later new interaction can be recorded after opt-in. Consent itself does not replay earlier events.

| Event | What it establishes | What it does not establish |
| --- | --- | --- |
| `workflow_demo_play` | A demo began playback in view | Deliberate user interest; playback can start automatically |
| `workflow_demo_watched` | Playback reached 75% while visible | Comprehension or purchase intent |
| `workflow_demo_open`, `workflow_steps_view` | A full-size video or written steps were opened | Completed evaluation of the product |
| `workflow_gif_download`, `sample_download` | A download link was clicked, with workflow/source context | A completed download or an opened file |
| `workflow_guide_click`, `workflow_section_click` | A visitor chose additional workflow information | An installation or sale |
| `purchase_section_view` | The homepage price section entered view | An accepted offer |
| `download_click` | An installer link was clicked | A completed install or activation |
| `buy_click`, `checkout_click` | A visitor initiated the purchase flow | Payment |
| `checkout_review_cancelled` | The terms-review step was cancelled | Stripe abandonment after entering payment details |
| `checkout_session_created`, `checkout_started` | The first-party API created a Stripe-hosted session | A paid or fulfilled purchase |
| `purchase` / advertising conversion | The existing first-party endpoint returned webhook-verified payment data, with provider-specific consent and transaction deduplication | A retained purchase after a future refund |

Use verified payments and fulfilled licenses as the sales authority. Review the path from page/section views through checkout creation to verified purchases, split by source and platform; also inspect checkout errors, refunds, and activation issues. Consent-based web reports represent only the consenting audience and should not be treated as the total business ledger.

For an effect estimate, compare an agreed post-release period against a comparable baseline while controlling for traffic volume, channel mix, platform, offer, and app release changes. A concurrent randomized experiment would provide stronger causal evidence. Do not label a before/after difference as caused by this refresh, and do not substitute download clicks or automatic demo playback for sales.

## Final local verification

- The complete React suite passed **81 tests across 22 suites**, including offer-unavailable guards, checkout retry, consent-aware analytics, manual video pause, viewport pause/resume, global motion pause, and a route-navigation regression that verifies each workflow receives its own video instance.
- All **13 post-deploy/evidence fixture tests**, **6 international tests**, and **10 static-deployment tests** passed. Negative controls reject wrong media hashes, HTML fallback responses, wrong release identity, broken trust pages, stale deployment predecessors, and corrupted uploads.
- All three HyperFrames compositions passed lint, runtime, layout, and contrast checks. Final MP4/GIF files were decoded in full; dimensions, duration, footer presence, looping and loop return were verified. Both the capture agent and root inspected final decoded contact sheets. An export viewport defect and a review-table crop were corrected before final encoding.
- The twelve final assets are 1280 × 800. Each animated output runs 12 seconds; MP4/WebM use 24 fps, GIFs use 12 fps. The site prefers the smaller video files and loads them near the viewport; GIFs remain downloadable.
- Browser checks used Chrome on the local development site at 390 px and 1669 px widths. Homepage, purchase, workflow, support, article, account, policy and auxiliary templates were checked for neutral colors and overflow. Mobile navigation, checkout review/cancel, and global motion pause were exercised. Paused videos were hidden and paused while all four static posters remained visible. No agreement was accepted and no payment was made.
- A source scan found no remaining chromatic hex literals in production JavaScript/CSS. Product capture pixels retain semantic annotation colors.
- `git diff --check` passed. The final full build includes the existing screenshot-evidence gate, English prerender checks, workflow asset/provenance checks, and the eight-language completeness gate.

The release uses `scripts/deploy-static.py`: staging validates every file and leaves the existing site live; activation switches atomically and hash-checks every public resource with guarded rollback. Deployment receipts, production smoke output, localized-route checks, and final public browser inspection establish publication separately from this source snapshot.
