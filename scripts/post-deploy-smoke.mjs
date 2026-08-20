#!/usr/bin/env node

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REQUIRED_CSP_SOURCES } from './reconcile-nginx-config.mjs';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const routeMetadata = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src/lib/route-metadata.json'), 'utf8')
);

export const htmlRoutes = Object.keys(routeMetadata);

export const articleRoutes = htmlRoutes.filter((route) => routeMetadata[route].type === 'article');

export const guideImageRoutes = [...new Set(articleRoutes
  .map((route) => routeMetadata[route].image)
  .filter((image) => typeof image === 'string' && image.startsWith('/guides/')))];

export const shareImageRoutes = [
  ...guideImageRoutes,
  '/og-image.png?v=20260819'
];

export const discoveryRoutes = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/feed.xml'];

export const downloadRoutes = [
  '/downloads/PolyPDFMac.dmg',
  '/downloads/windows/PolyPDFSetup.exe'
];

export const canonicalFooterRoutes = [
  '/pdf-takeoff-software/',
  '/measure-pdf-on-mac/',
  '/construction-pdf-markup/',
  '/visual-search-pdf-count/',
  '/compare-pdf-drawings/'
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
    const canonicalURL = `${base}${route === '/' ? '/' : `${route.replace(/\/+$/, '')}/`}`;
    const response = await fetchImpl(canonicalURL, { headers: smokeHeaders });
    const body = await response.text();
    assertResponse(response.ok, `${route} returned HTTP ${response.status}`);
    assertResponse(/text\/html/i.test(response.headers.get('content-type') || ''), `${route} did not return HTML`);
    if (route === '/') {
      const csp = response.headers.get('content-security-policy') || '';
      for (const [directive, sources] of Object.entries(REQUIRED_CSP_SOURCES)) {
        const directiveText = csp.split(';').map((part) => part.trim())
          .find((part) => part === directive || part.startsWith(`${directive} `)) || '';
        const tokens = directiveText.split(/\s+/);
        for (const source of sources) {
          assertResponse(tokens.includes(source), `live CSP ${directive} is missing ${source}`);
        }
      }
    }
    // Since the static-rendering build step, every route must ship prerendered body content —
    // an empty #root means crawlers (and no-JS readers) are getting a blank page again.
    assertResponse(body.includes('<div id="root">'), `${route} did not return the PolyPDF app shell`);
    assertResponse(!body.includes('<div id="root"></div>'), `${route} returned an empty app shell instead of prerendered content`);
    const metadata = routeMetadata[route];
    // buildStructuredData() deliberately emits nothing for noindex routes — there is no point
    // handing schema to a crawler that has been told not to index the page.
    assertResponse(
      body.includes('<script type="application/ld+json">') || metadata.robots.includes('noindex'),
      `${route} did not return JSON-LD structured data`
    );
    const escapedTitle = metadata.title.replaceAll('&', '&amp;');
    const escapedDescription = metadata.description.replaceAll('&', '&amp;');
    if (response.url) {
      assertResponse(response.url === canonicalURL, `${route} redirected away from its canonical URL`);
    }
    const imageURL = new URL(metadata.image || '/og-image.png?v=20260819', 'https://www.polypdf.com/').href;
    const imageAlt = (metadata.imageAlt
      || 'PolyPDF — measure and mark up PDF drawings on Mac and Windows, no subscription')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    assertResponse(body.includes(`<title>${escapedTitle}</title>`), `${route} did not return its route-specific title`);
    assertResponse(
      body.includes(`<meta name="description" content="${escapedDescription}"`),
      `${route} did not return its route-specific description`
    );
    assertResponse(
      body.includes(`<meta name="robots" content="${metadata.robots}"`),
      `${route} did not return its route-specific robots policy`
    );
    assertResponse(
      body.includes(`<link rel="canonical" href="${canonicalURL}"`),
      `${route} did not return its route-specific canonical URL`
    );
    assertResponse(
      body.includes(`<meta property="og:url" content="${canonicalURL}"`)
        && body.includes(`<meta property="og:type" content="${metadata.type || 'website'}"`)
        && body.includes(`<meta property="og:title" content="${escapedTitle}"`)
        && body.includes(`<meta property="og:description" content="${escapedDescription}"`)
        && body.includes(`<meta property="og:image" content="${imageURL}"`)
        && body.includes(`<meta property="og:image:alt" content="${imageAlt}"`)
        && body.includes(`<meta name="twitter:url" content="${canonicalURL}"`)
        && body.includes(`<meta name="twitter:title" content="${escapedTitle}"`)
        && body.includes(`<meta name="twitter:description" content="${escapedDescription}"`)
        && body.includes(`<meta name="twitter:image" content="${imageURL}"`)
        && body.includes(`<meta name="twitter:image:alt" content="${imageAlt}"`),
      `${route} did not return matching route-specific share metadata`
    );
    assertResponse(
      body.includes('<link rel="alternate" type="application/rss+xml"')
        && body.includes('href="https://www.polypdf.com/feed.xml"'),
      `${route} did not advertise the PolyPDF RSS feed`
    );
    assertResponse(!body.includes('"@type":"FAQPage"'), `${route} still emits retired FAQPage JSON-LD`);
    assertResponse(
      (body.match(/data-site-footer="true"/g) || []).length === 1,
      `${route} did not return exactly one canonical footer`
    );
    assertResponse(
      body.includes('https://www.googletagmanager.com/gtag/js?id=G-533RWNRCFP')
        && body.includes('gtag("config","G-533RWNRCFP"'),
      `${route} did not contain the approved Google tag`
    );
    for (const footerRoute of canonicalFooterRoutes) {
      assertResponse(body.includes(`href="${footerRoute}"`), `${route} footer is missing ${footerRoute}`);
    }
    results.push({ route, status: response.status });
  }

  for (const route of shareImageRoutes) {
    const response = await fetchImpl(`${base}${route}`, { headers: smokeHeaders });
    const image = await response.arrayBuffer();
    assertResponse(response.ok, `${route} returned HTTP ${response.status}`);
    assertResponse(/image\/(png|webp|jpeg)/i.test(response.headers.get('content-type') || ''), `${route} did not return an image`);
    assertResponse(image.byteLength > 0, `${route} returned an empty image`);
    const cacheControl = response.headers.get('cache-control') || '';
    assertResponse(
      /max-age=0/i.test(cacheControl)
        && /must-revalidate/i.test(cacheControl)
        && !/immutable/i.test(cacheControl),
      `${route} is not served with the revalidatable stable-image cache policy`
    );
    const publicPath = path.join(
      projectRoot,
      'public',
      new URL(route, 'https://www.polypdf.com/').pathname.slice(1)
    );
    const expectedHash = createHash('sha256').update(fs.readFileSync(publicPath)).digest('hex');
    const liveHash = createHash('sha256').update(Buffer.from(image)).digest('hex');
    assertResponse(liveHash === expectedHash, `${route} did not match the release screenshot bytes`);
    results.push({ route, status: response.status });
  }

  const discovery = {};
  for (const route of discoveryRoutes) {
    const response = await fetchImpl(`${base}${route}`, { headers: smokeHeaders });
    discovery[route] = await response.text();
    assertResponse(response.ok, `${route} returned HTTP ${response.status}`);
    results.push({ route, status: response.status });
  }
  assertResponse(
    discovery['/robots.txt'].includes('User-agent: OAI-SearchBot')
      && discovery['/robots.txt'].includes('Sitemap: https://www.polypdf.com/sitemap.xml'),
    '/robots.txt lost its crawler allowlist or sitemap declaration'
  );
  for (const route of articleRoutes) {
    const url = `https://www.polypdf.com${route.replace(/\/+$/, '')}/`;
    assertResponse(discovery['/sitemap.xml'].includes(`<loc>${url}</loc>`), `/sitemap.xml is missing ${route}`);
    assertResponse(discovery['/llms.txt'].includes(`(${url})`), `/llms.txt is missing ${route}`);
    assertResponse(discovery['/feed.xml'].includes(`<link>${url}</link>`), `/feed.xml is missing ${route}`);
  }
  for (const route of guideImageRoutes) {
    assertResponse(
      discovery['/sitemap.xml'].includes(`<image:loc>https://www.polypdf.com${route}</image:loc>`),
      `/sitemap.xml is missing the guide image ${route}`
    );
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
  assertResponse(
    !bundle.includes('github.com/mohammedbala/polypdf-feedback'),
    'deployed site bundle still exposes the retired public GitHub feature tracker'
  );
  assertResponse(
    bundle.includes('/api/checkout/conversion?session_id=')
      && bundle.includes('polypdf.ga4.purchase.v1.')
      && bundle.includes('AW-449436603/xb7JCMbVseMcELu3p9YB')
      && bundle.includes('purchase'),
    'deployed site bundle does not contain verified purchase conversion tracking'
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

  // The plugin packer is a published promise: PLUGIN-AUTHORING.md and /build-a-plugin both tell
  // authors to `curl -O` this exact URL. The failure mode is silent — the SPA's try_files fallback
  // answers 200 with a page of HTML, so curl writes a .mjs file full of markup and the author's
  // next command fails for a reason nothing explains. Assert on the body, not the status.
  const packerResponse = await fetchImpl(`${base}/plugins/polypdf-plugin-pack.mjs`, { headers: smokeHeaders });
  const packer = await packerResponse.text();
  assertResponse(packerResponse.ok, `/plugins/polypdf-plugin-pack.mjs returned HTTP ${packerResponse.status}`);
  assertResponse(
    !/^\s*<!doctype html/i.test(packer) && !packer.includes('<div id="root">'),
    '/plugins/polypdf-plugin-pack.mjs returned the SPA HTML fallback instead of the packer script'
  );
  assertResponse(
    packer.startsWith('#!/usr/bin/env node') && packer.includes('polypdf-plugin-pack'),
    '/plugins/polypdf-plugin-pack.mjs did not return the packer script'
  );
  results.push({ route: '/plugins/polypdf-plugin-pack.mjs', status: packerResponse.status });

  if (requireCheckout) {
    const conversionResponse = await fetchImpl(
      `${base}/api/checkout/conversion?session_id=invalid-deploy-smoke`,
      { headers: { ...smokeHeaders, Accept: 'application/json' } }
    );
    assertResponse(
      conversionResponse.status === 400,
      `/api/checkout/conversion returned HTTP ${conversionResponse.status} for an invalid session`
    );
    results.push({ route: '/api/checkout/conversion', status: conversionResponse.status });

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
