#!/usr/bin/env node
/*
 * Build-time static rendering for every public route.
 *
 * CRA ships an empty <div id="root"></div>, so any crawler that does not execute JavaScript —
 * which includes most LLM/answer-engine crawlers — used to receive correct metadata and an empty
 * body. This script renders the real React tree for each route with ReactDOMServer.renderToString
 * and writes the markup into the per-route index.html that generate-route-metadata.mjs already
 * produced, then injects route-specific JSON-LD structured data sourced from the same modules the
 * live pages render from (so the schema can never say something the visible page does not).
 *
 * Constraints honored here:
 * - No new dependencies. The Babel transform reuses react-scripts' own babel-preset-react-app,
 *   and rendering uses the installed react-dom/server + React Router StaticRouter.
 * - Node 18 compatible (the production droplet builds with Node 18).
 * - The client hydrates this markup in place. Platform-specific download controls defer OS
 *   detection until after hydration so the first server and browser renders remain identical.
 */

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const srcDirectory = path.join(root, 'src');
const buildDirectory = path.resolve(root, process.env.BUILD_PATH || 'build');
const mediaDirectory = path.join(buildDirectory, 'static', 'media');

// ---------------------------------------------------------------------------
// 1. Teach Node's CJS loader to load the CRA source tree.
// ---------------------------------------------------------------------------

// Node 21+ ships a global `navigator` that reports the build machine's OS, which would make
// platform-sniffed UI (the download CTA) render differently depending on where the site was
// built. Hide it so the prerender always renders the platform-neutral variant — which is also the
// right content for crawlers, because both download links end up in the static HTML.
Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true });

const babel = require('@babel/core');

const originalJsLoader = require.extensions['.js'];
require.extensions['.js'] = (module_, filename) => {
  if (!filename.startsWith(srcDirectory + path.sep)) {
    return originalJsLoader(module_, filename);
  }
  const source = fs.readFileSync(filename, 'utf8');
  const { code } = babel.transformSync(source, {
    filename,
    presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    babelrc: false,
    configFile: false,
    compact: false,
    sourceMaps: false
  });
  module_._compile(code, filename);
};

// Webpack rewrites asset imports to hashed /static/media URLs; mirror that mapping by resolving
// each imported asset to the hashed file the finished build actually contains, so prerendered
// <img src> attributes are real, fetchable URLs.
const mediaFiles = fs.existsSync(mediaDirectory) ? fs.readdirSync(mediaDirectory) : [];
const primaryFontFile = mediaFiles.find((file) =>
  /^outfit-latin-wght-normal\.[a-f0-9]+\.woff2$/.test(file)
);
if (!primaryFontFile) {
  throw new Error(`Prerender could not find the primary Outfit font in ${mediaDirectory}`);
}
const primaryFontPreload = `<link rel="preload" href="/static/media/${primaryFontFile}" as="font" type="font/woff2" crossorigin="anonymous">`;
const assetUrl = (filename) => {
  const parsed = path.parse(filename);
  const match = mediaFiles.find(
    (file) => file.startsWith(`${parsed.name}.`) && file.endsWith(parsed.ext)
  );
  if (!match) {
    throw new Error(`Prerender could not find the built asset for ${filename} in ${mediaDirectory}`);
  }
  return `/static/media/${match}`;
};

for (const extension of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4']) {
  require.extensions[extension] = (module_, filename) => {
    module_.exports = assetUrl(filename);
  };
}
require.extensions['.css'] = (module_) => {
  module_.exports = {};
};

// framer-motion animates elements in from opacity 0 / offset transforms. Rendering those initial
// styles into static HTML would ship visually hidden text to crawlers and no-JS readers, so the
// prerender substitutes plain elements. Browsers still load the real bundle with real motion.
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap',
  'whileFocus', 'whileDrag', 'whileInView', 'viewport', 'layout', 'layoutId',
  'onViewportEnter', 'onViewportLeave', 'drag', 'dragConstraints', 'dragElastic',
  'style'
]);

const buildMotionStub = () => {
  const React = require('react');
  const componentCache = new Map();
  const staticComponent = (tag) => {
    if (!componentCache.has(tag)) {
      componentCache.set(tag, React.forwardRef((props, ref) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(props)) {
          if (!MOTION_PROPS.has(key)) cleaned[key] = value;
        }
        return React.createElement(tag, { ...cleaned, ref });
      }));
    }
    return componentCache.get(tag);
  };
  return {
    __esModule: true,
    motion: new Proxy({}, { get: (_target, tag) => staticComponent(tag) }),
    AnimatePresence: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    useReducedMotion: () => true,
    useMotionValue: (value) => ({ get: () => value, set: () => undefined }),
    useSpring: (value) => value,
    useTransform: (value) => value
  };
};

const motionStub = buildMotionStub();
const originalLoad = Module._load;
const babelEsmHelperSegment = `${path.sep}@babel${path.sep}runtime${path.sep}helpers${path.sep}esm${path.sep}`;
const babelCommonJsHelperSegment = `${path.sep}@babel${path.sep}runtime${path.sep}helpers${path.sep}`;

// ---------------------------------------------------------------------------
// 2. Render every route.
// ---------------------------------------------------------------------------

async function prerenderAllRoutes() {
  // Phosphor's CommonJS export is empty under modern Node because the package is ESM-first. Load
  // its real ESM namespace once, then hand that namespace to Babel-transformed source imports so
  // the prerender and hydrated browser tree contain the exact same SVG structure.
  const phosphorIcons = await import('@phosphor-icons/react');
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'framer-motion') return motionStub;
    if (request === '@phosphor-icons/react') return phosphorIcons;
    // Babel rewrites a browser-only dynamic import to use its ESM interop helper. Node 18 cannot
    // require that helper while prerendering, even though the import itself is never executed on
    // the server. Its CommonJS twin is API-identical and keeps the production prerender portable.
    if (typeof request === 'string' && request.includes(babelEsmHelperSegment)) {
      return originalLoad.call(
        this,
        request.replace(babelEsmHelperSegment, babelCommonJsHelperSegment),
        parent,
        isMain
      );
    }
    return originalLoad.call(this, request, parent, isMain);
  };

const React = require('react');
const { renderToString } = require('react-dom/server');
const { StaticRouter } = require('react-router');
const AppRoutes = require(path.join(srcDirectory, 'AppRoutes.js')).default;
const routeMetadata = require(path.join(srcDirectory, 'lib', 'route-metadata.json'));
const { buildStructuredData } = require('./structured-data.js');

const routeHtmlPath = (route) =>
  route === '/' ? path.join(buildDirectory, 'index.html') : path.join(buildDirectory, route.slice(1), 'index.html');

const EMPTY_ROOT = '<div id="root"></div>';

let rendered = 0;
for (const route of Object.keys(routeMetadata)) {
  const htmlPath = routeHtmlPath(route);
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Expected ${htmlPath} to exist — run generate-route-metadata.mjs before prerender.`);
  }

  const markup = renderToString(
    React.createElement(StaticRouter, { location: route }, React.createElement(AppRoutes))
  );
  if (!markup || markup.length < 500) {
    throw new Error(`Prerender produced suspiciously little markup for ${route} (${markup.length} chars).`);
  }

  // Reset any previous prerender output first so the step is safe to re-run against a build
  // directory that was already processed (generate-route-metadata copies whatever is in
  // build/index.html, which may include an earlier run's markup and JSON-LD).
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '');
  html = html.replace(/<link rel="preload" href="\/static\/media\/outfit-latin-wght-normal\.[^"]+" as="font" type="font\/woff2" crossorigin="anonymous">/g, '');
  html = html.replace('</head>', `${primaryFontPreload}</head>`);
  html = html.replace(/<div id="root">[\s\S]*<\/div>(?=\s*<\/body>)/, EMPTY_ROOT);
  if (!html.includes(EMPTY_ROOT)) {
    throw new Error(`${htmlPath} does not contain the app shell to fill.`);
  }
  html = html.replace(EMPTY_ROOT, `<div id="root">${markup}</div>`);

  const structuredData = buildStructuredData(route);
  if (structuredData.length > 0) {
    const scripts = structuredData
      .map((entry) => `<script type="application/ld+json">${serializeJsonLd(entry)}</script>`)
      .join('');
    html = html.replace('</head>', `${scripts}</head>`);
  }

  fs.writeFileSync(htmlPath, html);
  rendered += 1;
}

const notFoundHtmlPath = path.join(buildDirectory, '404.html');
if (!fs.existsSync(notFoundHtmlPath)) {
  throw new Error(`Expected ${notFoundHtmlPath} to exist — run generate-route-metadata.mjs before prerender.`);
}
const notFoundMarkup = renderToString(
  React.createElement(
    StaticRouter,
    { location: '/__polypdf-not-found__' },
    React.createElement(AppRoutes)
  )
);
let notFoundHtml = fs.readFileSync(notFoundHtmlPath, 'utf8');
notFoundHtml = notFoundHtml.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '');
notFoundHtml = notFoundHtml.replace(/<link rel="preload" href="\/static\/media\/outfit-latin-wght-normal\.[^"]+" as="font" type="font\/woff2" crossorigin="anonymous">/g, '');
notFoundHtml = notFoundHtml.replace('</head>', `${primaryFontPreload}</head>`);
notFoundHtml = notFoundHtml.replace(/<div id="root">[\s\S]*<\/div>(?=\s*<\/body>)/, EMPTY_ROOT);
if (!notFoundHtml.includes(EMPTY_ROOT)) {
  throw new Error(`${notFoundHtmlPath} does not contain the app shell to fill.`);
}
notFoundHtml = notFoundHtml.replace(EMPTY_ROOT, `<div id="root">${notFoundMarkup}</div>`);
fs.writeFileSync(notFoundHtmlPath, notFoundHtml);

// Escape "<" so "</script>" can never terminate the JSON-LD block early.
function serializeJsonLd(entry) {
  return JSON.stringify(entry).replace(/</g, '\\u003c');
}

console.log(`Prerendered ${rendered} routes plus the static 404 page.`);
}

prerenderAllRoutes().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
