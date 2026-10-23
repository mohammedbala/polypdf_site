#!/usr/bin/env node
// Evaluate an explicit JavaScript file inside an isolated PolyPDF renderer over CDP.
// The app must be launched and torn down with automation-instance.mjs.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const argv = process.argv.slice(2);
const port = Number(valueAfter(argv, "--port") ?? 9431);
const appRoot = resolve(valueAfter(argv, "--app-root") ?? "/tmp/polypdf-blog-captures-PCzoem/src/polypdf");
const scriptPath = valueAfter(argv, "--script");
if (!scriptPath) throw new Error("Usage: app-eval.mjs --port <port> --script <expression.js>");

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
      // Wait for the private Electron renderer.
    }
    await sleep(250);
  }
  throw new Error(`No PolyPDF page target appeared on CDP port ${port}.`);
}

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

function cdp(method, params = {}) {
  const id = ++messageId;
  return new Promise((resolveRequest, rejectRequest) => {
    pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await cdp("Runtime.enable");
  const expression = await readFile(resolve(scriptPath), "utf8");
  const result = await cdp("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error(`PolyPDF evaluation failed: ${JSON.stringify(result.exceptionDetails).slice(0, 1600)}`);
  }
  process.stdout.write(`${JSON.stringify(result.result?.value ?? null, null, 2)}\n`);
} finally {
  socket.close();
}
