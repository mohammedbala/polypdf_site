(async () => {
  const before = window.polyPDFAutomation.annotations().length;
  let attempts = 0;
  let after = before;
  while (after >= before && attempts < 4) {
    attempts += 1;
    window.polyPDFAutomation.menuCommand({ type: "edit", command: "undo" });
    await new Promise((resolve) => setTimeout(resolve, 450));
    after = window.polyPDFAutomation.annotations().length;
  }
  if (after >= before) throw new Error(`Undo did not reduce annotation count from ${before} after ${attempts} attempts.`);
  return { before, after, attempts };
})()
