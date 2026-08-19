#!/usr/bin/env node
// CDP sidecar for isolated PolyPDF 1.3.4 screenshot evidence.
// The app itself must always be launched and torn down with automation-instance.mjs.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const port = Number(valueAfter(argv, "--port") ?? 9431);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const output = valueAfter(argv, "--output");
const sourceBase = valueAfter(argv, "--source-base") ?? "a0a709c39e35343d3c71f7d615fedffb007db619";
const sourceDiffSha256 = valueAfter(argv, "--source-diff-sha256") ?? "8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250";
const clickSelectors = valuesAfter(argv, "--click");
const waitSelector = valueAfter(argv, "--wait-for-selector");
const delayMs = Number(valueAfter(argv, "--delay-ms") ?? 700);
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function targetForPort() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const pages = targets.filter((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      const page = pages.find((item) => item.title === "PolyPDF" || String(item.url).endsWith("/renderer/index.html"))
        ?? pages[0];
      if (page) return page;
    } catch {
      // The port is not accepting connections yet.
    }
    await sleep(250);
  }
  throw new Error(`No PolyPDF page target appeared on CDP port ${port}.`);
}

async function connect() {
  const target = await targetForPort();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
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
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  const evalJs = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
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
  await cdp("Emulation.clearDeviceMetricsOverride");
  await cdp("Page.bringToFront");
  // Interactive dev launches maximize themselves. Automation/visual-capture launches intentionally
  // do not, so use PolyPDF's own window-control IPC (which calls BrowserWindow.maximize()) when the
  // renderer geometry does not yet fill the native work area. No emulated viewport is used.
  const maximizeProof = await evalJs(`(async () => {
    const geometry = () => ({
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenX: window.screenX,
      screenY: window.screenY,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio
    });
    const fillsWorkArea = (value) =>
      value.outerWidth >= value.availWidth - 4 && value.outerHeight >= value.availHeight - 48;
    const before = geometry();
    let maximizeInvoked = false;
    let controlResult = null;
    if (!fillsWorkArea(before)) {
      controlResult = await window.polyPDF.controlWindow("toggleMaximize");
      maximizeInvoked = true;
    }
    const after = await new Promise((resolveGeometry, rejectGeometry) => {
      const deadline = Date.now() + 8000;
      const poll = () => {
        const value = geometry();
        if (fillsWorkArea(value)) return resolveGeometry(value);
        if (Date.now() >= deadline) return rejectGeometry(new Error("PolyPDF did not fill the native work area after maximize"));
        setTimeout(poll, 75);
      };
      poll();
    });
    return { before, after, maximizeInvoked, controlResult, fillsWorkArea: fillsWorkArea(after) };
  })()`);
  await sleep(700);
  return { target, socket, cdp, evalJs, maximizeProof };
}

async function darkThemeFacts(evalJs) {
  return evalJs(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      version: settings.version,
      build: settings.build,
      appAppearance: settings.appearance,
      datasetTheme: document.documentElement.dataset.theme,
      bodyDark: document.body.classList.contains("appearance-dark"),
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
      chromeBase: rootStyle.getPropertyValue("--chrome-base").trim(),
      chromeElevated: rootStyle.getPropertyValue("--chrome-elevated").trim(),
      panelBase: rootStyle.getPropertyValue("--panel-base").trim(),
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      styleToolbar: (() => {
        const toolbar = document.querySelector(".style-toolbar");
        const track = toolbar?.querySelector("[data-style-toolbar-track]");
        const rect = toolbar?.getBoundingClientRect();
        return {
          exists: Boolean(toolbar),
          visible: Boolean(rect && rect.width > 0 && rect.height >= 34),
          hasOverflowClass: Boolean(toolbar?.classList.contains("has-style-toolbar-overflow")),
          clientWidth: track?.clientWidth ?? 0,
          scrollWidth: track?.scrollWidth ?? 0,
          scrollLeft: track?.scrollLeft ?? 0,
          sectionCount: track?.querySelectorAll("[data-style-section]").length ?? 0
        };
      })(),
      documentName: document.querySelector(".primary-tab-strip [data-document-tab-id].active .tab-label")?.textContent?.trim() ?? "",
      dialogId: document.querySelector("[data-dialog-id]")?.getAttribute("data-dialog-id") ?? ""
    };
  })()`);
}

async function setAndVerifyDark(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: "appearance", mode: "dark" }); true`);
  const facts = await evalJs(`new Promise((resolveFacts, rejectFacts) => {
    const deadline = Date.now() + 7000;
    const poll = async () => {
      try {
        const settings = await window.polyPDF.getAppSettingsInfo();
        const chrome = getComputedStyle(document.documentElement).getPropertyValue("--chrome-base").trim();
        if (
          document.documentElement.dataset.theme === "dark" &&
          document.body.classList.contains("appearance-dark") &&
          matchMedia("(prefers-color-scheme: dark)").matches &&
          chrome === "#26282b" &&
          settings.version === "1.3.4" &&
          String(settings.build) === "16" &&
          settings.appearance === "dark"
        ) {
          resolveFacts({ settings, chrome });
          return;
        }
      } catch {}
      if (Date.now() >= deadline) {
        rejectFacts(new Error("PolyPDF did not reach the verified 1.3.4 build 16 dark state."));
        return;
      }
      setTimeout(poll, 75);
    };
    void poll();
  })`);
  return facts;
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
  const proof = {
    width: image.width,
    height: image.height,
    darkHits,
    lightHits,
    darkRatio: darkHits / total,
    lightRatio: lightHits / total,
    topDarkHits,
    topLightHits,
    topDarkRatio: topDarkHits / topTotal,
    expectedWidth: Math.round(Number(facts.innerWidth) * Number(facts.devicePixelRatio)),
    expectedHeight: Math.round(Number(facts.innerHeight) * Number(facts.devicePixelRatio)),
    passes:
      image.width === Math.round(Number(facts.innerWidth) * Number(facts.devicePixelRatio))
      && image.height === Math.round(Number(facts.innerHeight) * Number(facts.devicePixelRatio))
      &&
      darkHits / total >= 0.02
      && topDarkHits / topTotal >= 0.25
      && topDarkHits > topLightHits * 10
  };
  return proof;
}

async function capturePng(cdp, destination, facts) {
  const result = await cdp("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const bytes = Buffer.from(result.data, "base64");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  const proof = pixelThemeProof(bytes, facts);
  if (!proof.passes) throw new Error(`Dark pixel gate failed for ${destination}: ${JSON.stringify(proof)}`);
  return proof;
}

async function main() {
  const session = await connect();
  try {
    await setAndVerifyDark(session.evalJs);
    if (waitSelector) {
      await session.evalJs(`new Promise((resolveWait, rejectWait) => {
        const selector = ${JSON.stringify(waitSelector)};
        const deadline = Date.now() + 10000;
        const poll = () => {
          const element = document.querySelector(selector);
          if (element) return resolveWait(true);
          if (Date.now() >= deadline) return rejectWait(new Error("Timed out waiting for " + selector));
          setTimeout(poll, 75);
        };
        poll();
      })`);
    }
    for (const selector of clickSelectors) {
      await session.evalJs(`(() => {
        const selector = ${JSON.stringify(selector)};
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) throw new Error("No clickable element matched " + selector);
        element.click();
        return true;
      })()`);
      await sleep(300);
    }
    await sleep(delayMs);
    const facts = await darkThemeFacts(session.evalJs);
    const windowProof = {
      ...session.maximizeProof,
      passes: session.maximizeProof.fillsWorkArea
        && facts.styleToolbar?.exists
        && facts.styleToolbar?.visible
        && !facts.styleToolbar?.hasOverflowClass
        && facts.styleToolbar?.scrollWidth <= facts.styleToolbar?.clientWidth + 2
    };
    if (!windowProof.passes) {
      throw new Error(`Maximized/full-style-bar gate failed: ${JSON.stringify({ windowProof, styleToolbar: facts.styleToolbar })}`);
    }
    let pixelProof;
    if (command === "capture" || output) {
      if (!output) throw new Error("capture requires --output <file.png>");
      pixelProof = await capturePng(session.cdp, resolve(output), facts);
      await writeFile(
        `${resolve(output)}.theme-proof.json`,
        `${JSON.stringify({
          capturedAt: new Date().toISOString(),
          source: { baseCommit: sourceBase, workingTreeDiffSha256: sourceDiffSha256 },
          facts,
          windowProof,
          pixelProof
        }, null, 2)}\n`
      );
    }
    process.stdout.write(`${JSON.stringify({ command, port, source: { baseCommit: sourceBase, workingTreeDiffSha256: sourceDiffSha256 }, facts, windowProof, pixelProof }, null, 2)}\n`);
  } finally {
    session.socket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
