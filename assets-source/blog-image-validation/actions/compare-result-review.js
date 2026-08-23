(async () => {
  await window.polyPDFAutomation.menuCommand({ type: "appearance", mode: "dark" });
  const fitPage = document.querySelector('[data-footer-action="fit-page"]');
  if (fitPage instanceof HTMLElement) fitPage.click();
  const markups = document.querySelector('[data-footer-action="toggle-markup-table"]');
  if (markups instanceof HTMLElement && !markups.classList.contains('active')) markups.click();
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const poll = () => {
      const cloud = document.querySelector('.annotation-box.revisionCloud');
      const rows = document.querySelectorAll('#markup-rows .markup-row').length;
      if (cloud instanceof HTMLElement && rows > 0) {
        cloud.click();
        return resolve(true);
      }
      if (Date.now() >= deadline) return reject(new Error('Compare result did not expose editable clouds'));
      setTimeout(poll, 100);
    };
    poll();
  });
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    clouds: document.querySelectorAll('.annotation-box.revisionCloud').length,
    rows: document.querySelectorAll('#markup-rows .markup-row').length,
    selected: document.querySelectorAll('.annotation-box.revisionCloud.selected').length
  };
})()
