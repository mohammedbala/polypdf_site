import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PDFDocument, PDFName, StandardFonts, rgb, degrees } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import { catalog } from "./manifest.mjs";
import {
  runTool,
  pageSelection,
  inspectPdf,
  validateOptions,
} from "../../src/toolkit/engine.mjs";
import { nodeAdapter } from "./node-adapter.mjs";
const outRoot = ".tmp/toolkit-tests";
await fs.mkdir(outRoot, { recursive: true });
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 3; i++) {
  const p = doc.addPage([360, 480]);
  p.drawText(`Drawing A10${i} - revision A`, { x: 25, y: 430, font, size: 17 });
  p.drawRectangle({
    x: 30,
    y: 90,
    width: 280,
    height: 300,
    borderWidth: 2,
    borderColor: rgb(0.2, 0.4, 0.3),
  });
  p.drawText(`PAGE ${i}`, { x: 40, y: 350, font, size: 22 });
}
doc.setTitle("Construction fixture");
doc.setAuthor("PolyPDF QA");
const source = { name: "drawing.pdf", bytes: await doc.save() };
await fs.writeFile(`${outRoot}/source.pdf`, source.bytes);
const second = await PDFDocument.load(source.bytes);
second.getPage(0).drawText("REVISED ROOM", { x: 50, y: 300, size: 12 });
const other = { name: "revision.pdf", bytes: await second.save() };
const formDoc = await PDFDocument.create();
const fp = formDoc.addPage([360, 480]);
fp.drawText("Construction review", { x: 25, y: 430, size: 18 });
const ff = formDoc.getForm();
let tf = ff.createTextField("Reviewer");
tf.setText("Morgan");
tf.addToPage(fp, { x: 30, y: 350, width: 250, height: 25 });
let cb = ff.createCheckBox("Reviewed");
cb.addToPage(fp, { x: 30, y: 300, width: 18, height: 18 });
let dd = ff.createDropdown("Status");
dd.addOptions(["Open", "Closed"]);
dd.select("Open");
dd.addToPage(fp, { x: 30, y: 240, width: 250, height: 25 });
const form = { name: "form.pdf", bytes: await formDoc.save() };
const canvas = createCanvas(240, 160),
  ctx = canvas.getContext("2d");
ctx.fillStyle = "#fbfaf4";
ctx.fillRect(0, 0, 240, 160);
ctx.strokeStyle = "#315240";
ctx.lineWidth = 3;
ctx.strokeRect(20, 20, 200, 120);
ctx.fillStyle = "#24352a";
ctx.font = "18px sans-serif";
ctx.fillText("SITE STAMP", 50, 85);
const images = {};
for (const f of ["png", "jpg", "webp"])
  images[f] = {
    name: `image.${f}`,
    bytes: new Uint8Array(await canvas.encode(f === "jpg" ? "jpeg" : f)),
  };
const options = {
  "merge-pdf": {},
  "split-pdf": { chunkSize: 1 },
  "extract-pdf-pages": { pages: "3,1" },
  "delete-pdf-pages": { pages: "2" },
  "organize-pdf": { order: "3,2,1" },
  "rotate-pdf": { angle: "90", pages: "1" },
  "duplicate-pdf-pages": { pages: "2", copies: 2 },
  "reverse-pdf-pages": {},
  "insert-blank-pdf-pages": { after: 1, count: 2 },
  "interleave-pdf": { reverseSecond: true },
  "jpg-to-pdf": {},
  "png-to-pdf": {},
  "webp-to-pdf": {},
  "pdf-to-jpg": { pages: "1", dpi: "72" },
  "pdf-to-png": { pages: "1", dpi: "72" },
  "pdf-to-webp": { pages: "1", dpi: "72" },
  "pdf-to-text": {},
  "text-to-pdf": {
    title: "Review notes",
    text: "Room finish review.\nCheck the revised doorway.",
  },
  "compress-pdf": {},
  "flatten-pdf": {},
  "fill-pdf-form": {
    values: { Reviewer: "River Bennett", Reviewed: true, Status: "Closed" },
  },
  "extract-pdf-form-data": {},
  "remove-pdf-annotations": {},
  "watermark-pdf": { text: "REVIEW" },
  "number-pdf-pages": {},
  "bates-number-pdf": { prefix: "ISSUE-", start: 42, digits: 6 },
  "crop-pdf": { left: 10, top: 10, right: 10, bottom: 10 },
  "resize-pdf": { paper: "Letter" },
  "add-pdf-margins": { margin: 36 },
  "pdf-booklet": {},
  "n-up-pdf": { perSheet: "2" },
  "add-text-to-pdf": { text: "CHECK", x: 10, y: 15 },
  "add-image-to-pdf": {},
  "edit-pdf-metadata": {
    title: "New issue",
    author: "Field office",
    subject: "Review",
    keywords: "drawing,review",
  },
  "inspect-pdf": {},
  "compare-pdf-text": {},
};
const expectedPages = {
  "merge-pdf": 6,
  "split-pdf": 1,
  "extract-pdf-pages": 2,
  "delete-pdf-pages": 2,
  "organize-pdf": 3,
  "duplicate-pdf-pages": 5,
  "reverse-pdf-pages": 3,
  "insert-blank-pdf-pages": 5,
  "interleave-pdf": 6,
  "pdf-booklet": 2,
  "n-up-pdf": 2,
  "text-to-pdf": 1,
  "jpg-to-pdf": 1,
  "png-to-pdf": 1,
  "webp-to-pdf": 1,
  "flatten-pdf": 1,
  "fill-pdf-form": 1,
};
for (const tool of catalog)
  test(`${tool.name}: actual output and semantic checks`, async () => {
    let files = [source];
    if (tool.minFiles === 0) files = [];
    if (["merge-pdf", "interleave-pdf", "compare-pdf-text"].includes(tool.id))
      files = [source, other];
    if (tool.category === "Forms") files = [form];
    if (tool.id === "add-image-to-pdf") files = [source, images.png];
    if (["jpg-to-pdf", "png-to-pdf", "webp-to-pdf"].includes(tool.id))
      files = [images[tool.id.split("-")[0]]];
    const adapter = await nodeAdapter();
    try {
      const result = await runTool(tool, files, options[tool.id], adapter);
      assert.ok(result.outputs.length);
      if (tool.id === "split-pdf") assert.equal(result.outputs.length, 3);
      const dir = `${outRoot}/${tool.id}`;
      await fs.mkdir(dir, { recursive: true });
      for (const output of result.outputs) {
        assert.ok(output.bytes.length > 20);
        await fs.writeFile(`${dir}/${output.name}`, output.bytes);
        if (output.type === "application/pdf") {
          const reopened = await PDFDocument.load(output.bytes);
          assert.equal(reopened.getPageCount(), expectedPages[tool.id] || 3);
          if (tool.id === "rotate-pdf")
            assert.equal(reopened.getPage(0).getRotation().angle, 90);
          if (tool.id === "crop-pdf")
            assert.equal(reopened.getPage(0).getCropBox().width, 340);
          if (tool.id === "resize-pdf")
            assert.equal(reopened.getPage(0).getWidth(), 612);
          if (tool.id === "add-pdf-margins")
            assert.equal(reopened.getPage(0).getWidth(), 432);
          if (tool.id === "edit-pdf-metadata")
            assert.equal(reopened.getTitle(), "New issue");
          if (tool.id === "flatten-pdf")
            assert.equal(reopened.getForm().getFields().length, 0);
          if (tool.id === "fill-pdf-form") {
            assert.equal(
              reopened.getForm().getTextField("Reviewer").getText(),
              "River Bennett",
            );
            assert.equal(
              reopened.getForm().getCheckBox("Reviewed").isChecked(),
              true,
            );
            assert.deepEqual(
              reopened.getForm().getDropdown("Status").getSelected(),
              ["Closed"],
            );
          }
          const page = await adapter.render(output.bytes, 0, {
            format: "png",
            dpi: 72,
          });
          assert.ok(page.bytes.length > 100);
          await fs.writeFile(`${dir}/preview.png`, page.bytes);
          if (
            ["extract-pdf-pages", "organize-pdf", "reverse-pdf-pages"].includes(
              tool.id,
            )
          ) {
            const text = await adapter.text(output.bytes, [0]);
            assert.match(text[0].text, /A103/);
          }
          if (
            [
              "watermark-pdf",
              "add-text-to-pdf",
              "bates-number-pdf",
              "flatten-pdf",
            ].includes(tool.id)
          ) {
            const text = await adapter.text(output.bytes, [0]);
            assert.ok(
              text[0].text.includes(
                tool.id === "bates-number-pdf"
                  ? "ISSUE-000042"
                  : tool.id === "flatten-pdf"
                    ? "Morgan"
                    : tool.id === "watermark-pdf"
                      ? "REVIEW"
                      : "CHECK",
              ),
            );
          }
        }
      }
      if (tool.id === "pdf-to-text")
        assert.match(
          new TextDecoder().decode(result.outputs[0].bytes),
          /Page 3/,
        );
      if (tool.id === "compare-pdf-text") {
        const report = JSON.parse(
          new TextDecoder().decode(result.outputs[0].bytes),
        );
        assert.ok(
          report.changes[0].added.some((x) => x.includes("REVISED ROOM")),
        );
        assert.equal(report.changes[1].changed, false);
      }
    } finally {
      await adapter.dispose();
    }
  });
test("image compression creates a smaller image PDF and reports losses", async () => {
  const adapter = await nodeAdapter();
  try {
    const result = await runTool(
      catalog.find((t) => t.id === "compress-pdf"),
      [source],
      { mode: "image", dpi: "72" },
      adapter,
    );
    assert.match(result.warnings.join(" "), /rasterized/);
    assert.equal((await inspectPdf(result.outputs[0].bytes)).pageCount, 3);
    await fs.writeFile(
      `${outRoot}/image-compression.pdf`,
      result.outputs[0].bytes,
    );
  } finally {
    await adapter.dispose();
  }
});
test("input, range, size, output and option guardrails", async () => {
  assert.throws(() => pageSelection("0", 3), /between/);
  assert.throws(() => pageSelection("3-1", 3), /ascending/);
  assert.throws(() => pageSelection("1;2", 3), /Use page/);
  assert.deepEqual(pageSelection("3,1-2", 3), [2, 0, 1]);
  assert.throws(() => validateOptions(catalog[0], { unknown: 1 }), /Unknown/);
  await assert.rejects(runTool(catalog[0], [source], {}), /Choose/);
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "delete-pdf-pages"),
      [source],
      { pages: "1-3" },
    ),
    /Keep at least/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "organize-pdf"),
      [source],
      { order: "1,1,2" },
    ),
    /exactly once/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "crop-pdf"),
      [source],
      { left: 400 },
    ),
    /visible page/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "insert-blank-pdf-pages"),
      [source],
      { after: 4 },
    ),
    /Insertion/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "fill-pdf-form"),
      [form],
      { values: { Unknown: "x" } },
    ),
    /No form field/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "fill-pdf-form"),
      [form],
      { values: { Status: "Invalid" } },
    ),
    /listed option/,
  );
  await assert.rejects(
    runTool(
      catalog.find((t) => t.id === "add-text-to-pdf"),
      [source],
      { text: "漢字" },
    ),
    /Latin/,
  );
});
test("signed input is blocked before any modification", async () => {
  const d = await PDFDocument.load(source.bytes);
  d.context.register(
    d.context.obj({
      Type: PDFName.of("Sig"),
      ByteRange: [0, 10, 20, 30],
      Contents: "signature",
    }),
  );
  await assert.rejects(
    runTool(catalog[5], [{ name: "signed.pdf", bytes: await d.save() }], {}),
    /digital signature/,
  );
});
test("rotated/cropped source layout preserves visual orientation", async () => {
  const d = await PDFDocument.load(source.bytes);
  d.getPage(0).setRotation(degrees(90));
  d.getPage(0).setCropBox(10, 10, 340, 460);
  const adapter = await nodeAdapter();
  try {
    const r = await runTool(
      catalog.find((t) => t.id === "add-pdf-margins"),
      [{ name: "rotated.pdf", bytes: await d.save() }],
      { margin: 36 },
      adapter,
    );
    const p = (await PDFDocument.load(r.outputs[0].bytes)).getPage(0);
    assert.equal(p.getWidth(), 532);
    assert.equal(p.getHeight(), 412);
    await fs.writeFile(`${outRoot}/rotated-margins.pdf`, r.outputs[0].bytes);
    await fs.writeFile(
      `${outRoot}/rotated-margins.png`,
      (await adapter.render(r.outputs[0].bytes, 0, { format: "png", dpi: 100 }))
        .bytes,
    );
  } finally {
    await adapter.dispose();
  }
});
test("comment removal keeps canonical form widgets and hyperlinks", async () => {
  const d = await PDFDocument.load(form.bytes),
    p = d.getPage(0),
    annots = p.node.Annots();
  const comment = d.context.register(
      d.context.obj({
        Type: "Annot",
        Subtype: "Text",
        Rect: [10, 10, 20, 20],
        Contents: "Review this",
      }),
    ),
    link = d.context.register(
      d.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [10, 30, 50, 50],
        A: { S: "URI", URI: "https://www.polypdf.com/" },
      }),
    );
  annots.push(comment);
  annots.push(link);
  const result = await runTool(
    catalog.find((t) => t.id === "remove-pdf-annotations"),
    [{ name: "comments.pdf", bytes: await d.save() }],
  );
  const reopened = await PDFDocument.load(result.outputs[0].bytes),
    a = reopened
      .getPage(0)
      .node.Annots()
      .asArray()
      .map((ref) =>
        reopened.context.lookup(ref).get(PDFName.of("Subtype")).toString(),
      );
  assert.ok(!a.includes("/Text"));
  assert.ok(a.includes("/Link"));
  assert.equal(a.filter((x) => x === "/Widget").length, 3);
  assert.equal(reopened.getForm().getTextField("Reviewer").getText(), "Morgan");
});
test("flattening removes all widgets while preserving visible field values", async () => {
  const result = await runTool(
    catalog.find((t) => t.id === "flatten-pdf"),
    [form],
  );
  const reopened = await PDFDocument.load(result.outputs[0].bytes);
  assert.equal(reopened.getForm().getFields().length, 0);
  for (const p of reopened.getPages())
    for (const ref of p.node.Annots()?.asArray() || [])
      assert.notEqual(
        reopened.context.lookup(ref).get(PDFName.of("Subtype"))?.toString(),
        "/Widget",
      );
});
