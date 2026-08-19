(async () => {
  const root = document.querySelector('[data-dialog-id="pluginGenerator"]');
  if (!(root instanceof HTMLElement)) throw new Error("AISC generator is not open.");
  const before = window.polyPDFAutomation.annotations();
  const button = root.querySelector("[data-dialog-confirm]");
  if (!(button instanceof HTMLButtonElement) || button.disabled) throw new Error("Enabled AISC Insert button was not found.");
  button.click();
  const annotations = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 12000;
    const poll = () => {
      const current = window.polyPDFAutomation.annotations();
      const generated = current.find(
        (annotation) => annotation.pluginProvenance?.pluginId === "com.polypdf.steel-sections"
      );
      if (!document.querySelector('[data-dialog-id="pluginGenerator"]') && current.length === before.length + 1 && generated) {
        resolve(current);
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`AISC output was not committed (before=${before.length}, current=${current.length}).`));
        return;
      }
      setTimeout(poll, 100);
    };
    poll();
  });
  const generated = annotations.find(
    (annotation) => annotation.pluginProvenance?.pluginId === "com.polypdf.steel-sections"
  );
  const element = document.querySelector(`[data-annotation-id="${CSS.escape(generated.id)}"]`);
  element?.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const visible = element instanceof HTMLElement && element.offsetParent !== null;
  const rect = element instanceof HTMLElement ? element.getBoundingClientRect() : null;
  return {
    beforeCount: before.length,
    afterCount: annotations.length,
    generated: {
      id: generated.id,
      kind: generated.kind,
      tool: generated.tool,
      page: generated.page,
      label: generated.label,
      strokeColor: generated.strokeColor,
      lineWidth: generated.lineWidth,
      pluginProvenance: generated.pluginProvenance
    },
    visible,
    selected: element?.classList.contains("selected") ?? false,
    rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
  };
})()
