(async () => {
  const root = document.querySelector('.plugin-sidebar-editor, [data-dialog-id="pluginGenerator"]');
  if (!(root instanceof HTMLElement)) throw new Error('PDF Maps editor is not open.');
  const location = root.querySelector('#plugin-field-location');
  const zoom = root.querySelector('#maps-insert-zoom');
  if (!(location instanceof HTMLInputElement) || !(zoom instanceof HTMLInputElement)) {
    throw new Error('PDF Maps location or zoom control is missing.');
  }
  location.value = 'New York, NY';
  location.dispatchEvent(new Event('input', { bubbles: true }));
  location.dispatchEvent(new Event('change', { bubbles: true }));
  const street = root.querySelector('[data-maps-insert-zoom-stop="16"]');
  if (street instanceof HTMLElement) street.click();
  await new Promise((resolve) => setTimeout(resolve, 1200));
  (root.querySelector('.plugin-sidebar-editor-body, .app-dialog-body') ?? root).scrollTo?.({ top: 0, behavior: 'instant' });
  return {
    location: location.value,
    zoom: zoom.value,
    bases: [...root.querySelectorAll('[data-maps-insert-base]')].map((chip) => ({
      id: chip.getAttribute('data-maps-insert-base'),
      active: chip.classList.contains('is-active')
    })),
    insertEnabled: !(root.querySelector('.plugin-sidebar-editor-confirm, [data-dialog-confirm]')?.disabled ?? true)
  };
})()
