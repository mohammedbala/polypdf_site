(async () => {
  document.querySelector('[data-dialog-id="preflightAssessment"] [data-dialog-cancel]')?.click();
  await new Promise((resolve) => setTimeout(resolve, 250));
  await window.polyPDFAutomation.menuCommand({ type: "documentDialog", dialog: "headersFooters" });
  const root = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const poll = () => {
      const element = document.querySelector('[data-dialog-id="headersFooters"]');
      if (element) return resolve(element);
      if (Date.now() >= deadline) return reject(new Error("Headers & Footers dialog did not open"));
      setTimeout(poll, 75);
    };
    poll();
  });
  const setValue = (selector, value) => {
    const control = root.querySelector(selector);
    if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) {
      throw new Error(`Missing header/footer control: ${selector}`);
    }
    control.value = String(value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  };
  setValue('[data-hf-field="header-left"]', "ISSUE 02 — REVIEW SET");
  setValue('[data-hf-field="header-center"]', "POLYPDF EVIDENCE LAB");
  setValue('[data-hf-field="header-right"]', "2026-08-19");
  setValue('[data-hf-field="footer-left"]', "FOR REVIEW — NOT FOR CONSTRUCTION");
  setValue('[data-hf-field="footer-center"]', "{label} · {page}");
  setValue('[data-hf-field="footer-right"]', "CONTROLLED COPY");
  setValue("[data-hf-page-range]", "all");
  setValue("[data-hf-font-size]", "9");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    dialog: root.getAttribute("data-dialog-id"),
    preview: Array.from(root.querySelectorAll("[data-hf-preview-text]"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean),
    range: root.querySelector("[data-hf-page-range]")?.value
  };
})()
