#!/usr/bin/env node
// Capture a real, trusted-input page-calibration workflow from the current PolyPDF build.
//
// The app must be launched and torn down separately through automation-instance.mjs. This sidecar
// connects only to that isolated instance's DevTools port. It never mutates application source or
// bypasses the product UI: buttons, drawing gestures, typing, confirmation, and Escape all travel
// through Chromium's trusted Input domain.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const port = Number(valueAfter(argv, "--port") ?? 9450);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/private/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const siteRoot = resolve(valueAfter(argv, "--site-root") ?? dirname(dirname(dirname(new URL(import.meta.url).pathname))));
const fixturePath = resolve(
  valueAfter(argv, "--fixture")
    ?? join(siteRoot, "assets-source/blog-image-validation/fixtures/measurement-diagnostics.pdf")
);
const captureDir = resolve(
  valueAfter(argv, "--capture-dir")
    ?? join(siteRoot, "assets-source/blog-image-validation/captures")
);
const expectedSourceHead = valueAfter(argv, "--source-head");
const sourceFingerprint = valueAfter(argv, "--source-fingerprint");
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

function sourceIdentity() {
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: appRoot,
    encoding: "utf8"
  }).trim();
  const productDiff = execFileSync("git", ["diff", "--binary", "HEAD"], {
    cwd: appRoot,
    maxBuffer: 64 * 1024 * 1024
  });
  const productDiffSha256 = createHash("sha256").update(productDiff).digest("hex");
  const statusLines = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: appRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  }).trim().split("\n").filter(Boolean);
  if (!expectedSourceHead || !sourceFingerprint) {
    throw new Error("Both --source-head and --source-fingerprint are required for publication captures.");
  }
  if (head !== expectedSourceHead) {
    throw new Error(`Source HEAD mismatch: expected ${expectedSourceHead}, got ${head}.`);
  }
  if (productDiffSha256 !== sourceFingerprint) {
    throw new Error(
      `Source product-diff fingerprint mismatch: expected ${sourceFingerprint}, got ${productDiffSha256}.`
    );
  }
  return {
    head,
    productDiffSha256,
    expectedHead: expectedSourceHead,
    expectedProductDiffSha256: sourceFingerprint,
    matchesExpectedSource: true,
    statusLines
  };
}

async function targetForPort() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const pages = targets.filter((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      const expectedRenderer = `${appRoot}/dist/renderer/index.html`;
      const page = pages.find((item) => decodeURIComponent(String(item.url)).includes(expectedRenderer))
        ?? pages.find((item) => item.title === "PolyPDF" || String(item.url).endsWith("/renderer/index.html"));
      if (page) return page;
    } catch {
      // The isolated instance is still starting.
    }
    await sleep(200);
  }
  throw new Error(`No PolyPDF page target appeared on CDP port ${port}.`);
}

async function connectSocket(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
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
  const cdp = (method, params = {}) => {
    const id = ++messageId;
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };
  return { socket, cdp };
}

async function browserTargetForPort() {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  const version = await response.json();
  if (!version.webSocketDebuggerUrl) throw new Error(`CDP port ${port} did not expose a browser target.`);
  return version;
}

async function connect() {
  const target = await targetForPort();
  const expectedRenderer = `${appRoot}/dist/renderer/index.html`;
  if (!decodeURIComponent(String(target.url)).includes(expectedRenderer)) {
    throw new Error(`Wrong renderer target: expected ${expectedRenderer}, got ${target.url}`);
  }
  const pageConnection = await connectSocket(target.webSocketDebuggerUrl);
  await pageConnection.cdp("Runtime.enable");
  await pageConnection.cdp("Page.enable");
  const evalJs = async (expression) => {
    const result = await pageConnection.cdp("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails).slice(0, 1000)}`);
    }
    return result.result?.value;
  };
  const browserTarget = await browserTargetForPort();
  const browserConnection = await connectSocket(browserTarget.webSocketDebuggerUrl);
  return {
    target,
    browserTarget,
    socket: pageConnection.socket,
    browserSocket: browserConnection.socket,
    cdp: pageConnection.cdp,
    browserCdp: browserConnection.cdp,
    evalJs
  };
}

async function maximizeAndVerifyNativeWindow(session) {
  const geometry = () => session.evalJs(`({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    screenX: window.screenX,
    screenY: window.screenY,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportWidth: window.visualViewport?.width ?? 0,
    visualViewportHeight: window.visualViewport?.height ?? 0
  })`);
  const fillsWorkArea = (value) => value.outerWidth >= value.availWidth - 4
    && value.outerHeight >= value.availHeight - 48;

  let browserDomainWindowCommands;
  try {
    const value = await session.browserCdp("Browser.getWindowForTarget", { targetId: session.target.id });
    browserDomainWindowCommands = { supported: true, value };
  } catch (error) {
    browserDomainWindowCommands = {
      supported: false,
      method: "Browser.getWindowForTarget",
      error: error?.message ?? String(error),
      limitation: "Electron 41 exposes Browser.getVersion but does not implement the Browser.* window commands."
    };
  }

  const before = await geometry();
  let maximizeInvoked = false;
  let controlResult = null;
  if (!fillsWorkArea(before)) {
    // controlWindow("toggleMaximize") is a preload bridge into the app's main-process
    // BrowserWindow.maximize(). CDP only invokes that real native-window path; it never overrides the
    // renderer viewport.
    controlResult = await session.evalJs(`window.polyPDF.controlWindow("toggleMaximize")`);
    maximizeInvoked = true;
  }

  const startedAt = Date.now();
  let stableViewport;
  let priorViewport;
  while (Date.now() - startedAt < 10_000) {
    const viewport = await geometry();
    if (
      fillsWorkArea(viewport)
      && viewport.innerWidth > 1400
      && viewport.innerHeight > 800
      && priorViewport?.innerWidth === viewport.innerWidth
      && priorViewport?.innerHeight === viewport.innerHeight
      && priorViewport?.outerWidth === viewport.outerWidth
      && priorViewport?.outerHeight === viewport.outerHeight
    ) {
      stableViewport = viewport;
      break;
    }
    priorViewport = viewport;
    await sleep(200);
  }
  if (!stableViewport || !fillsWorkArea(stableViewport)) {
    throw new Error(
      `Electron BrowserWindow did not reach stable native work-area bounds: ${JSON.stringify({ before, priorViewport })}`
    );
  }
  const inferredBounds = {
    left: stableViewport.screenX,
    top: stableViewport.screenY,
    width: stableViewport.outerWidth,
    height: stableViewport.outerHeight,
    windowState: "maximized"
  };
  return {
    browserDomainWindowCommands,
    maximizePath: maximizeInvoked
      ? "window.polyPDF.controlWindow(toggleMaximize) -> main-process BrowserWindow.maximize()"
      : "already filled native work area; no toggle was needed",
    maximizeInvoked,
    controlResult,
    before,
    after: stableViewport,
    windowState: "maximized",
    windowStateBasis: "outer bounds fill screen.avail work area",
    bounds: inferredBounds,
    fillsNativeWorkArea: true,
    domViewport: stableViewport,
    emulationApplied: false,
    emulationCommandsIssued: 0
  };
}

async function expandedStyleToolbarProof(evalJs) {
  const proof = await evalJs(`new Promise((resolveProof) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const toolbar = document.querySelector('#style-toolbar');
      const track = toolbar?.querySelector('[data-style-toolbar-track]');
      const previous = toolbar?.querySelector('[data-style-toolbar-scroll="previous"]');
      const next = toolbar?.querySelector('[data-style-toolbar-scroll="next"]');
      const visibleRect = (element) => {
        if (!(element instanceof HTMLElement)) return undefined;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: rect.x,
          y: rect.y,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          display: style.display,
          visibility: style.visibility,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          flexWrap: style.flexWrap,
          position: style.position,
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        };
      };
      const normalize = (value) => (value ?? '').replace(/\\s+/g, ' ').trim();
      const toolbarRect = visibleRect(toolbar);
      const trackRect = visibleRect(track);
      const sectionElements = track ? [...track.querySelectorAll('.style-section')] : [];
      const sections = sectionElements.map((section) => {
        const rect = visibleRect(section);
        return {
          id: section.getAttribute('data-style-section') ?? '',
          title: normalize(section.querySelector('.style-title')?.textContent),
          text: normalize(section.textContent),
          rect,
          controlCount: section.querySelectorAll('button, input, select, textarea, [role="button"]').length,
          fullyInsideTrack: Boolean(
            rect?.visible
            && trackRect?.visible
            && rect.left >= trackRect.left - 1
            && rect.right <= trackRect.right + 1
            && rect.top >= trackRect.top - 1
            && rect.bottom <= trackRect.bottom + 1
          )
        };
      });
      const sectionTopValues = sections.map((section) => Math.round(section.rect?.top ?? -9999));
      const allSectionsSameRow = sectionTopValues.length > 0 && new Set(sectionTopValues).size === 1;
      const allSectionsFullyVisible = sections.length > 0 && sections.every((section) => section.fullyInsideTrack);
      const previousRect = visibleRect(previous);
      const nextRect = visibleRect(next);
      const overflowClass = toolbar instanceof HTMLElement
        ? toolbar.classList.contains('has-style-toolbar-overflow')
        : undefined;
      const trackMetrics = track instanceof HTMLElement ? {
        clientWidth: track.clientWidth,
        scrollWidth: track.scrollWidth,
        clientHeight: track.clientHeight,
        scrollHeight: track.scrollHeight,
        scrollLeft: track.scrollLeft,
        remainingHorizontalOverflow: track.scrollWidth - track.clientWidth
      } : undefined;
      const arrowControlsHidden = previousRect?.display === 'none'
        && nextRect?.display === 'none'
        && !previousRect.visible
        && !nextRect.visible;
      const toolbarIsSingleFixedRow = Boolean(
        toolbarRect?.visible
        && toolbarRect.height >= 35
        && toolbarRect.height <= 37
        && toolbarRect.flexWrap === 'nowrap'
        && toolbarRect.overflowX === 'hidden'
      );
      const trackIsSingleRow = Boolean(
        trackRect?.visible
        && trackRect.display === 'flex'
        && trackRect.flexWrap === 'nowrap'
        && trackRect.overflowX === 'auto'
        && trackMetrics
        && trackMetrics.scrollHeight <= trackMetrics.clientHeight + 1
      );
      const hasNoCollapsedOrOverflowState = Boolean(
        overflowClass === false
        && trackMetrics
        && trackMetrics.remainingHorizontalOverflow <= 1
        && Math.abs(trackMetrics.scrollLeft) <= 1
        && arrowControlsHidden
      );
      resolveProof({
        toolbarClassName: toolbar instanceof HTMLElement ? toolbar.className : '',
        toolbarRect,
        trackRect,
        trackMetrics,
        previousButton: previousRect,
        nextButton: nextRect,
        overflowClass,
        arrowControlsHidden,
        allSectionsSameRow,
        allSectionsFullyVisible,
        toolbarIsSingleFixedRow,
        trackIsSingleRow,
        hasNoCollapsedOrOverflowState,
        sectionCount: sections.length,
        sections,
        passes: toolbarIsSingleFixedRow
          && trackIsSingleRow
          && hasNoCollapsedOrOverflowState
          && allSectionsSameRow
          && allSectionsFullyVisible
      });
    }));
  })`);
  if (!proof?.passes) {
    throw new Error(`Style toolbar is collapsed, overflowing, wrapped, or clipped: ${JSON.stringify(proof)}`);
  }
  return proof;
}

async function waitFor(evalJs, expression, label, timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await evalJs(`Boolean(${expression})`)) return;
    await sleep(75);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function setAndVerifyDark(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: "appearance", mode: "dark" }); true`);
  await waitFor(
    evalJs,
    `(async () => {
      const settings = await window.polyPDF.getAppSettingsInfo();
      return settings.version === "1.3.4"
        && String(settings.build) === "16"
        && settings.appearance === "dark"
        && document.documentElement.dataset.theme === "dark"
        && document.body.classList.contains("appearance-dark")
        && matchMedia("(prefers-color-scheme: dark)").matches
        && getComputedStyle(document.documentElement).getPropertyValue("--chrome-base").trim() === "#26282b";
    })()`,
    "verified PolyPDF 1.3.4 build 16 dark mode"
  );
}

async function elementCenter(evalJs, selector, textIncludes) {
  const result = await evalJs(`(() => {
    const selector = ${JSON.stringify(selector)};
    const textIncludes = ${JSON.stringify(textIncludes ?? "")};
    const candidates = [...document.querySelectorAll(selector)].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
        && (!textIncludes || (element.textContent ?? "").includes(textIncludes));
    });
    const element = candidates[0];
    if (!(element instanceof HTMLElement)) return undefined;
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      text: (element.textContent ?? "").replace(/\\s+/g, " ").trim(),
      disabled: element instanceof HTMLButtonElement ? element.disabled : false
    };
  })()`);
  if (!result) throw new Error(`No visible element matched ${selector}${textIncludes ? ` containing ${textIncludes}` : ""}.`);
  return result;
}

async function trustedClick(session, selector, textIncludes) {
  const center = await elementCenter(session.evalJs, selector, textIncludes);
  if (center.disabled) throw new Error(`Cannot click disabled element ${selector}: ${center.text}`);
  await session.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: center.x, y: center.y });
  await session.cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: center.x,
    y: center.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await session.cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: center.x,
    y: center.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
  await sleep(180);
  return center;
}

async function pagePointToClient(evalJs, point) {
  const geometry = await evalJs(`(() => {
    const overlay = document.querySelector('.page-shell[data-page="1"][data-materialized="true"] .overlay-layer');
    if (!(overlay instanceof HTMLElement)) return undefined;
    const rect = overlay.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  })()`);
  if (!geometry) throw new Error("Page 1 overlay is not materialized.");
  return {
    x: geometry.left + (point.x / 792) * geometry.width,
    y: geometry.top + (point.y / 612) * geometry.height,
    overlay: geometry
  };
}

async function trustedPageDrag(session, startPoint, endPoint) {
  const start = await pagePointToClient(session.evalJs, startPoint);
  const end = await pagePointToClient(session.evalJs, endPoint);
  await session.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x, y: start.y });
  await sleep(500); // Let the product's real vector-snap index display/acquire the endpoint.
  await session.cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: start.x,
    y: start.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  for (let step = 1; step <= 12; step += 1) {
    const fraction = step / 12;
    await session.cdp("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction,
      button: "left",
      buttons: 1
    });
    await sleep(20);
  }
  await sleep(350); // Let the endpoint snap settle before release.
  await session.cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: end.x,
    y: end.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
  await sleep(300);
  return { start, end };
}

async function trustedInsertText(session, selector, text) {
  await trustedClick(session, selector);
  await session.cdp("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "a",
    code: "KeyA",
    modifiers: 4
  });
  await session.cdp("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "a",
    code: "KeyA",
    modifiers: 4
  });
  await session.cdp("Input.insertText", { text });
  await sleep(250);
}

async function pressEscape(session) {
  await session.cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await session.cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await sleep(250);
}

async function parkPointer(session) {
  // Keep delayed chrome tooltips out of evidence captures. This point is inside the PDF page, away
  // from rail/toolbar controls, and mouse-move alone does not change the document in Select mode.
  await session.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1200, y: 700 });
  await sleep(450);
}

async function darkThemeFacts(evalJs) {
  return evalJs(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    const style = getComputedStyle(document.documentElement);
    return {
      version: settings.version,
      build: settings.build,
      appAppearance: settings.appearance,
      datasetTheme: document.documentElement.dataset.theme,
      bodyDark: document.body.classList.contains("appearance-dark"),
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
      chromeBase: style.getPropertyValue("--chrome-base").trim(),
      chromeElevated: style.getPropertyValue("--chrome-elevated").trim(),
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      availableScreenWidth: window.screen.availWidth,
      availableScreenHeight: window.screen.availHeight,
      visualViewportWidth: window.visualViewport?.width ?? 0,
      visualViewportHeight: window.visualViewport?.height ?? 0,
      rendererUrl: location.href,
      documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? "",
      dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? ""
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

function pixelThemeProof(buffer, facts) {
  const image = PNG.sync.read(buffer);
  const darkTokens = ["#26282b", "#313437", "#2a2d30", "#202225", "#46484b"].map(hexRgb);
  const lightTokens = ["#f7f7f4", "#fdfdfc", "#f1f0ec", "#7b7c7a", "#f1f1ed"].map(hexRgb);
  let darkHits = 0;
  let lightHits = 0;
  let topDarkHits = 0;
  let topLightHits = 0;
  const topRows = Math.min(image.height, Math.round(90 * Number(facts.devicePixelRatio || 1)));
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4;
      const pixel = [image.data[index], image.data[index + 1], image.data[index + 2]];
      const isDark = darkTokens.some((token) => within(pixel, token));
      const isLight = lightTokens.some((token) => within(pixel, token));
      if (isDark) darkHits += 1;
      if (isLight) lightHits += 1;
      if (y < topRows && isDark) topDarkHits += 1;
      if (y < topRows && isLight) topLightHits += 1;
    }
  }
  const total = image.width * image.height;
  const topTotal = image.width * topRows;
  const expectedWidth = Math.round(Number(facts.innerWidth) * Number(facts.devicePixelRatio));
  const expectedHeight = Math.round(Number(facts.innerHeight) * Number(facts.devicePixelRatio));
  const screenshotScaleX = image.width / Number(facts.innerWidth);
  const screenshotScaleY = image.height / Number(facts.innerHeight);
  const usesNativeDeviceScale = Math.abs(image.width - expectedWidth) <= 1
    && Math.abs(image.height - expectedHeight) <= 1
    && Math.abs(screenshotScaleX - Number(facts.devicePixelRatio)) <= 0.01
    && Math.abs(screenshotScaleY - Number(facts.devicePixelRatio)) <= 0.01;
  return {
    width: image.width,
    height: image.height,
    darkHits,
    lightHits,
    darkRatio: darkHits / total,
    lightRatio: lightHits / total,
    topDarkHits,
    topLightHits,
    topDarkRatio: topDarkHits / topTotal,
    expectedWidth,
    expectedHeight,
    screenshotScaleX,
    screenshotScaleY,
    usesNativeDeviceScale,
    passes:
      usesNativeDeviceScale
      && darkHits / total >= 0.02
      && topDarkHits / topTotal >= 0.25
      && topDarkHits > topLightHits * 10
  };
}

async function capture(session, fileName, stageFacts) {
  const nativeWindowEvidence = await maximizeAndVerifyNativeWindow(session);
  const styleToolbarProof = await expandedStyleToolbarProof(session.evalJs);
  const facts = await darkThemeFacts(session.evalJs);
  if (
    facts.appAppearance !== "dark"
    || facts.datasetTheme !== "dark"
    || !facts.bodyDark
    || !facts.prefersDark
    || facts.chromeBase !== "#26282b"
  ) {
    throw new Error(`Dark-mode identity gate failed for ${fileName}: ${JSON.stringify(facts)}`);
  }
  if (
    facts.innerWidth !== nativeWindowEvidence.domViewport.innerWidth
    || facts.innerHeight !== nativeWindowEvidence.domViewport.innerHeight
    || facts.devicePixelRatio !== nativeWindowEvidence.domViewport.devicePixelRatio
  ) {
    throw new Error(
      `Viewport changed after native maximize for ${fileName}: ${JSON.stringify({ nativeWindowEvidence, facts })}`
    );
  }
  const screenshot = await session.cdp("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const bytes = Buffer.from(screenshot.data, "base64");
  const outputPath = join(captureDir, fileName);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  const pixelProof = pixelThemeProof(bytes, facts);
  if (!pixelProof.passes) {
    throw new Error(`Dark screenshot pixel gate failed for ${outputPath}: ${JSON.stringify(pixelProof)}`);
  }
  const proof = {
    capturedAt: new Date().toISOString(),
    captureMode: "native-maximized-electron-no-emulation",
    publicationIdentity: session.publicationIdentity,
    nativeWindowEvidence,
    styleToolbarProof,
    facts,
    stageFacts,
    pixelProof
  };
  await writeFile(`${outputPath}.theme-proof.json`, `${JSON.stringify(proof, null, 2)}\n`);
  return { outputPath, nativeWindowEvidence, styleToolbarProof, facts, stageFacts, pixelProof };
}

async function uiFacts(evalJs) {
  return evalJs(`(() => {
    const normalize = (value) => (value ?? "").replace(/\\s+/g, " ").trim();
    const dialog = document.querySelector('[data-dialog-id]');
    const input = dialog?.querySelector('input:not([type="checkbox"]):not([type="radio"])');
    const confirm = dialog?.querySelector('[data-dialog-confirm]');
    const annotations = window.polyPDFAutomation.annotations();
    const overlay = document.querySelector('.page-shell[data-page="1"][data-materialized="true"] .overlay-layer');
    const rect = overlay?.getBoundingClientRect();
    return {
      pageScaleText: normalize(document.querySelector('.measurement-card .page-scale-status')?.textContent),
      pageScaleCardText: normalize(document.querySelector('.measurement-card')?.textContent),
      dialogId: dialog?.getAttribute('data-dialog-id') ?? "",
      dialogTitle: normalize(dialog?.querySelector('h2')?.textContent),
      dialogText: normalize(dialog?.textContent),
      dialogInputValue: input instanceof HTMLInputElement ? input.value : "",
      dialogConfirmDisabled: confirm instanceof HTMLButtonElement ? confirm.disabled : undefined,
      annotationCount: annotations.length,
      annotations,
      renderedMeasurementLabels: [...document.querySelectorAll('.measurement-label')]
        .map((element) => normalize(element.textContent))
        .filter(Boolean),
      selectedAnnotationId: document.querySelector('.annotation-box.selected[data-annotation-id]')
        ?.getAttribute('data-annotation-id') ?? "",
      styleToolbarText: normalize(document.querySelector('#style-toolbar')?.textContent),
      styleToolbarSectionIds: [...document.querySelectorAll('#style-toolbar .style-section')]
        .map((element) => element.getAttribute('data-style-section') ?? ""),
      overlayRect: rect ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : undefined,
      selectedTool: document.querySelector('.toolbar-button.active[data-tool]')?.getAttribute('data-tool') ?? ""
    };
  })()`);
}

async function main() {
  const fixtureBytes = await readFile(fixturePath);
  const fixtureSha256 = createHash("sha256").update(fixtureBytes).digest("hex");
  const source = sourceIdentity();
  const session = await connect();
  const initialNativeWindowEvidence = await maximizeAndVerifyNativeWindow(session);
  session.publicationIdentity = {
    source,
    rendererUrl: session.target.url,
    fixturePath,
    fixtureSha256,
    appVersion: "1.3.4",
    appBuild: "16"
  };
  const report = {
    generatedAt: new Date().toISOString(),
    appRoot,
    source,
    rendererUrl: session.target.url,
    browserDebugger: {
      browser: session.browserTarget.Browser,
      protocolVersion: session.browserTarget["Protocol-Version"],
      userAgent: session.browserTarget["User-Agent"]
    },
    fixturePath,
    fixtureSha256,
    port,
    captureMode: "native-maximized-electron-no-emulation",
    emulationCommandsIssued: 0,
    initialNativeWindowEvidence,
    inputMethod: "trusted Chrome DevTools Protocol Input events",
    manualVisualInspection: {
      status: "pending",
      requiredChecks: [
        "dark application chrome is visible edge-to-edge",
        "the PDF and highlighted product state match the stage claim",
        "the style toolbar is a complete single row with no collapsed or clipped controls",
        "no tooltip, transient snap marker, or unrelated window obscures the evidence"
      ]
    },
    stages: {}
  };
  try {
    await setAndVerifyDark(session.evalJs);
    await waitFor(
      session.evalJs,
      `document.querySelector('.page-shell[data-page="1"][data-materialized="true"] .overlay-layer')?.getBoundingClientRect().width > 500`,
      "the rendered measurement-diagnostics page"
    );
    if (await session.evalJs(`document.querySelector('[data-dialog-id="telemetryConsent"]') !== null`)) {
      await trustedClick(session, '[data-dialog-id="telemetryConsent"] [data-dialog-cancel]');
      await waitFor(session.evalJs, `!document.querySelector('[data-dialog-id]')`, "telemetry dialog dismissal");
    }
    const measurementsRailActive = await session.evalJs(`document.querySelector('.rail-button[data-panel="measurements"]')?.classList.contains('active')`);
    if (!measurementsRailActive) {
      await trustedClick(session, '.rail-button[data-panel="measurements"]');
    }
    await waitFor(session.evalJs, `document.querySelector('.page-scale-status.uncalibrated')`, "uncalibrated Page Scale card");
    await parkPointer(session);
    const beforeFacts = await uiFacts(session.evalJs);
    if (!beforeFacts.pageScaleText.includes("Scale not set")) {
      throw new Error(`Initial state is not honestly uncalibrated: ${beforeFacts.pageScaleText}`);
    }
    if (beforeFacts.annotationCount !== 0) {
      throw new Error(`Expected no workspace annotations before calibration, found ${beforeFacts.annotationCount}.`);
    }
    report.stages.before = await capture(session, "calibration-uncalibrated-dark.png", beforeFacts);

    await trustedClick(session, '.measurement-chip.scale-path-primary', "Calibrate by Drawing Line");
    const calibrationDrag = await trustedPageDrag(session, { x: 86, y: 404 }, { x: 446, y: 404 });
    await waitFor(session.evalJs, `document.querySelector('[data-dialog-id] input:not([type="checkbox"]):not([type="radio"])')`, "known-distance dialog");
    await trustedInsertText(session, '[data-dialog-id] input:not([type="checkbox"]):not([type="radio"])', "20");
    await waitFor(session.evalJs, `document.querySelector('[data-dialog-id] [data-dialog-confirm]:not(:disabled)')`, "valid known distance");
    await sleep(350);
    const dialogFacts = await uiFacts(session.evalJs);
    if (!dialogFacts.dialogText.includes("360") || dialogFacts.dialogInputValue !== "20") {
      throw new Error(`Calibration dialog did not show the real 360-point / 20-foot state: ${JSON.stringify(dialogFacts)}`);
    }
    report.stages.dialog = await capture(session, "calibration-known-distance-dialog-dark.png", {
      ...dialogFacts,
      trustedDrag: calibrationDrag,
      knownReference: "Printed 20'-0\" main-plan span"
    });

    await trustedClick(session, '[data-dialog-id] [data-dialog-confirm]');
    await waitFor(session.evalJs, `!document.querySelector('[data-dialog-id]')`, "calibration confirmation");
    await waitFor(
      session.evalJs,
      `document.querySelector('.page-scale-status.calibrated')?.textContent?.includes('18')`,
      "18 PDF pt/ft calibrated card"
    );

    await trustedClick(session, '[data-toolbar-id="linear-dimension"]');
    const verificationDrag = await trustedPageDrag(session, { x: 86, y: 188 }, { x: 86, y: 404 });
    await waitFor(session.evalJs, `window.polyPDFAutomation.annotations().length === 1`, "independent verification measurement");
    await pressEscape(session);
    await trustedClick(session, '.measurement-label', "12'-0\"");
    await waitFor(
      session.evalJs,
      `document.querySelector('.annotation-box.measure.linearDimension.selected[data-annotation-id]')
        && document.querySelector('#style-toolbar [data-style-section="measure"]')`,
      "selected verification measurement with its full style toolbar"
    );
    await parkPointer(session);
    await sleep(700);
    const afterFacts = await uiFacts(session.evalJs);
    const verification = afterFacts.annotations[0];
    if (!afterFacts.pageScaleText.includes("Calibrated") || !afterFacts.pageScaleText.includes("18")) {
      throw new Error(`Final Page Scale card is not calibrated at 18 PDF pt/ft: ${afterFacts.pageScaleText}`);
    }
    const verificationPoints = Array.isArray(verification?.points) ? verification.points : [];
    const verificationPointLength = verificationPoints.length === 2
      ? Math.hypot(
        Number(verificationPoints[1].x) - Number(verificationPoints[0].x),
        Number(verificationPoints[1].y) - Number(verificationPoints[0].y)
      )
      : 0;
    if (
      verification?.tool !== "linearDimension"
      || Math.abs(verificationPointLength - 216) > 0.001
      || Number(verification?.scale?.pointsPerUnitAtCreation) !== 18
      || afterFacts.selectedAnnotationId !== verification?.id
      || !afterFacts.styleToolbarSectionIds.includes("measure")
      || !afterFacts.renderedMeasurementLabels.some((label) => label.includes("12'-0\""))
    ) {
      throw new Error(`Independent 12-foot verification measurement failed: ${JSON.stringify(afterFacts)}`);
    }
    report.stages.after = await capture(session, "calibration-verified-second-span-dark.png", {
      ...afterFacts,
      trustedDrag: verificationDrag,
      independentReference: "Printed 12'-0\" vertical main-plan span",
      expectedPointsPerUnit: 18,
      expectedVerification: "12'-0\""
    });

    report.passed = true;
    report.assertions = {
      initialScaleWasUnset: true,
      calibrationUsedPrinted20FootSpan: true,
      calibrationDialogCaptured360PdfPoints: true,
      knownDistanceEnteredThroughTrustedInput: true,
      finalCardShows18PdfPointsPerFoot: true,
      independentPrinted12FootSpanMeasuredAs12Feet: true,
      everyScreenshotPassedDarkPixelAndIdentityGate: true,
      exactCurrentDevHeadAndDirtyFingerprintVerified: true,
      nativeElectronWindowWasMaximizedForEveryCapture: true,
      noDeviceMetricsEmulationWasApplied: true,
      fullStyleToolbarWasExpandedAndFullyVisibleForEveryCapture: true
    };
  } catch (error) {
    report.passed = false;
    report.error = error?.stack ?? String(error);
    throw error;
  } finally {
    await mkdir(captureDir, { recursive: true });
    await writeFile(join(captureDir, "calibration-workflow-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    session.socket.close();
    session.browserSocket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
