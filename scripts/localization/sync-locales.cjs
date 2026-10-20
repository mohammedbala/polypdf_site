#!/usr/bin/env node
// Import the product's canonical registry explicitly; production builds are offline.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const index = process.argv.indexOf('--app-root');
if (index < 0 || !process.argv[index + 1]) throw new Error('Supply --app-root pointing to the polypdf workspace.');
const source = path.resolve(process.argv[index + 1], 'packages/core/src/locales/registry.json');
const bytes = fs.readFileSync(source);
const locales = JSON.parse(bytes);
if (new Set(locales.map(locale => locale.tag)).size !== locales.length) throw new Error('Duplicate product locale.');
fs.mkdirSync(path.join(root, 'src/localization'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/localization/product-locales.json'), JSON.stringify({
  source: 'PolyPDF packages/core/src/locales/registry.json',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'), locales
}, null, 2) + '\n');
console.log(`Imported ${locales.length} product locales.`);
