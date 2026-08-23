(async () => {
  await window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: 'dark' });
  const annotation = document.querySelector('[data-annotation-id="piedmont-paving-area"]');
  if (!(annotation instanceof HTMLElement)) throw new Error('Auto Area evidence annotation is unavailable.');
  annotation.click();
  const helper = document.querySelector('[data-footer-action="toggle-helper-dimensions"]');
  if (!(helper instanceof HTMLElement)) throw new Error('Helper Dimensions control is unavailable.');
  if (!helper.classList.contains('active')) helper.click();
  await new Promise((resolve) => setTimeout(resolve, 700));
  const updatedHelper = document.querySelector('[data-footer-action="toggle-helper-dimensions"]');
  return {
    selected: annotation.classList.contains('selected'),
    helperDimensions: updatedHelper?.classList.contains('active') ?? false,
    label: annotation.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    cutouts: window.polyPDFAutomation.annotations().find((item) => item.id === 'piedmont-paving-area')?.areaCutouts?.length ?? 0
  };
})()
