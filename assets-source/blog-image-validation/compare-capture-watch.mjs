#!/usr/bin/env node
// Capture an editable Compare Documents result in a truly maximized isolated Electron window.
// The app must be launched and torn down by scripts/automation-instance.mjs; this sidecar only uses CDP.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const port = Number(valueAfter(argv, "--port") ?? 9474);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/private/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const output = resolve(valueAfter(argv, "--output") ?? "compare-editable-clouds-dark.png");
const mode = valueAfter(argv, "--mode") ?? "result";
const expectedCommit = valueAfter(argv, "--expected-commit");
const expectedDiffSha256 = valueAfter(argv, "--expected-diff-sha256");
const appPid = Number(valueAfter(argv, "--app-pid"));
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function targetForPort() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const pages = targets.filter((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      const page = pages.find((item) => item.title === "PolyPDF" || String(item.url).endsWith("/renderer/index.html"))
        ?? pages[0];
      if (page) return page;
    } catch {
      // The isolated instance is still starting.
    }
    await sleep(100);
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

async function connect() {
  const target = await targetForPort();
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  if (!version.webSocketDebuggerUrl) throw new Error(`No browser-level CDP endpoint appeared on port ${port}.`);
  const page = await connectSocket(target.webSocketDebuggerUrl);
  const browser = await connectSocket(version.webSocketDebuggerUrl);
  await page.cdp("Runtime.enable");
  await page.cdp("Page.enable");
  // Publication screenshots must represent the real native Electron window, never an emulated viewport.
  await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
  const browserCall = async (method, params = {}) => {
    try {
      return await browser.cdp(method, params);
    } catch (browserError) {
      try {
        return await page.cdp(method, params);
      } catch (pageError) {
        throw new Error(
          `${method} failed on browser and page CDP endpoints: browser=${browserError.message}; page=${pageError.message}`
        );
      }
    }
  };
  let browserWindowProof;
  try {
    const beforeWindow = await browserCall("Browser.getWindowForTarget", { targetId: target.id });
    await browserCall("Browser.setWindowBounds", {
      windowId: beforeWindow.windowId,
      bounds: { windowState: "maximized" }
    });
    let maximizedWindow;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      maximizedWindow = await browserCall("Browser.getWindowBounds", { windowId: beforeWindow.windowId });
      if (maximizedWindow.bounds?.windowState === "maximized") break;
      await sleep(50);
    }
    browserWindowProof = {
      supported: maximizedWindow?.bounds?.windowState === "maximized",
      windowId: beforeWindow.windowId,
      before: beforeWindow.bounds,
      after: maximizedWindow?.bounds
    };
  } catch (error) {
    // Electron 39 advertises Browser.getWindowForTarget in /json/protocol but returns method-not-found
    // from both endpoints. The interactive app itself calls BrowserWindow.maximize(); below we prove the
    // resulting native bounds exactly match Screen.avail and, when supplied, the AX window bounds too.
    browserWindowProof = { supported: false, error: error instanceof Error ? error.message : String(error) };
  }
  const evalJs = async (expression) => {
    const result = await page.cdp("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails).slice(0, 800)}`);
    }
    return result.result?.value;
  };
  const maximizeFacts = async () => evalJs(`({
    screenX: window.screenX,
    screenY: window.screenY,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    availLeft: screen.availLeft,
    availTop: screen.availTop,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight
  })`);
  let runtimeBounds = await maximizeFacts();
  const exactlyFillsAvailableScreen = (value) =>
    value.screenX === value.availLeft
    && value.screenY === value.availTop
    && value.outerWidth === value.availWidth
    && value.outerHeight === value.availHeight;
  if (!exactlyFillsAvailableScreen(runtimeBounds)) {
    await evalJs(`window.polyPDF.controlWindow('toggleMaximize')`);
    for (let attempt = 0; attempt < 80; attempt += 1) {
      runtimeBounds = await maximizeFacts();
      if (exactlyFillsAvailableScreen(runtimeBounds)) break;
      await sleep(50);
    }
  }
  if (!exactlyFillsAvailableScreen(runtimeBounds)) {
    throw new Error(`Native Electron window does not fill Screen.avail: ${JSON.stringify(runtimeBounds)}`);
  }
  // Wait for the maximized native bounds to settle in the renderer before measuring or capturing.
  let lastSize = "";
  let stableSamples = 0;
  for (let attempt = 0; attempt < 80 && stableSamples < 4; attempt += 1) {
    const size = await evalJs(`JSON.stringify({ innerWidth, innerHeight, outerWidth, outerHeight, dpr: devicePixelRatio })`);
    if (size === lastSize) stableSamples += 1;
    else stableSamples = 0;
    lastSize = size;
    await sleep(50);
  }
  return {
    target,
    pageSocket: page.socket,
    browserSocket: browser.socket,
    cdp: page.cdp,
    browserCdp: browserCall,
    evalJs,
    nativeWindow: {
      windowState: "maximized",
      verification: "native BrowserWindow bounds exactly match Screen.avail",
      runtimeBounds,
      browserCdp: browserWindowProof
    }
  };
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
  const topRows = Math.min(image.height, Math.round(90 * facts.devicePixelRatio));
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
    expectedWidth: Math.round(facts.innerWidth * facts.devicePixelRatio),
    expectedHeight: Math.round(facts.innerHeight * facts.devicePixelRatio),
    passes:
      image.width === Math.round(facts.innerWidth * facts.devicePixelRatio)
      && image.height === Math.round(facts.innerHeight * facts.devicePixelRatio)
      && darkHits / total >= 0.02
      && topDarkHits / topTotal >= 0.25
      && topDarkHits > topLightHits * 10
  };
}

function nativeAxWindowBounds(pid) {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error("Capture requires the exact automation-instance root PID via --app-pid.");
  const raw = execFileSync(
    "/usr/bin/osascript",
    [
      "-e", "tell application \"System Events\"",
      "-e", `tell first application process whose unix id is ${pid}`,
      "-e", "set w to front window",
      "-e", "set p to position of w",
      "-e", "set s to size of w",
      "-e", "return {item 1 of p, item 2 of p, item 1 of s, item 2 of s}",
      "-e", "end tell",
      "-e", "end tell"
    ],
    { encoding: "utf8" }
  ).trim();
  const [left, top, width, height] = raw.split(",").map((value) => Number(value.trim()));
  if (![left, top, width, height].every(Number.isFinite)) {
    throw new Error(`Could not parse native AX window bounds for PID ${pid}: ${raw}`);
  }
  return { pid, left, top, width, height };
}

async function main() {
  const session = await connect();
  try {
    let state;
    if (mode === "setup") {
      state = await session.evalJs(`new Promise((resolveState, rejectState) => {
        const deadline = Date.now() + 30000;
        const poll = () => {
          const root = document.querySelector('[data-dialog-id="compareDocuments"]');
          const picked = root?.querySelector('[data-pdf-source="compare-b"][data-path]');
          const confirm = root?.querySelector('[data-dialog-confirm]');
          if (root && picked instanceof HTMLElement && confirm instanceof HTMLButtonElement && !confirm.disabled) {
            resolveState({
              dialogId: 'compareDocuments',
              comparisonPath: picked.getAttribute('data-path'),
              comparisonName: picked.getAttribute('data-name')
            });
            return;
          }
          if (Date.now() >= deadline) rejectState(new Error('Timed out waiting for the selected Compare Documents setup.'));
          else setTimeout(poll, 50);
        };
        poll();
      })`);
    } else {
      state = await session.evalJs(`new Promise((resolveState, rejectState) => {
        const deadline = Date.now() + 30000;
        const poll = () => {
          const tab = document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '';
          const clouds = document.querySelectorAll('.annotation-box.revisionCloud');
          if (clouds.length > 0 && !document.querySelector('[data-dialog-id]')) {
            resolveState({ tab, clouds: clouds.length });
            return;
          }
          if (Date.now() >= deadline) {
            rejectState(new Error('Timed out waiting for a loaded Compare result with editable revision clouds; last tab=' + tab + ', clouds=' + clouds.length));
            return;
          }
          setTimeout(poll, 50);
        };
        poll();
      })`);

      await session.evalJs(`new Promise((resolveState, rejectState) => {
        const deadline = Date.now() + 5000;
        const open = () => {
          const table = document.querySelector('#markup-table');
          if (table && !table.classList.contains('hidden')) {
            resolveState(true);
            return;
          }
          const markups = document.querySelector('[data-footer-action="toggle-markup-table"]');
          if (markups instanceof HTMLElement) markups.click();
          if (Date.now() >= deadline) {
            rejectState(new Error('Timed out opening the real footer Markups List control.'));
            return;
          }
          setTimeout(open, 220);
        };
        open();
      })`);
      await session.evalJs(`new Promise((resolveState, rejectState) => {
        const deadline = Date.now() + 5000;
        const poll = () => {
          const count = document.querySelectorAll('#markup-rows .markup-row').length;
          if (count > 0) resolveState(count);
          else if (Date.now() >= deadline) rejectState(new Error('Timed out waiting for Compare markup rows.'));
          else setTimeout(poll, 50);
        };
        poll();
      })`);
      await session.evalJs(`(() => {
        const fitPage = document.querySelector('[data-footer-action="fit-page"]');
        if (fitPage instanceof HTMLElement) fitPage.click();
        return true;
      })()`);
      await sleep(650);
      await session.evalJs(`(() => {
        const cloud = document.querySelector('.annotation-box.revisionCloud');
        if (!(cloud instanceof HTMLElement)) throw new Error('No editable revision cloud is available to select.');
        cloud.click();
        return true;
      })()`);
      await sleep(500);
    }

    const facts = await session.evalJs(`(async () => {
      const settings = await window.polyPDF.getAppSettingsInfo();
      const rootStyle = getComputedStyle(document.documentElement);
      const rows = [...document.querySelectorAll('.markup-table-row, .markup-row, [data-markup-row]')]
        .map((row) => row.textContent?.replace(/\\s+/g, ' ').trim() ?? '')
        .filter(Boolean)
        .slice(0, 8);
      const styleToolbar = document.getElementById('style-toolbar');
      const styleTrack = styleToolbar?.querySelector('[data-style-toolbar-track]');
      const trackRect = styleTrack?.getBoundingClientRect();
      const styleSections = [...(styleToolbar?.querySelectorAll('.style-section') ?? [])].map((section) => {
        const rect = section.getBoundingClientRect();
        const style = getComputedStyle(section);
        return {
          id: section.getAttribute('data-style-section') ?? '',
          text: section.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
          left: rect.left,
          right: rect.right,
          width: rect.width,
          displayed: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0,
          withinTrack: Boolean(trackRect && rect.left >= trackRect.left - 1 && rect.right <= trackRect.right + 1)
        };
      });
      const styleControls = [...(styleToolbar?.querySelectorAll('button, input, select') ?? [])].filter(
        (control) => !control.matches('[data-style-toolbar-scroll]')
      );
      const visibleStyleControlCount = styleControls.filter((control) => {
        const rect = control.getBoundingClientRect();
        const style = getComputedStyle(control);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }).length;
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
        screenX: window.screenX,
        screenY: window.screenY,
        screenWidth: screen.width,
        screenHeight: screen.height,
        screenAvailLeft: screen.availLeft,
        screenAvailTop: screen.availTop,
        screenAvailWidth: screen.availWidth,
        screenAvailHeight: screen.availHeight,
        documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
        dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
        comparisonPath: document.querySelector('[data-pdf-source="compare-b"]')?.getAttribute('data-path') ?? '',
        comparisonName: document.querySelector('[data-pdf-source="compare-b"]')?.getAttribute('data-name') ?? '',
        compareConfirmEnabled: !(document.querySelector('[data-dialog-id="compareDocuments"] [data-dialog-confirm]')?.disabled ?? true),
        annotationCount: document.querySelectorAll('.annotation-box[data-annotation-id]').length,
        revisionCloudCount: document.querySelectorAll('.annotation-box.revisionCloud[data-annotation-id]').length,
        selectedRevisionCloudCount: document.querySelectorAll('.annotation-box.revisionCloud.selected').length,
        selectedCloudId: document.querySelector('.annotation-box.revisionCloud.selected')?.getAttribute('data-annotation-id') ?? '',
        markupsPanelActive: Boolean(document.querySelector('#markup-table:not(.hidden)'))
          && (document.querySelector('[data-footer-action="toggle-markup-table"]')?.classList.contains('active') ?? false),
        markupsTableVisible: Boolean(document.querySelector('#markup-table:not(.hidden)')),
        markupRows: rows,
        footerStatus: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
        styleControlsText: styleToolbar?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        styleToolbar: {
          present: Boolean(styleToolbar),
          className: styleToolbar?.className ?? '',
          trackPresent: Boolean(styleTrack),
          clientWidth: styleTrack?.clientWidth ?? 0,
          scrollWidth: styleTrack?.scrollWidth ?? 0,
          scrollLeft: styleTrack?.scrollLeft ?? 0,
          hasOverflowClass: styleToolbar?.classList.contains('has-style-toolbar-overflow') ?? false,
          sectionCount: styleSections.length,
          sections: styleSections,
          controlCount: styleControls.length,
          visibleControlCount: visibleStyleControlCount,
          visibleScrollButtonCount: [...(styleToolbar?.querySelectorAll('[data-style-toolbar-scroll]') ?? [])].filter((button) => {
            const rect = button.getBoundingClientRect();
            const style = getComputedStyle(button);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          }).length
        }
      };
    })()`);

    const fullStyleBarVisible = facts.styleToolbar.trackPresent
      && facts.styleToolbar.sectionCount > 0
      && facts.styleToolbar.controlCount > 0
      && facts.styleToolbar.visibleControlCount === facts.styleToolbar.controlCount
      && facts.styleToolbar.scrollWidth <= facts.styleToolbar.clientWidth + 1
      && facts.styleToolbar.scrollLeft === 0
      && facts.styleToolbar.hasOverflowClass === false
      && facts.styleToolbar.visibleScrollButtonCount === 0
      && facts.styleToolbar.sections.every((section) => section.displayed && section.width > 0 && section.withinTrack);
    const commonIdentityPass = facts.version === "1.3.4"
      && facts.build === "16"
      && facts.appAppearance === "dark"
      && facts.datasetTheme === "dark"
      && facts.bodyDark === true
      && facts.prefersDark === true
      && facts.chromeBase === "#26282b"
      && fullStyleBarVisible;
    const identityPass = commonIdentityPass && (mode === "setup"
      ? facts.dialogId === "compareDocuments"
        && facts.comparisonPath.endsWith("/compare-rev-b.pdf")
        && facts.comparisonName === "compare-rev-b.pdf"
        && facts.compareConfirmEnabled === true
      : facts.revisionCloudCount > 0
        && facts.selectedRevisionCloudCount > 0
        && facts.markupsPanelActive === true);
    if (!identityPass) throw new Error(`Compare identity/state gate failed: ${JSON.stringify(facts)}`);

    const finalRuntimeWindow = {
      left: facts.screenX,
      top: facts.screenY,
      width: facts.outerWidth,
      height: facts.outerHeight,
      availLeft: facts.screenAvailLeft,
      availTop: facts.screenAvailTop,
      availWidth: facts.screenAvailWidth,
      availHeight: facts.screenAvailHeight
    };
    const runtimeMaximized = finalRuntimeWindow.left === finalRuntimeWindow.availLeft
      && finalRuntimeWindow.top === finalRuntimeWindow.availTop
      && finalRuntimeWindow.width === finalRuntimeWindow.availWidth
      && finalRuntimeWindow.height === finalRuntimeWindow.availHeight;
    const axBounds = nativeAxWindowBounds(appPid);
    const axMatchesRuntime = axBounds.left === finalRuntimeWindow.left
      && axBounds.top === finalRuntimeWindow.top
      && axBounds.width === finalRuntimeWindow.width
      && axBounds.height === finalRuntimeWindow.height;
    if (!runtimeMaximized || !axMatchesRuntime) {
      throw new Error(`Native maximized-window gate failed: ${JSON.stringify({ finalRuntimeWindow, axBounds })}`);
    }
    const finalNativeWindow = {
      windowState: "maximized",
      runtimeMaximized,
      axMatchesRuntime,
      runtimeBounds: finalRuntimeWindow,
      axBounds
    };

    const capture = await session.cdp("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    const bytes = Buffer.from(capture.data, "base64");
    const pixelProof = pixelThemeProof(bytes, facts);
    if (!pixelProof.passes) throw new Error(`Dark pixel gate failed: ${JSON.stringify(pixelProof)}`);
    const appCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: appRoot, encoding: "utf8" }).trim();
    const appDiff = execFileSync("git", ["diff", "--binary"], {
      cwd: appRoot,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024
    });
    const appDiffSha256 = createHash("sha256").update(appDiff).digest("hex");
    if (expectedCommit && appCommit !== expectedCommit) {
      throw new Error(`App commit mismatch: expected ${expectedCommit}, got ${appCommit}.`);
    }
    if (expectedDiffSha256 && appDiffSha256 !== expectedDiffSha256) {
      throw new Error(`App working-tree diff mismatch: expected ${expectedDiffSha256}, got ${appDiffSha256}.`);
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, bytes);
    await writeFile(
      `${output}.theme-proof.json`,
      `${JSON.stringify({
        capturedAt: new Date().toISOString(),
        appSource: { appRoot, commit: appCommit, diffSha256: appDiffSha256 },
        nativeWindow: { ...session.nativeWindow, final: finalNativeWindow },
        mode,
        initialState: state,
        fullStyleBarVisible,
        facts,
        pixelProof
      }, null, 2)}\n`
    );
    process.stdout.write(`${JSON.stringify({
      output,
      appSource: { appRoot, commit: appCommit, diffSha256: appDiffSha256 },
      nativeWindow: { ...session.nativeWindow, final: finalNativeWindow },
      mode,
      initialState: state,
      fullStyleBarVisible,
      facts,
      pixelProof
    }, null, 2)}\n`);
  } finally {
    session.pageSocket.close();
    session.browserSocket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
