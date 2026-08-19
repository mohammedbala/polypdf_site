#!/usr/bin/env node
// Current-development Sanitize Document driver and status-preserving screenshot gate.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const action = argv[0] ?? "inspect";
const port = Number(valueAfter("--port", "9483"));
const appRoot = resolve(valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf"));
const output = valueAfter("--output", "");
const sourceBase = valueAfter("--source-base", "a0a709c39e35343d3c71f7d615fedffb007db619");
const sourceDiffSha256 = valueAfter(
  "--source-diff-sha256",
  "8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250"
);
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function target() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const pages = targets.filter((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      const page = pages.find(
        (item) =>
          item.title === "PolyPDF" ||
          String(item.url).endsWith("/renderer/index.html") ||
          String(item.url).includes("/dist/renderer/index.html")
      ) ?? pages[0];
      if (page) return page;
    } catch {
      // Wait for the isolated renderer.
    }
    await sleep(200);
  }
  throw new Error(`No PolyPDF renderer target appeared on port ${port}.`);
}

function within(pixel, targetColor, tolerance = 3) {
  return Math.abs(pixel[0] - targetColor[0]) <= tolerance
    && Math.abs(pixel[1] - targetColor[1]) <= tolerance
    && Math.abs(pixel[2] - targetColor[2]) <= tolerance;
}

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function pixelProof(bytes, facts) {
  const png = PNG.sync.read(bytes);
  const darkTokens = ["#26282b", "#313437", "#2a2d30", "#202225", "#46484b"].map(rgb);
  const lightTokens = ["#f7f7f4", "#fdfdfc", "#f1f0ec", "#7b7c7a", "#f1f1ed"].map(rgb);
  const topRows = Math.min(png.height, Math.round(90 * facts.devicePixelRatio));
  let darkHits = 0;
  let lightHits = 0;
  let topDarkHits = 0;
  let topLightHits = 0;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const index = (y * png.width + x) * 4;
      const pixel = [png.data[index], png.data[index + 1], png.data[index + 2]];
      const dark = darkTokens.some((token) => within(pixel, token));
      const light = lightTokens.some((token) => within(pixel, token));
      if (dark) darkHits += 1;
      if (light) lightHits += 1;
      if (y < topRows && dark) topDarkHits += 1;
      if (y < topRows && light) topLightHits += 1;
    }
  }
  const total = png.width * png.height;
  const topTotal = png.width * topRows;
  const passes =
    png.width === Math.round(facts.innerWidth * facts.devicePixelRatio) &&
    png.height === Math.round(facts.innerHeight * facts.devicePixelRatio) &&
    darkHits / total >= 0.02 &&
    topDarkHits / topTotal >= 0.25 &&
    topDarkHits > topLightHits * 10;
  return {
    width: png.width,
    height: png.height,
    expectedWidth: Math.round(facts.innerWidth * facts.devicePixelRatio),
    expectedHeight: Math.round(facts.innerHeight * facts.devicePixelRatio),
    darkRatio: darkHits / total,
    lightRatio: lightHits / total,
    topDarkRatio: topDarkHits / topTotal,
    passes
  };
}

async function main() {
  const page = await target();
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.once("open", resolveOpen);
    socket.once("error", rejectOpen);
  });
  let id = 0;
  const pending = new Map();
  socket.on("message", (raw) => {
    const message = JSON.parse(String(raw));
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolveRequest, rejectRequest) => {
    const requestId = ++id;
    pending.set(requestId, { resolve: resolveRequest, reject: rejectRequest });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails).slice(0, 1600)}`);
    }
    return result.result?.value;
  };
  await cdp("Runtime.enable");
  await cdp("Page.enable");

  const inspect = () => evaluate(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    const toolbar = document.querySelector('.style-toolbar');
    const track = toolbar?.querySelector('[data-style-toolbar-track]');
    const rect = toolbar?.getBoundingClientRect();
    const options = Object.fromEntries([
      ['metadata', '[data-sanitize-strip-metadata]'],
      ['thumbnails', '[data-sanitize-strip-thumbs]'],
      ['attachments', '[data-sanitize-strip-files]'],
      ['javascript', '[data-sanitize-strip-js]'],
      ['forms', '[data-sanitize-strip-forms]']
    ].map(([name, selector]) => {
      const input = document.querySelector(selector);
      return [name, input instanceof HTMLInputElement ? input.checked : null];
    }));
    return {
      version: settings.version,
      build: String(settings.build),
      appAppearance: settings.appearance,
      datasetTheme: document.documentElement.dataset.theme,
      bodyDark: document.body.classList.contains('appearance-dark'),
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      chromeBase: getComputedStyle(document.documentElement).getPropertyValue('--chrome-base').trim(),
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screenX: window.screenX,
      screenY: window.screenY,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
      dialog: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      dialogText: document.querySelector('[data-dialog-id]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      options,
      status: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      styleToolbar: {
        exists: Boolean(toolbar),
        visible: Boolean(rect && rect.width > 0 && rect.height >= 34),
        hasOverflowClass: Boolean(toolbar?.classList.contains('has-style-toolbar-overflow')),
        clientWidth: track?.clientWidth ?? 0,
        scrollWidth: track?.scrollWidth ?? 0,
        scrollLeft: track?.scrollLeft ?? 0,
        sectionCount: track?.querySelectorAll('[data-style-section]').length ?? 0
      }
    };
  })()`);

  let result;
  if (action === "inspect") {
    result = await inspect();
  } else if (action === "dismiss-consent") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="telemetryConsent"]');
      if (!root) return { dismissed: false, reason: 'not-open' };
      const button = root.querySelector('[data-dialog-cancel]');
      if (!(button instanceof HTMLElement)) throw new Error('Consent dismiss button was not found.');
      button.click();
      return { dismissed: true };
    })()`);
  } else if (action === "open") {
    result = await evaluate(`window.polyPDFAutomation.menuCommand({ type: 'documentDialog', dialog: 'sanitizeDocument' })`);
    await sleep(700);
    result = await inspect();
  } else if (action === "apply") {
    const before = await inspect();
    const expected = { metadata: true, thumbnails: true, attachments: true, javascript: true, forms: false };
    if (JSON.stringify(before.options) !== JSON.stringify(expected)) {
      throw new Error(`Sanitize defaults changed: ${JSON.stringify(before.options)}`);
    }
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="sanitizeDocument"]');
      if (!(root instanceof HTMLElement)) throw new Error('Sanitize Document dialog is not open.');
      const button = root.querySelector('[data-dialog-confirm]');
      if (!(button instanceof HTMLButtonElement)) throw new Error('Sanitize button was not found.');
      button.click();
      return { requested: true };
    })()`);
    await sleep(5000);
    result = { ...result, beforeOptions: before.options, after: await inspect() };
  } else if (action === "save") {
    result = await evaluate(`(() => {
      const button = document.querySelector('[data-toolbar-id="save"]');
      if (!(button instanceof HTMLElement)) throw new Error('Save toolbar button was not found.');
      button.click();
      return { requested: true };
    })()`);
    await sleep(4000);
    result = { ...result, after: await inspect() };
  } else if (action === "open-attachments") {
    result = await evaluate(`(() => {
      const button = document.querySelector('.rail-button[data-panel="attachments"]');
      if (!(button instanceof HTMLElement)) throw new Error('Attachments rail button was not found.');
      button.click();
      return { opened: true };
    })()`);
    await sleep(900);
    result = await evaluate(`(() => ({
      activePanel: document.querySelector('.rail-button.active')?.getAttribute('data-panel') ?? '',
      panelText: document.querySelector('.sidebar-panel:not([hidden])')?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
    }))()`);
  } else if (action === "capture-preserve-status") {
    if (!output) throw new Error("capture-preserve-status requires --output <file.png>");
    await cdp("Emulation.clearDeviceMetricsOverride");
    await cdp("Page.bringToFront");
    await sleep(300);
    const facts = await inspect();
    const fillsWorkArea =
      facts.outerWidth >= facts.availWidth - 4 &&
      facts.outerHeight >= facts.availHeight - 48 &&
      Math.abs(facts.screenX) <= 4 &&
      Math.abs(facts.screenY - 34) <= 40;
    const dark =
      facts.appAppearance === 'dark' &&
      facts.datasetTheme === 'dark' &&
      facts.bodyDark &&
      facts.prefersDark &&
      facts.chromeBase === '#26282b';
    const fullStyleToolbar =
      facts.styleToolbar.exists &&
      facts.styleToolbar.visible &&
      !facts.styleToolbar.hasOverflowClass &&
      facts.styleToolbar.scrollWidth <= facts.styleToolbar.clientWidth + 2;
    if (!fillsWorkArea || !dark || !fullStyleToolbar) {
      throw new Error(`Preserve-status screenshot gate failed: ${JSON.stringify({ fillsWorkArea, dark, fullStyleToolbar, facts })}`);
    }
    const capture = await cdp("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    const bytes = Buffer.from(capture.data, "base64");
    const pixels = pixelProof(bytes, facts);
    if (!pixels.passes) throw new Error(`Dark pixel proof failed: ${JSON.stringify(pixels)}`);
    const destination = resolve(output);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
    const proof = {
      capturedAt: new Date().toISOString(),
      source: { baseCommit: sourceBase, workingTreeDiffSha256: sourceDiffSha256 },
      facts,
      windowProof: { windowState: "maximized", fillsWorkArea, nativeBounds: { x: facts.screenX, y: facts.screenY, width: facts.outerWidth, height: facts.outerHeight } },
      pixelProof: pixels,
      passes: fillsWorkArea && dark && fullStyleToolbar && pixels.passes
    };
    await writeFile(`${destination}.theme-proof.json`, `${JSON.stringify(proof, null, 2)}\n`);
    result = proof;
  } else {
    throw new Error(`Unknown sanitize action: ${action}`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  socket.close();
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
