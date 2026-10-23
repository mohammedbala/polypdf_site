import { ToolError } from "./engine.mjs";
let webpReady;
async function localWebpEncoder() {
  if (!webpReady) webpReady = (async () => {
    const codec = await import("@jsquash/webp/encode.js");
    await codec.init(null, { locateFile: name => `/pdf-runtime/webp/1.5.0/${name}` });
    return codec.default;
  })().catch(error => { webpReady = null; throw error; });
  return webpReady;
}

export async function encodeCanvas(canvas, format, quality, loadWebp = localWebpEncoder) {
  const type = format === "jpg" ? "image/jpeg" : `image/${format}`;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
  if (format === "webp" && (!blob || blob.type !== type)) {
    try {
      const encode = await loadWebp();
      const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      return new Uint8Array(await encode(pixels, { quality: Math.round(quality * 100) }));
    } catch {
      throw new ToolError("UNSUPPORTED_RUNTIME", "The local WebP encoder could not finish. Reload and try again, or choose PNG or JPG.");
    }
  }
  if (!blob || blob.type !== type)
    throw new ToolError("UNSUPPORTED_RUNTIME", "This browser could not export the image. Try another image format.");
  return new Uint8Array(await blob.arrayBuffer());
}
