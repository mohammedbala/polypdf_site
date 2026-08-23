(async () => {
  await window.polyPDFAutomation.menuCommand({ type: "appearance", mode: "light" });
  await window.polyPDFAutomation.menuCommand({ type: "documentDialog", dialog: "batesNumbering" });
  const root = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const poll = () => {
      const element = document.querySelector('[data-dialog-id="batesNumbering"]');
      if (element) return resolve(element);
      if (Date.now() >= deadline) return reject(new Error("Bates Numbering dialog did not open"));
      setTimeout(poll, 75);
    };
    poll();
  });
  const setValue = (selector, value) => {
    const control = root.querySelector(selector);
    if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) {
      throw new Error(`Missing Bates control: ${selector}`);
    }
    control.value = String(value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  };
  setValue("[data-bates-page-range]", "all");
  setValue("[data-bates-prefix]", "ISSUED-IFC-");
  setValue("[data-bates-start-number]", "101");
  setValue("[data-bates-digit-count]", "4");
  setValue("[data-bates-suffix]", "");
  setValue("[data-bates-placement]", "footer-right");
  setValue("[data-bates-font-family]", "Helvetica");
  setValue("[data-bates-font-size]", "10");
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    dialog: root.getAttribute("data-dialog-id"),
    sample: root.querySelector("[data-bates-sample]")?.textContent?.trim(),
    prefix: root.querySelector("[data-bates-prefix]")?.value,
    start: root.querySelector("[data-bates-start-number]")?.value,
    digits: root.querySelector("[data-bates-digit-count]")?.value,
    placement: root.querySelector("[data-bates-placement]")?.value
  };
})()
