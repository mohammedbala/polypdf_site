/*
 * Per-route JSON-LD builders for scripts/prerender.js.
 *
 * Only ever require this module from prerender.js — it imports files from src/, which need the
 * Babel/asset require hooks prerender.js installs first.
 *
 * Every route-specific value here is sourced from the same modules the visible pages render from
 * (landingPages.js, blogPosts.js, route-metadata.json), so the structured data cannot drift from
 * the on-page claims. Deliberate omissions:
 * - No aggregateRating / review markup: PolyPDF has no collected ratings, and inventing them is
 *   exactly the kind of overclaim the product review process exists to catch.
 * - No paid Offer: founder availability is served dynamically by the app/API, so static InStock,
 *   availabilityEnds, or priceValidUntil claims can go stale. /buy remains authoritative.
 */

'use strict';

const path = require('path');

const srcDirectory = path.resolve(__dirname, '..', 'src');
const req = (relative) => require(path.join(srcDirectory, relative));

const routeMetadata = req('lib/route-metadata.json');
const { landingPages } = req('lib/landingPages.js');
const { blogPosts, blogPostPath } = req('lib/blogPosts.js');
const { DOWNLOADS } = req('lib/platform.js');
const { mediaCopy } = req('components/WorkflowLanding.js');

const ORIGIN = 'https://www.polypdf.com';
const ORG_ID = `${ORIGIN}/#organization`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const APP_ID = `${ORIGIN}/#software`;
const SOCIAL_IMAGE = `${ORIGIN}/og-image.png`;

const absolute = (route) => `${ORIGIN}${route === '/' ? '/' : route}`;

const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'PolyPDF',
  url: `${ORIGIN}/`,
  logo: { '@type': 'ImageObject', url: `${ORIGIN}/logo512.png` },
  email: 'support@polypdf.com',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@polypdf.com'
  }
});

const website = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${ORIGIN}/`,
  name: 'PolyPDF',
  publisher: { '@id': ORG_ID }
});

// Feature phrasing mirrors the product's own claims — reviewed for accuracy, never expanded here.
const FEATURE_LIST = [
  'PDF markup and annotation: callouts, revision clouds, highlights, shapes, stamps',
  'Measurement calibration with distance, area, perimeter, angle, and count tools',
  'Takeoff worksheets with CSV and PDF export',
  'Symbol Search (formerly Visual Search): capture one drawing symbol and auto-count matching instances',
  'Compare documents with revision clouds on detected differences',
  'Form filling and a drag-and-drop form builder',
  'Digital signatures (CMS/PKCS#7) and visual signatures',
  'OCR for scanned drawings',
  'Bates numbering, headers and footers, and watermarks',
  'Redaction for supported searchable text, with documented limits for vector, outlined, image, and nested content',
  'Automatic sheet hyperlinking for NCS sheet numbers',
  'Save markups as SVG, PNG, JPEG, or DXF',
  'Signed plugin platform with three first-party plugins'
];

const softwareApplication = (description) => ({
  '@type': 'SoftwareApplication',
  '@id': APP_ID,
  name: 'PolyPDF',
  description,
  url: `${ORIGIN}/`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: `${DOWNLOADS.mac.requirements.replace(/ · /g, ', ')}; ${DOWNLOADS.windows.requirements.replace(/ · /g, ', ')}`,
  downloadUrl: [`${ORIGIN}${DOWNLOADS.mac.url}`, `${ORIGIN}${DOWNLOADS.windows.url}`],
  featureList: FEATURE_LIST,
  publisher: { '@id': ORG_ID },
  // The paid Founder offer can close by date or count, so static JSON-LD deliberately omits it.
  // /buy and /api/commercial-offer are the live sources of truth. Free remains always available.
  offers: {
    '@type': 'Offer',
    name: 'PolyPDF Free',
    price: '0',
    priceCurrency: 'USD',
    url: `${ORIGIN}/`,
    availability: 'https://schema.org/InStock',
    description:
      'Free download for Mac and Windows with markup and review tools, up to 3 hand-created measurements per document, and uncapped Symbol Search auto-count.'
  }
});

const breadcrumbLabel = (route) => (route === '/' ? 'Home' : routeMetadata[route].title.split(' | ')[0]);

const breadcrumbs = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([route, name], index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: name || breadcrumbLabel(route),
    item: absolute(route)
  }))
});

const webPage = (route) => ({
  '@type': 'WebPage',
  url: absolute(route),
  name: routeMetadata[route].title,
  description: routeMetadata[route].description,
  isPartOf: { '@id': WEBSITE_ID }
});

const blogPosting = (entry) => {
  const route = blogPostPath(entry.slug);
  const metadata = routeMetadata[route];
  const imageURL = metadata?.image ? absolute(metadata.image) : SOCIAL_IMAGE;
  const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
  return {
    '@type': 'BlogPosting',
    headline: entry.title,
    description: entry.metaDescription,
    datePublished: entry.date,
    dateModified: entry.dateModified || entry.date,
    author: { '@type': 'Organization', name: 'PolyPDF', url: `${ORIGIN}/` },
    publisher: organization(),
    image: {
      '@type': 'ImageObject',
      url: imageURL,
      width: metadata?.imageWidth || 1200,
      height: metadata?.imageHeight || 630,
      caption: entry.heroImage?.caption || metadata?.imageAlt || entry.title
    },
    articleSection: entry.tag,
    keywords: keywords.join(', '),
    about: keywords.slice(0, 5).map((name) => ({ '@type': 'Thing', name })),
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    url: absolute(route),
    mainEntityOfPage: absolute(route)
  };
};

const blogListing = () => ({
  '@type': 'Blog',
  url: absolute('/blog'),
  name: routeMetadata['/blog'].title,
  description: routeMetadata['/blog'].description,
  publisher: organization(),
  blogPost: blogPosts.map((entry) => ({
    '@type': 'BlogPosting',
    headline: entry.title,
    datePublished: entry.date,
    dateModified: entry.dateModified || entry.date,
    image: routeMetadata[blogPostPath(entry.slug)]?.image
      ? absolute(routeMetadata[blogPostPath(entry.slug)].image)
      : SOCIAL_IMAGE,
    url: absolute(blogPostPath(entry.slug))
  }))
});

// The workflow videos shipped with the Phase 2 landing pages on 2026-07-31.
const WORKFLOW_VIDEO_UPLOAD_DATE = '2026-07-31';

const workflowVideo = (page) => {
  const copy = mediaCopy[page.mediaSlug];
  return {
    '@type': 'VideoObject',
    name: copy.title,
    description: copy.description,
    contentUrl: `${ORIGIN}/videos/${page.mediaSlug}-narrated.mp4`,
    thumbnailUrl: `${ORIGIN}${page.image}`,
    uploadDate: WORKFLOW_VIDEO_UPLOAD_DATE,
    publisher: { '@id': ORG_ID }
  };
};

const wrap = (blocks) => blocks.map((block) => ({ '@context': 'https://schema.org', ...block }));

const buildStructuredData = (route) => {
  const metadata = routeMetadata[route];
  if (!metadata || metadata.robots.includes('noindex')) return [];

  if (route === '/') {
    return wrap([
      organization(),
      website(),
      softwareApplication(metadata.description)
    ]);
  }

  if (route === '/buy' || route === '/windows') {
    return wrap([breadcrumbs([['/'], [route]]), softwareApplication(metadata.description)]);
  }

  if (route === '/blog') {
    return wrap([breadcrumbs([['/'], ['/blog']]), blogListing()]);
  }

  const post = blogPosts.find((entry) => blogPostPath(entry.slug) === route);
  if (post) {
    return wrap([breadcrumbs([['/'], ['/blog'], [route, post.title]]), blogPosting(post)]);
  }

  const workflowPage = Object.values(landingPages).find((page) => page.path === route);
  if (workflowPage) {
    return wrap([
      breadcrumbs([['/'], [route]]),
      webPage(route),
      workflowVideo(workflowPage)
    ]);
  }

  return wrap([breadcrumbs([['/'], [route]]), webPage(route)]);
};

module.exports = { buildStructuredData, ORIGIN };
