import fs from 'fs';
import path from 'path';
import routeMetadata from './route-metadata.json';
import { blogPosts, blogPostPath } from './blogPosts';

const screenshotImageVersion = '20260819-currentdev';

const readPublic = (name) => fs.readFileSync(path.join(process.cwd(), 'public', name), 'utf8');

test('sitemap, llms.txt and RSS cover every indexable article', () => {
  const sitemap = readPublic('sitemap.xml');
  const llms = readPublic('llms.txt');
  const feed = readPublic('feed.xml');

  Object.entries(routeMetadata).forEach(([route, metadata]) => {
    if (metadata.robots.includes('noindex')) {
      expect(sitemap).not.toContain(`<loc>https://www.polypdf.com${route}</loc>`);
    } else {
      const url = route === '/' ? 'https://www.polypdf.com/' : `https://www.polypdf.com${route}/`;
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }
  });

  blogPosts.forEach((entry) => {
    const url = `https://www.polypdf.com${blogPostPath(entry.slug)}/`;
    expect(llms).toContain(`(${url})`);
    expect(feed).toContain(`<link>${url}</link>`);
  });
  expect((feed.match(/<item>/g) || [])).toHaveLength(blogPosts.length);
});

test('the image sitemap and RSS expose one truthful public screenshot for every post', () => {
  const sitemap = readPublic('sitemap.xml');
  const feed = readPublic('feed.xml');
  expect(sitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');

  blogPosts.forEach((entry) => {
    const publicPath = path.join(process.cwd(), 'public', 'guides', `${entry.slug}.png`);
    const imageUrl = `https://www.polypdf.com/guides/${entry.slug}.png?v=${screenshotImageVersion}`;
    expect(sitemap).toContain(
      `<image:loc>${imageUrl}</image:loc>`
    );
    const imageLength = fs.statSync(publicPath).size;
    expect(imageLength).toBeGreaterThan(0);
    expect(feed).toContain(
      `<enclosure url="${imageUrl}" length="${imageLength}" type="image/png" />`
    );
  });
});

test('ordinary feed discovery and the crawler allowlist remain advertised', () => {
  const index = readPublic('index.html');
  const robots = readPublic('robots.txt');
  expect(index).toContain('rel="alternate" type="application/rss+xml"');
  expect(index).toContain('href="https://www.polypdf.com/feed.xml"');
  expect(robots).toContain('User-agent: OAI-SearchBot');
  expect(robots).toContain('User-agent: ChatGPT-User');
  expect(robots).toContain('Sitemap: https://www.polypdf.com/sitemap.xml');
});

test('llms.txt carries the reviewed redaction and sanitation limitations', () => {
  const llms = readPublic('llms.txt');
  expect(llms).toContain('it is not fail-closed for every content type');
  expect(llms).toContain('can miss some direct attachments and nested actions');
  expect(llms).not.toContain('Redaction permanently removes supported text');
});
