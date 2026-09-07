# Website privacy, terms and accessibility update

Scope: polypdf.com and its checkout initiation. Based on production site commit `1a9b8702119bc2384a17b5293e315a7dae11ec83`, in an isolated `codex/site-privacy-accessibility` worktree. The older main site checkout contains unrelated unfinished work and was left intact.

This work reduces identified risks. It is not legal advice, a WCAG conformance certificate, or a guarantee against a claim.

## What changed

- Removed the unconditional Google queue/loader from the HTML template. The site now requires a current, explicit choice before analytics or advertising tracking starts. Analytics and advertising are independently selectable; neither defaults on.
- Added equally styled accept/reject choices, a native keyboard-accessible settings dialog, a persistent footer settings link, a versioned 180-day preference and handling for expired, malformed or unavailable storage. Global Privacy Control and Do Not Track override optional grants. Changes in other tabs and page visibility trigger a fresh check.
- All website event callers now use one consent-aware dispatcher. Events exclude arbitrary form properties; URL queries, fragments and referrer paths are not intentionally passed to Google. Purchase payloads still require the first-party API's webhook-verified payment response. Analytics and Ads deduplicate independently with 30-day validity. Campaign attribution is not stored or attached to checkout without advertising consent, including a consent recheck immediately before the request.
- Withdrawal clears accessible first-party tracking cookies and optional local storage. When provider code is already running, the page reloads to unload it. Other domains' cookies and information already sent require browser/provider controls or a rights request.
- Added a cookie/storage inventory, expanded the privacy notice and added an accessibility statement with explicit limits. Kept the published operator name and support contact; no business address or jurisdiction was invented.
- Added a purchase review with an unchecked required terms agreement. No checkout session is created by current site controls until it is checked. Closing or cancelling the review grants neither terms acceptance nor optional tracking.
- The license API validates an incoming website acceptance, records its version and server time in Checkout and PaymentIntent metadata, and preserves the commercial license version `2026-07-30`. Legacy clients without this new field remain compatible and are not represented as having accepted it.
- Preserved the 14-day guarantee and grandfathered licenses. Clarified that downloading/using the app alone does not waive statutory cancellation rights, preserved mandatory consumer protections, and removed wording that could imply a customer must delay a card dispute.
- Added form instructions and announced status/errors, focus transfer after client-side route changes, general focus indicators, a pause-animations control and native video controls. Reduced motion presents still product imagery. Policy pages remain prerendered and discoverable without JavaScript.

## Verification and limits

The final website suite passed 66 checks in 20 suites. The license API suite passed, including 13 commercial-offer checks and the new acceptance metadata test. Deployment-smoke tests passed 8/8 and screenshot-evidence tests passed 12/12. The full production screenshot gate found 55 PNGs, 40 evidence records and zero violations. The production build compiled and prerendered all 35 registered routes and the 404 page, and every route passed the prerender verifier.

Six axe-core semantic checks cover the five policy pages and cookie choices. Their jsdom environment has no layout engine, so color contrast is deliberately excluded. Browser checks used the actual production build in an isolated local preview at desktop width and a 320-pixel viewport. They verified no Google script before choice or after refusal, separate analytics/advertising choices, loading only after grant, and unloading on withdrawal. The preview blocked provider requests to avoid generating real analytics.

Native dialogs retained keyboard focus, Escape restored focus to their opener, and client-side policy navigation focused the new heading. Cookie/privacy/accessibility pages and dialogs had no horizontal overflow at the narrow viewport; tall dialogs remained scrollable. Purchase agreement started unchecked, prevented continuation, and cancellation restored the purchase link. A local payment stub received exactly one accepted request with version `2026-09-06` and empty attribution; its failure produced an announced error and never created a real payment. The pause-animations control removed looping video in favor of still imagery. These are targeted checks, not a complete manual accessibility audit.

The checkout service was deployed with source-hash preconditions, preserved ownership, backup copies, syntax checks and automatic restoration on a failed health check. Live health passed, invalid acceptance returned HTTP 400, and the explicit deployment monitor successfully created and immediately expired a Stripe session carrying the current acceptance without a payment. Final website deployment evidence is retained with the deployment workflow and the task's release notes.

The first build was interrupted after the disk filled. Only this task's installed dependency directory was removed; an existing installation with the identical lockfile and React Router version was reused. One prematurely started build read the dependency directory during that replacement and failed; the subsequent build runs after setup completed. No source, user document, unrelated cache or production data was deleted.

## Owner and legal review still needed

1. Confirm Euclidean Software LLC's registration country/state and public correspondence address. The owner was asked; no answer has been supplied. The existing published name and support email remain in use.
2. Confirm the actual processor contracts, international transfer mechanisms, hosting/email providers and retention schedules for support, logs, backups and financial records. Provider privacy links are disclosure aids, not proof that the business has completed these obligations.
3. Review Google Analytics/Ads account-side settings, linked products, enhanced measurement, data-sharing configuration and retention. This change gates the website tags; it is not an audit of those external accounts.
4. Have counsel assess applicable sales regions, privacy-law thresholds, consumer cancellation/information requirements, any representative/registration duties, and enforceability of the revised terms. Existing liability language is subject to mandatory rights and has not been certified enforceable.
5. Establish a repeatable privacy-rights process, including verification, legally justified retention, processor coordination and pseudonymous desktop diagnostics. A prior desktop audit found that diagnostic pseudonyms and licensing hashes differ; this website update does not repair or certify that separate erasure workflow.
6. Continue accessibility checks with screen-reader users and representative browsers, including Stripe checkout, older guide imagery, the desktop app and customer PDFs. Automated tests alone cannot establish full accessibility.

## Official references consulted

- [ICO: Managing consent in practice](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/) — prior choice, equally easy refusal, granular purposes and withdrawal.
- [ICO: Right to be informed](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/) — identity/contact, purposes and bases, recipients, transfers, retention and rights. This guidance notes it is under review following the Data (Use and Access) Act.
- [US Department of Justice: Web accessibility guidance](https://www.ada.gov/resources/web-guidance/) — keyboard operation, labels, contrast, alternatives and combining automated and manual checks.
- [W3C: WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) — technical accessibility reference.
- [California Attorney General: CCPA](https://oag.ca.gov/privacy/ccpa) — privacy rights and opt-out signals, subject to legal applicability.
- [Google: Consent mode](https://developers.google.com/tag-platform/security/guides/consent) and [Google cookie information](https://policies.google.com/technologies/cookies) — provider settings and storage context.
