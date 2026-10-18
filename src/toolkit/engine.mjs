import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  PDFSignature,
  PDFButton,
  StandardFonts,
  rgb,
  degrees,
} from "pdf-lib";

export const LIMITS = Object.freeze({
  fileBytes: 30 * 1024 * 1024,
  totalBytes: 80 * 1024 * 1024,
  pages: 500,
  renderPages: 100,
  pixels: 16000000,
  outputBytes: 120 * 1024 * 1024,
});
export class ToolError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}
const fail = (code, message) => {
  throw new ToolError(code, message);
};
export function pageSelection(value, count, duplicates = false) {
  if (!value || !String(value).trim())
    return Array.from({ length: count }, (_, i) => i);
  const result = [];
  for (const part of String(value).split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m)
      fail(
        "INVALID_PAGES",
        "Use page numbers and ascending ranges, such as 1, 3-5.",
      );
    const a = Number(m[1]),
      b = Number(m[2] || m[1]);
    if (a < 1 || b > count || a > b)
      fail(
        "INVALID_PAGES",
        `Pages must be between 1 and ${count}, in ascending ranges.`,
      );
    for (let i = a - 1; i < b; i++) {
      if (duplicates || !result.includes(i)) result.push(i);
    }
    if (result.length > LIMITS.pages)
      fail("PAGE_LIMIT", "Select no more than 500 pages.");
  }
  return result;
}
export function validateOptions(tool, supplied = {}) {
  if (!supplied || typeof supplied !== "object" || Array.isArray(supplied))
    fail("INVALID_OPTIONS", "Options must be an object.");
  const allowed = new Set(
    tool.fields
      .map((f) => f.key)
      .concat(tool.id === "fill-pdf-form" ? ["values"] : []),
  );
  for (const key of Object.keys(supplied))
    if (!allowed.has(key)) fail("INVALID_OPTIONS", `Unknown option: ${key}.`);
  const result = {};
  for (const f of tool.fields) {
    let v = supplied[f.key] ?? f.default;
    if (f.type === "number") {
      v = Number(v);
      if (!Number.isFinite(v) || v < f.min || v > f.max)
        fail(
          "INVALID_OPTIONS",
          `${f.label} must be between ${f.min} and ${f.max}.`,
        );
    } else if (f.type === "checkbox") {
      if (typeof v !== "boolean")
        fail("INVALID_OPTIONS", `${f.label} must be true or false.`);
    } else {
      if (typeof v !== "string")
        fail("INVALID_OPTIONS", `${f.label} must be text.`);
      if (v.length > (f.maxLength || 2000))
        fail("INVALID_OPTIONS", `${f.label} is too long.`);
    }
    if (f.type === "select" && !f.options.includes(v))
      fail("INVALID_OPTIONS", `Choose an available ${f.label.toLowerCase()}.`);
    if (f.type === "color" && !/^#[a-f0-9]{6}$/i.test(v))
      fail("INVALID_OPTIONS", "Choose a valid six-digit color.");
    result[f.key] = v;
  }
  for (const key of [
    "chunkSize",
    "copies",
    "count",
    "after",
    "start",
    "digits",
  ])
    if (key in result && !Number.isInteger(result[key]))
      fail("INVALID_OPTIONS", `${key} must be a whole number.`);
  if (tool.id === "fill-pdf-form") {
    const v = supplied.values || {};
    if (
      !v ||
      typeof v !== "object" ||
      Array.isArray(v) ||
      Object.keys(v).length > 500
    )
      fail(
        "INVALID_OPTIONS",
        "Form values must be an object with at most 500 fields.",
      );
    result.values = v;
  }
  return result;
}
export function fileKind(bytes) {
  if (!(bytes instanceof Uint8Array))
    fail("INVALID_FILE", "File data must be bytes.");
  if (new TextDecoder().decode(bytes.subarray(0, 1024)).includes("%PDF-"))
    return "pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => bytes[i] === x))
    return "png";
  if (
    new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP"
  )
    return "webp";
  fail(
    "UNSUPPORTED_FILE",
    "Use a valid PDF, JPG, PNG, or WebP file supported by this tool.",
  );
}
export function validateFiles(tool, files) {
  if (
    !Array.isArray(files) ||
    files.length < tool.minFiles ||
    files.length > tool.maxFiles
  )
    fail(
      "FILE_COUNT",
      `Choose ${tool.minFiles === tool.maxFiles ? tool.minFiles : `${tool.minFiles}–${tool.maxFiles}`} files for ${tool.name}.`,
    );
  let total = 0;
  files.forEach((file, i) => {
    if (!file.bytes?.length || file.bytes.length > LIMITS.fileBytes)
      fail("FILE_SIZE", "Each file must be nonempty and no larger than 30 MB.");
    total += file.bytes.length;
    const kind = fileKind(file.bytes);
    if (
      !tool.types.includes(kind) ||
      (tool.id === "add-image-to-pdf" &&
        (i === 0 ? kind !== "pdf" : !["jpg", "png"].includes(kind)))
    )
      fail(
        "UNSUPPORTED_FILE",
        tool.id === "add-image-to-pdf"
          ? "Choose a PDF first, then a JPG or PNG."
          : `This tool accepts ${tool.types.join(", ")} files.`,
      );
  });
  if (total > LIMITS.totalBytes)
    fail("FILE_SIZE", "Keep the combined input below 80 MB.");
}
export async function loadPdf(bytes, editing = false) {
  let doc;
  try {
    doc = await PDFDocument.load(bytes, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
  } catch (error) {
    fail(
      /encrypt|password/i.test(error.message) ? "ENCRYPTED_PDF" : "INVALID_PDF",
      /encrypt|password/i.test(error.message)
        ? "Password-protected PDFs are not supported here. Use an authorized unencrypted copy."
        : "This PDF could not be read. Try exporting a fresh copy from its source application.",
    );
  }
  if (doc.getPageCount() > LIMITS.pages)
    fail("PAGE_LIMIT", "Use a PDF with no more than 500 pages.");
  if (
    editing &&
    doc
      .getForm()
      .getFields()
      .some(
        (f) =>
          f instanceof PDFSignature && f.acroField.dict.has(PDFName.of("V")),
      )
  )
    fail(
      "SIGNED_PDF",
      "This PDF contains a digital signature. Use an unsigned source copy.",
    );
  if (editing)
    for (const [, obj] of doc.context.enumerateIndirectObjects())
      if (
        obj instanceof PDFDict &&
        (obj.has(PDFName.of("ByteRange")) ||
          (obj.get(PDFName.of("Type"))?.toString() === "/Sig" &&
            obj.has(PDFName.of("Contents"))))
      )
        fail(
          "SIGNED_PDF",
          "This PDF contains a digital signature. Editing would invalidate it; use an unsigned source copy.",
        );
  return doc;
}
function fieldData(doc) {
  if (doc.getForm().hasXFA())
    fail(
      "XFA_UNSUPPORTED",
      "XFA forms are unsupported. Use a standard AcroForm PDF.",
    );
  return doc
    .getForm()
    .getFields()
    .map((f) => ({
      name: f.getName(),
      type:
        [
          [PDFTextField, "PDFTextField"],
          [PDFCheckBox, "PDFCheckBox"],
          [PDFDropdown, "PDFDropdown"],
          [PDFRadioGroup, "PDFRadioGroup"],
          [PDFOptionList, "PDFOptionList"],
          [PDFSignature, "PDFSignature"],
          [PDFButton, "PDFButton"],
        ].find(([Type]) => f instanceof Type)?.[1] || "Unknown",
      readOnly: f.isReadOnly(),
      value: f.getText?.() ?? f.isChecked?.() ?? f.getSelected?.() ?? null,
      options: f.getOptions?.() || [],
    }));
}
export async function inspectPdf(bytes) {
  const d = await loadPdf(bytes);
  return {
    pageCount: d.getPageCount(),
    bytes: bytes.length,
    title: d.getTitle() || "",
    author: d.getAuthor() || "",
    subject: d.getSubject() || "",
    keywords: d.getKeywords() || "",
    pages: d
      .getPages()
      .map((p, i) => ({
        page: i + 1,
        ...p.getSize(),
        rotation: p.getRotation().angle,
        cropBox: p.getCropBox(),
      })),
    fields: fieldData(d),
  };
}
const sizes = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  A3: [841.89, 1190.55],
  Tabloid: [792, 1224],
};
const color = (hex) =>
  rgb(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));
const textFile = (name, data, type = "application/json") => ({
  name,
  type,
  bytes: new TextEncoder().encode(
    typeof data === "string" ? data : JSON.stringify(data, null, 2),
  ),
});
const pdfFile = async (name, doc) => ({
  name,
  type: "application/pdf",
  bytes: await doc.save({ useObjectStreams: true, addDefaultPage: false }),
});
function safeText(font, text) {
  try {
    font.encodeText(text);
  } catch {
    fail(
      "UNSUPPORTED_TEXT",
      "This tool’s built-in font supports Latin text. Remove unsupported characters or use the desktop editor with an appropriate font.",
    );
  }
  return text;
}
function visualSize(p) {
  const b = p.getCropBox(),
    r = ((p.getRotation().angle % 360) + 360) % 360;
  return r % 180 ? [b.height, b.width] : [b.width, b.height];
}
async function drawVisual(targetDoc, target, source, box) {
  const b = source.getCropBox();
  const embedded = await targetDoc.embedPage(source, {
    left: b.x,
    bottom: b.y,
    right: b.x + b.width,
    top: b.y + b.height,
  });
  const r = ((source.getRotation().angle % 360) + 360) % 360;
  const [sw, sh] = visualSize(source);
  const scale = Math.min(box.w / sw, box.h / sh),
    w = sw * scale,
    h = sh * scale;
  let x = box.x + (box.w - w) / 2,
    y = box.y + (box.h - h) / 2;
  if (r === 90) y += h;
  if (r === 180) {
    x += w;
    y += h;
  }
  if (r === 270) x += w;
  target.drawPage(embedded, {
    x,
    y,
    xScale: scale,
    yScale: scale,
    rotate: degrees(-r),
  });
}
function flattenFields(doc) {
  doc.getForm().flatten();
  // pdf-lib can leave references to removed widgets; do not serialize dangling annotations.
  for (const page of doc.getPages()) {
    const annotations = page.node.Annots();
    if (!annotations) continue;
    const retained = annotations.asArray().filter((ref) => {
      const value = doc.context.lookup(ref);
      return (
        value instanceof PDFDict &&
        value.get(PDFName.of("Subtype"))?.toString() !== "/Widget"
      );
    });
    page.node.set(PDFName.of("Annots"), doc.context.obj(retained));
  }
  doc.catalog.delete(PDFName.of("AcroForm"));
}
async function flattenForCopy(doc, warnings) {
  if (doc.getForm().hasXFA())
    fail(
      "XFA_UNSUPPORTED",
      "Page assembly cannot preserve XFA forms. Use a standard PDF copy.",
    );
  if (doc.getForm().getFields().length) {
    flattenFields(doc);
    warnings.push("Interactive form values were flattened in the new copy.");
  }
}
function checkOutputPages(count) {
  if (count > LIMITS.pages)
    fail(
      "PAGE_LIMIT",
      "The result would exceed 500 pages. Choose fewer files or copies.",
    );
}
export async function runTool(
  tool,
  files,
  supplied = {},
  adapter = {},
  onProgress = () => {},
) {
  validateFiles(tool, files);
  const o = validateOptions(tool, supplied),
    id = tool.id,
    warnings = [],
    outputs = [];
  onProgress({ stage: "Reading files", percent: 5 });
  let doc;
  if (files[0] && fileKind(files[0].bytes) === "pdf")
    doc = await loadPdf(
      files[0].bytes,
      !tool.readOnly && !id.startsWith("pdf-to-"),
    );
  const selected = doc ? pageSelection(o.pages, doc.getPageCount()) : [];
  const needAdapter = (name) => {
    if (!adapter[name])
      fail(
        "UNSUPPORTED_RUNTIME",
        "This operation needs the PDF rendering runtime. Reload and try again.",
      );
    return adapter[name];
  };
  if (id === "inspect-pdf")
    outputs.push(
      textFile("pdf-inspection.json", await inspectPdf(files[0].bytes)),
    );
  else if (id === "extract-pdf-form-data")
    outputs.push(textFile("pdf-form-data.json", { fields: fieldData(doc) }));
  else if (id === "pdf-to-text" || id === "compare-pdf-text") {
    const read = needAdapter("text");
    const before = await read(files[0].bytes, selected);
    if (!before.some((p) => p.text.trim()))
      warnings.push("No selectable text was found. Scanned pages require OCR.");
    if (id === "pdf-to-text")
      outputs.push(
        textFile(
          "pdf-text.txt",
          before.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n"),
          "text/plain;charset=utf-8",
        ),
      );
    else {
      const second = await loadPdf(files[1].bytes);
      const after = await read(
        files[1].bytes,
        pageSelection("", second.getPageCount()),
      );
      const changes = Array.from(
        { length: Math.max(before.length, after.length) },
        (_, i) => {
          const a = (before[i]?.text || "").split("\n"),
            b = (after[i]?.text || "").split("\n");
          const ac = new Map(),
            bc = new Map();
          a.forEach((v) => ac.set(v, (ac.get(v) || 0) + 1));
          b.forEach((v) => bc.set(v, (bc.get(v) || 0) + 1));
          const removed = [],
            added = [];
          for (const [line, n] of ac)
            for (let j = 0; j < n - (bc.get(line) || 0); j++)
              removed.push(line);
          for (const [line, n] of bc)
            for (let j = 0; j < n - (ac.get(line) || 0); j++) added.push(line);
          return {
            page: i + 1,
            changed: (before[i]?.text || "") !== (after[i]?.text || ""),
            removed,
            added,
            orderChangedOnly:
              !removed.length &&
              !added.length &&
              (before[i]?.text || "") !== (after[i]?.text || ""),
          };
        },
      );
      outputs.push(
        textFile("pdf-text-comparison.json", {
          method:
            "Page-by-page extracted lines; includes repeated-line counts. Not a visual comparison or OCR.",
          pagesBefore: before.length,
          pagesAfter: after.length,
          changes,
        }),
      );
    }
  } else if (["jpg-to-pdf", "png-to-pdf", "webp-to-pdf"].includes(id)) {
    const out = await PDFDocument.create();
    for (const [i, file] of files.entries()) {
      let bytes = file.bytes;
      const kind = fileKind(bytes);
      if (kind === "webp") bytes = await needAdapter("imageToPng")(bytes);
      const img =
        kind === "jpg" ? await out.embedJpg(bytes) : await out.embedPng(bytes);
      if (img.width * img.height > LIMITS.pixels)
        fail("IMAGE_LIMIT", "Use images no larger than 16 megapixels.");
      const dimensions =
        o.paper === "Image"
          ? [img.width * 0.75 + o.margin * 2, img.height * 0.75 + o.margin * 2]
          : sizes[o.paper];
      const p = out.addPage(dimensions),
        scale = Math.min(
          (p.getWidth() - o.margin * 2) / img.width,
          (p.getHeight() - o.margin * 2) / img.height,
        );
      if (scale <= 0)
        fail("INVALID_OPTIONS", "Margins leave no room for the image.");
      p.drawImage(img, {
        x: (p.getWidth() - img.width * scale) / 2,
        y: (p.getHeight() - img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
      });
      onProgress({
        stage: "Converting images",
        percent: 10 + (80 * (i + 1)) / files.length,
      });
    }
    outputs.push(await pdfFile("images.pdf", out));
  } else if (
    id.startsWith("pdf-to-") ||
    (id === "compress-pdf" && o.mode === "image")
  ) {
    if (selected.length > LIMITS.renderPages)
      fail("PAGE_LIMIT", "Render no more than 100 pages at a time.");
    const format =
        id === "pdf-to-png" ? "png" : id === "pdf-to-webp" ? "webp" : "jpg",
      render = needAdapter("render");
    const rasterDoc = id === "compress-pdf" ? await PDFDocument.create() : null;
    let total = 0;
    for (const [index, p] of selected.entries()) {
      const img = await render(files[0].bytes, p, {
        format,
        dpi: Number(o.dpi),
        quality: Number(o.quality || 85) / 100,
      });
      total += img.bytes.length;
      if (total > LIMITS.outputBytes)
        fail(
          "OUTPUT_LIMIT",
          "Images exceed 120 MB. Lower the resolution or select fewer pages.",
        );
      if (rasterDoc) {
        const embedded = await rasterDoc.embedJpg(img.bytes),
          page = rasterDoc.addPage([img.widthPoints, img.heightPoints]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: img.widthPoints,
          height: img.heightPoints,
        });
      } else
        outputs.push({
          name: `page-${String(p + 1).padStart(3, "0")}.${format}`,
          type: format === "jpg" ? "image/jpeg" : `image/${format}`,
          bytes: img.bytes,
        });
      onProgress({
        stage: "Rendering pages",
        percent: 10 + (80 * (index + 1)) / selected.length,
      });
    }
    if (rasterDoc) {
      outputs.push(await pdfFile("compressed-image.pdf", rasterDoc));
      warnings.push(
        "Image compression rasterized the document. Text, vector detail, links, and interactive fields are not retained.",
      );
    }
  } else if (id === "text-to-pdf") {
    if (!o.text.trim()) fail("INVALID_OPTIONS", "Enter some text first.");
    const out = await PDFDocument.create(),
      font = await out.embedFont(StandardFonts.Helvetica),
      bold = await out.embedFont(StandardFonts.HelveticaBold);
    safeText(font, o.text.replace(/[\r\n\t]/g, " "));
    safeText(bold, o.title);
    let p = out.addPage(sizes.A4),
      y = p.getHeight() - 48;
    out.setTitle(o.title);
    const write = (line, f = font, size = o.fontSize) => {
      if (y < 48 + size) {
        checkOutputPages(out.getPageCount() + 1);
        p = out.addPage(sizes.A4);
        y = p.getHeight() - 48;
      }
      p.drawText(line, { x: 48, y: y - size, font: f, size });
      y -= size * 1.45;
    };
    const wrap = (txt, f, size) => {
      for (const raw of txt.replace(/\t/g, "    ").split(/\r?\n/)) {
        let line = "";
        for (const ch of raw) {
          if (f.widthOfTextAtSize(line + ch, size) > p.getWidth() - 96) {
            write(line, f, size);
            line = "";
          }
          line += ch;
        }
        write(line, f, size);
      }
    };
    if (o.title) {
      wrap(o.title, bold, Math.min(24, o.fontSize + 4));
      y -= 12;
    }
    wrap(o.text, font, o.fontSize);
    outputs.push(await pdfFile("notes.pdf", out));
  } else if (
    [
      "merge-pdf",
      "split-pdf",
      "extract-pdf-pages",
      "delete-pdf-pages",
      "organize-pdf",
      "duplicate-pdf-pages",
      "reverse-pdf-pages",
      "interleave-pdf",
    ].includes(id)
  ) {
    const docs = [doc];
    for (let i = 1; i < files.length; i++)
      docs.push(await loadPdf(files[i].bytes, true));
    for (const d of docs) await flattenForCopy(d, warnings);
    let sequence = [];
    if (id === "merge-pdf")
      docs.forEach((d) =>
        d.getPageIndices().forEach((i) => sequence.push([d, i])),
      );
    else if (id === "interleave-pdf") {
      const second = docs[1].getPageIndices();
      if (o.reverseSecond) second.reverse();
      for (let i = 0; i < Math.max(doc.getPageCount(), second.length); i++) {
        if (i < doc.getPageCount()) sequence.push([doc, i]);
        if (i < second.length) sequence.push([docs[1], second[i]]);
      }
    } else {
      let indexes = doc.getPageIndices();
      if (id === "extract-pdf-pages") indexes = selected;
      if (id === "delete-pdf-pages")
        indexes = indexes.filter((i) => !selected.includes(i));
      if (id === "reverse-pdf-pages") indexes.reverse();
      if (id === "organize-pdf") {
        indexes = pageSelection(o.order, doc.getPageCount(), true);
        if (
          indexes.length !== doc.getPageCount() ||
          new Set(indexes).size !== indexes.length
        )
          fail(
            "INVALID_PAGES",
            "Use every original page exactly once in the new order.",
          );
      }
      if (id === "duplicate-pdf-pages")
        indexes = indexes.flatMap((i) =>
          Array(1 + (selected.includes(i) ? o.copies : 0)).fill(i),
        );
      sequence = indexes.map((i) => [doc, i]);
    }
    if (!sequence.length)
      fail("INVALID_PAGES", "Keep at least one page in the output.");
    checkOutputPages(sequence.length);
    const chunks =
      id === "split-pdf" ? Math.ceil(sequence.length / o.chunkSize) : 1;
    for (let c = 0; c < chunks; c++) {
      const out = await PDFDocument.create(),
        entries =
          id === "split-pdf"
            ? sequence.slice(c * o.chunkSize, (c + 1) * o.chunkSize)
            : sequence;
      for (const [d, i] of entries) {
        const [page] = await out.copyPages(d, [i]);
        out.addPage(page);
      }
      outputs.push(
        await pdfFile(
          chunks > 1
            ? `part-${String(c + 1).padStart(3, "0")}.pdf`
            : `${id}.pdf`,
          out,
        ),
      );
    }
    warnings.push(
      "Page assembly creates a new document; document-level bookmarks, tags, and embedded attachments are not carried over.",
    );
  } else if (
    ["resize-pdf", "add-pdf-margins", "pdf-booklet", "n-up-pdf"].includes(id)
  ) {
    await flattenForCopy(doc, warnings);
    const out = await PDFDocument.create();
    let order = doc.getPageIndices();
    let perSheet = 1;
    if (id === "pdf-booklet") {
      const n = Math.ceil(order.length / 4) * 4;
      order = [];
      for (let i = 0; i < n / 4; i++)
        order.push(n - 1 - 2 * i, 2 * i, 2 * i + 1, n - 2 - 2 * i);
      perSheet = 2;
    }
    if (id === "n-up-pdf") perSheet = Number(o.perSheet);
    for (let i = 0; i < order.length; i += perSheet) {
      const source = doc.getPage(order[i] < doc.getPageCount() ? order[i] : 0),
        [sw, sh] = visualSize(source);
      let dimensions =
        id === "add-pdf-margins"
          ? [sw + o.margin * 2, sh + o.margin * 2]
          : sizes[o.paper];
      if (perSheet > 1) dimensions = [dimensions[1], dimensions[0]];
      const p = out.addPage(dimensions);
      for (let k = 0; k < perSheet; k++) {
        const idx = order[i + k];
        if (idx === undefined || idx >= doc.getPageCount()) continue;
        const columns = perSheet > 1 ? 2 : 1,
          rows = perSheet === 4 ? 2 : 1,
          m = id === "add-pdf-margins" ? o.margin : perSheet > 1 ? 12 : 0;
        const cw = p.getWidth() / columns,
          ch = p.getHeight() / rows;
        await drawVisual(out, p, doc.getPage(idx), {
          x: (k % columns) * cw + m,
          y: p.getHeight() - (Math.floor(k / columns) + 1) * ch + m,
          w: cw - m * 2,
          h: ch - m * 2,
        });
      }
    }
    outputs.push(await pdfFile(`${id}.pdf`, out));
    warnings.push(
      "Page layout creates a static copy. Links, editable annotations, tags, and document-level navigation are not retained. Verify drawing scale after resizing.",
    );
  } else {
    if (id === "rotate-pdf")
      selected.forEach((i) => {
        const p = doc.getPage(i);
        p.setRotation(degrees((p.getRotation().angle + Number(o.angle)) % 360));
      });
    else if (id === "insert-blank-pdf-pages") {
      if (o.after > doc.getPageCount())
        fail(
          "INVALID_PAGES",
          `Insertion point must be between 0 and ${doc.getPageCount()}.`,
        );
      checkOutputPages(doc.getPageCount() + o.count);
      const source = doc.getPage(Math.max(0, o.after - 1)),
        size = visualSize(source);
      for (let i = 0; i < o.count; i++) doc.insertPage(o.after + i, size);
    } else if (id === "crop-pdf") {
      for (const i of selected) {
        const p = doc.getPage(i),
          b = p.getCropBox();
        if (o.left + o.right >= b.width || o.top + o.bottom >= b.height)
          fail("INVALID_OPTIONS", "Margins must leave a visible page area.");
        p.setCropBox(
          b.x + o.left,
          b.y + o.bottom,
          b.width - o.left - o.right,
          b.height - o.top - o.bottom,
        );
      }
      warnings.push(
        "Cropping hides content; it does not delete or redact it. Margins follow the unrotated PDF page axes.",
      );
    } else if (id === "flatten-pdf") {
      fieldData(doc);
      if (!doc.getForm().getFields().length)
        fail("NO_FIELDS", "This PDF has no interactive fields to flatten.");
      flattenFields(doc);
    } else if (id === "fill-pdf-form") {
      const fields = fieldData(doc);
      if (!fields.length)
        fail(
          "NO_FIELDS",
          "No interactive form fields were found. Try Add text for a flat PDF.",
        );
      if (!Object.keys(o.values).length)
        fail("INVALID_OPTIONS", "Enter at least one field value.");
      for (const [name, value] of Object.entries(o.values)) {
        const info = fields.find((f) => f.name === name);
        if (!info) fail("UNKNOWN_FIELD", `No form field named ${name}.`);
        if (info.readOnly)
          fail("READ_ONLY_FIELD", `The field ${name} is read-only.`);
        const f = doc.getForm().getField(name);
        if (info.type === "PDFTextField") {
          if (typeof value !== "string" || value.length > 10000)
            fail(
              "INVALID_OPTIONS",
              "Text fields require text of at most 10,000 characters.",
            );
          safeText(await doc.embedFont(StandardFonts.Helvetica), value);
          f.setText(value);
        } else if (info.type === "PDFCheckBox") {
          if (typeof value !== "boolean")
            fail("INVALID_OPTIONS", `${name} needs true or false.`);
          value ? f.check() : f.uncheck();
        } else if (
          ["PDFDropdown", "PDFOptionList", "PDFRadioGroup"].includes(info.type)
        ) {
          const values = Array.isArray(value) ? value : [value];
          if (values.some((v) => !info.options.includes(v)))
            fail("INVALID_OPTIONS", `Choose a listed option for ${name}.`);
          f.select(info.type === "PDFRadioGroup" ? values[0] : values);
        } else
          fail(
            "UNSUPPORTED_FIELD",
            `The field ${name} cannot be filled by this tool.`,
          );
      }
      doc.getForm().updateFieldAppearances();
    } else if (id === "remove-pdf-annotations") {
      for (const i of selected) {
        const p = doc.getPage(i),
          annots = p.node.Annots();
        if (!annots) continue;
        const keep = [];
        for (const ref of annots.asArray()) {
          const a = doc.context.lookup(ref);
          if (
            a instanceof PDFDict &&
            ["/Widget", "/Link"].includes(
              a.get(PDFName.of("Subtype"))?.toString(),
            )
          )
            keep.push(ref);
        }
        p.node.set(PDFName.of("Annots"), doc.context.obj(keep));
      }
    } else if (id === "edit-pdf-metadata") {
      doc.setTitle(o.title);
      doc.setAuthor(o.author);
      doc.setSubject(o.subject);
      doc.setKeywords(
        o.keywords
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      );
    } else if (
      [
        "watermark-pdf",
        "number-pdf-pages",
        "bates-number-pdf",
        "add-text-to-pdf",
        "add-image-to-pdf",
      ].includes(id)
    ) {
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let img;
      if (id === "add-image-to-pdf")
        img =
          fileKind(files[1].bytes) === "jpg"
            ? await doc.embedJpg(files[1].bytes)
            : await doc.embedPng(files[1].bytes);
      for (const [index, i] of selected.entries()) {
        const p = doc.getPage(i),
          b = p.getCropBox();
        if (p.getRotation().angle % 360 !== 0)
          fail(
            "ROTATED_PLACEMENT",
            "Rotate this page to 0° before placing text or images. This tool positions content on unrotated pages.",
          );
        if (img) {
          const w = (b.width * o.width) / 100,
            h = (img.height * w) / img.width,
            x = b.x + (b.width * o.x) / 100,
            y = b.y + b.height * (1 - o.y / 100) - h;
          if (x + w > b.x + b.width || y < b.y)
            fail(
              "PLACEMENT_OUTSIDE_PAGE",
              "The image extends beyond the page. Reduce its width or change its position.",
            );
          p.drawImage(img, { x, y, width: w, height: h });
        } else {
          let text = o.text,
            size = o.fontSize || 11,
            opacity = 1,
            x,
            y;
          if (id === "number-pdf-pages" || id === "bates-number-pdf") {
            const number = String(o.start + index).padStart(
              id === "bates-number-pdf" ? o.digits : 1,
              "0",
            );
            text = o.prefix + number;
            const width = font.widthOfTextAtSize(safeText(font, text), size);
            x =
              b.x +
              (o.position.endsWith("left")
                ? 18
                : o.position.endsWith("right")
                  ? b.width - width - 18
                  : (b.width - width) / 2);
            y =
              b.y + (o.position.startsWith("top") ? b.height - size - 18 : 18);
          } else if (id === "watermark-pdf") {
            safeText(font, text);
            const tw = font.widthOfTextAtSize(text, size);
            size = Math.min(size, ((b.width - 36) / Math.max(tw, 1)) * size);
            x = b.x + (b.width - font.widthOfTextAtSize(text, size)) / 2;
            y = b.y + (b.height - size) / 2;
            opacity = o.opacity / 100;
          } else {
            safeText(font, text);
            x = b.x + (b.width * o.x) / 100;
            y = b.y + b.height * (1 - o.y / 100) - size;
          }
          if (!text.trim()) fail("INVALID_OPTIONS", "Enter visible text.");
          safeText(font, text);
          if (
            x < b.x ||
            x + font.widthOfTextAtSize(text, size) > b.x + b.width ||
            y < b.y
          )
            fail(
              "PLACEMENT_OUTSIDE_PAGE",
              "The text does not fit. Reduce its size or adjust its position.",
            );
          p.drawText(text, {
            x,
            y,
            size,
            font,
            color: color(o.color || "#243128"),
            opacity,
          });
        }
      }
    } else if (id !== "compress-pdf")
      fail("UNKNOWN_TOOL", "This tool is not supported.");
    outputs.push(await pdfFile(`${id}.pdf`, doc));
  }
  const outputBytes = outputs.reduce((n, f) => n + f.bytes.length, 0);
  if (outputBytes > LIMITS.outputBytes)
    fail(
      "OUTPUT_LIMIT",
      "The result is larger than 120 MB. Process a smaller file or fewer pages.",
    );
  const inputBytes = files.reduce((n, f) => n + f.bytes.length, 0);
  if (id === "compress-pdf" && outputBytes >= inputBytes)
    warnings.push(
      "This file did not become smaller. Keep the original or try image compression if its tradeoffs are suitable.",
    );
  onProgress({ stage: "Ready", percent: 100 });
  return {
    tool: id,
    outputs,
    warnings: [...new Set(warnings)],
    summary: {
      inputFiles: files.length,
      inputBytes,
      outputFiles: outputs.length,
      outputBytes,
      ...(doc ? { sourcePages: doc.getPageCount() } : {}),
    },
  };
}
