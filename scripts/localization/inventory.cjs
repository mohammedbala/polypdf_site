#!/usr/bin/env node
'use strict';
// Read a rendered English build without modifying it. Include sample files even when no
// current guide links them, so unlinked library sheets cannot disappear from the worklist.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const content = require('../international/content.cjs');
const { inventoryWalkthroughMedia } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const value = flag => process.argv[process.argv.indexOf(flag) + 1];
if (!process.argv.includes('--build-dir')) throw new Error('Supply --build-dir for the rendered English source.');
const build = path.resolve(value('--build-dir'));
const routes = Object.keys(content.metadata);
const output = path.resolve(process.argv.includes('--output') ? value('--output') : path.join(root, '.tmp/localization/source-inventory.json'));
const assets = new Map(), externalEmbeds = [], missingPages = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function add(url, route) {
  const relative = decodeURIComponent(url).replace(/^\/+/, '');
  const candidates = [path.resolve(build, relative), path.resolve(root, 'public', relative)];
  if (candidates.some((candidate, i) => !candidate.startsWith((i ? path.join(root, 'public') : build) + path.sep))) {
    throw new Error(`Asset outside source tree: ${url}`);
  }
  const file = candidates.find(candidate => fs.existsSync(candidate));
  const entry = assets.get(url) || { source: url, sha256: file ? hash(fs.readFileSync(file)) : null, routes: [] };
  if (route && !entry.routes.includes(route)) entry.routes.push(route);
  assets.set(url, entry);
}
for (const route of routes) {
  const file = content.fileFor(build, route);
  if (!fs.existsSync(file)) { missingPages.push(route); continue; }
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  for (const asset of inventoryWalkthroughMedia(dom.window.document)) add(asset, route);
  for (const node of dom.window.document.querySelectorAll('iframe[src]')) {
    const url = node.getAttribute('src');
    if (/^https?:\/\//i.test(url) && !url.startsWith(content.ORIGIN + '/')) externalEmbeds.push({ route, url });
  }
  dom.window.close();
}
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(pdf|zip|csv|xlsx|png|webp|mp4|webm|gif|vtt)$/i.test(file)) {
      add('/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/'), null);
    }
  }
}
for (const dir of ['samples', 'guides', 'screenshots', 'images/workflows']) walk(path.join(root, 'public', dir));
const appWalkthroughAssets = [];
if (process.argv.includes('--app-root')) {
  const appRoot = path.resolve(value('--app-root'));
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(png|jpe?g|webp|gif|mp4|webm|vtt|pdf)$/i.test(file)) {
        appWalkthroughAssets.push({ source: path.relative(appRoot, file).split(path.sep).join('/'),
          sha256: hash(fs.readFileSync(file)) });
      }
    }
  };
  visit(path.join(appRoot, 'docs/teams/walkthrough'));
}
const report = {
  schemaVersion: 1, sourceRelease: require('../../src/lib/siteRelease.json'),
  coverage: { eligibleRoutes: routes.length, scannedRoutes: routes.length - missingPages.length,
    currentlyTranslatedGuideRoutes: content.routes,
    currentlyEnglishOnlyRoutes: require('../../src/lib/englishOnlyRoutes.json'),
    missingPages, externalEmbeds, scope: 'All English route metadata, including currently English-only pages, plus public sample, guide, screenshot and workflow files. External CSS, dynamic states, the separately served Teams walkthrough and native/iPad surfaces require separate review.' },
  assets: [...assets.values()].sort((a, b) => a.source.localeCompare(b.source)),
  appWalkthroughAssets: appWalkthroughAssets.sort((a, b) => a.source.localeCompare(b.source))
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ scannedRoutes: report.coverage.scannedRoutes, assets: assets.size,
  pdfs: report.assets.filter(asset => asset.source.endsWith('.pdf')).length,
  missingFiles: report.assets.filter(asset => !asset.sha256).length, missingPages: missingPages.length,
  appWalkthroughAssets: appWalkthroughAssets.length, externalEmbeds: externalEmbeds.length, output }));
