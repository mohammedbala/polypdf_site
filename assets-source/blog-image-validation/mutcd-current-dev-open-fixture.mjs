#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";

const execFile = promisify(execFileCallback);
const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const port = Number(valueAfter("--port", "9507"));
const pid = Number(valueAfter("--pid", "64240"));
const appRoot = resolve(valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf"));
const fixture = resolve(valueAfter("--fixture", "/Users/mohammedbala/Projects/polypdf_site-organic-guides/assets-source/blog-image-validation/fixtures/mutcd-r1-1-reference-sheet.pdf"));
if (!Number.isInteger(pid) || pid <= 0) throw new Error("--pid must be the exact owned automation root PID.");

const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function target() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find(
        (item) => item.type === "page" && (item.title === "PolyPDF" || String(item.url).endsWith("/renderer/index.html"))
      );
      if (page) return page;
    } catch {
      // The exact isolated renderer is still starting.
    }
    await sleep(200);
  }
  throw new Error(`No PolyPDF page target appeared on port ${port}.`);
}

const pageTarget = await target();
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
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
const cdp = (method, params = {}) => new Promise((resolveRequest, rejectRequest) => {
  const id = ++messageId;
  pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await cdp("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
};

await cdp("Runtime.enable");
await cdp("Page.enable");
await cdp("Page.bringToFront");

try {
  const point = await evaluate(`(() => {
    const button = document.querySelector('[data-toolbar-id="open"][data-action="open"]');
    if (!(button instanceof HTMLButtonElement) || button.offsetParent === null) throw new Error('Visible Open toolbar button is missing.');
    const rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", buttons: 1, clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(800);

  await execFile("/usr/bin/osascript", [
    "-e", "tell application \"System Events\"",
    "-e", `tell first application process whose unix id is ${pid}`,
    "-e", "set frontmost to true",
    "-e", "keystroke \"g\" using {command down, shift down}",
    "-e", "delay 0.4",
    "-e", `keystroke ${JSON.stringify(fixture)}`,
    "-e", "delay 0.4",
    "-e", "key code 36",
    "-e", "delay 0.7",
    "-e", "key code 36",
    "-e", "end tell",
    "-e", "end tell"
  ], { maxBuffer: 4 * 1024 * 1024 });

  const opened = await evaluate(`new Promise((resolveWait, rejectWait) => {
    const expected = ${JSON.stringify(basename(fixture))};
    const deadline = Date.now() + 30000;
    const poll = () => {
      const label = document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '';
      const canvas = document.querySelector('.page-shell canvas');
      if (label === expected && canvas) return resolveWait({ label, canvasWidth: canvas.width, canvasHeight: canvas.height });
      if (Date.now() >= deadline) return rejectWait(new Error('Timed out waiting for owned MUTCD fixture to open. Active tab: ' + label));
      setTimeout(poll, 100);
    };
    poll();
  })`);
  process.stdout.write(`${JSON.stringify({ fixture, pid, opened }, null, 2)}\n`);
} finally {
  socket.close();
}
