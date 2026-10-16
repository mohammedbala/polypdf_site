import routeMetadata from './route-metadata.json';
import { blogPosts, blogPostPath } from './blogPosts';
import { landingPageRoutes } from './landingPages';
import siteRelease from './siteRelease.json';

const { buildStructuredData } = require('../../scripts/structured-data');

test('product facts and workflow pages identify the same software and publisher', () => {
  const facts = buildStructuredData('/product-facts');
  const app = facts.find((entry) => entry['@type'] === 'SoftwareApplication');
  const page = facts.find((entry) => entry['@type'] === 'WebPage');
  const publisher = facts.find((entry) => entry['@type'] === 'Organization');
  expect(page.mainEntity['@id']).toBe(app['@id']);
  expect(page.publisher['@id']).toBe(publisher['@id']);
  expect(page.dateModified).toBe('2026-10-16');
  for (const route of ['/pdf-measuring-tool', '/pdf-takeoff-software', '/flooring-takeoff-software', '/bluebeam-alternative']) {
    const workflow = buildStructuredData(route).find((entry) => entry['@type'] === 'WebPage');
    expect(workflow.about['@id']).toBe(app['@id']);
    expect(workflow['@id']).toBe(`https://www.polypdf.com${route}/#webpage`);
    expect(workflow.publisher['@id']).toBe(publisher['@id']);
  }
});

test('does not emit retired FAQPage structured data on any route', () => {
  Object.keys(routeMetadata).forEach((route) => {
    const types = buildStructuredData(route).map((entry) => entry['@type']);
    expect(types).not.toContain('FAQPage');
  });
});

test('does not advertise removed workflow videos on landing routes', () => {
  landingPageRoutes.forEach(({ path }) => {
    const blocks = buildStructuredData(path);
    expect(blocks.map((entry) => entry['@type'])).toEqual(['BreadcrumbList', 'WebPage']);
    expect(JSON.stringify(blocks)).not.toMatch(/\/videos\/|\.mp4|\.vtt/);
  });
});

test('static application schema advertises Free but not a closable paid offer', () => {
  const application = buildStructuredData('/buy')
    .find((entry) => entry['@type'] === 'SoftwareApplication');
  expect(application.offers).toMatchObject({
    '@type': 'Offer',
    name: 'PolyPDF Free',
    price: '0',
    availability: 'https://schema.org/InStock'
  });
  expect(JSON.stringify(application.offers)).not.toContain('Founder');
  expect(JSON.stringify(application.offers)).not.toContain('49.99');
  expect(JSON.stringify(application.featureList)).not.toContain('permanently removes');
  expect(JSON.stringify(application.featureList)).toContain('documented limits');
  expect(JSON.stringify(application.featureList)).toContain('Revision Packages');
  expect(application.softwareVersion).toBe(siteRelease.version);
  expect(application.offers.description).toContain('Revision Package viewing');
  expect(application.offers.description).toContain('Revision Package changes or publishing require PolyPDF Pro');
});

test('BlogPosting schema uses each post evidence image and reviewed dates', () => {
  blogPosts.forEach((entry) => {
    const route = blogPostPath(entry.slug);
    const blocks = buildStructuredData(route);
    const article = blocks.find((block) => block['@type'] === 'BlogPosting');

    expect(article).toBeDefined();
    expect(article.headline).toBe(entry.title);
    expect(article.datePublished).toBe(entry.date);
    expect(article.dateModified).toBe(entry.dateModified);
    expect(article.author.url).toBe('https://www.polypdf.com/');
    expect(article.url).toBe(`https://www.polypdf.com${route}/`);
    expect(article.mainEntityOfPage).toBe(`https://www.polypdf.com${route}/`);
    expect(article.publisher).toMatchObject({
      '@type': 'Organization',
      '@id': 'https://www.polypdf.com/#organization',
      url: 'https://www.polypdf.com/',
      logo: { url: 'https://www.polypdf.com/logo512.png' }
    });
    expect(article.image).toMatchObject({
      '@type': 'ImageObject',
      url: `https://www.polypdf.com/guides/${entry.slug}.png?v=${entry.imageCacheToken || siteRelease.screenshotCacheToken}`,
      width: entry.heroImage.width,
      height: entry.heroImage.height,
      caption: entry.heroImage.caption
    });
    expect(article.keywords).toContain(entry.keywords[0]);
    expect(article.about).toEqual(
      entry.keywords.slice(0, 5).map((name) => ({ '@type': 'Thing', name }))
    );
    expect(article.isAccessibleForFree).toBe(true);
  });
});
