#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

export const htmlRoutes = [
  '/',
  '/buy',
  '/windows',
  '/support',
  '/privacy',
  '/terms',
  '/refund',
  '/versions',
  '/account'
];

export const downloadRoutes = [
  '/downloads/PolyPDFMac.dmg',
  '/downloads/windows/PolyPDFSetup.exe'
];

export const expectedOffer = Object.freeze({
  id: 'polypdf_pro_founder_1x_2026',
  checkoutLineItemName: "PolyPDF Pro Founder's License — Perpetual 1.x",
  price: 49.99,
  activationLimit: 3
});

const smokeHeaders = {
  Accept: '*/*',
  'User-Agent': 'PolyPDF-Deploy-Monitor/1.0'
};

export async function runPostDeploySmoke({
  baseURL = 'https://www.polypdf.com',
  fetchImpl = fetch,
  requireCheckout = true
} = {}) {
  const base = baseURL.replace(/\/+$/, '');
  const results = [];

  for (const route of htmlRoutes) {
    const response = await fetchImpl(`${base}${route}`, { headers: smokeHeaders });
    const body = await response.text();
    assertResponse(response.ok, `${route} returned HTTP ${response.status}`);
    assertResponse(/text\/html/i.test(response.headers.get('content-type') || ''), `${route} did not return HTML`);
    assertResponse(body.includes('<div id="root"></div>'), `${route} did not return the PolyPDF app shell`);
    results.push({ route, status: response.status });
  }

  const healthResponse = await fetchImpl(`${base}/api/healthz`, {
    headers: { ...smokeHeaders, Accept: 'application/json' }
  });
  const health = await healthResponse.json().catch(() => null);
  assertResponse(healthResponse.ok, `/api/healthz returned HTTP ${healthResponse.status}`);
  assertResponse(health?.ok === true, '/api/healthz did not return {"ok":true}');
  results.push({ route: '/api/healthz', status: healthResponse.status });

  const offerResponse = await fetchImpl(`${base}/api/commercial-offer`, {
    headers: { ...smokeHeaders, Accept: 'application/json' }
  });
  const offer = await offerResponse.json().catch(() => null);
  assertResponse(offerResponse.ok, `/api/commercial-offer returned HTTP ${offerResponse.status}`);
  assertResponse(offer?.id === expectedOffer.id, '/api/commercial-offer returned the wrong offer ID');
  assertResponse(
    offer?.checkoutLineItemName === expectedOffer.checkoutLineItemName,
    '/api/commercial-offer returned the wrong checkout line-item name'
  );
  assertResponse(offer?.price === expectedOffer.price, '/api/commercial-offer returned the wrong price');
  assertResponse(
    offer?.license?.majorVersions === '1.x'
      && offer?.license?.updates === 'all_1.x'
      && offer?.license?.activationLimit === expectedOffer.activationLimit
      && offer?.license?.platforms?.includes('macOS')
      && offer?.license?.platforms?.includes('Windows'),
    '/api/commercial-offer returned inconsistent license rights'
  );
  results.push({ route: '/api/commercial-offer', status: offerResponse.status });

  const manifestResponse = await fetchImpl(`${base}/asset-manifest.json`, { headers: smokeHeaders });
  const manifest = await manifestResponse.json().catch(() => null);
  const mainBundlePath = manifest?.files?.['main.js'];
  assertResponse(manifestResponse.ok && typeof mainBundlePath === 'string', 'asset manifest did not identify main.js');
  const bundleResponse = await fetchImpl(new URL(mainBundlePath, `${base}/`), { headers: smokeHeaders });
  const bundle = await bundleResponse.text();
  assertResponse(bundleResponse.ok, `main site bundle returned HTTP ${bundleResponse.status}`);
  assertResponse(
    bundle.includes("PolyPDF Pro Founder's License")
      && bundle.includes('Every PolyPDF 1.x update is included')
      && bundle.includes('Future major versions may be optional paid upgrades'),
    'deployed site bundle does not contain the canonical Founder License rights'
  );
  results.push({ route: mainBundlePath, status: bundleResponse.status });

  for (const route of downloadRoutes) {
    const response = await fetchImpl(`${base}${route}`, {
      headers: { ...smokeHeaders, Range: 'bytes=0-0' }
    });
    assertResponse([200, 206].includes(response.status), `${route} returned HTTP ${response.status}`);
    const contentRange = response.headers.get('content-range') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    assertResponse(
      response.status === 206 ? /^bytes 0-0\/\d+$/.test(contentRange) : contentLength > 0,
      `${route} did not prove a non-empty downloadable artifact`
    );
    await response.arrayBuffer();
    results.push({ route, status: response.status });
  }

  if (requireCheckout) {
    const checkoutResponse = await fetchImpl(`${base}/api/checkout/session`, {
      method: 'POST',
      headers: { ...smokeHeaders, Accept: 'application/json' }
    });
    const checkout = await checkoutResponse.json().catch(() => null);
    assertResponse(checkoutResponse.ok, `/api/checkout/session returned HTTP ${checkoutResponse.status}`);
    let checkoutURL;
    try {
      checkoutURL = new URL(checkout?.url || '');
    } catch {
      checkoutURL = null;
    }
    assertResponse(
      checkoutURL?.protocol === 'https:' && /(^|\.)stripe\.com$/i.test(checkoutURL.hostname),
      '/api/checkout/session did not return a secure Stripe URL'
    );
    assertResponse(checkout?.smoke === true, '/api/checkout/session did not expire its deploy-smoke session');
    results.push({ route: '/api/checkout/session', status: checkoutResponse.status });
  }

  return results;
}

function assertResponse(condition, message) {
  if (!condition) throw new Error(message);
}

function argumentValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPostDeploySmoke({
    baseURL: argumentValue('--base-url') || process.env.POLYPDF_SITE_BASE_URL || 'https://www.polypdf.com',
    requireCheckout: !process.argv.includes('--skip-checkout')
  })
    .then((results) => {
      for (const result of results) {
        console.log(`ok ${result.status} ${result.route}`);
      }
      console.log(`post-deploy smoke passed (${results.length} checks)`);
    })
    .catch((error) => {
      console.error(`post-deploy smoke failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
