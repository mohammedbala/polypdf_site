#!/usr/bin/env node
// Narrow CDP helper for capturing truthful signature UI states from an isolated PolyPDF instance.
import { createRequire } from "node:module";
import { join } from "node:path";

const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const action = argv[0] ?? "inspect";
const port = Number(valueAfter("--port", "9481"));
const appRoot = valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf");
const requestedSealScale = valueAfter("--scale", "0.72");
const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function target() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
      // Keep polling until the isolated app exposes its page target.
    }
    await sleep(250);
  }
  throw new Error(`No PolyPDF page target appeared on port ${port}.`);
}

async function main() {
  const page = await target();
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
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
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
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

  let result;
  if (action === "inspect") {
    result = await evaluate(`(() => ({
      dialog: document.querySelector("[data-dialog-id]")?.getAttribute("data-dialog-id") ?? "",
      dialogText: document.querySelector("[data-dialog-id]")?.textContent?.trim() ?? "",
      activePanel: document.querySelector(".rail-button.active")?.getAttribute("data-panel") ?? "",
      panelText: document.querySelector(".sidebar-panel:not([hidden])")?.textContent?.trim() ?? "",
      buttons: [...document.querySelectorAll("button")].filter((button) => button.offsetParent).map((button) => ({
        text: button.textContent?.trim() ?? "",
        aria: button.getAttribute("aria-label") ?? "",
        title: button.getAttribute("title") ?? "",
        cls: button.className,
        attrs: Object.fromEntries([...button.attributes].filter((attribute) => attribute.name.startsWith("data-")).map((attribute) => [attribute.name, attribute.value]))
      })),
      controls: [...document.querySelectorAll("input, select, textarea")].filter((control) => control.offsetParent).map((control) => ({
        tag: control.tagName,
        id: control.id,
        name: control.getAttribute("name") ?? "",
        type: control.getAttribute("type") ?? "",
        value: control.value,
        checked: control instanceof HTMLInputElement ? control.checked : undefined,
        options: control instanceof HTMLSelectElement ? [...control.options].map((option) => ({ value: option.value, text: option.textContent?.trim() ?? "", selected: option.selected })) : undefined
      }))
    }))()`);
  } else if (action === "inspect-signature-dom") {
    result = await evaluate(`(() => {
      const nodes = [...document.querySelectorAll("*")].filter((node) => /Signature is valid with later changes/i.test(node.textContent ?? ""));
      return nodes.slice(-8).map((node) => ({
        tag: node.tagName,
        cls: node.className,
        text: node.textContent?.trim().slice(0, 500) ?? "",
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
        overflowY: getComputedStyle(node).overflowY
      }));
    })()`);
  } else if (action === "dismiss-consent") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="telemetryConsent"]');
      if (!root) return { dismissed: false, reason: "not-open" };
      const button = [...root.querySelectorAll("button")].find((candidate) => /not now|decline|continue|confirm|ok/i.test(candidate.textContent ?? ""));
      if (!(button instanceof HTMLElement)) throw new Error("Telemetry consent action was not found.");
      const text = button.textContent?.trim() ?? "";
      button.click();
      return { dismissed: true, text };
    })()`);
  } else if (action === "open-signatures") {
    result = await evaluate(`(() => {
      const button = document.querySelector('.rail-button[data-panel="signatures"]');
      if (!(button instanceof HTMLElement)) throw new Error("Signatures rail button was not found.");
      button.click();
      return { opened: true };
    })()`);
  } else if (action === "scroll-signature-details") {
    result = await evaluate(`(() => {
      const target = [...document.querySelectorAll(".signature-detail-card")].find((node) => /Signature is valid with later changes/i.test(node.textContent ?? ""));
      if (!(target instanceof HTMLElement)) throw new Error("Validated signature card was not found.");
      let scroller = target.parentElement;
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) {
        scroller = scroller.parentElement;
      }
      if (!(scroller instanceof HTMLElement)) throw new Error("Signature sidebar scroller was not found.");
      scroller.scrollTop = Math.max(0, target.offsetTop - 18);
      return {
        scrolled: true,
        scrollTop: scroller.scrollTop,
        cardText: target.textContent?.trim() ?? ""
      };
    })()`);
  } else if (action === "show-signature-technical") {
    result = await evaluate(`(() => {
      const target = [...document.querySelectorAll(".signature-detail-card")].find((node) => /Signature is valid with later changes/i.test(node.textContent ?? ""));
      if (!(target instanceof HTMLElement)) throw new Error("Validated signature card was not found.");
      const details = target.querySelector("details");
      if (!(details instanceof HTMLDetailsElement)) throw new Error("Signature technical details were not found.");
      details.open = true;
      let scroller = target.parentElement;
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) {
        scroller = scroller.parentElement;
      }
      if (!(scroller instanceof HTMLElement)) throw new Error("Signature sidebar scroller was not found.");
      scroller.scrollTop = Math.max(0, details.offsetTop - 86);
      return {
        opened: details.open,
        scrollTop: scroller.scrollTop,
        text: details.textContent?.trim() ?? ""
      };
    })()`);
  } else if (action === "hide-signature-technical") {
    result = await evaluate(`(() => {
      const target = [...document.querySelectorAll(".signature-detail-card")].find((node) => /Signature is valid with later changes/i.test(node.textContent ?? ""));
      if (!(target instanceof HTMLElement)) throw new Error("Validated signature card was not found.");
      const details = target.querySelector("details");
      if (!(details instanceof HTMLDetailsElement)) throw new Error("Signature technical details were not found.");
      details.open = false;
      let scroller = target.parentElement;
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) {
        scroller = scroller.parentElement;
      }
      if (!(scroller instanceof HTMLElement)) throw new Error("Signature sidebar scroller was not found.");
      scroller.scrollTop = Math.max(0, target.offsetTop - 18);
      return { closed: !details.open, scrollTop: scroller.scrollTop };
    })()`);
  } else if (action === "open-visual-chooser") {
    result = await evaluate(`(() => {
      const candidates = [...document.querySelectorAll("button")].filter((button) => button.offsetParent && /^Sign…?$/.test(button.textContent?.trim() ?? ""));
      const button = candidates.at(-1);
      if (!(button instanceof HTMLElement)) throw new Error("Visible Sign action was not found.");
      const text = button.textContent?.trim() ?? "";
      button.click();
      return { opened: true, text };
    })()`);
  } else if (action === "open-seal-dialog") {
    result = await evaluate(`(() => {
      const button = [...document.querySelectorAll("button.plugin-panel-run")].find((candidate) => /Insert Professional Seal/i.test(candidate.textContent ?? ""));
      if (!(button instanceof HTMLElement)) throw new Error("Professional Seal command was not found in the Plugins panel.");
      const text = button.textContent?.trim() ?? "";
      button.click();
      return { opened: true, text };
    })()`);
  } else if (action === "open-plugins") {
    result = await evaluate(`(() => {
      const button = document.querySelector('.rail-button[data-panel="plugins"]');
      if (!(button instanceof HTMLElement)) throw new Error("Plugins rail button was not found.");
      button.click();
      return { opened: true };
    })()`);
    await sleep(900);
  } else if (action === "fill-seal-test") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="pluginGenerator"], .plugin-sidebar-editor');
      if (!(root instanceof HTMLElement)) throw new Error("Professional Seal dialog is not open.");
      const setValue = (selector, value) => {
        const control = root.querySelector(selector);
        if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) throw new Error("Missing seal control " + selector);
        control.value = value;
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue("#plugin-field-profession", "engineer");
      setValue("#plugin-field-jurisdiction", "us-ca");
      setValue("#plugin-field-licenseNumber", "00000000");
      setValue("#plugin-field-name", "TEST NOT VALID");
      setValue("#plugin-field-discipline", "civil");
      setValue("#plugin-field-city", "DEMO");
      setValue("#plugin-field-sealScale", ${JSON.stringify(requestedSealScale)});
      (root.querySelector(".app-dialog-body, .plugin-sidebar-editor-body") ?? root).scrollTo?.({ top: 0, behavior: "instant" });
      return {
        filled: true,
        warningPresent: /graphic, not a cryptographic signature/i.test(root.textContent ?? ""),
        values: Object.fromEntries([...root.querySelectorAll("input[id^='plugin-field-'], select[id^='plugin-field-']")].map((control) => [control.id, control.value]))
      };
    })()`);
  } else if (action === "insert-seal-test") {
    result = await evaluate(`(() => {
      const root = document.querySelector('[data-dialog-id="pluginGenerator"], .plugin-sidebar-editor');
      if (!(root instanceof HTMLElement)) throw new Error("Professional Seal dialog is not open.");
      const button = root.querySelector("[data-dialog-confirm], .plugin-sidebar-editor-confirm");
      if (!(button instanceof HTMLButtonElement)) throw new Error("Professional Seal Insert button was not found.");
      button.click();
      return { requested: true };
    })()`);
    await sleep(1800);
    result = await evaluate(`(() => ({
      dialog: document.querySelector("[data-dialog-id]")?.getAttribute("data-dialog-id") ?? "",
      status: document.querySelector("#footer-status")?.textContent?.trim() ?? "",
      visibleAnnotations: [...document.querySelectorAll(".annotation-box")].filter((node) => node instanceof HTMLElement && node.offsetParent).map((node) => ({
        id: node.getAttribute("data-annotation-id") ?? "",
        cls: node.className,
        text: node.textContent?.trim() ?? "",
        imageCount: node.querySelectorAll("img").length
      }))
    }))()`);
  } else if (action === "move-seal-right") {
    const geometry = await evaluate(`(() => {
      const annotation = document.querySelector(".annotation-box.imageStamp.selected");
      const page = annotation?.closest(".page-shell");
      if (!(annotation instanceof HTMLElement) || !(page instanceof HTMLElement)) throw new Error("Selected seal annotation/page was not found.");
      const annotationRect = annotation.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      return {
        startX: annotationRect.left + annotationRect.width / 2,
        startY: annotationRect.top + annotationRect.height / 2,
        targetX: pageRect.left + pageRect.width * (5 / 6),
        targetY: pageRect.top + pageRect.height * 0.49,
        annotationRect: { x: annotationRect.x, y: annotationRect.y, width: annotationRect.width, height: annotationRect.height },
        pageRect: { x: pageRect.x, y: pageRect.y, width: pageRect.width, height: pageRect.height }
      };
    })()`);
    await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: geometry.startX, y: geometry.startY });
    await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: geometry.startX, y: geometry.startY, button: "left", buttons: 1, clickCount: 1 });
    for (let step = 1; step <= 12; step += 1) {
      const progress = step / 12;
      await cdp("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: geometry.startX + (geometry.targetX - geometry.startX) * progress,
        y: geometry.startY + (geometry.targetY - geometry.startY) * progress,
        button: "left",
        buttons: 1
      });
    }
    await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: geometry.targetX, y: geometry.targetY, button: "left", buttons: 0, clickCount: 1 });
    await sleep(700);
    result = await evaluate(`(() => {
      const annotation = document.querySelector(".annotation-box.imageStamp.selected");
      if (!(annotation instanceof HTMLElement)) throw new Error("Seal selection disappeared after drag.");
      const rect = annotation.getBoundingClientRect();
      return { moved: true, before: ${JSON.stringify(geometry)}, after: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
    })()`);
  } else {
    throw new Error(`Unknown signature action: ${action}`);
  }
  await sleep(700);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  socket.close();
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
