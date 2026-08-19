(async () => {
  const root = document.querySelector('[data-dialog-id="batesNumbering"]');
  if (!root) throw new Error("Bates Numbering dialog is not open");
  const button = root.querySelector('[data-dialog-confirm][data-dialog-default]:not([disabled])');
  if (!(button instanceof HTMLButtonElement)) throw new Error("Bates Apply button is unavailable");
  button.click();
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    const poll = () => {
      if (!document.querySelector('[data-dialog-id="batesNumbering"]')) return resolve(true);
      if (Date.now() >= deadline) return reject(new Error("Bates Numbering did not finish"));
      setTimeout(poll, 100);
    };
    poll();
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    activeDocument: document.querySelector(".primary-tab-strip [data-document-tab-id].active .tab-label")?.textContent?.trim(),
    status: document.querySelector(".status-message, [data-status-message]")?.textContent?.trim() ?? "",
    dialogOpen: Boolean(document.querySelector('[data-dialog-id="batesNumbering"]'))
  };
})()
