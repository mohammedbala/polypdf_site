'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function registerLibraryCopy(manifest, localeId) {
  const file = path.join(__dirname, `library-copy-${localeId}.json`);
  const profile = JSON.parse(fs.readFileSync(file));
  const pack = manifest.locales[localeId];
  if (!pack || profile.locale !== pack.appLocale || profile.region !== pack.region) {
    throw new Error(`Wrong library copy locale: ${localeId}`);
  }
  for (const [key, copy] of Object.entries(profile.text)) {
    if (!/^(library|exercise)\./.test(key) || !copy.source?.trim() || !copy.target?.trim()) {
      throw new Error(`Invalid library copy: ${key}`);
    }
  }
  for (const [source, alt] of Object.entries(profile.previews)) {
    const asset = pack.assets[source];
    if (!asset || asset.locale !== profile.locale || asset.region !== profile.region
        || asset.status !== 'verified' || !alt.trim()) {
      throw new Error(`Missing verified library preview: ${source}`);
    }
    asset.alt = alt;
  }
  pack.regionalText = {...pack.regionalText, ...profile.text};
}

if (require.main === module) {
  const localeId = process.argv[2];
  if (!localeId) throw new Error('Pass the regional locale ID.');
  const file = path.join(root, 'src/localization/walkthrough-media.json');
  const manifest = JSON.parse(fs.readFileSync(file));
  registerLibraryCopy(manifest, localeId);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Registered source-bound ${localeId} library copy; pack and route status unchanged.`);
}
module.exports = {registerLibraryCopy};
