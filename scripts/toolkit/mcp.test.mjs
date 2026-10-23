import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { PDFDocument } from "pdf-lib";
await fs.mkdir(".tmp", { recursive: true });
const root = await fs.mkdtemp(path.resolve(".tmp/toolkit-mcp-"));
const d = await PDFDocument.create();
d.addPage([300, 400]);
d.addPage([400, 300]);
const bytes = await d.save();
await fs.writeFile(path.join(root, "source.pdf"), bytes);
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const client = new Client({ name: "toolkit-validation", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["scripts/toolkit/server.mjs", "--root", root],
  stderr: "pipe",
});
let stderr = "";
transport.stderr?.on("data", (b) => (stderr += b));
await client.connect(transport);
try {
  await test("MCP exposes exactly 36 schema-described tools", async () => {
    const r = await client.listTools();
    assert.equal(r.tools.length, 36);
    assert.equal(new Set(r.tools.map((t) => t.name)).size, 36);
    for (const t of r.tools) {
      assert.equal(t.inputSchema.additionalProperties, false);
      assert.ok(t.inputSchema.required.includes("request_id"));
      assert.equal(t.annotations.destructiveHint, false);
      assert.equal(t.annotations.idempotentHint, true);
    }
  });
  await test("MCP real execution, exact retry, resource bytes and input immutability", async () => {
    const args = {
      request_id: "rotation-verified",
      files: [{ path: "source.pdf", sha256: sha(bytes) }],
      options: { angle: "90" },
    };
    const r = await client.callTool({
      name: "polypdf_rotate_pdf",
      arguments: args,
    });
    assert.ok(!r.isError, JSON.stringify(r));
    const receipt = r.structuredContent;
    assert.equal(receipt.outputs.length, 1);
    const output = receipt.outputs[0];
    const actual = await fs.readFile(output.path);
    assert.equal(sha(actual), output.sha256);
    assert.equal(
      (await PDFDocument.load(actual)).getPage(0).getRotation().angle,
      90,
    );
    assert.equal(
      sha(await fs.readFile(path.join(root, "source.pdf"))),
      sha(bytes),
    );
    const retried = await client.callTool({
      name: "polypdf_rotate_pdf",
      arguments: args,
    });
    assert.equal(retried.structuredContent.replayed, true);
    assert.equal(retried.structuredContent.outputs[0].path, output.path);
    const resource = await client.readResource({ uri: output.uri });
    assert.equal(
      sha(Buffer.from(resource.contents[0].blob, "base64")),
      output.sha256,
    );
  });
  await test("MCP rejects path escape, symlink escape, stale hash and request conflicts", async () => {
    const outside = path.resolve(".tmp/outside-toolkit.pdf");
    await fs.writeFile(outside, bytes);
    const link = path.join(root, "escape.pdf");
    await fs.rm(link, { force: true });
    await fs.symlink(outside, link);
    for (const [id, file] of [
      ["outside", { path: outside }],
      ["link", { path: "escape.pdf" }],
      ["stale", { path: "source.pdf", sha256: "0".repeat(64) }],
    ]) {
      const r = await client.callTool({
        name: "polypdf_rotate_pdf",
        arguments: { request_id: id, files: [file] },
      });
      assert.equal(r.isError, true);
      assert.match(r.content[0].text, /PATH_DENIED|REVISION_CONFLICT/);
    }
    const r = await client.callTool({
      name: "polypdf_rotate_pdf",
      arguments: {
        request_id: "rotation-verified",
        files: [{ path: "source.pdf" }],
        options: { angle: "180" },
      },
    });
    assert.equal(r.isError, true);
    assert.match(r.content[0].text, /REQUEST_CONFLICT/);
  });
  await test("MCP detects tampered results before replay", async () => {
    const a = { request_id: "tamper", files: [{ path: "source.pdf" }] };
    const r = await client.callTool({
      name: "polypdf_inspect_pdf",
      arguments: a,
    });
    await fs.writeFile(r.structuredContent.outputs[0].path, "changed");
    const repeat = await client.callTool({
      name: "polypdf_inspect_pdf",
      arguments: a,
    });
    assert.equal(repeat.isError, true);
    assert.match(repeat.content[0].text, /OUTPUT_CHANGED/);
  });
} finally {
  await client.close();
}
