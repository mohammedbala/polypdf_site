import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.resolve(root, process.env.BUILD_PATH || 'build');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/route-metadata.json'), 'utf8'));
const baseHTML = fs.readFileSync(path.join(buildDirectory, 'index.html'), 'utf8');
const origin = 'https://www.polypdf.com';

const escapeHTML = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const replace = (html, expression, replacement) => {
  if (!expression.test(html)) throw new Error(`Expected metadata pattern was not found: ${expression}`);
  return html.replace(expression, replacement);
};

for (const [route, entry] of Object.entries(metadata)) {
  const url = `${origin}${route === '/' ? '/' : route}`;
  const title = escapeHTML(entry.title);
  const description = escapeHTML(entry.description);
  let html = baseHTML;

  html = replace(html, /<title>.*?<\/title>/, `<title>${title}</title>`);
  html = replace(html, /<meta name="title" content=".*?"\s*\/?>/, `<meta name="title" content="${title}" />`);
  html = replace(html, /<meta\s+name="description"\s+content=".*?"\s*\/?>/s, `<meta name="description" content="${description}" />`);
  html = replace(html, /<meta name="robots" content=".*?"\s*\/?>/, `<meta name="robots" content="${entry.robots}" />`);
  html = replace(html, /<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${url}" />`);
  html = replace(html, /<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${title}" />`);
  html = replace(html, /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/s, `<meta property="og:description" content="${description}" />`);
  html = replace(html, /<meta name="twitter:url" content=".*?"\s*\/?>/, `<meta name="twitter:url" content="${url}" />`);
  html = replace(html, /<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`);
  html = replace(html, /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/s, `<meta name="twitter:description" content="${description}" />`);
  html = replace(html, /<link rel="canonical" href=".*?"\s*\/?>/, `<link rel="canonical" href="${url}" />`);

  const outputDirectory = route === '/' ? buildDirectory : path.join(buildDirectory, route.slice(1));
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'index.html'), html);
}

console.log(`Generated server-readable metadata for ${Object.keys(metadata).length} routes.`);
