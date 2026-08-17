#!/usr/bin/env node
// Build gate for the static rendering step: every public route's built index.html must contain
// real body markup (not CRA's empty shell) and parseable JSON-LD. Runs at the end of `npm run
// build` so a droplet build can never ship crawler-empty pages again without failing loudly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.resolve(root, process.env.BUILD_PATH || 'build');
const routeMetadata = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/route-metadata.json'), 'utf8'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const [route, metadata] of Object.entries(routeMetadata)) {
  const htmlPath = route === '/'
    ? path.join(buildDirectory, 'index.html')
    : path.join(buildDirectory, route.slice(1), 'index.html');
  if (!fs.existsSync(htmlPath)) {
    failures.push(`${route}: built index.html is missing`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert(!html.includes('<div id="root"></div>'), `${route}: #root is empty — prerender did not run`);
  const rootStart = html.indexOf('<div id="root">');
  assert(rootStart !== -1, `${route}: #root container is missing`);
  const body = rootStart === -1 ? '' : html.slice(rootStart);
  assert(body.length > 2000, `${route}: prerendered body is implausibly small (${body.length} bytes)`);
  assert(html.includes('<link rel="canonical"'), `${route}: canonical link is missing`);
  assert((body.match(/data-site-footer="true"/g) || []).length === 1, `${route}: canonical footer is missing or duplicated`);
  for (const footerPath of [
    '/pdf-takeoff-software',
    '/measure-pdf-on-mac',
    '/construction-pdf-markup',
    '/visual-search-pdf-count',
    '/compare-pdf-drawings'
  ]) {
    assert(body.includes(`href="${footerPath}"`), `${route}: footer is missing ${footerPath}`);
  }

  const indexable = !metadata.robots.includes('noindex');
  if (indexable) {
    assert(/<h1[\s>]/.test(body), `${route}: prerendered body has no <h1>`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  for (const [, raw] of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(raw);
      assert(parsed['@context'] === 'https://schema.org', `${route}: JSON-LD block lacks schema.org @context`);
      assert(typeof parsed['@type'] === 'string', `${route}: JSON-LD block lacks @type`);
    } catch (error) {
      failures.push(`${route}: JSON-LD block does not parse (${error.message})`);
    }
  }
}

if (failures.length > 0) {
  console.error('Prerender verification failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Verified prerendered markup and JSON-LD for ${Object.keys(routeMetadata).length} routes.`);
