import { LIMITS, ToolError } from "./engine.mjs";
export function makeRenderAdapter({
  pdfjs,
  createCanvas,
  encodeCanvas,
  imageToPng,
  fontsBase,
}) {
  const documents = new Map();
  class CanvasFactory {
    create(width, height) {
      const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
      return { canvas, context: canvas.getContext("2d") };
    }
    reset(item, width, height) {
      item.canvas.width = width;
      item.canvas.height = height;
    }
    destroy(item) {
      item.canvas.width = 1;
      item.canvas.height = 1;
      item.canvas = null;
      item.context = null;
    }
  }
  async function open(bytes) {
    if (!documents.has(bytes))
      documents.set(
        bytes,
        pdfjs.getDocument({
          data: bytes.slice(),
          isEvalSupported: false,
          useSystemFonts: false,
          disableFontFace: true,
          stopAtErrors: true,
          maxImageSize: LIMITS.pixels,
          CanvasFactory,
          standardFontDataUrl: fontsBase + "standard_fonts/",
          cMapUrl: fontsBase + "cmaps/",
          cMapPacked: true,
          wasmUrl: fontsBase + "wasm/",
        }).promise,
      );
    return documents.get(bytes);
  }
  return {
    imageToPng,
    async text(bytes, indexes) {
      const pdf = await open(bytes),
        out = [];
      for (const index of indexes) {
        const p = await pdf.getPage(index + 1),
          content = await p.getTextContent();
        let text = "";
        for (const item of content.items) {
          if (typeof item.str === "string")
            text += item.str + (item.hasEOL ? "\n" : " ");
        }
        out.push({ page: index + 1, text: text.trim() });
      }
      return out;
    },
    async render(
      bytes,
      index,
      { format = "png", dpi = 100, quality = 0.85 } = {},
    ) {
      const pdf = await open(bytes),
        page = await pdf.getPage(index + 1),
        base = page.getViewport({ scale: 1 }),
        viewport = page.getViewport({ scale: dpi / 72 });
      if (viewport.width * viewport.height > LIMITS.pixels)
        throw new ToolError(
          "IMAGE_LIMIT",
          "This page would exceed 16 megapixels. Lower the resolution.",
        );
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      try {
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
          background: "rgb(255,255,255)",
        }).promise;
        return {
          bytes: await encodeCanvas(canvas, format, quality),
          widthPoints: base.width,
          heightPoints: base.height,
        };
      } finally {
        canvas.width = 1;
        canvas.height = 1;
      }
    },
    async dispose() {
      for (const p of documents.values()) {
        try {
          await (await p).destroy();
        } catch {}
      }
      documents.clear();
    },
  };
}
