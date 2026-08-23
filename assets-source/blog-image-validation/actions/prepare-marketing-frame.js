(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const visibleRect = (element) => {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (
      rect.width <= 0
      || rect.height <= 0
      || style.display === 'none'
      || style.visibility === 'hidden'
      || Number(style.opacity) === 0
    ) return null;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  };

  // Visual manifests are useful for deterministic demo content, but their capture-only layout is
  // intentionally not the shipping app layout. Publication screenshots must return to the normal
  // renderer chrome before they are framed.
  document.body.classList.remove('visual-capture', 'visual-window-capture');
  window.dispatchEvent(new Event('resize'));
  await nextPaint();
  await sleep(450);

  const documentName = document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent?.trim() ?? '';
  if (documentName === 'takeoff-demo.pdf') {
    const recordsTab = document.querySelector('#measurements-view-records-tab');
    if (recordsTab instanceof HTMLButtonElement && recordsTab.getAttribute('aria-selected') !== 'true') {
      recordsTab.click();
      await nextPaint();
    }
    const closeMarkupTable = document.querySelector('#markup-table-close');
    if (closeMarkupTable instanceof HTMLButtonElement) {
      closeMarkupTable.click();
      await nextPaint();
    }
  }

  const fitPage = document.querySelector('[data-footer-action="fit-page"]');
  if (!(fitPage instanceof HTMLButtonElement) || fitPage.disabled) {
    throw new Error('The shipping Fit Page control is unavailable.');
  }
  fitPage.click();
  await nextPaint();

  const deadline = Date.now() + 12000;
  let facts;
  do {
    const toolbar = document.querySelector('#annotation-toolbar');
    const toolbarMain = toolbar?.querySelector('.toolbar-main-actions');
    const toolbarButtons = [...(toolbarMain?.querySelectorAll('.toolbar-button') ?? [])];
    const toolbarIcons = toolbarButtons
      .flatMap((button) => [...button.querySelectorAll('svg')])
      .filter((icon) => visibleRect(icon));
    const styleToolbar = document.querySelector('#style-toolbar');
    const styleTrack = styleToolbar?.querySelector('[data-style-toolbar-track]');
    const scroller = document.querySelector('#canvas-scroller');
    const page = scroller?.querySelector('.page-shell');
    const pageCanvases = [...(page?.querySelectorAll('canvas') ?? [])]
      .filter((canvas) => visibleRect(canvas));
    const toolbarRect = visibleRect(toolbar);
    const toolbarMainRect = visibleRect(toolbarMain);
    const styleToolbarRect = visibleRect(styleToolbar);
    const scrollerRect = visibleRect(scroller);
    const pageRect = visibleRect(page);
    const pageCenterDelta = scrollerRect && pageRect
      ? {
          x: Math.abs((pageRect.left + pageRect.right - scrollerRect.left - scrollerRect.right) / 2),
          y: Math.abs((pageRect.top + pageRect.bottom - scrollerRect.top - scrollerRect.bottom) / 2)
        }
      : { x: Infinity, y: Infinity };
    const pageFullyVisible = Boolean(
      scrollerRect
      && pageRect
      && pageRect.left >= scrollerRect.left - 2
      && pageRect.top >= scrollerRect.top - 2
      && pageRect.right <= scrollerRect.right + 2
      && pageRect.bottom <= scrollerRect.bottom + 2
    );
    const pageCoverage = scrollerRect && pageRect
      ? (pageRect.width * pageRect.height) / (scrollerRect.width * scrollerRect.height)
      : 0;
    const sharpPageTiles = pageCanvases.filter((canvas) => canvas.classList.contains('pdf-page-tile-canvas'));
    const canvasIsSharp = sharpPageTiles.length > 0
      && sharpPageTiles.every((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return canvas.width >= Math.round(rect.width * devicePixelRatio * 0.9)
          && canvas.height >= Math.round(rect.height * devicePixelRatio * 0.9);
      });
    facts = {
      bodyClasses: document.body.className,
      toolbarRect,
      toolbarMainRect,
      toolbarButtonCount: toolbarButtons.length,
      visibleToolbarIconCount: toolbarIcons.length,
      styleToolbarRect,
      styleToolbarOverflow: styleTrack instanceof HTMLElement
        ? {
            clientWidth: styleTrack.clientWidth,
            scrollWidth: styleTrack.scrollWidth,
            scrollLeft: styleTrack.scrollLeft,
            overflowing: styleTrack.scrollWidth > styleTrack.clientWidth + 1
          }
        : null,
      scrollerRect,
      pageRect,
      pageCenterDelta,
      pageFullyVisible,
      pageCoverage,
      canvases: pageCanvases.map((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return {
          className: canvas.className,
          width: canvas.width,
          height: canvas.height,
          cssWidth: rect.width,
          cssHeight: rect.height
        };
      }),
      canvasIsSharp,
      documentName
    };
    if (
      toolbarRect
      && toolbarMainRect
      && toolbarButtons.length >= 30
      && toolbarIcons.length >= 30
      && styleToolbarRect
      && pageFullyVisible
      && pageCenterDelta.x <= 4
      && pageCenterDelta.y <= 4
      && pageCoverage >= 0.36
      && canvasIsSharp
    ) return { passes: true, ...facts };
    await sleep(180);
  } while (Date.now() < deadline);

  throw new Error(`Marketing-frame preparation failed: ${JSON.stringify(facts)}`);
})()
