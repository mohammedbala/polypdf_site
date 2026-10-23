#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

const execFile = promisify(execFileCallback);
const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const stateName = valueAfter("--state");
const pngPath = resolve(valueAfter("--png") ?? "");
const port = Number(valueAfter("--port", "9507"));
const appRoot = resolve(valueAfter("--app-root", "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf"));
const userData = resolve(valueAfter("--user-data", "/private/tmp/polypdf-plugin-current-dev-UDkryF"));
const expectedBase = "a0a709c39e35343d3c71f7d615fedffb007db619";
const expectedDiff = "8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250";
const validStates = new Set(["plugin-sidebar", "plugin-generator", "plugin-inserted", "mutcd-regulatory", "mutcd-stop-placed"]);
if (!pngPath || !validStates.has(stateName)) {
  throw new Error("usage: plugin-current-dev-capture-proof.mjs --state <plugin-sidebar|plugin-generator|plugin-inserted|mutcd-regulatory|mutcd-stop-placed> --png <capture.png> [--port 9507] [--app-root PATH] [--user-data PATH]");
}

const requireFromApp = createRequire(join(appRoot, "package.json"));
const WebSocket = requireFromApp("ws");
const { PNG } = requireFromApp("pngjs");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readSha256 = async (path) => sha256(await readFile(path));

async function pageTarget() {
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

async function rendererEvidence() {
  const target = await pageTarget();
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
    return await evaluate(`(async () => {
      const settings = await window.polyPDF.getAppSettingsInfo();
      const visible = (node) => node instanceof HTMLElement && node.offsetParent !== null;
      const rect = (node) => {
        const value = node?.getBoundingClientRect();
        return value ? { x: value.x, y: value.y, width: value.width, height: value.height } : null;
      };
      const toolbar = document.querySelector('.style-toolbar');
      const track = toolbar?.querySelector('[data-style-toolbar-track]');
      const dialog = document.querySelector('[data-dialog-id]');
      const controls = dialog ? [...dialog.querySelectorAll('input, select, textarea')].map((control) => ({
        tag: control.tagName.toLowerCase(),
        id: control.id,
        name: control.getAttribute('name') ?? '',
        type: control.getAttribute('type') ?? '',
        value: control.value,
        selectedText: control instanceof HTMLSelectElement ? control.selectedOptions[0]?.textContent?.trim() ?? '' : '',
        checked: control instanceof HTMLInputElement ? control.checked : undefined,
        visible: visible(control)
      })) : [];
      const annotations = window.polyPDFAutomation.annotations();
      const aisc = annotations.find((item) => item.id === 'aisc-W24X55-profile');
      const aiscNode = document.querySelector('[data-annotation-id="aisc-W24X55-profile"]');
      const stop = annotations.find((item) => item.label === 'R1-1 Stop' && item.tool === 'imageStamp');
      const stopNode = stop ? document.querySelector('[data-annotation-id="' + CSS.escape(stop.id) + '"]') : null;
      const regulatory = document.querySelector('[data-toolchest-id="builtin-mutcd-regulatory"]');
      const regulatoryCards = regulatory ? [...regulatory.querySelectorAll('.toolchest-preview-card')] : [];
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        settings: { version: settings.version, build: String(settings.build), appearance: settings.appearance },
        theme: {
          datasetTheme: document.documentElement.dataset.theme,
          bodyDark: document.body.classList.contains('appearance-dark'),
          prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
          chromeBase: rootStyle.getPropertyValue('--chrome-base').trim(),
          chromeElevated: rootStyle.getPropertyValue('--chrome-elevated').trim()
        },
        geometry: {
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
        },
        styleToolbar: {
          exists: Boolean(toolbar),
          visible: visible(toolbar),
          sectionCount: track?.querySelectorAll('[data-style-section]').length ?? 0,
          clientWidth: track?.clientWidth ?? 0,
          scrollWidth: track?.scrollWidth ?? 0,
          scrollLeft: track?.scrollLeft ?? 0,
          overflowClass: Boolean(toolbar?.classList.contains('has-style-toolbar-overflow')),
          rect: rect(toolbar)
        },
        documentName: document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '',
        activePanel: document.querySelector('.rail-button.active')?.getAttribute('data-panel') ?? '',
        visiblePanelText: document.querySelector('.sidebar-content')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        dialog: dialog ? {
          id: dialog.getAttribute('data-dialog-id') ?? '',
          visible: visible(dialog),
          rect: rect(dialog),
          text: dialog.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
          controls
        } : null,
        aiscAnnotation: aisc ?? null,
        aiscDom: aiscNode ? { visible: visible(aiscNode), selected: aiscNode.classList.contains('selected'), rect: rect(aiscNode) } : null,
        stopAnnotation: stop ?? null,
        stopDom: stopNode ? { visible: visible(stopNode), selected: stopNode.classList.contains('selected'), rect: rect(stopNode) } : null,
        mutcd: regulatory ? {
          name: regulatory.querySelector('.toolchest-toolset-name')?.textContent?.trim() ?? '',
          expanded: regulatory.querySelector('.toolchest-toolset-header')?.getAttribute('aria-expanded') === 'true',
          collapsed: regulatory.classList.contains('collapsed'),
          cardCount: regulatoryCards.length,
          renderedImageCount: regulatory.querySelectorAll('.toolchest-item-preview img').length,
          firstCards: regulatoryCards.slice(0, 12).map((card) => ({
            ariaLabel: card.getAttribute('aria-label') ?? '',
            title: card.getAttribute('title') ?? '',
            imageAlt: card.querySelector('img')?.getAttribute('alt') ?? '',
            visible: visible(card),
            rect: rect(card)
          })),
          rect: rect(regulatory)
        } : null
      };
    })()`);
  } finally {
    socket.close();
  }
}

function isExpectedAisc(annotation) {
  return Boolean(
    annotation
    && annotation.id === "aisc-W24X55-profile"
    && annotation.tool === "polygon"
    && annotation.label === "W24×55"
    && annotation.strokeColor === "#1a4d8f"
    && annotation.lineWidth === 2
    && annotation.pluginProvenance?.pluginId === "com.polypdf.steel-sections"
    && annotation.pluginProvenance?.pluginVersion === "1.0.6"
    && annotation.pluginProvenance?.generatorId === "aisc-steel-section/v1"
    && annotation.pluginProvenance?.dataVersion === "AISC-v16.0"
    && annotation.pluginProvenance?.parameters?.designation === "W24X55"
    && annotation.pluginProvenance?.parameters?.unitSystem === "customary"
    && annotation.pluginProvenance?.parameters?.drawingScale === `1" = 1'-0"`
    && annotation.pluginProvenance?.parameters?.lineWidth === 2
    && annotation.pluginProvenance?.parameters?.strokeColor === "#1a4d8f"
  );
}

function stateAssertions(renderer) {
  const assertions = {};
  if (stateName === "plugin-sidebar") {
    assertions.activePluginPanel = renderer.activePanel === "plugins";
    assertions.noDialog = renderer.dialog === null;
    assertions.aiscCard = renderer.visiblePanelText.includes("AISC Steel Sections") && renderer.visiblePanelText.includes("v1.0.6");
    assertions.mapsCard = renderer.visiblePanelText.includes("PDF Maps") && renderer.visiblePanelText.includes("v1.0.3");
    assertions.sealCard = renderer.visiblePanelText.includes("Professional Seal Maker") && renderer.visiblePanelText.includes("v1.0.7");
    assertions.commandNames = renderer.visiblePanelText.includes("Insert AISC Steel Section")
      && renderer.visiblePanelText.includes("Insert Map")
      && renderer.visiblePanelText.includes("Insert Professional Seal");
  } else if (stateName === "plugin-generator") {
    const visibleControls = renderer.dialog?.controls?.filter((control) => control.visible) ?? [];
    const selections = visibleControls.map((control) => control.selectedText || control.value);
    assertions.activePluginPanel = renderer.activePanel === "plugins";
    assertions.dialogVisible = Boolean(renderer.dialog?.visible);
    assertions.dialogIdentity = renderer.dialog?.text?.includes("Insert AISC Steel Section")
      && renderer.dialog?.text?.includes("com.polypdf.steel-sections")
      && renderer.dialog?.text?.includes("v1.0.6");
    assertions.designation = selections.includes("W24×55") || selections.includes("W24X55");
    assertions.units = selections.some((value) => /Customary/.test(value));
    assertions.drawingScale = selections.includes(`1" = 1'-0"`);
    assertions.lineWidth = selections.includes("2");
    assertions.color = selections.includes("Blue") || selections.includes("#1a4d8f");
    assertions.previewAndInsert = renderer.dialog?.text?.includes("Line weight")
      && renderer.dialog?.text?.includes("Color")
      && renderer.dialog?.text?.includes("Insert");
  } else if (stateName === "plugin-inserted") {
    assertions.activePluginPanel = renderer.activePanel === "plugins";
    assertions.noDialog = renderer.dialog === null;
    assertions.genuinePluginProvenance = isExpectedAisc(renderer.aiscAnnotation);
    assertions.visibleSelectedOutput = Boolean(renderer.aiscDom?.visible && renderer.aiscDom?.selected);
    assertions.outputInsideFixture = Boolean(
      renderer.aiscDom?.rect
      && renderer.aiscDom.rect.x >= 560
      && renderer.aiscDom.rect.x <= 700
      && renderer.aiscDom.rect.y >= 430
      && renderer.aiscDom.rect.y <= 510
    );
  } else if (stateName === "mutcd-regulatory") {
    assertions.activeToolsPanel = renderer.activePanel === "toolchests";
    assertions.regulatoryExpanded = Boolean(renderer.mutcd?.expanded && !renderer.mutcd?.collapsed);
    assertions.regulatoryName = renderer.mutcd?.name === "MUTCD Regulatory";
    assertions.allRegulatoryCardsLoaded = renderer.mutcd?.cardCount === 435;
    assertions.stopAndYieldFirst = renderer.mutcd?.firstCards?.[0]?.imageAlt === "R1-1 Stop"
      && renderer.mutcd?.firstCards?.[1]?.imageAlt === "R1-2 Yield";
    assertions.signPreviewsRendered = Number(renderer.mutcd?.renderedImageCount ?? 0) >= 12;
    assertions.genuineSelectedPluginOutputAlsoVisible = isExpectedAisc(renderer.aiscAnnotation)
      && Boolean(renderer.aiscDom?.visible && renderer.aiscDom?.selected);
  } else if (stateName === "mutcd-stop-placed") {
    assertions.activeToolsPanel = renderer.activePanel === "toolchests";
    assertions.regulatoryExpanded = Boolean(renderer.mutcd?.expanded && !renderer.mutcd?.collapsed);
    assertions.allRegulatoryCardsLoaded = renderer.mutcd?.cardCount === 435;
    assertions.stopSourceCardVisible = renderer.mutcd?.firstCards?.[0]?.imageAlt === "R1-1 Stop"
      && renderer.mutcd?.firstCards?.[0]?.visible === true;
    assertions.genuineStopAnnotation = Boolean(
      renderer.stopAnnotation
      && renderer.stopAnnotation.kind === "text"
      && renderer.stopAnnotation.tool === "imageStamp"
      && renderer.stopAnnotation.label === "R1-1 Stop"
      && renderer.stopAnnotation.imageFilename === "mutcd/R01-01.pdf"
      && renderer.stopAnnotation.x === 360
      && renderer.stopAnnotation.y === 306
      && renderer.stopAnnotation.width === 72
      && renderer.stopAnnotation.height === 72
    );
    assertions.stopVisibleAndSelected = Boolean(renderer.stopDom?.visible && renderer.stopDom?.selected);
    assertions.stopClearlyPlacedOnFixture = Boolean(
      renderer.stopDom?.rect
      && renderer.stopDom.rect.width >= 90
      && renderer.stopDom.rect.height >= 90
      && renderer.stopDom.rect.x >= 900
      && renderer.stopDom.rect.x <= 1100
      && renderer.stopDom.rect.y >= 450
      && renderer.stopDom.rect.y <= 700
    );
  }
  return assertions;
}

const automationRecordPath = join(userData, "automation-instance.json");
const automationRecord = JSON.parse(await readFile(automationRecordPath, "utf8"));
const renderer = await rendererEvidence();
const pngBytes = await readFile(pngPath);
const png = PNG.sync.read(pngBytes);
const themeProofPath = `${pngPath}.theme-proof.json`;
const themeProof = JSON.parse(await readFile(themeProofPath, "utf8"));
const { stdout: cgWindowStdout } = await execFile("/usr/bin/swift", [
  join(dirname(new URL(import.meta.url).pathname), "plugin-current-dev-cgwindow.swift"),
  String(automationRecord.pid)
], { maxBuffer: 4 * 1024 * 1024 });
const cgWindow = JSON.parse(cgWindowStdout);
const { stdout: headStdout } = await execFile("git", ["rev-parse", "HEAD"], { cwd: appRoot });
const { stdout: diffStdout } = await execFile("git", ["diff", "--binary"], {
  cwd: appRoot,
  encoding: "buffer",
  maxBuffer: 64 * 1024 * 1024
});
const { stdout: processCommand } = await execFile("ps", ["-p", String(automationRecord.pid), "-o", "command="]);
const mutcdFixturePath = "/Users/mohammedbala/Projects/polypdf_site-organic-guides/assets-source/blog-image-validation/fixtures/mutcd-r1-1-reference-sheet.pdf";
const mutcdFixtureBuilderPath = "/Users/mohammedbala/Projects/polypdf_site-organic-guides/assets-source/blog-image-validation/mutcd-generate-reference-fixture.py";
const { stdout: mutcdFixtureText } = await execFile("pdftotext", [mutcdFixturePath, "-"]);
const source = {
  appRoot,
  baseCommit: headStdout.trim(),
  workingTreeDiffSha256: sha256(diffStdout),
  expectedBaseCommit: expectedBase,
  expectedWorkingTreeDiffSha256: expectedDiff,
  rendererBundle: {
    path: join(appRoot, "dist/renderer/app.js"),
    sha256: await readSha256(join(appRoot, "dist/renderer/app.js"))
  },
  mainBundle: {
    path: join(appRoot, "dist/main/main.js"),
    sha256: await readSha256(join(appRoot, "dist/main/main.js"))
  },
  captureDriver: {
    path: join(dirname(new URL(import.meta.url).pathname), "capture-driver.mjs"),
    sha256: await readSha256(join(dirname(new URL(import.meta.url).pathname), "capture-driver.mjs")),
    noEmulationMechanism: "Emulation.clearDeviceMetricsOverride before native maximize and Page.captureScreenshot"
  },
  mutcdProvenance: {
    readmePath: join(appRoot, "scripts/mutcd-signs-source/README.md"),
    readmeSha256: await readSha256(join(appRoot, "scripts/mutcd-signs-source/README.md")),
    signIndexPath: join(appRoot, "scripts/mutcd-signs-source/sign-index.json"),
    signIndexSha256: await readSha256(join(appRoot, "scripts/mutcd-signs-source/sign-index.json")),
    officialReleaseStatusUrl: "https://mutcd.fhwa.dot.gov/kno-shs_2024-release-status/index.htm",
    sourceStatement: "FHWA Standard Highway Signs 2024, Releases 1–6; U.S. Government work per the repository source record."
  },
  mutcdFixture: {
    path: mutcdFixturePath,
    sha256: await readSha256(mutcdFixturePath),
    builderPath: mutcdFixtureBuilderPath,
    builderSha256: await readSha256(mutcdFixtureBuilderPath),
    extractedTextSha256: sha256(Buffer.from(mutcdFixtureText)),
    contextLabels: [
      "OWNED TRAFFIC-CONTROL FIXTURE",
      "MUTCD REGULATORY SIGN",
      "R1-1 STOP DEMONSTRATION",
      "R1-1 PLACEMENT TARGET",
      "FICTIONAL DEMONSTRATION"
    ]
  }
};

const nativeWindow = cgWindow.windows.find((window) =>
  window.onScreen
  && window.layer === 0
  && window.bounds?.x === 0
  && window.bounds?.y === 34
  && window.bounds?.width === 1710
  && window.bounds?.height === 1073
);
const assertions = {
  exactSourceCommit: source.baseCommit === expectedBase,
  exactTrackedDiff: source.workingTreeDiffSha256 === expectedDiff,
  exactOwnedRootPID: automationRecord.pid === 64240,
  exactOwnedUserData: automationRecord.userData === userData,
  expectedFixtureOpened: automationRecord.argv?.includes("/Users/mohammedbala/Projects/polypdf_site-organic-guides/assets-source/blog-image-validation/fixtures/plugin-reference-sheet.pdf"),
  processAliveAtProof: processCommand.trim().length > 0,
  appVersion: renderer.settings.version === "1.3.4" && renderer.settings.build === "16",
  darkAppSetting: renderer.settings.appearance === "dark",
  darkRenderer: renderer.theme.datasetTheme === "dark"
    && renderer.theme.bodyDark
    && renderer.theme.prefersDark
    && renderer.theme.chromeBase === "#26282b"
    && renderer.theme.chromeElevated === "#313437",
  rendererNativeGeometry: renderer.geometry.outerWidth === 1710
    && renderer.geometry.outerHeight === 1073
    && renderer.geometry.innerWidth === 1710
    && renderer.geometry.innerHeight === 1073
    && renderer.geometry.screenX === 0
    && renderer.geometry.screenY === 34
    && renderer.geometry.availWidth === 1710
    && renderer.geometry.availHeight === 1073
    && renderer.geometry.devicePixelRatio === 2,
  cgWindowNativeGeometry: Boolean(nativeWindow),
  cgWindowOwnedByExactPID: Boolean(nativeWindow?.ownerPID === automationRecord.pid && nativeWindow?.ownerName === "PolyPDF"),
  screenshotExactPhysicalDimensions: png.width === 3420 && png.height === 2146,
  screenshotMatchesNativeDpr: png.width === renderer.geometry.innerWidth * renderer.geometry.devicePixelRatio
    && png.height === renderer.geometry.innerHeight * renderer.geometry.devicePixelRatio,
  themeProofPassed: themeProof.pixelProof?.passes === true
    && themeProof.windowProof?.passes === true
    && themeProof.facts?.appAppearance === "dark"
    && themeProof.source?.baseCommit === expectedBase
    && themeProof.source?.workingTreeDiffSha256 === expectedDiff,
  fullStyleToolbarVisible: renderer.styleToolbar.exists
    && renderer.styleToolbar.visible
    && renderer.styleToolbar.sectionCount >= (
      stateName === "mutcd-stop-placed" ? 2
        : stateName === "plugin-sidebar" ? 3
          : 4
    ),
  noStyleToolbarOverflow: !renderer.styleToolbar.overflowClass
    && renderer.styleToolbar.scrollLeft === 0
    && renderer.styleToolbar.scrollWidth <= renderer.styleToolbar.clientWidth + 2,
  correctOwnedFixture: renderer.documentName === (stateName === "mutcd-stop-placed"
    ? "mutcd-r1-1-reference-sheet.pdf"
    : "plugin-reference-sheet.pdf"),
  contextCorrectMutcdFixture: stateName !== "mutcd-stop-placed" || [
    "OWNED TRAFFIC-CONTROL FIXTURE",
    "MUTCD REGULATORY SIGN",
    "R1-1 STOP DEMONSTRATION",
    "R1-1 PLACEMENT TARGET",
    "FICTIONAL DEMONSTRATION"
  ].every((label) => mutcdFixtureText.includes(label)),
  ...stateAssertions(renderer)
};
const failedAssertions = Object.entries(assertions).filter(([, passed]) => passed !== true).map(([name]) => name);
const payload = {
  schema: "polypdf-blog-current-dev-capture-proof/v1",
  state: stateName,
  capturedImage: {
    path: pngPath,
    filename: basename(pngPath),
    sha256: sha256(pngBytes),
    width: png.width,
    height: png.height,
    themeProofPath,
    themeProofCapturedAt: themeProof.capturedAt
  },
  proofCapturedAt: new Date().toISOString(),
  source,
  ownedInstance: {
    automationRecordPath,
    ...automationRecord,
    processCommand: processCommand.trim()
  },
  renderer,
  cgWindow,
  assertions,
  failedAssertions,
  passes: failedAssertions.length === 0
};
const proofPath = `${pngPath}.capture-proof.json`;
await writeFile(proofPath, `${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ proofPath, passes: payload.passes, failedAssertions, screenshotSha256: payload.capturedImage.sha256, cgWindow: nativeWindow }, null, 2)}\n`);
if (!payload.passes) process.exitCode = 1;
