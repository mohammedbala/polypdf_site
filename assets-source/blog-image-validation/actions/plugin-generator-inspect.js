(() => {
  const root = document.querySelector('[data-dialog-id="pluginGenerator"]');
  return {
    inputs: Array.from(root?.querySelectorAll("input, select, textarea") ?? []).map((control) => ({
      tag: control.tagName,
      type: control.getAttribute("type"),
      value: control.value,
      name: control.getAttribute("name"),
      id: control.id,
      className: control.className,
      data: { ...control.dataset },
      placeholder: control.getAttribute("placeholder")
    })),
    buttons: Array.from(root?.querySelectorAll("button") ?? []).map((button) => ({
      text: button.textContent?.trim(),
      disabled: button.disabled,
      className: button.className,
      data: { ...button.dataset }
    }))
  };
})()
