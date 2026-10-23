(() => ({
  pageScaleText: document.querySelector('.measurement-card .page-scale-status')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  cardText: document.querySelector('.measurement-card')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  dialogId: document.querySelector('[data-dialog-id]')?.getAttribute('data-dialog-id') ?? '',
  dialogText: document.querySelector('[data-dialog-id]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  annotations: window.polyPDFAutomation.annotations()
}))()
