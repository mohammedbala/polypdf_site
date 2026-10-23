#!/usr/bin/env node
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const port = Number(valueAfter(argv, "--port") ?? 9491);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const output = resolve(valueAfter(argv, "--output") ?? "plugin-manager-dark.png");
const width = Number(valueAfter(argv, "--width") ?? 1200);
const height = Number(valueAfter(argv, "--height") ?? 800);
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function targetForPort() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const target = targets.find((item) => item.type === "page" && item.title === "Plugins");
      if (target) return target;
    } catch {
      // Wait for the manager renderer.
    }
    await sleep(250);
  }
  throw new Error("The Plugin Manager CDP target did not appear.");
}

function rgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function near(data, index, token) {
  return Math.abs(data[index] - token[0]) <= 3
    && Math.abs(data[index + 1] - token[1]) <= 3
    && Math.abs(data[index + 2] - token[2]) <= 3;
}

const target = await targetForPort();
const socket = new WebSocket(target.webSocketDebuggerUrl);
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

try {
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false,
    screenWidth: width,
    screenHeight: height
  });
  await sleep(500);
  const evaluated = await cdp("Runtime.evaluate", {
    expression: `(() => ({
      title: document.title,
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
      chromeBase: getComputedStyle(document.documentElement).getPropertyValue("--chrome-base").trim(),
      chromeElevated: getComputedStyle(document.documentElement).getPropertyValue("--chrome-elevated").trim(),
      devicePixelRatio,
      innerWidth,
      innerHeight,
      detail: document.querySelector(".detail-name")?.textContent?.trim() ?? "",
      pluginCount: document.querySelectorAll("button.list-open").length
    }))()`,
    returnByValue: true
  });
  const facts = evaluated.result?.value;
  if (!facts?.prefersDark || facts.chromeBase !== "#26282b") {
    throw new Error(`Plugin Manager is not dark: ${JSON.stringify(facts)}`);
  }
  const shot = await cdp("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const bytes = Buffer.from(shot.data, "base64");
  const png = PNG.sync.read(bytes);
  const darkTokens = ["#26282b", "#313437", "#2a2d30", "#202225", "#46484b"].map(rgb);
  const lightTokens = ["#f7f7f4", "#fdfdfc", "#f1f0ec", "#7b7c7a", "#f1f1ed"].map(rgb);
  let darkHits = 0;
  let lightHits = 0;
  let topDarkHits = 0;
  let topLightHits = 0;
  const topRows = Math.round(90 * facts.devicePixelRatio);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const pixel = (y * png.width + x) * 4;
      const dark = darkTokens.some((token) => near(png.data, pixel, token));
      const light = lightTokens.some((token) => near(png.data, pixel, token));
      if (dark) darkHits += 1;
      if (light) lightHits += 1;
      if (y < topRows && dark) topDarkHits += 1;
      if (y < topRows && light) topLightHits += 1;
    }
  }
  const total = png.width * png.height;
  const topTotal = png.width * topRows;
  const pixelProof = {
    width: png.width,
    height: png.height,
    darkRatio: darkHits / total,
    lightRatio: lightHits / total,
    topDarkRatio: topDarkHits / topTotal,
    topLightHits,
    passes: png.width === width * 2
      && png.height === height * 2
      && darkHits / total >= 0.02
      && topDarkHits / topTotal >= 0.25
      && topDarkHits > topLightHits * 10
  };
  if (!pixelProof.passes) throw new Error(`Plugin Manager dark pixel gate failed: ${JSON.stringify(pixelProof)}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes);
  await writeFile(`${output}.theme-proof.json`, `${JSON.stringify({
    capturedAt: new Date().toISOString(),
    appVersion: "1.3.4",
    appBuild: "16",
    parentDocument: "plugin-reference-sheet.pdf",
    facts,
    pixelProof
  }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ facts, pixelProof }, null, 2)}\n`);
} finally {
  socket.close();
}
