# Regional workflow guide integration — 12 November 2026

This website release connects the already published PolyPDF 1.6.32 build 114 language installers to 36 regional workflow guides: nine each in German, French, Spanish (Spain), and Brazilian Portuguese. It publishes the preserved regional construction libraries and completes 27 French, Spanish, and Brazilian guides with current native app screenshots. No installer, update feed, license API or account migration is part of this website release.

## Source continuity

The integration starts from published website commit bc44222ea5a6166fd17cfabc2d4eb2124b8168e2. The preserved localization source at ef8d7d20d1467e76337f03255deb430fe47790a9 was imported as 29 reviewed commits through bde8fa5. The original checkout and its history remain preserved. Current download routing, English metric exercises, and current release metadata are retained.

Seven German source-media bindings were refreshed after checking the corresponding English source changes; see source-rebinding-review.json. German app images, saved output evidence, test versions and test dates are historical and unchanged. Current page-verification receipts live in public/localized-media/de/guides114 and do not certify those old workflows on build 114. The additional German electrical preview verifier writes only an ignored preview, not a new published localized route.

## Content and assets

Each language has calibration, area/cutouts/depth, count, compare, markup-table, OCR, forms, interactive-stamp and redaction/sanitize guides. The new authored guides include six steps, expected checks, a pitfall, their own source files, language-specific Mac and Windows downloads, and related workflows.

French uses Maison de quartier des Tilleuls; Spanish uses Centro Vecinal Los Olmos; Brazilian Portuguese uses Centro Comunitário dos Ipês. The regional construction libraries contain twelve PDFs / twenty-four A1 sheets each, metric dimensions, regional labels and day/month/year dates. They are fictional practice drawings with explicit scope, not construction or regulatory certification. Previously authored Italian, Dutch, Polish and Turkish library material is preserved by this integration.

The three new A4 practice forms contain ten logical fields / twelve widgets, with a three-option exclusive status group and appearance streams for every widget. The generator, PDF language, structure, hashes and Poppler visual reviews are recorded in each forms114 directory. Native captures show those forms loaded in the matching language; they do not claim completed filled-file round trips.

All 27 new captures were taken through Screen Sharing from the actual Mac mini app, version 1.6.32 build 114. App asar SHA256: aefb8f96296779d4f222408d18a675626224739a6a397ae40cf665942e86621f. Cropping removes Screen Sharing chrome; resizing/compression is recorded. No interface pixels were generated or relabeled. Each guide manifest binds the locale, app version, capture bytes and all sixteen source resources.

## Native-check scope and findings

The check covers the real localized interface states shown, not complete saved-output qualification of every workflow or new Windows/iPad workflow testing. German build 114 compatibility was checked with its regional A101 drawing; the nine historical German workflow qualifications retain their original scope.

The French Symbol Search attempt on M101 displayed “Invalid PDF tile render request.” Cause is unconfirmed. The three new count guides disclose this dated finding and explain the manual fallback: sixteen diffusers in the plan, excluding the legend. Spanish and Brazilian screenshots show search controls and do not claim successful automatic results.

Area captions preserve the actual manually traced values: French 361.89 m² / 43.43 m³, Spanish 358.26 m² / 42.99 m³, Brazilian 357.44 m² / 42.89 m³, each with 120 mm depth. Nominal 360 m² gross, 342 m² after the 18 m² cutout, and 41.04 m³ net volume are separate drawing-reference checks.

OCR captures show completion for two image-only Latin-script pages. Compare captions identify setup states. Stamp captures show required reviewer fields, and sanitize captures show their actual dialog state. Pricing, checkout, accounts and policies remain explicitly identified as English/USD where applicable.

The native check used an isolated same-machine profile. At completion the app was quit through its UI, only owned unsaved demo changes were discarded, the original license-file hash was unchanged, source PDFs were preserved, and the owned desktop launcher symlink was removed.

## Validation

- Full production build passed, including 240 marketing translations across eight languages and 836 translated toolkit pages across twenty-two languages.
- Forty-six focused localization tests and three new regional-guide tests passed. Ten static-deployment fixture tests passed.
- All nine German guide verifiers and the separate electrical preview verifier passed.
- Site-wide navigation: 1,176 HTML pages, 61,442 links, 4,387 fragment targets, no issues.
- Static accessibility: 106 English/supplemental pages plus all 36 regional guide pages, no reported violations. Static checks exclude color contrast.
- SEO growth checks passed for all 27 configured routes.
- Native capture contact sheets and all three A4 form renders were visually reviewed.
- Mini Chrome visual review: French calibration desktop and 375 × 667 responsive layout; Spanish area guide at 375 × 667, including screenshot/caption and procedure; Brazilian form guide desktop. Text, labels, downloads and image sizing were readable in these inspected views. This is a representative layout review, not device-wide certification.
- Fixed six incoming calibration fragment links by preserving practice-calibration. Fixed a duplicate nested electrical table region label with a distinct table caption ID.

Validation log digests and structured navigation/accessibility results accompany this audit. Native screenshots and raw logs remain in the mini's regional-guides-20261112 support directory. Production stage and activation receipts are stored separately under .tmp/deploy-static/<frozen-source-sha>/ and in the deployment server's matching receipt directory; only successful public hash readback establishes deployment completion.
