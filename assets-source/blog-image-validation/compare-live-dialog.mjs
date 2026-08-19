#!/usr/bin/env node
// Small CDP controller for the live Compare Documents dialog in the isolated visual-capture instance.
// Native file selection is deliberately left to the real macOS picker; this script never substitutes DOM state.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const action = argv[0] ?? "inspect";
const port = Number(valueAfter(argv, "--port") ?? 9476);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/private/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const sourcePath = valueAfter(argv, "--source");
const comparisonPath = valueAfter(argv, "--comparison");
const outputPath = valueAfter(argv, "--output");
const WebSocket = createRequire(join(appRoot, "package.json"))("ws");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function targetForPort() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((item) => item.type === "page" && !String(item.url).startsWith("devtools://"));
      if (page) return page;
    } catch {
      // The isolated app is still starting.
    }
    await sleep(100);
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
  const cdp = (method, params = {}) => {
    const messageId = ++id;
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(messageId, { resolve: resolveRequest, reject: rejectRequest });
      socket.send(JSON.stringify({ id: messageId, method, params }));
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
    if (result.exceptionDetails) throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    return result.result?.value;
  };
  return { socket, evalJs };
}

async function facts(evalJs) {
  return evalJs(`(async () => {
    const settings = await window.polyPDF.getAppSettingsInfo();
    return {
      version: settings.version,
      build: String(settings.build),
      appearance: settings.appearance,
      theme: document.documentElement.dataset.theme,
      documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
      dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
      comparisonPath: document.querySelector('[data-pdf-source="compare-b"]')?.getAttribute('data-path') ?? '',
      comparisonName: document.querySelector('[data-pdf-source="compare-b"]')?.getAttribute('data-name') ?? '',
      confirmEnabled: !(document.querySelector('[data-dialog-confirm]')?.disabled ?? true),
      revisionClouds: document.querySelectorAll('.annotation-box.revisionCloud[data-annotation-id]').length,
      annotationClasses: [...document.querySelectorAll('.annotation-box[data-annotation-id]')].map((element) => element.className),
      annotationLabels: [...document.querySelectorAll('.annotation-box[data-annotation-id]')].map((element) => element.getAttribute('aria-label') ?? element.getAttribute('title') ?? ''),
      status: document.querySelector('#footer-status')?.textContent?.trim() ?? '',
      windowMetrics: {
        screenX: window.screenX,
        screenY: window.screenY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        screenWidth: screen.width,
        screenHeight: screen.height,
        availLeft: screen.availLeft,
        availTop: screen.availTop,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      },
      visibleText: document.body.innerText.slice(0, 3000)
    };
  })()`);
}

async function main() {
  const session = await connect();
  try {
    const before = await facts(session.evalJs);
    if (action === "set-dark") {
      await session.evalJs(`(async () => {
        localStorage.setItem('polypdf.appearance', JSON.stringify({
          schemaVersion: 1,
          store: 'polypdf.appearance',
          data: 'dark'
        }, null, 2) + '\\n');
        await window.polyPDF.setAppearance('dark');
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.style.colorScheme = 'dark';
        document.body.classList.remove('appearance-light', 'appearance-system');
        document.body.classList.add('appearance-dark');
        return true;
      })()`);
      await sleep(200);
      process.stdout.write(`${JSON.stringify({ action, before, after: await facts(session.evalJs) }, null, 2)}\n`);
      return;
    }
    if (before.version !== "1.3.4" || before.build !== "16" || before.appearance !== "dark" || before.theme !== "dark") {
      throw new Error(`Wrong app identity or theme: ${JSON.stringify(before)}`);
    }
    if (action === "open-picker") {
      await session.evalJs(`window.polyPDFAutomation.menuCommand({ type: 'documentDialog', dialog: 'compareDocuments' }); true`);
      await session.evalJs(`new Promise((resolveWait, rejectWait) => {
        const deadline = Date.now() + 7000;
        const poll = () => {
          const root = document.querySelector('[data-dialog-id="compareDocuments"]');
          const browse = root?.querySelector('[data-pick-pdf="compare-b"]');
          if (browse instanceof HTMLElement) {
            browse.click();
            resolveWait(true);
            return;
          }
          if (Date.now() >= deadline) return rejectWait(new Error('Compare Documents dialog did not open.'));
          setTimeout(poll, 50);
        };
        poll();
      })`);
    } else if (action === "confirm") {
      await session.evalJs(`new Promise((resolveWait, rejectWait) => {
        const deadline = Date.now() + 7000;
        const poll = () => {
          const root = document.querySelector('[data-dialog-id="compareDocuments"]');
          const picked = root?.querySelector('[data-pdf-source="compare-b"][data-path]');
          const confirm = root?.querySelector('[data-dialog-confirm]');
          if (picked instanceof HTMLElement && confirm instanceof HTMLButtonElement && !confirm.disabled) {
            confirm.click();
            resolveWait(true);
            return;
          }
          if (Date.now() >= deadline) return rejectWait(new Error('Compare input selection did not become confirmable.'));
          setTimeout(poll, 50);
        };
        poll();
      })`);
    } else if (action === "dismiss-dialog") {
      await session.evalJs(`(() => {
        const cancel = document.querySelector('[data-dialog-cancel]');
        if (!(cancel instanceof HTMLElement)) throw new Error('No dismissible dialog is open.');
        cancel.click();
        return true;
      })()`);
    } else if (action === "generate-artifact") {
      if (!sourcePath || !comparisonPath || !outputPath) {
        throw new Error("generate-artifact requires --source, --comparison, and --output.");
      }
      const generated = await session.evalJs(`(async () => {
        const sourcePath = ${JSON.stringify(sourcePath)};
        const comparisonPath = ${JSON.stringify(comparisonPath)};
        const opened = await window.polyPDF.readPdfBytes(sourcePath);
        if (!opened.ok) throw new Error(opened.message ?? 'Could not read Compare source bytes.');
        const result = await window.polyPDF.compareDocumentsPdf({
          bytes: opened.bytes,
          comparisonPath,
          sourceName: 'compare-rev-a.pdf',
          output: 'markups'
        });
        if (!result.ok) throw new Error(result.message ?? 'Compare engine did not produce an artifact.');
        const bytes = new Uint8Array(result.bytes);
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 0x4000) {
          binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + 0x4000)));
        }
        return {
          base64: btoa(binary),
          comparedPageCount: result.comparedPageCount,
          differenceCount: result.differenceCount,
          usedRasterDiff: result.usedRasterDiff,
          editableClouds: result.editableClouds,
          byteLength: bytes.byteLength
        };
      })()`);
      await writeFile(resolve(outputPath), Buffer.from(generated.base64, "base64"));
      delete generated.base64;
      process.stdout.write(`${JSON.stringify({ action, sourcePath, comparisonPath, outputPath: resolve(outputPath), result: generated }, null, 2)}\n`);
      return;
    }
    await sleep(200);
    process.stdout.write(`${JSON.stringify({ action, before, after: await facts(session.evalJs) }, null, 2)}\n`);
  } finally {
    session.socket.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
