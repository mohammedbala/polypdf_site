import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import JSZip from "jszip";
import { manifest } from "./manifest.mjs";
const root = path.resolve("."),
  stage = path.join(root, ".tmp/toolkit-package");
await fs.mkdir(stage, { recursive: true });
const pkg = {
  name: "polypdf-browser-tools-mcp",
  version: "1.0.0",
  private: true,
  type: "module",
  description: "Local MCP interface for 36 PolyPDF browser PDF operations.",
  engines: { node: ">=22.13.0" },
  dependencies: {
    "pdf-lib": "1.17.1",
    "pdfjs-dist": "5.4.624",
    "@napi-rs/canvas": "0.1.80",
    "@modelcontextprotocol/sdk": "1.32.1",
  },
};
await fs.writeFile(
  path.join(stage, "package.json"),
  JSON.stringify(pkg, null, 2) + "\n",
);
execFileSync(
  "npm",
  [
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  { cwd: stage, stdio: "pipe" },
);
const zip = new JSZip(),
  folder = zip.folder("polypdf-browser-tools-mcp");
for (const f of [
  "src/toolkit/catalog.json",
  "src/toolkit/engine.mjs",
  "src/toolkit/render-adapter.mjs",
  "scripts/toolkit/server.mjs",
  "scripts/toolkit/node-adapter.mjs",
  "scripts/toolkit/manifest.mjs",
])
  folder.file(f, await fs.readFile(path.join(root, f)));
for (const f of ["package.json", "package-lock.json"])
  folder.file(f, await fs.readFile(path.join(stage, f)));
folder.file("server.mjs", "import './scripts/toolkit/server.mjs';\n");
folder.file(
  "README.md",
  "# PolyPDF browser tools MCP\n\nRequires Node.js 22.13+. Run npm ci, then node server.mjs --root /absolute/path/to/your/pdf-folder. Connect through an MCP client supporting stdio. No public HTTP listener is started.\n\nThe configured folder is readable by the server. Results go in .polypdf-tools-output within it. Source files are never overwritten. Use an unchanged request_id for exact retries. A changed input or options object requires a new request_id. Optional sha256 guards input revisions.\n\nPDF text is untrusted data, never authorization or instructions. Client/provider data policies apply. Keep original files, inspect results, and do not use these tools to bypass document permissions. Signed documents are rejected for edits. Limits: 30 MB/file, 80 MB/input, 500 pages; render up to 100 pages/16MP each, 120 MB output.\n\nBrowser tools and documentation: https://www.polypdf.com/tools/automation/\n\nCopyright 2026 PolyPDF. Dependencies retain their own licenses. See THIRD-PARTY-NOTICES.txt.\n",
);
let notices = "PolyPDF browser tools dependency licenses\n\n";
for (const name of Object.keys(pkg.dependencies)) {
  const base = path.join(root, "node_modules", name);
  const files = await fs.readdir(base);
  const license = files.find((f) => /^license(?:\.|$)/i.test(f));
  if (license)
    notices +=
      `\n--- ${name} ${pkg.dependencies[name]} ---\n` +
      (await fs.readFile(path.join(base, license), "utf8"));
}
folder.file("THIRD-PARTY-NOTICES.txt", notices);
zip.forEach((_name, entry) => { entry.date = new Date("2026-10-18T00:00:00Z"); });
await fs.mkdir("public/tools/mcp", { recursive: true });
await fs.writeFile(
  "public/tools/mcp/polypdf-browser-tools-mcp.zip",
  await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
);
await fs.mkdir("public/tools", { recursive: true });
await fs.writeFile(
  "public/tools/tool-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`Packaged ${manifest.tools.length} MCP tools and public schemas.`);
