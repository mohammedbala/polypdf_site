(() => ({
  buttons: [...document.querySelectorAll('button')]
    .filter((button) => button instanceof HTMLElement && button.offsetParent !== null)
    .slice(0, 90)
    .map((button) => ({
      text: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      title: button.getAttribute('title') ?? '',
      ariaLabel: button.getAttribute('aria-label') ?? '',
      id: button.id,
      className: button.className,
      data: Object.fromEntries([...button.attributes]
        .filter((attribute) => attribute.name.startsWith('data-'))
        .map((attribute) => [attribute.name, attribute.value]))
    }))
}))()
