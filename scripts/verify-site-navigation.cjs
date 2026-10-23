'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');
const build = path.resolve(process.env.BUILD_PATH || 'build');
const metadata = require('../src/lib/route-metadata.json');
const localized = JSON.parse(fs.readFileSync(path.join(build, 'international-manifest.json'), 'utf8')).routes;
const toolkitLocalized = JSON.parse(fs.readFileSync(path.join(build, 'toolkit-international-manifest.json'), 'utf8')).routes;
const supplemental = ['/404.html', '/samples/construction/DEMO-GUIDE.html', '/samples/electrical/README.html', '/samples/evaluation/START-HERE.html', '/samples/evaluation/local-build-1.6.14-76/verification.html'];
const routes = [...Object.keys(metadata), ...localized.map(entry => entry.route), ...toolkitLocalized.map(entry => entry.route), ...supplemental];
const origin = 'https://www.polypdf.com';
const documents = new Map();
const targetIds = new Map();
const localizedAccessibility = new Set(['/es/tools/', '/es/tools/automation/', '/ar/tools/fill-pdf-form/', '/he/tools/organize-pdf/', '/ja/tools/pdf-to-webp/', '/de/tools/text-to-pdf/']);
const issues = [];
const fileFor = pathname => path.join(build, decodeURIComponent(pathname), path.extname(pathname) ? '' : 'index.html');
function documentFor(file) {
  if (!documents.has(file)) documents.set(file, new JSDOM(fs.readFileSync(file, 'utf8'), { runScripts: 'outside-only', url: origin }).window.document);
  return documents.get(file);
}
function idsFor(file) {
  if (!targetIds.has(file)) targetIds.set(file, new Set([...documentFor(file).querySelectorAll('[id]')].map(element => element.id)));
  return targetIds.get(file);
}
(async () => {
  let checkedLinks = 0;
  let checkedFragments = 0;
  let accessibilityPages = 0;
  for (const route of routes) {
    const document = documentFor(fileFor(route));
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    targetIds.set(fileFor(route), new Set(ids));
    if (new Set(ids).size !== ids.length) issues.push({ route, issue: 'duplicate IDs' });
    for (const link of document.querySelectorAll('a[href]')) {
      const url = new URL(link.getAttribute('href'), origin + (route.endsWith('/') || path.extname(route) ? route : route + '/'));
      if (!['www.polypdf.com', 'polypdf.com'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) continue;
      if (/^\/(?:api|downloads)\//.test(url.pathname)) continue;
      checkedLinks++;
      const file = fileFor(url.pathname);
      if (!fs.existsSync(file)) { issues.push({ route, issue: 'missing target file', href: link.getAttribute('href') }); continue; }
      if (url.hash.length > 1 && file.endsWith('.html')) {
        checkedFragments++;
        const id = decodeURIComponent(url.hash.slice(1));
        if (!idsFor(file).has(id)) issues.push({ route, issue: 'missing section', href: link.getAttribute('href') });
      }
    }
    // Translations share tested templates; audit each English route's unique structure.
    if (Object.hasOwn(metadata, route) || supplemental.includes(route) || localizedAccessibility.has(route)) {
      document.defaultView.eval(axe.source);
      const result = await document.defaultView.axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
      accessibilityPages++;
      for (const violation of result.violations) issues.push({ route, issue: violation.id, help: violation.help, targets: violation.nodes.map(node => node.target) });
    }
    // Keep only small fragment indexes between routes, rather than 1,000+ live DOM windows.
    for (const cached of documents.values()) cached.defaultView.close();
    documents.clear();
  }
  const report = { scope: 'All English and localized internal links and section targets; static accessibility on every English route and supplemental HTML guide, excluding color contrast.', pages: routes.length, checkedLinks, checkedFragments, accessibilityPages, issues };
  fs.mkdirSync(path.resolve('.tmp/sitewide-validation'), { recursive: true });
  fs.writeFileSync(path.resolve('.tmp/sitewide-validation/navigation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  for (const document of documents.values()) document.defaultView.close();
  if (issues.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
