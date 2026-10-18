import { makeRenderAdapter } from "./render-adapter.mjs";
import { ToolError } from "./engine.mjs";
export async function browserAdapter() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "/pdf-runtime/5.4.624/pdf.worker.min.js";
  const createCanvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const encodeCanvas = (canvas, format, quality) =>
    new Promise((resolve, reject) =>
      canvas.toBlob(
        async (blob) => {
          if (!blob || (format === "webp" && blob.type !== "image/webp")) {
            reject(
              new ToolError(
                "UNSUPPORTED_RUNTIME",
                "This browser cannot export WebP. Try PNG or JPG.",
              ),
            );
            return;
          }
          resolve(new Uint8Array(await blob.arrayBuffer()));
        },
        format === "jpg" ? "image/jpeg" : `image/${format}`,
        quality,
      ),
    );
  const imageToPng = async (bytes) => {
    const blob = new Blob([bytes], { type: "image/webp" }),
      url = URL.createObjectURL(blob),
      img = new Image();
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () =>
          reject(
            new ToolError("INVALID_IMAGE", "The image could not be decoded."),
          );
        img.src = url;
      });
      if (img.width * img.height > 16000000)
        throw new ToolError(
          "IMAGE_LIMIT",
          "Use images no larger than 16 megapixels.",
        );
      const c = createCanvas(img.width, img.height);
      c.getContext("2d").drawImage(img, 0, 0);
      return await encodeCanvas(c, "png", 1);
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  return makeRenderAdapter({
    pdfjs,
    createCanvas,
    encodeCanvas,
    imageToPng,
    fontsBase: "/pdf-runtime/5.4.624/",
  });
}
