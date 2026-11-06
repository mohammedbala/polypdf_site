#!/usr/bin/env node
'use strict';
// Sitemap dates for localized URLs come from a committed ledger, not from the English page.
// A localized URL gets a recorded date only while its built content still hashes to the ledger
// entry that carries it. Nothing here stamps today's date, so a change nobody recorded is never
// published as newly dated.
//   node scripts/international/page-dates.cjs                     apply the ledger to the built sitemap
//   PAGE_DATES_RECORD=YYYY-MM-DD node scripts/international/page-dates.cjs
//                                                                 date every changed page, then apply
//   node scripts/international/page-dates.cjs --seed-from-live    store the live pages' hashes, undated
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const c = require('./content.cjs');
const { isCalendarDate } = require('./discovery-checks.cjs');
const toolLocales = require('../../src/toolkit/locales.json');
const ledgerFile = path.join(c.root, 'src/content/translations/page-dates.json');

const squash = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
// The one definition of a page's content: its title, its meta description and its body text
// outside script, style and noscript, each with whitespace normalized. The document is not modified.
function documentContentHash(document) {
  const walker = document.createTreeWalker(document.body, 4);
  let text = '';
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('script,style,noscript')) text += walker.currentNode.textContent;
  const parts = [document.title, document.querySelector('meta[name="description"]')?.getAttribute('content'), text].map(squash);
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}
function pageContentHash(html) {
  const dom = new JSDOM(html);
  try { return documentContentHash(dom.window.document); } finally { dom.window.close(); }
}
// Every localized URL: the translated marketing pages and the translated browser-tool pages.
function localizedPages() {
  return [
    ...c.locales.flatMap((locale) => c.routes.map((route) => ({path: c.localizedPath(locale.id, route), source: c.routePath(route), kind: 'marketing'}))),
    ...toolLocales.flatMap((locale) => c.toolkitRoutes.map((route) => ({path: `/${locale.id}${route}/`, source: `${route}/`, kind: 'tool'}))),
  ];
}
// Dated match: the later of the recorded date and the English source date. Otherwise a marketing
// URL has no date and a tool URL keeps the English tool date that toolkit/international.cjs writes.
function expectedLastmod(page, hash, ledger, englishDate) {
  const entry = ledger[page.path];
  if (entry && entry.hash === hash && entry.date) return englishDate > entry.date ? englishDate : entry.date;
  return page.kind === 'tool' ? englishDate : undefined;
}
// Dates only the pages whose content differs from the ledger; every other entry is left as it is.
function recordLedger(ledger, hashes, date) {
  if (!isCalendarDate(date)) throw new Error(`PAGE_DATES_RECORD must be a real date, YYYY-MM-DD: ${date}`);
  const next = {...ledger}, recorded = [];
  for (const [route, hash] of Object.entries(hashes)) if (next[route]?.hash !== hash) { next[route] = {hash, date}; recorded.push(route); }
  return {ledger: next, recorded};
}
// Stores what is live with no date. An entry that already matches the live page keeps its date.
function seedLedger(ledger, liveHashes) {
  const next = {...ledger}, stored = [];
  for (const [route, hash] of Object.entries(liveHashes)) if (next[route]?.hash !== hash) { next[route] = {hash}; stored.push(route); }
  return {ledger: next, stored};
}
function sitemapDates(xml) {
  const dates = new Map();
  for (const [entry] of xml.matchAll(/<url>[\s\S]*?<\/url>/g)) dates.set(entry.match(/<loc>(.*?)<\/loc>/)?.[1], entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]);
  return dates;
}
// Sets or removes <lastmod> on the URLs in `dates`; every other sitemap entry is returned unchanged.
function datedSitemap(xml, dates) {
  return xml.replace(/<url>[\s\S]*?<\/url>/g, (entry) => {
    const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!dates.has(loc)) return entry;
    const date = dates.get(loc);
    return entry.replace(/\s*<lastmod>[\s\S]*?<\/lastmod>/, '').replace('</loc>', `</loc>${date ? `<lastmod>${date}</lastmod>` : ''}`);
  });
}
function readLedger(file = ledgerFile) {
  if (!fs.existsSync(file)) return {};
  const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [route, entry] of Object.entries(ledger)) {
    if (!/^[a-f0-9]{64}$/.test(entry?.hash) || (entry.date !== undefined && !isCalendarDate(entry.date))) throw new Error(`page-dates.json: invalid entry for ${route}`);
  }
  return ledger;
}
// One sorted line per URL, written atomically.
function writeLedger(ledger, file = ledgerFile) {
  const lines = Object.keys(ledger).sort().map((route) => `  ${JSON.stringify(route)}: {"hash": ${JSON.stringify(ledger[route].hash)}${ledger[route].date ? `, "date": ${JSON.stringify(ledger[route].date)}` : ''}}`);
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `{\n${lines.join(',\n')}\n}\n`);
  fs.chmodSync(temporary, 0o644);
  fs.renameSync(temporary, file);
}
async function builtHashes(build) {
  const hashes = {};
  for (const page of localizedPages()) {
    hashes[page.path] = pageContentHash(fs.readFileSync(c.fileFor(build, page.path), 'utf8'));
    await new Promise(setImmediate); // jsdom releases a closed window only once the event loop turns
  }
  return hashes;
}
function applyPageDates(build, ledger, hashes) {
  const file = path.join(build, 'sitemap.xml');
  const xml = fs.readFileSync(file, 'utf8'), english = sitemapDates(xml), dates = new Map();
  const count = {dated: 0, undated: 0, changed: 0, unrecorded: 0};
  for (const page of localizedPages()) {
    const entry = ledger[page.path], hash = hashes[page.path];
    count[!entry ? 'unrecorded' : entry.hash !== hash ? 'changed' : entry.date ? 'dated' : 'undated']++;
    dates.set(c.ORIGIN + page.path, expectedLastmod(page, hash, ledger, english.get(c.ORIGIN + page.source)));
  }
  fs.writeFileSync(file, datedSitemap(xml, dates));
  console.log(`Page dates: ${dates.size} localized URLs; ${count.changed} changed since their recorded hash, ${count.unrecorded} not in the ledger, ${count.dated} unchanged with a recorded date, ${count.undated} unchanged and undated.`);
  if (count.changed + count.unrecorded) console.log('Page dates: those pages get no ledger date (marketing: no lastmod; tools: the English tool date) until PAGE_DATES_RECORD=YYYY-MM-DD records one.');
  return count;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function liveHtml(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {redirect: 'manual', headers: {'User-Agent': 'PolyPDF-Page-Dates/1.0', Accept: 'text/html'}, signal: AbortSignal.timeout(30000)});
      const body = await response.text();
      if (response.status === 200) return body;
      if ([301, 302, 307, 308, 404, 410].includes(response.status)) return null; // not published at this URL
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 3) throw new Error(`${url}: ${error.message}`);
      await sleep(2000 * attempt);
    }
  }
}
// GET only, four requests at a time, each worker pausing before its next one.
async function liveHashes(pages) {
  const queue = [...pages], hashes = {}, absent = [];
  await Promise.all(Array.from({length: 4}, async () => {
    for (let page; (page = queue.shift());) {
      const html = await liveHtml(c.ORIGIN + page.path).catch((error) => { queue.length = 0; throw error; });
      if (html === null) absent.push(page.path); else hashes[page.path] = pageContentHash(html);
      await sleep(300);
    }
  }));
  return {hashes, absent};
}
async function main() {
  const seed = process.argv.includes('--seed-from-live'), date = process.env.PAGE_DATES_RECORD;
  if (seed && date) throw new Error('Choose one of --seed-from-live and PAGE_DATES_RECORD');
  let ledger = readLedger();
  if (seed) {
    const {hashes, absent} = await liveHashes(localizedPages());
    const {ledger: next, stored} = seedLedger(ledger, hashes);
    writeLedger(next);
    console.log(`Page dates: seeded ${stored.length} live hashes with no date; ${Object.keys(hashes).length - stored.length} already recorded; ${absent.length} not live${absent.length ? ': ' + absent.join(' ') : ''}.`);
    return;
  }
  const build = path.resolve(c.root, process.env.BUILD_PATH || 'build');
  const hashes = await builtHashes(build);
  if (date) {
    const {ledger: next, recorded} = recordLedger(ledger, hashes, date);
    writeLedger(next); ledger = next;
    console.log(`Page dates: recorded ${date} on ${recorded.length} changed pages; ${Object.keys(hashes).length - recorded.length} left as they were.`);
  }
  applyPageDates(build, ledger, hashes);
}
// Applying is best effort because the two verifiers recompute every date and are the gate.
// Recording and seeding are explicit requests, so their failures are reported as failures.
if (require.main === module) main().catch((error) => {
  const requested = process.argv.includes('--seed-from-live') || process.env.PAGE_DATES_RECORD;
  console.error(`Page dates ${requested ? 'failed' : 'not applied'}: ${error.message}`);
  if (requested) process.exitCode = 1;
});
module.exports = {ledgerFile, documentContentHash, pageContentHash, localizedPages, expectedLastmod, recordLedger, seedLedger, sitemapDates, datedSitemap, readLedger, writeLedger, builtHashes, applyPageDates};
