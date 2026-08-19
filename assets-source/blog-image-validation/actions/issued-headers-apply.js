(async () => {
  const root = document.querySelector('[data-dialog-id="headersFooters"]');
  if (!root) throw new Error("Headers & Footers dialog is not open");
  const button = root.querySelector('[data-dialog-confirm][data-dialog-default]:not([disabled])');
  if (!(button instanceof HTMLButtonElement)) throw new Error("Headers & Footers Apply button is unavailable");
  button.click();
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 25000;
    const poll = () => {
      if (!document.querySelector('[data-dialog-id="headersFooters"]')) return resolve(true);
      if (Date.now() >= deadline) return reject(new Error("Headers & Footers did not finish"));
      setTimeout(poll, 100);
    };
    poll();
  });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { applied: true };
})()
