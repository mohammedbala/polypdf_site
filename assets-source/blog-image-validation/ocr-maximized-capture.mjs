#!/usr/bin/env node
// Current-development screenshot gate for OCR evidence. This sidecar prefers
// browser-level CDP window control when Electron exposes it; otherwise it verifies
// the app's native BrowserWindow.maximize() through outer/work-area bounds. It applies
// no device emulation and records window/style-ribbon/theme facts beside every PNG.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function valuesAfter(argv, flag) {
  const values = [];
  for (let index = 0; index < argv.length - 1; index += 1) {
    if (argv[index] === flag) values.push(argv[index + 1]);
  }
  return values;
}

const argv = process.argv.slice(2);
const command = argv[0] ?? "inspect";
const port = Number(valueAfter(argv, "--port") ?? 9460);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/private/tmp/polypdf-blog-current/src/polypdf");
const output = valueAfter(argv, "--output");
const sourceCommit = valueAfter(argv, "--source-commit") ?? "";
const sourceFingerprint = valueAfter(argv, "--source-fingerprint") ?? "";
const waitSelector = valueAfter(argv, "--wait-for-selector");
const clickSelectors = valuesAfter(argv, "--click");
const delayMs = Number(valueAfter(argv, "--delay-ms") ?? 700);
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function endpoints() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [versionResponse, listResponse] = await Promise.all([
        fetch(`http://127.0.0.1:${port}/json/version`),
        fetch(`http://127.0.0.1:${port}/json/list`)
      ]);
      const version = await versionResponse.json();
      const targets = await listResponse.json();
      const pages = targets.filter((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      const page = pages.find((item) => item.title === "PolyPDF" || String(item.url).endsWith("/renderer/index.html"))
        ?? pages[0];
      if (version.webSocketDebuggerUrl && page?.webSocketDebuggerUrl) {
        return { browserUrl: version.webSocketDebuggerUrl, page };
      }
    } catch {
      // The isolated Electron instance is still starting.
    }
    await sleep(200);
  }
  throw new Error(`No PolyPDF CDP endpoints appeared on port ${port}.`);
}

async function cdpConnection(url) {
  const socket = new WebSocket(url);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.once("open", resolveOpen);
    socket.once("error", rejectOpen);
  });
  let messageId = 0;
  const pending = new Map();
  socket.on("message", (raw) => {
    const message = JSON.parse(String(raw));
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const call = (method, params = {}) => {
    const id = ++messageId;
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };
  return { socket, call };
}

async function connect() {
  const target = await endpoints();
  const browser = await cdpConnection(target.browserUrl);
  const page = await cdpConnection(target.page.webSocketDebuggerUrl);
  await page.call("Runtime.enable");
  await page.call("Page.enable");
  const evalJs = async (expression) => {
    const result = await page.call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails).slice(0, 1200)}`);
    }
    return result.result?.value;
  };
  return { target: target.page, browser, page, evalJs };
}

async function maximizeNativeWindow(session) {
  // Chromium exposes Browser.getWindowForTarget in Chrome, but Electron 39's browser WebSocket may
  // omit that method. Prefer it when available; otherwise verify the current-dev app's own
  // BrowserWindow.maximize() by native outer bounds and invoke the real controlWindow IPC only when
  // the ready-to-show maximize has not landed yet. No renderer viewport emulation is used either way.
  try {
    const initial = await session.browser.call("Browser.getWindowForTarget", { targetId: session.target.id });
    const windowId = initial.windowId;
    if (initial.bounds?.windowState === "minimized" || initial.bounds?.windowState === "fullscreen") {
      await session.browser.call("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } });
      await sleep(300);
    }
    await session.browser.call("Browser.setWindowBounds", { windowId, bounds: { windowState: "maximized" } });
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const current = await session.browser.call("Browser.getWindowBounds", { windowId });
      if (current.bounds?.windowState === "maximized") {
        await sleep(700);
        return {
          windowState: "maximized",
          method: "Browser.setWindowBounds",
          browserCdpAvailable: true,
          windowId,
          initialBounds: initial.bounds,
          bounds: current.bounds,
          maximizedByBounds: true
        };
      }
      await sleep(100);
    }
    throw new Error("Browser window never reported maximized.");
  } catch (error) {
    const browserCdpError = error instanceof Error ? error.message : String(error);
    const metrics = () => session.evalJs(`(() => ({
      screenX: window.screenX,
      screenY: window.screenY,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      availLeft: window.screen.availLeft,
      availTop: window.screen.availTop,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    }))()`);
    const matchesWorkArea = (value) =>
      Math.abs(value.screenX - value.availLeft) <= 4
      && Math.abs(value.screenY - value.availTop) <= 40
      && Math.abs(value.outerWidth - value.availWidth) <= 8
      && Math.abs(value.outerHeight - value.availHeight) <= 40;
    let current = await metrics();
    if (!matchesWorkArea(current)) {
      await session.evalJs(`window.polyPDF.controlWindow('toggleMaximize')`);
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await sleep(100);
        current = await metrics();
        if (matchesWorkArea(current)) break;
      }
    }
    if (!matchesWorkArea(current)) {
      throw new Error(`Native BrowserWindow bounds do not match the screen work area: ${JSON.stringify({ browserCdpError, current })}`);
    }
    await sleep(700);
    return {
      windowState: "maximized",
      method: "current-dev BrowserWindow.maximize verified by native outer bounds",
      browserCdpAvailable: false,
      browserCdpError,
      bounds: {
        left: current.screenX,
        top: current.screenY,
        width: current.outerWidth,
        height: current.outerHeight
      },
      workArea: {
        left: current.availLeft,
        top: current.availTop,
        width: current.availWidth,
        height: current.availHeight
      },
      viewport: { width: current.innerWidth, height: current.innerHeight },
      maximizedByBounds: true
    };
  }
}

async function waitFor(evalJs, selector, waitMs = 15_000) {
  if (!selector) return;
  await evalJs(`new Promise((resolveWait, rejectWait) => {
    const selector = ${JSON.stringify(selector)};
    const deadline = Date.now() + ${waitMs};
    const poll = () => {
      if (document.querySelector(selector)) return resolveWait(true);
      if (Date.now() >= deadline) return rejectWait(new Error('Timed out waiting for ' + selector));
      setTimeout(poll, 75);
    };
    poll();
  })`);
}

async function setDark(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: 'dark' }); true`);
  await evalJs(`new Promise((resolveDark, rejectDark) => {
    const deadline = Date.now() + 8000;
    const poll = async () => {
      try {
        const settings = await window.polyPDF.getAppSettingsInfo();
        const chrome = getComputedStyle(document.documentElement).getPropertyValue('--chrome-base').trim();
        if (
          settings.appearance === 'dark' &&
          document.documentElement.dataset.theme === 'dark' &&
          document.body.classList.contains('appearance-dark') &&
          matchMedia('(prefers-color-scheme: dark)').matches &&
          chrome === '#26282b'
        ) return resolveDark(true);
      } catch {}
      if (Date.now() >= deadline) return rejectDark(new Error('PolyPDF did not reach verified dark mode.'));
      setTimeout(poll, 75);
    };
    void poll();
  })`);
}

async function pageFacts(evalJs, windowProof) {
  return evalJs(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    const rootStyle = getComputedStyle(document.documentElement);
    const toolbar = document.getElementById('style-toolbar');
    const track = toolbar?.querySelector('[data-style-toolbar-track]');
    const toolbarRect = toolbar?.getBoundingClientRect();
    const trackRect = track?.getBoundingClientRect();
    const sections = [...(toolbar?.querySelectorAll('.style-section') ?? [])];
    const sectionFacts = sections.map((section) => {
      const rect = section.getBoundingClientRect();
      return {
        id: section.getAttribute('data-style-section') ?? '',
        text: section.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom)
      };
    });
    const scrollButtons = [...(toolbar?.querySelectorAll('[data-style-toolbar-scroll]') ?? [])].map((button) => ({
      direction: button.getAttribute('data-style-toolbar-scroll'),
      display: getComputedStyle(button).display,
      hidden: button.hidden,
      disabled: button.disabled
    }));
    const allSectionsInsideTrack = Boolean(trackRect) && sectionFacts.every(
      (section) => section.left >= Math.floor(trackRect.left) - 1 && section.right <= Math.ceil(trackRect.right) + 1
    );
    const toolbarSingleRow = Boolean(toolbarRect) && toolbarRect.height >= 35 && toolbarRect.height <= 37 && sectionFacts.every(
      (section) => section.top >= Math.floor(toolbarRect.top) - 1 && section.bottom <= Math.ceil(toolbarRect.bottom) + 1
    );
    return {
      version: settings.version,
      build: String(settings.build),
      appAppearance: settings.appearance,
      datasetTheme: document.documentElement.dataset.theme,
      bodyDark: document.body.classList.contains('appearance-dark'),
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      chromeBase: rootStyle.getPropertyValue('--chrome-base').trim(),
      chromeElevated: rootStyle.getPropertyValue('--chrome-elevated').trim(),
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenAvailWidth: window.screen.availWidth,
      screenAvailHeight: window.screen.availHeight,
      visualViewportWidth: window.visualViewport?.width,
      visualViewportHeight: window.visualViewport?.height,
      documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
      dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      styleToolbar: {
        present: Boolean(toolbar),
        trackPresent: Boolean(track),
        className: toolbar?.className ?? '',
        rect: toolbarRect ? { x: toolbarRect.x, y: toolbarRect.y, width: toolbarRect.width, height: toolbarRect.height } : null,
        trackRect: trackRect ? { x: trackRect.x, y: trackRect.y, width: trackRect.width, height: trackRect.height } : null,
        clientWidth: track?.clientWidth ?? 0,
        scrollWidth: track?.scrollWidth ?? 0,
        scrollLeft: track?.scrollLeft ?? 0,
        hasOverflow: toolbar?.classList.contains('has-style-toolbar-overflow') ?? false,
        toolbarSingleRow,
        allSectionsInsideTrack,
        sectionCount: sectionFacts.length,
        sections: sectionFacts,
        controlCount: toolbar?.querySelectorAll('button, input, select, textarea').length ?? 0,
        scrollButtons
      },
      injectedWindowProof: ${JSON.stringify(windowProof)}
    };
  })()`);
}

function within(pixel, target, tolerance = 3) {
  return Math.abs(pixel[0] - target[0]) <= tolerance
    && Math.abs(pixel[1] - target[1]) <= tolerance
    && Math.abs(pixel[2] - target[2]) <= tolerance;
}

function hexRgb(value) {
  const hex = value.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function pixelProof(bytes, facts) {
  const image = PNG.sync.read(bytes);
  const darkTokens = ["#26282b", "#313437", "#2a2d30", "#202225", "#46484b"].map(hexRgb);
  const lightTokens = ["#f7f7f4", "#fdfdfc", "#f1f0ec", "#7b7c7a", "#f1f1ed"].map(hexRgb);
  const scaleX = image.width / facts.innerWidth;
  const scaleY = image.height / facts.innerHeight;
  const topRows = Math.min(image.height, Math.round(90 * scaleY));
  let darkHits = 0;
  let lightHits = 0;
  let topDarkHits = 0;
  let topLightHits = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4;
      const pixel = [image.data[index], image.data[index + 1], image.data[index + 2]];
      const dark = darkTokens.some((token) => within(pixel, token));
      const light = lightTokens.some((token) => within(pixel, token));
      if (dark) darkHits += 1;
      if (light) lightHits += 1;
      if (y < topRows && dark) topDarkHits += 1;
      if (y < topRows && light) topLightHits += 1;
    }
  }
  const total = image.width * image.height;
  const topTotal = image.width * topRows;
  const nativeMaximized = facts.injectedWindowProof?.windowState === "maximized"
    && facts.injectedWindowProof?.maximizedByBounds === true;
  const noViewportEmulation = Math.abs(facts.innerWidth - facts.visualViewportWidth) < 1
    && Math.abs(facts.innerHeight - facts.visualViewportHeight) < 1;
  const styleToolbarPasses = facts.styleToolbar.present
    && facts.styleToolbar.trackPresent
    && facts.styleToolbar.toolbarSingleRow
    && !facts.styleToolbar.hasOverflow
    && facts.styleToolbar.scrollWidth <= facts.styleToolbar.clientWidth + 1
    && facts.styleToolbar.allSectionsInsideTrack;
  const darkPasses = darkHits / total >= 0.02
    && topDarkHits / topTotal >= 0.25
    && topDarkHits > topLightHits * 10;
  return {
    width: image.width,
    height: image.height,
    captureScaleX: scaleX,
    captureScaleY: scaleY,
    darkHits,
    lightHits,
    darkRatio: darkHits / total,
    lightRatio: lightHits / total,
    topDarkHits,
    topLightHits,
    topDarkRatio: topDarkHits / topTotal,
    nativeMaximized,
    noViewportEmulation,
    styleToolbarPasses,
    darkPasses,
    passes: nativeMaximized && noViewportEmulation && styleToolbarPasses && darkPasses
  };
}

async function main() {
  const session = await connect();
  try {
    const nativeWindow = await maximizeNativeWindow(session);
    await setDark(session.evalJs);
    await waitFor(session.evalJs, waitSelector);
    for (const selector of clickSelectors) {
      await session.evalJs(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!(element instanceof HTMLElement)) throw new Error('No clickable element matched ${selector.replaceAll("'", "\\'")}');
        element.click();
        return true;
      })()`);
      await sleep(250);
    }
    await sleep(delayMs);
    const facts = await pageFacts(session.evalJs, nativeWindow);
    const proofBase = {
      capturedAt: new Date().toISOString(),
      source: { appRoot, sourceCommit, sourceFingerprint },
      nativeWindow,
      facts
    };
    let pixels;
    if (command === "capture" || output) {
      if (!output) throw new Error("capture requires --output <file.png>");
      const capture = await session.page.call("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false
      });
      const bytes = Buffer.from(capture.data, "base64");
      pixels = pixelProof(bytes, facts);
      if (!pixels.passes) throw new Error(`Maximized dark screenshot gate failed: ${JSON.stringify(pixels)}`);
      const destination = resolve(output);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
      await writeFile(`${destination}.capture-proof.json`, `${JSON.stringify({ ...proofBase, pixelProof: pixels }, null, 2)}\n`);
    }
    process.stdout.write(`${JSON.stringify({ command, port, ...proofBase, pixelProof: pixels }, null, 2)}\n`);
  } finally {
    session.page.socket.close();
    session.browser.socket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
