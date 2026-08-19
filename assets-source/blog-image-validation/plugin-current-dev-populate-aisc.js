(() => {
  const root = document.querySelector('[data-dialog-id="pluginGenerator"]');
  if (!(root instanceof HTMLElement)) throw new Error("AISC generator is not open.");
  const setValue = (selector, value) => {
    const control = root.querySelector(selector);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
      throw new Error(`Missing AISC control ${selector}`);
    }
    control.value = value;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    if (control.value !== value) throw new Error(`AISC control ${selector} rejected ${value}`);
  };
  setValue("#plugin-field-designation", "W24×55");
  setValue("#plugin-field-unitSystem", "customary");
  setValue("#plugin-field-drawingScale", "1\" = 1'-0\"");
  setValue("#plugin-field-lineWidth", "2");
  setValue("#plugin-field-strokeColor", "#1a4d8f");
  root.querySelector(".app-dialog-body")?.scrollTo({ top: 0, behavior: "instant" });
  return {
    title: root.querySelector("h1, h2, h3")?.textContent?.trim() ?? "",
    values: Object.fromEntries(
      [...root.querySelectorAll("#plugin-field-designation, #plugin-field-unitSystem, #plugin-field-drawingScale, #plugin-field-lineWidth, #plugin-field-strokeColor")]
        .map((control) => [control.id, control.value])
    ),
    insertEnabled: !(root.querySelector("[data-dialog-confirm]")?.disabled ?? true)
  };
})()
