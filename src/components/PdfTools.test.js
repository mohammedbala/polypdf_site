import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route } from "react-router";
import { PdfToolsHub, PdfToolPage } from "./PdfTools";
import catalog from "../toolkit/catalog.json";
import pageContent from "../toolkit/page-content.json";
let node, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  node = document.createElement("div");
  document.body.appendChild(node);
  root = createRoot(node);
});
afterEach(() => {
  act(() => root.unmount());
  node.remove();
});
test("all 36 tools have crawlable unique links and honest processing copy", () => {
  act(() =>
    root.render(
      <MemoryRouter>
        <PdfToolsHub />
      </MemoryRouter>,
    ),
  );
  const cards = [...node.querySelectorAll(".pdf-tool-card")];
  expect(cards.length).toBe(36);
  expect(new Set(cards.map((x) => x.getAttribute("href"))).size).toBe(36);
  for (const t of catalog)
    expect(
      cards.some((a) => a.getAttribute("href") === `/tools/${t.id}/`),
    ).toBe(true);
  expect(node.textContent).toContain("do not upload");
  expect(node.querySelectorAll("h1")).toHaveLength(1);
});
test("category filters narrow the tools and return to all results", () => {
  act(() =>
    root.render(
      <MemoryRouter>
        <PdfToolsHub />
      </MemoryRouter>,
    ),
  );
  const buttons = [...node.querySelectorAll(".pdf-filters button")];
  act(() => buttons.find((b) => b.textContent === "Forms").click());
  expect(node.querySelectorAll(".pdf-tool-card")).toHaveLength(3);
  expect(node.querySelector('[aria-pressed="true"]').textContent).toBe("Forms");
  act(() => buttons[0].click());
  expect(node.querySelectorAll(".pdf-tool-card")).toHaveLength(36);
});

test("WebMCP describes fill values and cleans up registered tools", () => {
  const registered = [];
  const unregisterTool = jest.fn();
  Object.defineProperty(navigator, "modelContext", { configurable: true, value: {
    registerTool: (tool) => registered.push(tool), unregisterTool,
  }});
  act(() => root.render(<MemoryRouter initialEntries={["/tools/fill-pdf-form/"]}>
    <Routes><Route path="/tools/:toolId/" element={<PdfToolPage />} /></Routes>
  </MemoryRouter>));
  expect(registered.map((t) => t.name)).toEqual(["polypdf_list_files", "polypdf_fill_pdf_form"]);
  const schema = registered[1].inputSchema.properties.options;
  expect(schema.additionalProperties).toBe(false);
  expect(schema.properties.values.additionalProperties.anyOf.map((x) => x.type)).toEqual(["string", "boolean", "array"]);
  act(() => root.render(<div />));
  expect(unregisterTool.mock.calls.map(([name]) => name)).toEqual(["polypdf_list_files", "polypdf_fill_pdf_form"]);
  delete navigator.modelContext;
});
test("partial WebMCP registration is cleaned up on failure", () => {
  const unregisterTool = jest.fn();
  Object.defineProperty(navigator, "modelContext", { configurable: true, value: {
    registerTool: (tool) => { if (tool.name !== "polypdf_list_files") throw new Error("unsupported"); }, unregisterTool,
  }});
  act(() => root.render(<MemoryRouter initialEntries={["/tools/merge-pdf/"]}>
    <Routes><Route path="/tools/:toolId/" element={<PdfToolPage />} /></Routes>
  </MemoryRouter>));
  expect(unregisterTool).toHaveBeenCalledWith("polypdf_list_files");
  delete navigator.modelContext;
});

test.each(catalog)("$id renders useful, crawlable task-specific content", (tool) => {
  act(() => root.render(<MemoryRouter initialEntries={[`/tools/${tool.id}/`]}>
    <Routes><Route path="/tools/:toolId/" element={<PdfToolPage />} /></Routes>
  </MemoryRouter>));
  const content = pageContent[tool.id];
  expect(node.querySelectorAll("h1")).toHaveLength(1);
  expect(node.querySelector(".pdf-tool-guide").textContent).toContain(content.example);
  for (const [question, answer] of content.faqs) {
    expect(node.querySelector(".pdf-answers").textContent).toContain(question);
    expect(node.querySelector(".pdf-answers").textContent).toContain(answer);
  }
  expect([...node.querySelectorAll(".pdf-related a")].map(a => a.getAttribute("href")))
    .toEqual(content.related.map(id => `/tools/${id}/`));
});
