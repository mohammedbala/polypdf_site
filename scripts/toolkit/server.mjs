#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { catalog, manifest } from "./manifest.mjs";
import { runTool, LIMITS, ToolError } from "../../src/toolkit/engine.mjs";
import { nodeAdapter } from "./node-adapter.mjs";
console.log = (...args) => console.error(...args);
console.warn = (...args) => console.error(...args);
const args = process.argv.slice(2),
  rootArgument = args[args.indexOf("--root") + 1];
if (!args.includes("--root") || !rootArgument)
  throw new Error("Start with --root /absolute/path/to/allowed/pdf-folder");
const root = await fs.realpath(rootArgument);
if (!(await fs.stat(root)).isDirectory())
  throw new Error("The allowed root must be a folder.");
const outputRoot = path.join(root, ".polypdf-tools-output");
await fs.mkdir(outputRoot, { recursive: true, mode: 0o700 });
if (
  (await fs.lstat(outputRoot)).isSymbolicLink() ||
  (await fs.realpath(outputRoot)) !== outputRoot
)
  throw new Error("Output folder must not be a symbolic link.");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const within = (candidate, parent) =>
  candidate !== parent && candidate.startsWith(parent + path.sep);
const server = new Server(
  { name: "polypdf-browser-tools", version: manifest.version },
  { capabilities: { tools: {}, resources: {} } },
);
const resources = new Map();
let queue = Promise.resolve();
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: manifest.tools.map(({ url, ...t }) => t),
}));
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [...resources.values()].map(({ uri, name, mimeType }) => ({
    uri,
    name,
    mimeType,
  })),
}));
server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => {
  const entry = resources.get(params.uri);
  if (!entry)
    throw new Error(
      "Unknown output resource. Run a tool in this session first.",
    );
  const real = await fs.realpath(entry.path);
  if (!within(real, outputRoot))
    throw new Error("Resource is outside the output folder.");
  const bytes = await fs.readFile(real);
  if (sha(bytes) !== entry.sha256)
    throw new Error(
      "Output changed after creation; rerun with a new request ID.",
    );
  if (bytes.length > 8 * 1024 * 1024)
    throw new Error(
      "Output is larger than the 8 MB MCP resource transfer limit. Open the returned local path.",
    );
  return {
    contents: [
      {
        uri: params.uri,
        mimeType: entry.mimeType,
        blob: bytes.toString("base64"),
      },
    ],
  };
});
async function execute(params) {
  const tool = catalog.find(
    (t) => `polypdf_${t.id.replaceAll("-", "_")}` === params.name,
  );
  if (!tool) throw new ToolError("UNKNOWN_TOOL", "Unknown PDF tool.");
  const a = params.arguments;
  if (
    !a ||
    typeof a !== "object" ||
    typeof a.request_id !== "string" ||
    !a.request_id.length ||
    a.request_id.length > 128 ||
    !Array.isArray(a.files)
  )
    throw new ToolError(
      "INVALID_REQUEST",
      "Supply request_id, files, and optional options.",
    );
  if (
    Object.keys(a).some((k) => !["request_id", "files", "options"].includes(k))
  )
    throw new ToolError("INVALID_REQUEST", "Unknown request field.");
  if (a.files.length < tool.minFiles || a.files.length > tool.maxFiles)
    throw new ToolError(
      "FILE_COUNT",
      `This tool accepts ${tool.minFiles} to ${tool.maxFiles} files.`,
    );
  const files = [],
    inputs = [];
  let total = 0;
  for (const file of a.files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      Object.keys(file).some((k) => !["path", "sha256"].includes(k))
    )
      throw new ToolError(
        "INVALID_FILE",
        "Each file requires a local path and optional sha256.",
      );
    const resolved = await fs.realpath(path.resolve(root, file.path));
    if (!within(resolved, root))
      throw new ToolError("PATH_DENIED", "File is outside the allowed root.");
    const handle = await fs.open(resolved, "r");
    let bytes;
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || !stat.size || stat.size > LIMITS.fileBytes)
        throw new ToolError(
          "FILE_SIZE",
          "Files must be nonempty regular files of at most 30 MB.",
        );
      total += stat.size;
      if (total > LIMITS.totalBytes)
        throw new ToolError("FILE_SIZE", "Total input exceeds 80 MB.");
      bytes = new Uint8Array(await handle.readFile());
    } finally {
      await handle.close();
    }
    const hash = sha(bytes);
    if (file.sha256 && file.sha256 !== hash)
      throw new ToolError(
        "REVISION_CONFLICT",
        "Input fingerprint changed. Inspect the current file and use a new request ID.",
      );
    files.push({ name: path.basename(resolved), bytes });
    inputs.push({ path: resolved, sha256: hash });
  }
  const requestHash = sha(
      JSON.stringify({
        version: manifest.version,
        tool: tool.id,
        inputs,
        options: a.options || {},
      }),
    ),
    folder = path.join(outputRoot, sha(a.request_id)),
    receiptPath = path.join(folder, "receipt.json");
  try {
    const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
    if (receipt.requestHash !== requestHash)
      throw new ToolError(
        "REQUEST_CONFLICT",
        "This request ID was already used with different inputs. Use a new ID.",
      );
    for (const output of receipt.outputs) {
      const actual = await fs.realpath(output.path);
      if (
        !within(actual, folder) ||
        sha(await fs.readFile(actual)) !== output.sha256
      )
        throw new ToolError(
          "OUTPUT_CHANGED",
          "A saved result changed or is missing. Use a new request ID.",
        );
      resources.set(output.uri, output);
    }
    return { ...receipt, replayed: true };
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const adapter = await nodeAdapter();
  let result;
  try {
    result = await runTool(tool, files, a.options || {}, adapter);
  } finally {
    await adapter.dispose();
  }
  await fs.mkdir(folder, { mode: 0o700 });
  const outputs = [];
  try {
    for (const [i, output] of result.outputs.entries()) {
      const outputPath = path.join(folder, output.name);
      await fs.writeFile(outputPath, output.bytes, { flag: "wx", mode: 0o600 });
      const record = {
        name: output.name,
        path: outputPath,
        uri: `polypdf-toolkit://${sha(a.request_id)}/${i}`,
        mimeType: output.type,
        bytes: output.bytes.length,
        sha256: sha(output.bytes),
      };
      outputs.push(record);
    }
    const receipt = {
      version: manifest.version,
      requestId: a.request_id,
      requestHash,
      tool: tool.id,
      inputs,
      summary: result.summary,
      warnings: result.warnings,
      outputs,
    };
    await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
    outputs.forEach((o) => resources.set(o.uri, o));
    return receipt;
  } catch (e) {
    await fs.rm(folder, { recursive: true, force: true });
    throw e;
  }
}
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  const job = queue.then(() => execute(params));
  queue = job.catch(() => {});
  try {
    const receipt = await job;
    return {
      content: [{ type: "text", text: JSON.stringify(receipt) }],
      structuredContent: receipt,
    };
  } catch (e) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code: e.code || "OPERATION_FAILED",
            message: e.message,
          }),
        },
      ],
    };
  }
});
await server.connect(new StdioServerTransport());
