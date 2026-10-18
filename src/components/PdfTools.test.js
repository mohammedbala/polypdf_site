import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router";
import { PdfToolsHub } from "./PdfTools";
import catalog from "../toolkit/catalog.json";
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
