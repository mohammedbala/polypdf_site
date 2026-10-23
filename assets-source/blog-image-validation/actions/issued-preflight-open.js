(async () => {
  await window.polyPDFAutomation.menuCommand({ type: "documentDialog", dialog: "preflightAssessment" });
  const root = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    const poll = () => {
      const element = document.querySelector('[data-dialog-id="preflightAssessment"] [data-preflight-root]');
      const checks = element?.querySelectorAll(".preflight-check").length ?? 0;
      if (element && !element.hasAttribute("data-preflight-loading") && checks === 10) return resolve(element);
      if (Date.now() >= deadline) return reject(new Error(`Preflight did not reach 10 checks (found ${checks})`));
      setTimeout(poll, 100);
    };
    poll();
  });
  return {
    dialog: root.closest("[data-dialog-id]")?.getAttribute("data-dialog-id"),
    checks: root.querySelectorAll(".preflight-check").length,
    fail: root.querySelector('[data-preflight-count="fail"]')?.textContent?.trim(),
    warning: root.querySelector('[data-preflight-count="warning"]')?.textContent?.trim(),
    pass: root.querySelector('[data-preflight-count="pass"]')?.textContent?.trim(),
    info: root.querySelector('[data-preflight-count="info"]')?.textContent?.trim(),
    status: root.querySelector("[data-preflight-status]")?.textContent?.trim()
  };
})()
