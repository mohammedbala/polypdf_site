export async function loadToolLanguage(document, fetcher = fetch) {
  const element = document.getElementById('pdf-tool-language');
  if (!element) return undefined;
  const payload = JSON.parse(element.textContent);
  if (!/^\/tools\/i18n\/[a-z-]+\.[a-f0-9]{12}\.json$/.test(payload.src)) throw new Error('Invalid language resource.');
  const response = await fetcher(payload.src, {credentials:'same-origin'});
  if (!response.ok) throw new Error('Language resource unavailable.');
  const dictionary = await response.json();
  if (dictionary.locale !== payload.locale || !dictionary.strings || typeof dictionary.strings !== 'object') throw new Error('Invalid language data.');
  return dictionary.strings;
}
