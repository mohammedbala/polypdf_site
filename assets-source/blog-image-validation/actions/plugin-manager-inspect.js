(() => ({
  title: document.title,
  bodyClass: document.body.className,
  htmlClass: document.documentElement.className,
  bodyText: document.body.innerText.slice(0, 5000),
  buttons: Array.from(document.querySelectorAll("button")).map((button) => ({
    text: button.textContent?.trim(),
    className: button.className,
    data: { ...button.dataset }
  })),
  rows: Array.from(document.querySelectorAll("[data-plugin-id]")).map((node) => ({
    tag: node.tagName,
    className: node.className,
    pluginId: node.getAttribute("data-plugin-id"),
    text: node.textContent?.trim()
  }))
}))()
