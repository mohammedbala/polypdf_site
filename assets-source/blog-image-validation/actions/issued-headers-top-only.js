(async () => {
  await window.polyPDFAutomation.menuCommand({ type: "documentDialog", dialog: "headersFooters" });
  const root = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const poll = () => {
      const element = document.querySelector('[data-dialog-id="headersFooters"]');
      if (element) return resolve(element);
      if (Date.now() >= deadline) return reject(new Error("Headers & Footers dialog did not reopen"));
      setTimeout(poll, 75);
    };
    poll();
  });
  for (const key of ["footer-left", "footer-center", "footer-right"]) {
    const input = root.querySelector(`[data-hf-field="${key}"]`);
    if (!(input instanceof HTMLInputElement)) throw new Error(`Missing ${key}`);
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
  const button = root.querySelector('[data-dialog-confirm][data-dialog-default]:not([disabled])');
  if (!(button instanceof HTMLButtonElement)) throw new Error("Apply unavailable");
  button.click();
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 25000;
    const poll = () => {
      if (!document.querySelector('[data-dialog-id="headersFooters"]')) return resolve(true);
      if (Date.now() >= deadline) return reject(new Error("Top-only headers did not finish"));
      setTimeout(poll, 100);
    };
    poll();
  });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { applied: "top-only" };
})()
