#!/usr/bin/env node
// Trusted-CDP driver for the synthetic redaction fixture. The app must be launched and
// torn down with automation-instance.mjs; this helper only operates the isolated renderer.
import { createRequire } from "node:module";
import { join } from "node:path";

const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const action = argv[0] ?? "inspect";
const port = Number(valueAfter("--port", "9482"));
const appRoot = valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf");
const query = valueAfter("--query", "CASE-ORCHID-742");
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
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

  const targetGeometry = async () => evaluate(`(() => {
    const needle = ${JSON.stringify(query)};
    const layers = [...document.querySelectorAll('.pdf-text-layer')];
    for (const layer of layers) {
      const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let fullText = '';
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        nodes.push({ node, start: fullText.length, end: fullText.length + (node.nodeValue?.length ?? 0) });
        fullText += node.nodeValue ?? '';
      }
      const matchStart = fullText.indexOf(needle);
      if (matchStart < 0) continue;
      const matchEnd = matchStart + needle.length;
      const first = nodes.find((item) => item.start <= matchStart && item.end > matchStart);
      const last = nodes.find((item) => item.start < matchEnd && item.end >= matchEnd);
      if (!first || !last) throw new Error('Could not map the redaction target into text nodes.');
      const range = document.createRange();
      range.setStart(first.node, matchStart - first.start);
      range.setEnd(last.node, matchEnd - last.start);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      if (!rects.length) throw new Error('The redaction target has no visible text rectangle.');
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      const pageShell = layer.closest('.page-shell')?.getBoundingClientRect();
      return {
        needle,
        fullTextSample: fullText.slice(Math.max(0, matchStart - 36), matchEnd + 36),
        startX: left - 5,
        startY: top - 4,
        endX: right + 5,
        endY: bottom + 4,
        rect: { left, top, right, bottom, width: right - left, height: bottom - top },
        pageShell: pageShell ? { left: pageShell.left, top: pageShell.top, right: pageShell.right, bottom: pageShell.bottom } : null
      };
    }
    throw new Error('Searchable redaction target was not found in a visible PDF text layer.');
  })()`);

  let result;
  if (action === "inspect") {
    result = await evaluate(`(() => ({
      dialog: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      dialogText: document.querySelector('[data-dialog-id]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      status: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
      activePanel: document.querySelector('.rail-button.active')?.getAttribute('data-panel') ?? '',
      previewCount: document.querySelectorAll('.two-point-preview.redaction-preview').length,
      redactionBoxes: [...document.querySelectorAll('.annotation-box')].filter((node) => /redact/i.test(node.className)).length,
      textLayers: [...document.querySelectorAll('.pdf-text-layer')].map((layer) => ({
        length: layer.textContent?.length ?? 0,
        containsTarget: (layer.textContent ?? '').includes(${JSON.stringify(query)}),
        sample: layer.textContent?.slice(0, 420) ?? ''
      })),
      searchText: document.querySelector('.search-results')?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
    }))()`);
  } else if (action === "dismiss-consent") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="telemetryConsent"]');
      if (!root) return { dismissed: false, reason: 'not-open' };
      const button = root.querySelector('[data-dialog-cancel]');
      if (!(button instanceof HTMLElement)) throw new Error('Consent dismiss button was not found.');
      button.click();
      return { dismissed: true };
    })()`);
  } else if (action === "target-geometry") {
    result = await targetGeometry();
  } else if (action === "begin-target-drag") {
    const geometry = await targetGeometry();
    await evaluate(`(() => {
      const button = document.querySelector('[data-toolbar-id="redact"]');
      if (!(button instanceof HTMLElement)) throw new Error('Redact toolbar control was not found.');
      button.click();
      return { active: button.classList.contains('active'), pressed: button.getAttribute('aria-pressed') };
    })()`);
    await sleep(350);
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.startX, y: geometry.startY });
    await cdp("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: geometry.startX,
      y: geometry.startY,
      button: "left",
      buttons: 1,
      clickCount: 1
    });
    for (let step = 1; step <= 14; step += 1) {
      const progress = step / 14;
      await cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: geometry.startX + (geometry.endX - geometry.startX) * progress,
        y: geometry.startY + (geometry.endY - geometry.startY) * progress,
        button: "left",
        buttons: 1
      });
    }
    await sleep(500);
    result = await evaluate(`(() => ({
      geometry: ${JSON.stringify(geometry)},
      previewCount: document.querySelectorAll('.two-point-preview.redaction-preview').length,
      previewRects: [...document.querySelectorAll('.two-point-preview.redaction-preview')].map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      })
    }))()`);
  } else if (action === "release-target-drag") {
    const geometry = await targetGeometry();
    await cdp("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: geometry.endX,
      y: geometry.endY,
      button: "left",
      buttons: 0,
      clickCount: 1
    });
    await sleep(700);
    result = await evaluate(`(() => ({
      released: true,
      dialog: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      dialogText: document.querySelector('[data-dialog-id]')?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
    }))()`);
  } else if (action === "confirm-redaction") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id]');
      if (!(root instanceof HTMLElement) || !/redact/i.test(root.textContent ?? '')) throw new Error('Redaction confirmation is not open.');
      const button = root.querySelector('[data-dialog-confirm]');
      if (!(button instanceof HTMLButtonElement)) throw new Error('Apply Redaction button was not found.');
      button.click();
      return { requested: true };
    })()`);
    await sleep(3500);
    result = await evaluate(`(() => ({
      ...${JSON.stringify(result)},
      dialog: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      status: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      targetStillInTextLayer: [...document.querySelectorAll('.pdf-text-layer')].some((layer) => (layer.textContent ?? '').includes(${JSON.stringify(query)}))
    }))()`);
  } else if (action === "save") {
    result = await evaluate(`(() => {
      const button = document.querySelector('[data-toolbar-id="save"]');
      if (!(button instanceof HTMLElement)) throw new Error('Save toolbar button was not found.');
      button.click();
      return { requested: true };
    })()`);
    await sleep(4000);
    result = await evaluate(`(() => ({
      ...${JSON.stringify(result)},
      status: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      tabClass: document.querySelector('.primary-tab-strip [data-document-tab-id].active')?.className ?? ''
    }))()`);
  } else if (action === "search") {
    result = await evaluate(`(async () => {
      const rail = document.querySelector('.rail-button[data-panel="search"]');
      if (!(rail instanceof HTMLElement)) throw new Error('Search rail button was not found.');
      rail.click();
      const input = await new Promise((resolveInput, rejectInput) => {
        const deadline = Date.now() + 8000;
        const poll = () => {
          const found = document.querySelector('.search-box input[type="search"]');
          if (found instanceof HTMLInputElement) return resolveInput(found);
          if (Date.now() >= deadline) return rejectInput(new Error('Search input did not appear.'));
          setTimeout(poll, 75);
        };
        poll();
      });
      input.value = ${JSON.stringify(query)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.closest('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return { submitted: true, query: input.value };
    })()`);
    await sleep(2500);
    result = await evaluate(`(() => ({
      ...${JSON.stringify(result)},
      resultText: document.querySelector('.search-results')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      empty: Boolean(document.querySelector('.search-results.empty')),
      resultCount: document.querySelectorAll('.search-result').length
    }))()`);
  } else {
    throw new Error(`Unknown redaction action: ${action}`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  socket.close();
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
