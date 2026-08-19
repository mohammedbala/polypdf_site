(() => {
  const visible = (node) => node instanceof HTMLElement && node.offsetParent !== null;
  const firstCommand = [...document.querySelectorAll("button.plugin-panel-run")].find(visible);
  const panel = firstCommand?.closest("section, aside, .panel-content, .sidebar-panel")
    ?? [...document.querySelectorAll("section, aside")].find(
      (node) => visible(node) && /Plugins/i.test(node.textContent ?? "")
    );
  const dialog = document.querySelector('[data-dialog-id="pluginGenerator"]');
  return {
    activePanel: document.querySelector(".rail-button.active")?.getAttribute("data-panel") ?? "",
    panelText: panel?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    pluginCommands: [...document.querySelectorAll("button.plugin-panel-run")].filter(visible).map((button) => ({
      text: button.textContent?.replace(/\s+/g, " ").trim() ?? "",
      disabled: button.disabled,
      attributes: Object.fromEntries(
        [...button.attributes]
          .filter((attribute) => attribute.name.startsWith("data-"))
          .map((attribute) => [attribute.name, attribute.value])
      )
    })),
    dialogId: document.querySelector("[data-dialog-id]")?.getAttribute("data-dialog-id") ?? "",
    dialogText: dialog?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    dialogControls: [...(dialog?.querySelectorAll("input, select, textarea") ?? [])].map((control) => ({
      tag: control.tagName,
      id: control.id,
      type: control.getAttribute("type") ?? "",
      value: control.value,
      options: control instanceof HTMLSelectElement
        ? [...control.options].map((option) => ({ value: option.value, text: option.textContent?.trim() ?? "", selected: option.selected }))
        : undefined
    })),
    visibleAnnotations: [...document.querySelectorAll(".annotation-box")].filter(visible).map((node) => ({
      id: node.getAttribute("data-annotation-id") ?? "",
      className: node.className,
      text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
      images: node.querySelectorAll("img").length,
      rect: (() => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })()
    }))
  };
})()
