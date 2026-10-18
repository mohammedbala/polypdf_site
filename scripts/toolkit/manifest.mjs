import fs from "node:fs";
export const catalog = JSON.parse(
  fs.readFileSync(new URL("../../src/toolkit/catalog.json", import.meta.url)),
);
export function optionSchema(tool) {
  const properties = Object.fromEntries(
    tool.fields.map((f) => [
      f.key,
      {
        type:
          f.type === "number"
            ? "number"
            : f.type === "checkbox"
              ? "boolean"
              : "string",
        description: [f.label, f.help].filter(Boolean).join(". "),
        default: f.default,
        ...(f.options ? { enum: f.options } : {}),
        ...(f.min !== undefined ? { minimum: f.min, maximum: f.max } : {}),
        ...(f.maxLength ? { maxLength: f.maxLength } : {}),
      },
    ]),
  );
  if (tool.id === "fill-pdf-form")
    properties.values = {
      type: "object",
      description:
        "Exact field names mapped to text, boolean, or listed choice values. Inspect the PDF first.",
      additionalProperties: {
        anyOf: [
          { type: "string", maxLength: 10000 },
          { type: "boolean" },
          { type: "array", items: { type: "string" } },
        ],
      },
    };
  return { type: "object", properties, additionalProperties: false };
}
export const manifest = {
  version: "1.0.0",
  name: "PolyPDF browser tools",
  processing:
    "Browser: local memory. MCP: explicitly allowed local folder. No PDF upload service.",
  limits: {
    fileMB: 30,
    totalInputMB: 80,
    pages: 500,
    renderPages: 100,
    renderMegapixels: 16,
  },
  tools: catalog.map((t) => ({
    name: `polypdf_${t.id.replaceAll("-", "_")}`,
    title: t.name,
    description: t.answer + " " + t.limitation,
    url: `https://www.polypdf.com/tools/${t.id}/`,
    inputSchema: {
      type: "object",
      properties: {
        request_id: {
          type: "string",
          minLength: 1,
          maxLength: 128,
          description:
            "Stable unique request ID. Reuse only for an identical retry.",
        },
        files: {
          type: "array",
          minItems: t.minFiles,
          maxItems: t.maxFiles,
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path inside the configured allowed root.",
              },
              sha256: {
                type: "string",
                pattern: "^[a-f0-9]{64}$",
                description:
                  "Optional expected input fingerprint; mismatch rejects the request.",
              },
            },
            required: ["path"],
            additionalProperties: false,
          },
        },
        options: optionSchema(t),
      },
      required: ["request_id", "files"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  })),
};
