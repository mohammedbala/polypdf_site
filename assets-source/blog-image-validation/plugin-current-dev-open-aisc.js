(() => {
  const button = [...document.querySelectorAll("button.plugin-panel-run")].find(
    (candidate) => candidate.offsetParent !== null && /Insert AISC Steel Section/i.test(candidate.textContent ?? "")
  );
  if (!(button instanceof HTMLButtonElement)) throw new Error("Visible AISC generator command was not found.");
  button.click();
  return { opened: true, command: button.textContent?.replace(/\s+/g, " ").trim() ?? "" };
})()
