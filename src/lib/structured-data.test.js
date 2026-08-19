import routeMetadata from './route-metadata.json';
import { blogPostPath } from './blogPosts';
import { guidePosts } from '../content/guides';

const { buildStructuredData } = require('../../scripts/structured-data');

test('does not emit retired FAQPage structured data on any route', () => {
  Object.keys(routeMetadata).forEach((route) => {
    const types = buildStructuredData(route).map((entry) => entry['@type']);
    expect(types).not.toContain('FAQPage');
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
});

test('guide BlogPosting schema uses its evidence image and reviewed dates', () => {
  guidePosts.forEach((entry) => {
    const route = blogPostPath(entry.slug);
    const blocks = buildStructuredData(route);
    const article = blocks.find((block) => block['@type'] === 'BlogPosting');

    expect(article).toBeDefined();
    expect(article.headline).toBe(entry.title);
    expect(article.datePublished).toBe(entry.date);
    expect(article.dateModified).toBe(entry.dateModified);
    expect(article.author.url).toBe('https://www.polypdf.com/');
    expect(article.publisher).toMatchObject({
      '@type': 'Organization',
      '@id': 'https://www.polypdf.com/#organization',
      url: 'https://www.polypdf.com/',
      logo: { url: 'https://www.polypdf.com/logo512.png' }
    });
    expect(article.image).toMatchObject({
      '@type': 'ImageObject',
      url: `https://www.polypdf.com/guides/${entry.slug}.png`,
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
