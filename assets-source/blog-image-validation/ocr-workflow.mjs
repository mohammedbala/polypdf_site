#!/usr/bin/env node
// Drives only the real, user-visible PolyPDF OCR workflow over CDP. The Electron
// instance itself is owned by scripts/automation-instance.mjs; this sidecar never
// launches or terminates a process and never mutates renderer state directly.
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const action = argv[0] ?? "inspect";
const port = Number(valueAfter(argv, "--port") ?? 9460);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/private/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const query = valueAfter(argv, "--query") ?? "AKRON";
const theme = valueAfter(argv, "--theme") ?? "light";
const timeoutMs = Number(valueAfter(argv, "--timeout-ms") ?? 180_000);
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");

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
      // The isolated app is still starting.
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
  const evalJs = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
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
  return { socket, evalJs };
}

async function inspect(evalJs) {
  return evalJs(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    const dialog = document.querySelector('[data-dialog-id]');
    return {
      version: settings.version,
      build: String(settings.build),
      appearance: settings.appearance,
      theme: document.documentElement.dataset.theme,
      bodyDark: document.body.classList.contains('appearance-dark'),
      documentName: document.querySelector('.primary-tab-strip .tab.active .tab-label')?.textContent?.trim() ?? '',
      dirty: document.querySelector('.primary-tab-strip .tab.active')?.classList.contains('dirty') ?? false,
      dialogId: dialog?.getAttribute('data-dialog-id') ?? '',
      dialogText: dialog?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      ocrProgress: Number(document.querySelector('[data-ocr-progress]')?.value ?? -1),
      ocrHeadline: document.querySelector('[data-ocr-headline]')?.textContent?.trim() ?? '',
      ocrPercent: document.querySelector('[data-ocr-percent]')?.textContent?.trim() ?? '',
      footerOcrBadge: document.querySelector('.footer-ocr-badge')?.getAttribute('title') ?? '',
      footerStatus: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      searchRows: [...document.querySelectorAll('.search-row')].map((row) => row.textContent?.replace(/\\s+/g, ' ').trim() ?? ''),
      selectedSearchRows: document.querySelectorAll('.search-row.selected').length,
      selectedHitRects: document.querySelectorAll('.search-hit-rect.selected').length
    };
  })()`);
}

async function waitFor(evalJs, expression, label, waitMs = timeoutMs) {
  const started = Date.now();
  for (;;) {
    const result = await evalJs(`(() => { try { return Boolean(${expression}); } catch { return false; } })()`);
    if (result) return;
    if (Date.now() - started >= waitMs) throw new Error(`Timed out waiting for ${label}.`);
    await sleep(150);
  }
}

async function dismissTelemetryIfPresent(evalJs) {
  const dismissed = await evalJs(`(() => {
    const telemetry = document.querySelector('[data-dialog-id="telemetryConsent"] [data-dialog-cancel]');
    if (!(telemetry instanceof HTMLElement)) return false;
    telemetry.click();
    return true;
  })()`);
  if (dismissed) await waitFor(evalJs, `!document.querySelector('[data-dialog-id]')`, "first-run telemetry dialog to close", 10_000);
}

async function startOcr(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: ${JSON.stringify(theme)} }); true`);
  await waitFor(
    evalJs,
    `document.documentElement.dataset.theme === ${JSON.stringify(theme)}`,
    `${theme} theme`,
    10_000
  );
  await dismissTelemetryIfPresent(evalJs);
  await waitFor(evalJs, `!document.querySelector('[data-dialog-id]')`, "any first-run dialog to close", 10_000);
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'documentDialog', dialog: 'ocr' }); true`);
  await waitFor(evalJs, `document.querySelector('[data-dialog-id="ocr"] [data-ocr-progress]')`, "the real OCR dialog", 12_000);
  return inspect(evalJs);
}

async function waitForOcrCompletion(evalJs) {
  await waitFor(
    evalJs,
    `document.querySelector('[data-dialog-id="ocr"]') && Number(document.querySelector('[data-ocr-progress]')?.value ?? 0) >= 100`,
    "OCR completion",
    timeoutMs
  );
  await sleep(800);
  return inspect(evalJs);
}

async function closeAndSave(evalJs) {
  const before = await inspect(evalJs);
  if (before.ocrProgress < 100) throw new Error(`Refusing to close an incomplete OCR run (${before.ocrProgress}%).`);
  await evalJs(`(() => {
    const close = document.querySelector('[data-dialog-id="ocr"] [data-dialog-cancel]');
    if (!(close instanceof HTMLElement)) throw new Error('OCR Close button is missing.');
    close.click();
    return true;
  })()`);
  await waitFor(evalJs, `!document.querySelector('[data-dialog-id]')`, "the OCR dialog to close", 10_000);
  await waitFor(evalJs, `document.querySelector('.primary-tab-strip .tab.active.dirty')`, "the OCR result to become dirty", 10_000);
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'save', mode: 'save' }); true`);
  await waitFor(evalJs, `!document.querySelector('.primary-tab-strip .tab.active.dirty')`, "the OCR PDF to save", 45_000);
  await sleep(800);
  return { before, after: await inspect(evalJs) };
}

async function searchOutput(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: ${JSON.stringify(theme)} }); true`);
  await waitFor(evalJs, `document.documentElement.dataset.theme === ${JSON.stringify(theme)}`, `${theme} theme`, 10_000);
  await dismissTelemetryIfPresent(evalJs);
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'panel', panel: 'search' }); true`);
  await waitFor(evalJs, `document.querySelector('.search-box input[type="search"]')`, "text search panel", 10_000);
  await evalJs(`(() => {
    const input = document.querySelector('.search-box input[type="search"]');
    const form = input?.closest('form');
    if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) {
      throw new Error('Text search form is unavailable.');
    }
    input.value = ${JSON.stringify(query)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.requestSubmit();
    return true;
  })()`);
  await waitFor(evalJs, `document.querySelectorAll('.search-row').length > 0`, `a search result for ${query}`, 30_000);
  await evalJs(`(() => {
    const first = document.querySelector('.search-row');
    if (!(first instanceof HTMLElement)) throw new Error('No search result exists to select.');
    first.click();
    return true;
  })()`);
  await waitFor(evalJs, `document.querySelector('.search-row.selected')`, "selected search result", 10_000);
  await waitFor(evalJs, `document.querySelector('.search-hit-rect.selected')`, "selected on-page OCR search highlight", 30_000);
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'viewZoom', mode: 'fitPage' }); true`);
  await sleep(800);
  return inspect(evalJs);
}

async function searchNoMatch(evalJs) {
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: ${JSON.stringify(theme)} }); true`);
  await waitFor(evalJs, `document.documentElement.dataset.theme === ${JSON.stringify(theme)}`, `${theme} theme`, 10_000);
  await dismissTelemetryIfPresent(evalJs);
  await evalJs(`window.polyPDFAutomation.menuCommand({ type: 'panel', panel: 'search' }); true`);
  await waitFor(evalJs, `document.querySelector('.search-box input[type="search"]')`, "text search panel", 10_000);
  await evalJs(`(() => {
    const input = document.querySelector('.search-box input[type="search"]');
    const form = input?.closest('form');
    if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) {
      throw new Error('Text search form is unavailable.');
    }
    input.value = ${JSON.stringify(query)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.requestSubmit();
    return true;
  })()`);
  await waitFor(evalJs, `document.querySelector('.search-results.empty')`, `no pre-OCR match for ${query}`, 30_000);
  await sleep(600);
  return inspect(evalJs);
}

async function main() {
  const session = await connect();
  try {
    let result;
    if (action === "start") result = await startOcr(session.evalJs);
    else if (action === "wait-complete") result = await waitForOcrCompletion(session.evalJs);
    else if (action === "close-save") result = await closeAndSave(session.evalJs);
    else if (action === "search") result = await searchOutput(session.evalJs);
    else if (action === "search-no-match") result = await searchNoMatch(session.evalJs);
    else if (action === "inspect") result = await inspect(session.evalJs);
    else throw new Error(`Unknown OCR workflow action: ${action}`);
    process.stdout.write(`${JSON.stringify({ action, port, query, result }, null, 2)}\n`);
  } finally {
    session.socket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
