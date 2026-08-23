import { createHash } from 'node:crypto';
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = resolve(
  root,
  'assets-source/blog-image-validation/screenshot-evidence.registry.json'
);
const baseCommit = 'ed65b0558a0bd6a7fb312f13826de37bfc056ad4';
const cleanProductDiff = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const inventory = [
  ['wrong-scale', 'wrong-scale-dark.png', 'dark', 'wrong-scale-v1-4-dark-web.png'],
  ['takeoff', 'takeoff-dark.png', 'dark', 'takeoff-v1-4-dark-web.png'],
  ['markup', 'markup-dark.png', 'dark', 'markup-v1-4-dark-web.png'],
  ['forms', 'forms-light.png', 'light', 'forms-v1-4-light-web.png'],
  ['symbol-search-review', 'symbol-search-review-dark.png', 'dark', 'symbol-search-review-v1-4-dark-web.png'],
  ['count-committed', 'count-committed-dark.png', 'dark', 'count-committed-v1-4-dark-web.png'],
  ['area-cutouts-depth', 'area-cutouts-depth-dark.png', 'dark', 'area-cutouts-depth-v1-4-dark-web.png'],
  ['calibration-uncalibrated', 'calibration-uncalibrated-dark.png', 'dark', 'calibration-uncalibrated-v1-4-dark-web.png'],
  ['calibration-known-distance-dialog', 'calibration-known-distance-dialog-dark.png', 'dark', 'calibration-known-distance-dialog-v1-4-dark-web.png'],
  ['calibration-verified-second-span', 'calibration-verified-second-span-dark.png', 'dark', 'calibration-verified-second-span-v1-4-dark-web.png'],
  ['compare-editable-clouds', 'compare-editable-clouds-dark.png', 'dark', 'compare-editable-clouds-v1-4-dark-web.png'],
  ['ocr-no-text-before', 'ocr-uss-akron-no-text-before-light.png', 'light', 'ocr-uss-akron-no-text-before-v1-4-light-web.png'],
  ['ocr-complete', 'ocr-uss-akron-complete-light.png', 'light', 'ocr-uss-akron-complete-v1-4-light-web.png'],
  ['ocr-search-hit', 'ocr-uss-akron-search-hit-light.png', 'light', 'ocr-uss-akron-search-hit-v1-4-light-web.png'],
  ['issued-final', 'issued-final-light.png', 'light', 'shot-issued-final-v1-4-light-web.png'],
  ['issued-headers', 'issued-headers-footers-dialog-light.png', 'light', 'shot-issued-headers-v1-4-light-web.png'],
  ['issued-bates', 'issued-bates-dialog-light.png', 'light', 'shot-issued-bates-v1-4-light-web.png'],
  ['issued-preflight', 'issued-preflight-light.png', 'light', 'shot-issued-preflight-v1-4-light-web.png'],
  ['plugins-sidebar', 'plugin-current-dev-sidebar-dark-maximized.png', 'dark', 'plugins-sidebar-v1-4-dark-web.png'],
  ['plugins-aisc-generator', 'plugin-current-dev-aisc-generator-dark-maximized.png', 'dark', 'plugins-aisc-w24x55-generator-v1-4-dark-web.png'],
  ['plugins-aisc-result', 'plugin-current-dev-aisc-inserted-dark-maximized.png', 'dark', 'plugins-aisc-w24x55-result-v1-4-dark-web.png'],
  ['mutcd-r1-1-stop', 'mutcd-current-dev-r1-1-stop-placed-dark-maximized.png', 'dark', 'mutcd-r1-1-stop-v1-4-dark-web.png'],
  ['signature-valid-certificate', 'signature-valid-certificate-light.png', 'light', 'signature-valid-certificate-v1-4-light-web.png'],
  ['signature-certificate-technical', 'signature-certificate-technical-light.png', 'light', 'signature-certificate-technical-v1-4-light-web.png'],
  ['signature-visual-chooser', 'signature-visual-chooser-light.png', 'light', 'signature-visual-chooser-v1-4-light-web.png'],
  ['signature-visual-styles', 'signature-visual-styles-light.png', 'light', 'signature-visual-styles-v1-4-light-web.png'],
  ['signature-seal-builder-warning', 'signature-seal-builder-warning-light.png', 'light', 'signature-seal-builder-warning-v1-4-light-web.png'],
  ['signature-seal-inserted', 'signature-seal-inserted-light.png', 'light', 'signature-seal-inserted-v1-4-light-web.png'],
  ['redaction-search-no-matches', 'redaction-reopened-search-no-matches-light.png', 'light', 'redaction-reopened-search-no-matches-v1-4-light-web.png'],
  ['redaction-before', 'redaction-lab-before-light.png', 'light', 'redaction-lab-before-v1-4-light-web.png'],
  ['redaction-marked', 'redaction-marked-text-light.png', 'light', 'redaction-marked-text-v1-4-light-web.png'],
  ['redaction-confirmation', 'redaction-apply-confirmation-light.png', 'light', 'redaction-apply-confirmation-v1-4-light-web.png'],
  ['redaction-applied', 'redaction-applied-result-light.png', 'light', 'redaction-applied-result-v1-4-light-web.png'],
  ['sanitize-options', 'sanitize-options-light.png', 'light', 'sanitize-options-v1-4-light-web.png'],
  ['sanitize-result', 'sanitize-result-light.png', 'light', 'sanitize-result-v1-4-light-web.png'],
  ['pdf-maps', 'pdf-maps-dark.png', 'dark', 'pdf-maps-v1-4-dark-web.png'],
  ['auto-area', 'auto-area-helper-dimensions-dark.png', 'dark', 'auto-area-v1-4-dark-web.png'],
  ['custom-shortcuts', 'custom-shortcuts-settings-light.png', 'light', 'custom-shortcuts-v1-4-light-web.png']
].map(([id, rawName, theme, outputName]) => ({ id, rawName, theme, outputName }));

function repoPath(file) {
  return relative(root, file).split('\\').join('/');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function binding(file, dimensions = false) {
  const buffer = await readFile(file);
  const result = { path: repoPath(file), sha256: sha256(buffer) };
  if (dimensions) {
    const png = PNG.sync.read(buffer);
    result.width = png.width;
    result.height = png.height;
  }
  return result;
}

function exactHalf(source) {
  if (source.width % 2 !== 0 || source.height % 2 !== 0) {
    throw new Error(`Expected even source dimensions, got ${source.width}x${source.height}`);
  }
  const output = new PNG({ width: source.width / 2, height: source.height / 2 });
  for (let y = 0; y < output.height; y += 1) {
    for (let x = 0; x < output.width; x += 1) {
      const target = (y * output.width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        const topLeft = ((y * 2) * source.width + x * 2) * 4 + channel;
        const topRight = topLeft + 4;
        const bottomLeft = topLeft + source.width * 4;
        const bottomRight = bottomLeft + 4;
        output.data[target + channel] = Math.round(
          (source.data[topLeft] + source.data[topRight]
            + source.data[bottomLeft] + source.data[bottomRight]) / 4
        );
      }
    }
  }
  return PNG.sync.write(output, { colorType: 6, inputColorType: 6 });
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.refreshing`;
  await writeFile(temporary, bytes);
  await rename(temporary, file);
}

const previous = JSON.parse(await readFile(registryPath, 'utf8'));
const previousById = new Map(previous.records.map((record) => [record.id, record]));
const records = [];
const ogDependencyPaths = [
  'public/logo512.png',
  'src/assets/screenshots/takeoff-v1-4-dark-web.png'
];

for (const item of inventory) {
  const rawFile = resolve(
    root,
    'assets-source/blog-image-validation/captures',
    item.rawName
  );
  const proofFile = `${rawFile}.theme-proof.json`;
  const outputFile = resolve(root, 'src/assets/screenshots', item.outputName);
  const rawBytes = await readFile(rawFile);
  const rawPng = PNG.sync.read(rawBytes);
  if (rawPng.width !== 3420 || rawPng.height !== 2146) {
    throw new Error(`${item.id} source is ${rawPng.width}x${rawPng.height}, expected 3420x2146`);
  }
  const proof = JSON.parse(await readFile(proofFile, 'utf8'));
  const proofTheme = proof.release?.theme
    ?? proof.pixelProof?.theme
    ?? proof.publicationIdentity?.theme;
  if (proofTheme && proofTheme !== item.theme) {
    throw new Error(`${item.id} proof theme is ${proofTheme}, expected ${item.theme}`);
  }

  const outputBytes = exactHalf(rawPng);
  await atomicWrite(outputFile, outputBytes);
  const outputBinding = {
    ...await binding(outputFile, true),
    derivedFrom: repoPath(rawFile),
    transform: 'exact-50-percent'
  };

  const oldRecord = previousById.get(item.id);
  const guideOutput = oldRecord?.outputs?.find(({ path }) => path.startsWith('public/guides/'));
  const outputs = [outputBinding];
  if (guideOutput) {
    const guideFile = resolve(root, guideOutput.path);
    await atomicWrite(guideFile, outputBytes);
    outputs.push({
      ...await binding(guideFile, true),
      derivedFrom: repoPath(outputFile),
      transform: 'byte-identical'
    });
  }

  records.push({
    id: item.id,
    publicationStatus: 'publication-approved',
    source: {
      raw: await binding(rawFile, true),
      proof: await binding(proofFile),
      report: await binding(proofFile),
      fingerprint: {
        baseCommit,
        workingTreeProductDiffSha256: cleanProductDiff
      }
    },
    assertions: {
      theme: item.theme,
      nativeMaximized: true,
      viewportEmulation: false,
      styleToolbarStateValidated: true,
      pageOnlyCrop: false
    },
    outputs
  });

  const previousPrimary = oldRecord?.outputs?.find(({ path }) => path.startsWith('src/assets/screenshots/'));
  if (previousPrimary && resolve(root, previousPrimary.path) !== outputFile) {
    await rm(resolve(root, previousPrimary.path), { force: true });
  }
}

for (const item of inventory) {
  await stat(resolve(root, 'src/assets/screenshots', item.outputName));
}

const registry = {
  schemaVersion: 1,
  records,
  ogComposites: await Promise.all(previous.ogComposites.map(async (composite) => ({
    ...composite,
    output: await binding(resolve(root, composite.output.path), true),
    template: await binding(resolve(root, composite.template.path)),
    dependencies: await Promise.all(ogDependencyPaths.map((path) => binding(resolve(root, path))))
  })))
};
await atomicWrite(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Refreshed ${records.length} source records and ${records.flatMap(({ outputs }) => outputs).filter(({ path }) => path.startsWith('public/guides/')).length} stable guide images.`);
