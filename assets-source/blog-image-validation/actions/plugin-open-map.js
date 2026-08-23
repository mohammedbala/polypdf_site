(() => {
  const button = [...document.querySelectorAll("button.plugin-panel-run")].find(
    (candidate) => candidate.offsetParent !== null && /Insert Map/i.test(candidate.textContent ?? "")
  );
  if (!(button instanceof HTMLButtonElement)) throw new Error("Visible PDF Maps command was not found.");
  button.click();
  return { opened: true, command: button.textContent?.replace(/\s+/g, " ").trim() ?? "" };
})()
