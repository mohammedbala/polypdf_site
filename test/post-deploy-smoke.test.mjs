import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  articleRoutes,
  canonicalFooterRoutes,
  discoveryRoutes,
  downloadRoutes,
  expectedOffer,
  htmlRoutes,
  routeMetadata,
  runPostDeploySmoke,
  shareImageRoutes,
  workflowMediaRoutes
} from '../scripts/post-deploy-smoke.mjs';

async function withFakeSite({ brokenRoute = null, htmlFallbackRoute = null } = {}, run) {
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (path === brokenRoute) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('broken');
      return;
    }
    // Reproduces nginx's `try_files $uri $uri/ /index.html`: a 200 carrying the app shell.
    if (path === htmlFallbackRoute) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><title>PolyPDF</title><div id="root"><h1>PolyPDF</h1></div>');
      return;
    }
    if (htmlRoutes.includes(path)) {
      const metadata = routeMetadata[path];
      const title = metadata.title.replaceAll('&', '&amp;');
      const description = metadata.description.replaceAll('&', '&amp;');
      const canonicalURL = `http://${request.headers.host}${path === '/' ? '/' : path}`;
      const imageURL = new URL(metadata.image || '/og-image.png', 'https://www.polypdf.com/').href;
      const imageAlt = (metadata.imageAlt
        || 'PolyPDF — measure and mark up PDF drawings on Mac and Windows, no subscription')
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;');
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(
        `<!doctype html><title>${title}</title>`
        + `<meta name="description" content="${description}" />`
        + `<meta name="robots" content="${metadata.robots}" />`
        + `<meta property="og:type" content="${metadata.type || 'website'}" />`
        + `<meta property="og:url" content="${canonicalURL}" />`
        + `<meta property="og:title" content="${title}" />`
        + `<meta property="og:description" content="${description}" />`
        + `<meta property="og:image" content="${imageURL}" />`
        + `<meta property="og:image:alt" content="${imageAlt}" />`
        + `<meta name="twitter:url" content="${canonicalURL}" />`
        + `<meta name="twitter:title" content="${title}" />`
        + `<meta name="twitter:description" content="${description}" />`
        + `<meta name="twitter:image" content="${imageURL}" />`
        + `<meta name="twitter:image:alt" content="${imageAlt}" />`
        + '<link rel="alternate" type="application/rss+xml" title="PolyPDF Guides and Product Notes" href="https://www.polypdf.com/feed.xml" />'
        + `<link rel="canonical" href="${canonicalURL}" />`
        + '<script async src="https://www.googletagmanager.com/gtag/js?id=G-533RWNRCFP"></script>'
        + '<script>gtag("config","G-533RWNRCFP",{})</script>'
        + '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'
        + `<div id="root"><h1>${title}</h1><p>Prerendered body content for ${path}</p>`
        + '<footer data-site-footer="true">'
        + canonicalFooterRoutes.map((route) => `<a href="${route}">${route}</a>`).join('')
        + '</footer></div>'
      );
      return;
    }
    if (shareImageRoutes.includes(path)) {
      response.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': '1' });
      response.end('x');
      return;
    }
    if (path === '/robots.txt') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('User-agent: OAI-SearchBot\nAllow: /\nSitemap: https://www.polypdf.com/sitemap.xml\n');
      return;
    }
    if (path === '/sitemap.xml') {
      response.writeHead(200, { 'Content-Type': 'application/xml' });
      response.end(
        '<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
        + articleRoutes.map((route) => `<url><loc>https://www.polypdf.com${route}</loc></url>`).join('')
        + shareImageRoutes.map((route) => `<image:image><image:loc>https://www.polypdf.com${route}</image:loc></image:image>`).join('')
        + '</urlset>'
      );
      return;
    }
    if (path === '/llms.txt') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end(articleRoutes.map((route) => `(https://www.polypdf.com${route})`).join('\n'));
      return;
    }
    if (path === '/feed.xml') {
      response.writeHead(200, { 'Content-Type': 'application/rss+xml' });
      response.end(`<rss><channel>${articleRoutes.map((route) => `<item><link>https://www.polypdf.com${route}</link></item>`).join('')}</channel></rss>`);
      return;
    }
    if (path === '/api/healthz') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"ok":true}');
      return;
    }
    if (path === '/api/commercial-offer') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        id: expectedOffer.id,
        checkoutLineItemName: expectedOffer.checkoutLineItemName,
        price: expectedOffer.price,
        license: {
          majorVersions: '1.x',
          updates: 'all_1.x',
          activationLimit: expectedOffer.activationLimit,
          platforms: ['macOS', 'Windows']
        }
      }));
      return;
    }
    if (path === '/asset-manifest.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"files":{"main.js":"/static/js/main.test.js"}}');
      return;
    }
    if (path === '/static/js/main.test.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript' });
      response.end([
        "PolyPDF Pro Founder's License",
        'Every PolyPDF 1.x update is included',
        'Future major versions may be optional paid upgrades',
        '/api/checkout/conversion?session_id=',
        'polypdf.ga4.purchase.v1.',
        'AW-449436603/xb7JCMbVseMcELu3p9YB',
        'purchase'
      ].join(';'));
      return;
    }
    if (downloadRoutes.includes(path)) {
      if (request.headers.range === 'bytes=0-0') {
        response.writeHead(206, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': '1',
          'Content-Range': 'bytes 0-0/100'
        });
        response.end('x');
      } else {
        response.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': '100'
        });
        response.end('x'.repeat(100));
      }
      return;
    }
    if (workflowMediaRoutes.includes(path)) {
      if (path.endsWith('.mp4')) {
        if (request.headers.range === 'bytes=0-0') {
          response.writeHead(206, {
            'Content-Type': 'video/mp4',
            'Content-Length': '1',
            'Content-Range': 'bytes 0-0/100'
          });
          response.end('x');
        } else {
          response.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': '100' });
          response.end('x'.repeat(100));
        }
      } else {
        response.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        response.end('WEBVTT\n\n00:00.000 --> 00:01.000\nPolyPDF');
      }
      return;
    }
    if (path === '/plugins/polypdf-plugin-pack.mjs') {
      response.writeHead(200, { 'Content-Type': 'text/javascript' });
      response.end('#!/usr/bin/env node\n// polypdf-plugin-pack — build, sign and inspect packages.\n');
      return;
    }
    if (path === '/api/checkout/session' && request.method === 'POST') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"url":"https://checkout.stripe.com/c/pay/cs_test_123","smoke":true}');
      return;
    }
    if (path === '/api/checkout/conversion') {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end('{"error":"invalid_checkout_session"}');
      return;
    }
    response.writeHead(404);
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('passes only when every route, artifact, health check, and checkout pass', async () => {
  await withFakeSite({}, async (baseURL) => {
    const results = await runPostDeploySmoke({ baseURL });
    // +6 = /api/healthz, /api/commercial-offer, the main bundle, the plugin packer,
    // conversion verification, and checkout.
    assert.equal(
      results.length,
      htmlRoutes.length + shareImageRoutes.length + discoveryRoutes.length
        + downloadRoutes.length + workflowMediaRoutes.length + 6
    );
  });
});

test('derives the HTML smoke surface from the route metadata registry', () => {
  assert.deepEqual(htmlRoutes, Object.keys(routeMetadata));
});

// The packer's failure mode is a 200, not a 404: the SPA's try_files fallback serves index.html for
// any unmatched path, so `curl -O` writes a file of HTML and the author's next command fails with
// nothing to explain why. Status codes alone would not catch it.
test('the plugin packer served as the SPA HTML fallback fails the deploy smoke', async () => {
  await withFakeSite({ htmlFallbackRoute: '/plugins/polypdf-plugin-pack.mjs' }, async (baseURL) => {
    await assert.rejects(
      runPostDeploySmoke({ baseURL }),
      /returned the SPA HTML fallback instead of the packer script/
    );
  });
});

test('a deliberately broken trust route fails the deploy smoke', async () => {
  await withFakeSite({ brokenRoute: '/terms' }, async (baseURL) => {
    await assert.rejects(
      runPostDeploySmoke({ baseURL }),
      /\/terms returned HTTP 500/
    );
  });
});
