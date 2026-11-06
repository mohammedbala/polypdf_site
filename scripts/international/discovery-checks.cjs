'use strict';
// Crawler- and answer-engine discovery guarantees for localized editions. Kept pure so
// test/international.test.cjs can prove that each one rejects the broken input it guards against.
const assert = require('node:assert/strict');
const ORIGIN = 'https://www.polypdf.com';
const MAC = `${ORIGIN}/downloads/PolyPDFMac.dmg`;
const WINDOWS = `${ORIGIN}/downloads/windows/PolyPDFSetup.exe`;
const links = (text, label, targets) => { for (const target of targets) assert(text.includes(`](${target})`), `${label}: llms.txt must link ${target}`); };
// The page list is why these files exist, so every localized page must be listed, once.
const inventory = (text, label, routes) => {
  assert(Array.isArray(routes) && routes.length > 0, `${label}: llms.txt needs a page inventory to check`);
  for (const route of routes) assert.equal(text.split(`](${ORIGIN}${route})`).length - 1, 1, `${label}: llms.txt must list ${route} exactly once`);
};
const isCalendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// A title-tag separator belongs in <title>, never in the visible heading or the article headline.
function assertVisibleHeading(text, label) {
  assert(String(text ?? '').trim().length > 0, `${label}translated H1`);
  assert(!String(text).includes('|'), `${label}H1 has no title-tag separator: ${text}`);
}
// The caller recomputes `expected` from the page-dates ledger and the built page; undefined means no <lastmod>.
function assertLocalizedLastmod(actual, expected, label) {
  if (expected !== undefined) assert(isCalendarDate(expected), `${label}sitemap lastmod must be a real date: ${expected}`);
  assert.equal(actual, expected, `${label}sitemap lastmod must be the date the page-dates ledger supports`);
}
// RSS dates are RFC 822. Date#toUTCString is the one spelling that round-trips, weekday included.
function assertLocalizedFeedDates(xml, label, articles) {
  assert(Array.isArray(articles) && articles.length > 0, `${label}: feed needs its articles to check`);
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  assert.equal(items.length, articles.length, `${label}: one feed item per localized article`);
  for (const item of items) {
    const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    assert(date && !Number.isNaN(Date.parse(date)) && new Date(date).toUTCString() === date, `${label}: feed item pubDate must be an RFC 822 date: ${item.slice(0, 160)}`);
  }
  for (const article of articles) {
    const item = items.find((entry) => entry.includes(`<link>${ORIGIN}${article.route}</link>`));
    assert(item, `${label}: feed item for ${article.route}`);
    assert.equal(item.match(/<pubDate>(.*?)<\/pubDate>/)[1], new Date(`${article.published}T12:00:00.000Z`).toUTCString(), `${label}: ${article.route} pubDate must be its publication date`);
  }
}
function assertMarketingLlms(text, id, routes, summary) {
  links(text, id, [MAC, WINDOWS, `${ORIGIN}/buy/?source=intl_${id}_llms`, `${ORIGIN}/${id}/tools/llms.txt`, `${ORIGIN}/llms.txt`]);
  assert(typeof summary === 'string' && summary.trim(), `${id}: llms.txt needs the translated product summary to check`);
  assert.equal(text.match(/^> (.*)$/m)?.[1], summary, `${id}: llms.txt must open with the translated product summary`);
  inventory(text, id, routes);
}
function assertToolsLlms(text, id, hasMarketingEdition, routes) {
  const takeoff = hasMarketingEdition ? `${ORIGIN}/${id}/pdf-takeoff-software/` : `${ORIGIN}/pdf-takeoff-software/`;
  links(text, `${id} tools`, [MAC, WINDOWS, takeoff, `${ORIGIN}/buy/?source=intl_${id}_llms`, ...(hasMarketingEdition ? [`${ORIGIN}/${id}/llms.txt`] : [])]);
  inventory(text, `${id} tools`, routes);
}
function assertLocalizedHomeSchema(blocks, description, label) {
  const app = blocks.find((block) => block['@type'] === 'SoftwareApplication');
  assert(app, `${label}localized home product entity`);
  assert.equal(app['@id'], `${ORIGIN}/#software`, `${label}shared product identity`);
  assert(typeof description === 'string' && description.trim(), `${label}translated product description to check`);
  assert.equal(app.description, description, `${label}product description must be the translated product description`);
  assert.equal([].concat(app.offers||[]).find((offer)=>offer.price==='0')?.price, '0', `${label}the Free offer must be listed`);
  assert(![].concat(app.offers||[]).some((offer)=>/founder/i.test(JSON.stringify(offer))), `${label}the ended Founder offer must not be listed`);
  assert.equal(blocks.find((block) => block['@type'] === 'Organization')?.['@id'], `${ORIGIN}/#organization`, `${label}publisher entity`);
}
// Non-JavaScript crawlers read this template text first; it must not be English on a translated page.
function assertNoEnglishToolShell(html, label) {
  assert(!/<noscript\b/.test(html), `${label} no English noscript shell`);
  assert(!/<meta\b[^>]*\bname="keywords"/.test(html), `${label} no English keywords`);
}
module.exports = {isCalendarDate, assertVisibleHeading, assertLocalizedLastmod, assertLocalizedFeedDates, assertMarketingLlms, assertToolsLlms, assertLocalizedHomeSchema, assertNoEnglishToolShell};
