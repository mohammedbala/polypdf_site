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
await cdp("Page.enable");
await cdp("Page.bringToFront");

const inspect = () => evaluate(`(() => {
  const visible = (node) => node instanceof HTMLElement && node.offsetParent !== null;
  const rect = (node) => {
    const value = node?.getBoundingClientRect();
    return value ? { x: value.x, y: value.y, width: value.width, height: value.height } : null;
  };
  const sections = [...document.querySelectorAll('[data-toolchest-id^="builtin-mutcd-"]')].map((section) => ({
    id: section.getAttribute('data-toolchest-id'),
    name: section.querySelector('.toolchest-toolset-name')?.textContent?.trim() ?? '',
    collapsed: section.classList.contains('collapsed'),
    expanded: section.querySelector('.toolchest-toolset-header')?.getAttribute('aria-expanded') === 'true',
    cardCount: section.querySelectorAll('.toolchest-preview-card').length,
    visibleCardCount: [...section.querySelectorAll('.toolchest-preview-card')].filter(visible).length,
    renderedImageCount: section.querySelectorAll('.toolchest-item-preview img').length,
    loading: Boolean(section.querySelector('[aria-busy="true"]')),
    firstCards: [...section.querySelectorAll('.toolchest-preview-card')].slice(0, 12).map((card) => ({
      ariaLabel: card.getAttribute('aria-label') ?? '',
      title: card.getAttribute('title') ?? '',
      visible: visible(card),
      rect: rect(card),
      imageAlt: card.querySelector('img')?.getAttribute('alt') ?? ''
    })),
    rect: rect(section)
  }));
  const sidebar = document.querySelector('.sidebar-content');
  const toolbar = document.querySelector('.style-toolbar');
  const track = toolbar?.querySelector('[data-style-toolbar-track]');
  const selected = document.querySelector('[data-annotation-id="aisc-W24X55-profile"]');
  return {
    activePanel: document.querySelector('.rail-button.active')?.getAttribute('data-panel') ?? '',
    search: document.querySelector('#toolchest-search-input')?.value ?? '',
    searchStatus: document.querySelector('#toolchest-search-status')?.textContent?.trim() ?? '',
    sidebar: sidebar ? { scrollTop: sidebar.scrollTop, scrollHeight: sidebar.scrollHeight, clientHeight: sidebar.clientHeight } : null,
    styleToolbar: {
      visible: visible(toolbar),
      sectionCount: track?.querySelectorAll('[data-style-section]').length ?? 0,
      clientWidth: track?.clientWidth ?? 0,
      scrollWidth: track?.scrollWidth ?? 0,
      overflowClass: Boolean(toolbar?.classList.contains('has-style-toolbar-overflow'))
    },
    selectedAisc: selected ? { visible: visible(selected), selected: selected.classList.contains('selected'), rect: rect(selected) } : null,
    annotations: window.polyPDFAutomation.annotations().map((annotation) => ({
      id: annotation.id,
      kind: annotation.kind,
      tool: annotation.tool,
      page: annotation.page,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
      label: annotation.label,
      imageFilename: annotation.imageFilename,
      imageMimeType: annotation.imageMimeType,
      pluginProvenance: annotation.pluginProvenance
    })),
    sections
  };
})()`);

async function clickAtSelector(selector) {
  const geometry = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error('Missing element: ' + ${JSON.stringify(selector)});
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    const value = element.getBoundingClientRect();
    return { x: value.left + value.width / 2, y: value.top + value.height / 2 };
  })()`);
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.x, y: geometry.y });
  await cdp("Input.dispatchMouseEvent", {
    type: "mousePressed", x: geometry.x, y: geometry.y, button: "left", buttons: 1, clickCount: 1
  });
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased", x: geometry.x, y: geometry.y, button: "left", buttons: 0, clickCount: 1
  });
}

try {
  if (action === "expand-regulatory") {
    const state = await inspect();
    const regulatory = state.sections.find((section) => section.id === "builtin-mutcd-regulatory");
    if (!regulatory) throw new Error("MUTCD Regulatory toolset is missing.");
    if (regulatory.collapsed) {
      await clickAtSelector('[data-toolchest-id="builtin-mutcd-regulatory"] .toolchest-toolset-header');
    }
    await evaluate(`new Promise((resolveWait, rejectWait) => {
      const deadline = Date.now() + 15000;
      const poll = () => {
        const section = document.querySelector('[data-toolchest-id="builtin-mutcd-regulatory"]');
        const count = section?.querySelectorAll('.toolchest-preview-card').length ?? 0;
        if (count > 0) return resolveWait(count);
        if (Date.now() >= deadline) return rejectWait(new Error('MUTCD Regulatory signs did not load.'));
        setTimeout(poll, 100);
      };
      poll();
    })`);
    await evaluate(`(() => {
      const header = document.querySelector('[data-toolchest-id="builtin-mutcd-regulatory"] .toolchest-toolset-header');
      header?.scrollIntoView({ block: 'start', inline: 'nearest' });
      const sidebar = document.querySelector('.sidebar-content');
      if (sidebar instanceof HTMLElement) sidebar.scrollTop = Math.max(0, sidebar.scrollTop - 74);
      return true;
    })()`);
    await sleep(900);
  } else if (action === "search-stop") {
    const selector = "#toolchest-search-input";
    const geometry = await evaluate(`(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!(input instanceof HTMLInputElement)) throw new Error('MUTCD search input is missing.');
      input.scrollIntoView({ block: 'start', inline: 'nearest' });
      const value = input.getBoundingClientRect();
      return { x: value.left + value.width / 2, y: value.top + value.height / 2 };
    })()`);
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.x, y: geometry.y });
    await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: geometry.x, y: geometry.y, button: "left", buttons: 1, clickCount: 1 });
    await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: geometry.x, y: geometry.y, button: "left", buttons: 0, clickCount: 1 });
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
    await cdp("Input.insertText", { text: "stop" });
    await evaluate(`new Promise((resolveWait, rejectWait) => {
      const deadline = Date.now() + 15000;
      const poll = () => {
        const input = document.querySelector('#toolchest-search-input');
        const status = document.querySelector('#toolchest-search-status')?.textContent?.trim() ?? '';
        const cards = document.querySelectorAll('[data-toolchest-id^="builtin-mutcd-"] .toolchest-preview-card').length;
        if (input?.value === 'stop' && status && cards > 0) return resolveWait({ status, cards });
        if (Date.now() >= deadline) return rejectWait(new Error('MUTCD stop search did not finish.'));
        setTimeout(poll, 100);
      };
      poll();
    })`);
    await evaluate(`(() => {
      const input = document.querySelector('#toolchest-search-input');
      input?.scrollIntoView({ block: 'start', inline: 'nearest' });
      const sidebar = document.querySelector('.sidebar-content');
      if (sidebar instanceof HTMLElement) sidebar.scrollTop = Math.max(0, sidebar.scrollTop - 10);
      return true;
    })()`);
    await sleep(900);
  } else if (action === "place-stop") {
    let state = await inspect();
    if (state.activePanel !== "toolchests") {
      await clickAtSelector('[data-panel="toolchests"]');
      await sleep(600);
      state = await inspect();
    }
    let regulatory = state.sections.find((section) => section.id === "builtin-mutcd-regulatory");
    if (!regulatory) throw new Error("MUTCD Regulatory toolset is missing.");
    if (regulatory.collapsed) {
      await clickAtSelector('[data-toolchest-id="builtin-mutcd-regulatory"] .toolchest-toolset-header');
      await evaluate(`new Promise((resolveWait, rejectWait) => {
        const deadline = Date.now() + 15000;
        const poll = () => {
          const section = document.querySelector('[data-toolchest-id="builtin-mutcd-regulatory"]');
          const count = section?.querySelectorAll('.toolchest-preview-card').length ?? 0;
          if (count > 0) return resolveWait(count);
          if (Date.now() >= deadline) return rejectWait(new Error('MUTCD Regulatory signs did not load.'));
          setTimeout(poll, 100);
        };
        poll();
      })`);
    }
    const before = await evaluate(`window.polyPDFAutomation.annotations().length`);
    await clickAtSelector('[data-toolchest-id="builtin-mutcd-regulatory"] .toolchest-preview-card[aria-label="Place R1-1 Stop"]');
    await evaluate(`new Promise((resolveWait, rejectWait) => {
      const before = ${JSON.stringify(0)} + ${before};
      const deadline = Date.now() + 10000;
      const poll = () => {
        const annotations = window.polyPDFAutomation.annotations();
        const stop = annotations.find((annotation) => annotation.label === 'R1-1 Stop' && annotation.tool === 'imageStamp');
        if (annotations.length === before + 1 && stop) return resolveWait(stop.id);
        if (Date.now() >= deadline) return rejectWait(new Error('R1-1 Stop was not placed through the real toolchest card.'));
        setTimeout(poll, 100);
      };
      poll();
    })`);
    await evaluate(`(() => {
      const header = document.querySelector('[data-toolchest-id="builtin-mutcd-regulatory"] .toolchest-toolset-header');
      header?.scrollIntoView({ block: 'start', inline: 'nearest' });
      const sidebar = document.querySelector('.sidebar-content');
      if (sidebar instanceof HTMLElement) sidebar.scrollTop = Math.max(0, sidebar.scrollTop - 74);
      return true;
    })()`);
    await sleep(1000);
  } else if (action === "move-stop-down") {
    const geometry = await evaluate(`(() => {
      const stored = window.polyPDFAutomation.annotations().find((annotation) => annotation.label === 'R1-1 Stop' && annotation.tool === 'imageStamp');
      const annotation = stored ? document.querySelector('[data-annotation-id="' + CSS.escape(stored.id) + '"]') : null;
      if (!(annotation instanceof HTMLElement) || annotation.offsetParent === null) throw new Error('Visible placed R1-1 Stop annotation was not found.');
      const rect = annotation.getBoundingClientRect();
      return {
        id: stored.id,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        targetX: rect.left + rect.width / 2,
        targetY: rect.top + rect.height / 2 + 52,
        storedBefore: { x: stored.x, y: stored.y, width: stored.width, height: stored.height },
        rectBefore: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    })()`);
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.startX, y: geometry.startY });
    await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: geometry.startX, y: geometry.startY, button: "left", buttons: 1, clickCount: 1 });
    for (let step = 1; step <= 14; step += 1) {
      const progress = step / 14;
      await cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: geometry.startX,
        y: geometry.startY + (geometry.targetY - geometry.startY) * progress,
        button: "left",
        buttons: 1
      });
    }
    await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: geometry.targetX, y: geometry.targetY, button: "left", buttons: 0, clickCount: 1 });
    await evaluate(`new Promise((resolveWait, rejectWait) => {
      const deadline = Date.now() + 8000;
      const beforeY = ${geometry.storedBefore.y};
      const poll = () => {
        const stop = window.polyPDFAutomation.annotations().find((annotation) => annotation.label === 'R1-1 Stop' && annotation.tool === 'imageStamp');
        if (stop && stop.y > beforeY + 20) return resolveWait({ id: stop.id, y: stop.y });
        if (Date.now() >= deadline) return rejectWait(new Error('R1-1 Stop did not move down inside its target.'));
        setTimeout(poll, 100);
      };
      poll();
    })`);
    await sleep(900);
  }
  process.stdout.write(`${JSON.stringify(await inspect(), null, 2)}\n`);
} finally {
  socket.close();
}
