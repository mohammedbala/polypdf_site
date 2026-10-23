# Teams customer guide — September 25, 2026

The customer guide is a website route at `/teams/guide`, linked from Teams and the site footer. `/teams/setup` renders the same current guide for existing links. It contains no historical screenshots, audit timelines, test tenants or internal release artifacts. Internal evidence remains separate.

Content follows app/manager source 79ef76e95baa7f39078f3af162a5e17db80e0689 and website Teams UI based on cfefaf6. It covers purchase (minimum three seats), prerequisites, native console setup, enrollment, assignments, employee sign-in, recovery and maintenance. Employees use the firm’s Entra tenant; PolyPDF holds the billing-owner account, not firm employee accounts. Entra authentication is cloud-hosted by Microsoft.

## Validation

- Full website regression: 26 suites, 118 tests passed.
- Final guide suite: 10 tests passed, including automated WCAG A/AA checks (color contrast excluded from the DOM-only checker), clipboard failure/success, printing disclosures, anchors and safe release/download handling.
- Full production build passed; 42 English routes plus 240 localized pages across eight languages verified. After the account-ownership wording update, compilation, prerender and all international verification passed again. The guide itself remains English; its footer link is translated.
- Interactive browser checks: desktop layout, 390px and 320px layouts with no horizontal overflow, keyboard disclosure/section navigation, employee checklist copying and current ownership copy. Responsive overrides were reset afterward.
- Screenshot provenance: screenshots are captures of the actual built customer guide. They are internal website-layout evidence, not screenshots of a paid Teams activation.

## Release boundary

The production download manifest remains unavailable; no installer links are invented. The unavailable and network-failure states are customer-facing and actionable. No checkout setting, desktop download or public deployment was changed. The website guide is prepared for release with the Teams website; the broader Teams launch gates still apply.
