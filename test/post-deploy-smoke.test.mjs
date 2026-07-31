import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  downloadRoutes,
  expectedOffer,
  htmlRoutes,
  runPostDeploySmoke
} from '../scripts/post-deploy-smoke.mjs';

async function withFakeSite({ brokenRoute = null } = {}, run) {
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (path === brokenRoute) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('broken');
      return;
    }
    if (htmlRoutes.includes(path)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><div id="root"></div>');
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
        'Future major versions may be optional paid upgrades'
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
    if (path === '/api/checkout/session' && request.method === 'POST') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"url":"https://checkout.stripe.com/c/pay/cs_test_123","smoke":true}');
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
    assert.equal(results.length, htmlRoutes.length + downloadRoutes.length + 4);
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
