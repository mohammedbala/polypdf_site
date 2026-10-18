import {
  createCanvas,
  loadImage,
  DOMMatrix,
  Path2D,
  ImageData,
} from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
import { makeRenderAdapter } from "../../src/toolkit/render-adapter.mjs";
import { ToolError } from "../../src/toolkit/engine.mjs";
globalThis.DOMMatrix ||= DOMMatrix;
globalThis.Path2D ||= Path2D;
globalThis.ImageData ||= ImageData;
export async function nodeAdapter() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const fontsBase = fileURLToPath(
    new URL("../../", import.meta.resolve("pdfjs-dist/legacy/build/pdf.mjs")),
  );
  const encodeCanvas = async (c, f, q) =>
    new Uint8Array(
      await c.encode(f === "jpg" ? "jpeg" : f, Math.round(q * 100)),
    );
  const imageToPng = async (bytes) => {
    const img = await loadImage(Buffer.from(bytes));
    if (img.width * img.height > 16000000)
      throw new ToolError(
        "IMAGE_LIMIT",
        "Use images no larger than 16 megapixels.",
      );
    const c = createCanvas(img.width, img.height);
    c.getContext("2d").drawImage(img, 0, 0);
    return encodeCanvas(c, "png", 1);
  };
  return makeRenderAdapter({
    pdfjs,
    createCanvas,
    encodeCanvas,
    imageToPng,
    fontsBase,
  });
}
