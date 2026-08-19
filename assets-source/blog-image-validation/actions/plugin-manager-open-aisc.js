(async () => {
  const button = Array.from(document.querySelectorAll("button.list-open"))
    .find((candidate) => candidate.textContent?.trim() === "AISC Steel Sections");
  if (!(button instanceof HTMLButtonElement)) throw new Error("AISC plugin row was not found");
  button.click();
  const heading = await new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const poll = () => {
      const node = document.querySelector(".detail-name");
      if (node?.textContent?.includes("AISC Steel Sections")) return resolve(node);
      if (Date.now() >= deadline) return reject(new Error("AISC detail did not load"));
      setTimeout(poll, 75);
    };
    poll();
  });
  return {
    heading: heading.textContent?.trim(),
    text: document.querySelector(".detail")?.innerText.slice(0, 4000)
  };
})()
