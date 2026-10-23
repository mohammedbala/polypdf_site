# PolyPDF SEO and Answer-Engine System

This document describes the system that is currently implemented. It is not a backlog of
unverified schema or content ideas.

## Current crawl surface

- 31 routes are prerendered with real body content, unique titles, descriptions, canonicals,
  Open Graph/Twitter metadata, and route-appropriate JSON-LD.
- 13 evidence-backed articles are published: twelve workflow guides plus the PolyPDF plugin
  platform note.
- `sitemap.xml`, `feed.xml`, `llms.txt`, and route metadata are generated from the same article
  registry before every build.
- Canonical page URLs use trailing slashes, matching the production Nginx behavior.
- Article share-image URLs carry the current screenshot version so long-lived caches cannot keep
  serving an older light-mode or mismatched capture.

## Structured data policy

- The home/product graph includes Organization, WebSite, and SoftwareApplication entities.
- Article routes emit BlogPosting with author, reviewed dates, keywords, topics, free-access status,
  and the exact evidence image.
- Workflow pages emit WebPage and BreadcrumbList data.
- Paid-offer availability is intentionally omitted from static schema because the Founder Offer can
  close; `/buy/` and the commercial-offer API are authoritative.
- No aggregate rating, Review, or FAQPage schema is emitted without eligible first-party evidence.
  Visible FAQs remain useful prose, but are not marked up as a Google rich-result type.

## Screenshot and media policy

- All 35 app screenshots used by the site come from the recorded current-development source
  snapshot, in PolyPDF dark mode, from a native-maximized window with the complete style bar.
- Web images are uncropped exact 50-percent derivatives of the 3420×2146 Retina captures. Article
  pages expose a keyboard-accessible horizontal detail viewport on small screens; guide cards show
  the complete frame with `object-fit: contain`.
- A build-blocking evidence registry binds each published file to its raw capture, proof files,
  workflow report, hashes, dimensions, source fingerprint, and approved transformation.
- Stale 1.1.3 workflow videos were removed rather than relabeled as current behavior.

## Answer-engine content policy

- Every guide opens with a direct Quick Answer, then shows the relevant app evidence before the
  longer explanation.
- Claims are scoped to observed behavior. High-risk subjects—OCR, redaction, sanitation,
  signatures, comparison fallbacks, forms, and plugin availability—state their limits explicitly.
- Sources favor primary references: current PolyPDF implementation/evidence, official government
  records for public-domain fixtures, and official format/service documentation.
- No testimonials, ratings, performance numbers, compatibility promises, or legal conclusions are
  invented.

## Measurement and monitoring

- GA4 and verified purchase-conversion tracking are present; purchase events come from the signed
  Stripe webhook record rather than the success-page query alone.
- The deployment smoke checks every registered route, discovery artifact, guide-image bytes,
  downloads, trust pages, checkout surface, and plugin packer after activation.
- Submit `https://www.polypdf.com/sitemap.xml` and `https://www.polypdf.com/feed.xml` to the relevant
  webmaster/feed systems, then monitor indexed pages, search queries, CTR, Core Web Vitals, and
  crawl errors.
- Evaluate organic conversion by landing route and query class. Do not publish synthetic traffic or
  conversion claims as evidence.

## Priority topic families

- PDF measurement calibration, mixed scales, area cutouts, depth, and takeoff
- Construction PDF markup, RFI/punch-list review, and revision comparison
- Symbol Search and repeated-symbol counting
- OCR for scanned engineering documents
- Fillable PDF forms, issued-set preparation, Bates numbering, and preflight
- PDF redaction/sanitation limits and certificate-versus-visual signatures
- PolyPDF workflows on macOS and Windows

Avoid iPad-specific targeting: the current product is a Mac and Windows desktop application.

## Release checklist

- Run the discovery generator and confirm 31 routes, 13 articles, 13 sitemap images, and 13 feed
  items.
- Run the screenshot evidence gate and its adversarial test suite.
- Run all Jest and post-deployment smoke tests, then complete the production build/prerender check.
- Audit representative desktop and 390px mobile routes for overflow, image completeness, alt text,
  captions, and console errors.
- After deployment, verify live canonical URLs, metadata, discovery files, and exact screenshot
  hashes before treating the release as published.
