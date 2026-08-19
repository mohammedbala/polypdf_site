#!/usr/bin/env node
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const action = argv[0] ?? "inspect";
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const port = Number(valueAfter("--port", "9507"));
const appRoot = resolve(valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf"));
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
      // The isolated renderer is still starting.
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

try {
  let result;
  if (action === "move-aisc-left") {
    const geometry = await evaluate(`(() => {
      const annotation = [...document.querySelectorAll('.annotation-box')].find((node) => {
        const id = node.getAttribute('data-annotation-id') ?? '';
        return id === 'aisc-W24X55-profile' && node instanceof HTMLElement && node.offsetParent !== null;
      });
      const page = annotation?.closest('.page-shell');
      if (!(annotation instanceof HTMLElement) || !(page instanceof HTMLElement)) {
        throw new Error('Visible generated AISC annotation/page was not found.');
      }
      const annotationRect = annotation.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      const stored = window.polyPDFAutomation.annotations().find((item) => item.id === 'aisc-W24X55-profile');
      return {
        startX: annotationRect.left + annotationRect.width / 2,
        startY: annotationRect.top + annotationRect.height / 2,
        targetX: pageRect.left + pageRect.width * (1 / 6),
        targetY: pageRect.top + pageRect.height * 0.49,
        annotationRect: { x: annotationRect.x, y: annotationRect.y, width: annotationRect.width, height: annotationRect.height },
        pageRect: { x: pageRect.x, y: pageRect.y, width: pageRect.width, height: pageRect.height },
        storedBefore: stored ? { x: stored.x, y: stored.y, width: stored.width, height: stored.height } : null
      };
    })()`);
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.startX, y: geometry.startY });
    await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: geometry.startX, y: geometry.startY, button: "left", buttons: 1, clickCount: 1 });
    for (let step = 1; step <= 16; step += 1) {
      const progress = step / 16;
      await cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: geometry.startX + (geometry.targetX - geometry.startX) * progress,
        y: geometry.startY + (geometry.targetY - geometry.startY) * progress,
        button: "left",
        buttons: 1
      });
    }
    await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: geometry.targetX, y: geometry.targetY, button: "left", buttons: 0, clickCount: 1 });
    await sleep(900);
    result = await evaluate(`(() => {
      const annotation = document.querySelector('[data-annotation-id="aisc-W24X55-profile"]');
      const rect = annotation?.getBoundingClientRect();
      const stored = window.polyPDFAutomation.annotations().find((item) => item.id === 'aisc-W24X55-profile');
      return {
        visible: annotation instanceof HTMLElement && annotation.offsetParent !== null,
        selected: annotation?.classList.contains('selected') ?? false,
        rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        storedAfter: stored ? { x: stored.x, y: stored.y, width: stored.width, height: stored.height } : null,
        provenance: stored?.pluginProvenance ?? null
      };
    })()`);
    result = { geometry, ...result };
  } else {
    result = await evaluate(`(() => ({
      activePanel: document.querySelector('.rail-button.active')?.getAttribute('data-panel') ?? '',
      dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      annotations: window.polyPDFAutomation.annotations(),
      visibleToolchestText: [...document.querySelectorAll('section, aside')]
        .find((node) => node instanceof HTMLElement && node.offsetParent !== null && /Tools/i.test(node.textContent ?? ''))
        ?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
    }))()`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  socket.close();
}
