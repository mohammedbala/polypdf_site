---
workflow: motion-graphics
flow: automation
storyboard: no
message: "PolyPDF snaps dimensions precisely to drawing geometry"
destination: website-hero
aspect: 1710x1073
language: en
length: 5.2s
---

## Intent

Turn the homepage hero from a static product screenshot into a short, quiet
demonstration of PolyPDF's dimension workflow: approach the lower-left drawing endpoint,
show the snap lock, draw the measurement across the plan's lower edge, and resolve the
dimension visibly. It should feel like the real shipping app, with a playful
but restrained layer of motion graphics rather than a synthetic mockup.

## Assets

- `../../src/assets/screenshots/takeoff-v1-4-dark-web.png` — exact PolyPDF 1.4 product frame used as the animation base.
- `../../src/assets/screenshots/auto-area-v1-4-dark-web.png` — static source for a site-native Auto Area motion accent.
- `../../src/assets/screenshots/pdf-maps-v1-4-dark-web.png` — static source for a site-native PDF Maps motion accent.

## Customizations

- Render the primary hero deliverable as an endlessly looping GIF with an unhurried hold before the loop resets.
- Animate a real cursor, endpoint snap target, dimension guide, extension lines, and the resolved measurement label.
- Add restrained site-native motion overlays to Auto Area and PDF Maps, with static reduced-motion fallbacks.

## Notes

- Preserve the complete shipping toolbar and the centered, full-page document.
- Remove the already-selected source dimension before frame zero so the motion resolves to exactly one measurement.
- No camera shake, fake application chrome, tutorial modal, or noisy captions.
- Keep file weight appropriate for an eager homepage hero.
