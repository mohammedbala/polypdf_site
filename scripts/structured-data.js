/*
 * Per-route JSON-LD builders for scripts/prerender.js.
 *
 * Only ever require this module from prerender.js — it imports files from src/, which need the
 * Babel/asset require hooks prerender.js installs first.
 *
 * Every value here is sourced from the same modules the visible pages render from
 * (commercialOffer.js, landingPages.js, blogPosts.js, route-metadata.json), so the structured
 * data cannot drift from the on-page claims. Deliberate omissions:
 * - No aggregateRating / review markup: PolyPDF has no collected ratings, and inventing them is
 *   exactly the kind of overclaim the product review process exists to catch.
 * - No offer end date (availabilityEnds / priceValidUntil): the founder-pricing end date is served
 *   dynamically by the app/API; a date baked into built HTML goes stale. The human-readable limit
 *   text on the pages comes from commercialOffer.js, the single editable source.
 */

'use strict';

const path = require('path');

const srcDirectory = path.resolve(__dirname, '..', 'src');
const req = (relative) => require(path.join(srcDirectory, relative));

const routeMetadata = req('lib/route-metadata.json');
const { landingPages } = req('lib/landingPages.js');
const { blogPosts, blogPostPath } = req('lib/blogPosts.js');
const { commercialOffer, founderRightsText } = req('lib/commercialOffer.js');
const { DOWNLOADS } = req('lib/platform.js');
const { homeFaqs } = req('components/Home.js');
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
  'Visual Search: capture one drawing symbol and auto-count matching instances',
  'Compare documents with revision clouds on detected differences',
  'Form filling and a drag-and-drop form builder',
  'Digital signatures (CMS/PKCS#7) and visual signatures',
  'OCR for scanned drawings',
  'Bates numbering, headers and footers, and watermarks',
  'True content-destroying redaction',
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
  offers: [
    {
      '@type': 'Offer',
      name: 'PolyPDF Free',
      price: '0',
      priceCurrency: 'USD',
      url: `${ORIGIN}/`,
      availability: 'https://schema.org/InStock',
      description:
        'Free download for Mac and Windows with markup and review tools, up to 3 hand-created measurements per document, and uncapped Visual Search auto-count.'
    },
    {
      '@type': 'Offer',
      name: commercialOffer.name,
      price: commercialOffer.price.replace('$', ''),
      priceCurrency: 'USD',
      url: `${ORIGIN}/buy`,
      availability: 'https://schema.org/InStock',
      description: founderRightsText
    }
  ]
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

const faqPage = (faqs) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer }
  }))
});

const blogPosting = (entry) => ({
  '@type': 'BlogPosting',
  headline: entry.title,
  description: entry.metaDescription,
  datePublished: entry.date,
  dateModified: entry.date,
  author: { '@type': 'Organization', name: 'PolyPDF', url: `${ORIGIN}/` },
  publisher: { '@id': ORG_ID },
  image: SOCIAL_IMAGE,
  articleSection: entry.tag,
  url: absolute(blogPostPath(entry.slug)),
  mainEntityOfPage: absolute(blogPostPath(entry.slug))
});

const blogListing = () => ({
  '@type': 'Blog',
  url: absolute('/blog'),
  name: routeMetadata['/blog'].title,
  description: routeMetadata['/blog'].description,
  publisher: { '@id': ORG_ID },
  blogPost: blogPosts.map((entry) => ({
    '@type': 'BlogPosting',
    headline: entry.title,
    datePublished: entry.date,
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
      softwareApplication(metadata.description),
      faqPage(homeFaqs)
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
      workflowVideo(workflowPage),
      faqPage(workflowPage.faq.map(([question, answer]) => ({ question, answer })))
    ]);
  }

  return wrap([breadcrumbs([['/'], [route]]), webPage(route)]);
};

module.exports = { buildStructuredData, ORIGIN };
