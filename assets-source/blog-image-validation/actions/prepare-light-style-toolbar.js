(async () => {
  const dialog = document.querySelector('[data-dialog-id]');
  const cancel = dialog?.querySelector('[data-dialog-cancel]')
    ?? [...(dialog?.querySelectorAll('button') ?? [])].find((button) => /^cancel$/i.test(button.textContent?.trim() ?? ''));
  if (cancel instanceof HTMLElement) cancel.click();
  await new Promise((resolve) => setTimeout(resolve, 250));
  await window.polyPDFAutomation.menuCommand({ type: "appearance", mode: "light" });
  const tool = document.querySelector('[data-toolbar-id="polygon"]');
  if (!(tool instanceof HTMLElement)) throw new Error("Polygon tool is unavailable");
  tool.click();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    prepared: true,
    theme: document.documentElement.dataset.theme,
    documentName: document.querySelector('.primary-tab-strip .tab.active .tab-label')?.textContent?.trim() ?? ''
  };
})()
