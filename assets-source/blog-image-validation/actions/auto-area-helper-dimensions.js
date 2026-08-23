(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await window.polyPDFAutomation.menuCommand({ type: 'appearance', mode: 'dark' });
  document.body.classList.remove('visual-capture', 'visual-window-capture');
  window.dispatchEvent(new Event('resize'));
  await nextPaint();
  await wait(450);
  const presetSelect = document.querySelector('.measurement-preset-row select');
  if (!(presetSelect instanceof HTMLSelectElement)) throw new Error('Page scale preset control is unavailable.');
  const quarterInchPreset = [...presetSelect.options].find((option) =>
    option.textContent?.includes('1/4') && option.textContent?.includes("1'-0")
  );
  if (!quarterInchPreset) throw new Error('The 1/4 inch page scale preset is unavailable.');
  presetSelect.value = quarterInchPreset.value;
  presetSelect.dispatchEvent(new Event('change', { bubbles: true }));
  const applyScale = presetSelect.closest('.scale-path')?.querySelector('button.scale-path-primary');
  if (!(applyScale instanceof HTMLButtonElement)) throw new Error('Apply Scale control is unavailable.');
  applyScale.click();
  await wait(500);
  const closeSidebar = document.querySelector('#sidebar-close');
  if (!(closeSidebar instanceof HTMLButtonElement)) throw new Error('Measurements sidebar close control is unavailable.');
  closeSidebar.click();
  await wait(350);
  const fitPage = document.querySelector('[data-footer-action="fit-page"]');
  if (!(fitPage instanceof HTMLButtonElement)) throw new Error('Fit Page control is unavailable.');
  fitPage.click();
  await wait(700);

  const areaTool = document.querySelector('[data-tool="areaMeasurement"]');
  if (!(areaTool instanceof HTMLButtonElement)) throw new Error('Area tool is unavailable.');
  areaTool.click();
  await wait(180);
  const strokeColor = document.querySelector('[data-style-color="strokeColor"]');
  if (!(strokeColor instanceof HTMLButtonElement)) throw new Error('Area stroke color control is unavailable.');
  strokeColor.click();
  await wait(120);
  const blueSwatch = [...document.querySelectorAll('.style-color-popover .style-popover-swatch')].find((swatch) =>
    getComputedStyle(swatch).backgroundColor === 'rgb(10, 132, 255)'
  );
  if (!(blueSwatch instanceof HTMLButtonElement)) throw new Error('PolyPDF blue area swatch is unavailable.');
  blueSwatch.click();
  await wait(350);

  const overlay = document.querySelector('.page-shell[data-page="1"] .overlay-layer');
  if (!(overlay instanceof HTMLElement)) throw new Error('Auto Area page overlay is unavailable.');
  const overlayRect = overlay.getBoundingClientRect();
  const hoverAt = async (x, y, delay = 100) => {
    overlay.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: overlayRect.left + overlayRect.width * x,
      clientY: overlayRect.top + overlayRect.height * y
    }));
    await wait(delay);
  };

  // Prime the release's PDF-content index over the upper-left room before evaluating candidates.
  await hoverAt(0.29, 0.35, 4200);
  const candidates = [
    [0.29, 0.35],
    [0.29, 0.61],
    [0.61, 0.35],
    [0.61, 0.61],
    [0.38, 0.35],
    [0.38, 0.61],
    [0.54, 0.35],
    [0.54, 0.61]
  ];
  let selectedCandidate = null;
  for (const candidate of candidates) {
    await hoverAt(candidate[0], candidate[1], 180);
    const boundary = overlay.querySelector('.auto-measure-area-boundary polygon');
    const hint = overlay.querySelector('.auto-measure-hint[data-preview="auto-measure"]');
    if (!(boundary instanceof SVGPolygonElement) || !(hint instanceof HTMLElement)) continue;
    const bounds = boundary.getBoundingClientRect();
    const areaRatio = (bounds.width * bounds.height) / Math.max(1, overlayRect.width * overlayRect.height);
    if (areaRatio >= 0.035 && areaRatio <= 0.35) {
      selectedCandidate = candidate;
      break;
    }
  }
  if (!selectedCandidate) throw new Error('No legible enclosed-room Auto Area suggestion was detected.');
  await hoverAt(selectedCandidate[0], selectedCandidate[1], 500);

  const boundary = overlay.querySelector('.auto-measure-area-boundary polygon');
  const preview = overlay.querySelector('.auto-measure-annotation.areaMeasurement');
  const hint = overlay.querySelector('.auto-measure-hint[data-preview="auto-measure"]');
  const activeTool = document.querySelector('[data-tool="areaMeasurement"].active');
  const sidebarClosed = document.querySelector('.sidebar')?.classList.contains('closed') ?? false;
  const pageRect = document.querySelector('.page-shell[data-page="1"]')?.getBoundingClientRect();
  const scrollerRect = document.querySelector('#canvas-scroller')?.getBoundingClientRect();
  const pageCenterDelta = pageRect && scrollerRect
    ? {
        x: Math.abs((pageRect.left + pageRect.width / 2) - (scrollerRect.left + scrollerRect.width / 2)),
        y: Math.abs((pageRect.top + pageRect.height / 2) - (scrollerRect.top + scrollerRect.height / 2))
      }
    : { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
  const pageFullyVisible = Boolean(
    pageRect && scrollerRect
    && pageRect.left >= scrollerRect.left - 2
    && pageRect.top >= scrollerRect.top - 2
    && pageRect.right <= scrollerRect.right + 2
    && pageRect.bottom <= scrollerRect.bottom + 2
  );
  const pageCoverage = pageRect && scrollerRect
    ? (pageRect.width * pageRect.height) / Math.max(1, scrollerRect.width * scrollerRect.height)
    : 0;
  const pageTiles = [...document.querySelectorAll('.page-shell[data-page="1"] .pdf-page-tile-canvas')];
  const canvasIsSharp = pageTiles.length > 0 && pageTiles.every((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return canvas instanceof HTMLCanvasElement
      && canvas.width >= Math.round(rect.width * devicePixelRatio * 0.9)
      && canvas.height >= Math.round(rect.height * devicePixelRatio * 0.9);
  });
  const shippingChrome = !document.body.classList.contains('visual-capture')
    && !document.body.classList.contains('visual-window-capture');
  const toolbarButtons = [...document.querySelectorAll('#annotation-toolbar .toolbar-main-actions .toolbar-button')];
  const visibleToolbarIconCount = toolbarButtons
    .flatMap((button) => [...button.querySelectorAll('svg')])
    .filter((icon) => {
      const rect = icon.getBoundingClientRect();
      const style = getComputedStyle(icon);
      return rect.width >= 12 && rect.height >= 12
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0;
    }).length;
  const scaleReadout = document.querySelector('#footer-page-scale')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const boundaryRect = boundary?.getBoundingClientRect();
  const hintText = hint?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const passes = activeTool instanceof HTMLButtonElement
    && boundary instanceof SVGPolygonElement
    && preview instanceof HTMLElement
    && hint instanceof HTMLElement
    && /capture room/i.test(hintText)
    && !/not scaled/i.test(scaleReadout)
    && sidebarClosed
    && pageCenterDelta.x <= 4
    && pageCenterDelta.y <= 4
    && pageFullyVisible
    && pageCoverage >= 0.6
    && canvasIsSharp
    && shippingChrome
    && Boolean(boundaryRect && boundaryRect.width >= 150 && boundaryRect.height >= 100);
  return {
    passes,
    activeTool: activeTool?.getAttribute('data-tool') ?? '',
    bodyClasses: document.body.className,
    toolbarButtonCount: toolbarButtons.length,
    visibleToolbarIconCount,
    sidebarClosed,
    shippingChrome,
    pageCenterDelta: {
      x: Number.isFinite(pageCenterDelta.x) ? Math.round(pageCenterDelta.x * 10) / 10 : null,
      y: Number.isFinite(pageCenterDelta.y) ? Math.round(pageCenterDelta.y * 10) / 10 : null
    },
    pageFullyVisible,
    pageCoverage: Math.round(pageCoverage * 1000) / 1000,
    canvasIsSharp,
    candidate: selectedCandidate,
    hint: hintText,
    scale: scaleReadout,
    boundary: boundaryRect ? {
      width: Math.round(boundaryRect.width),
      height: Math.round(boundaryRect.height)
    } : null,
    committedAnnotations: window.polyPDFAutomation.annotations().length
  };
})()
