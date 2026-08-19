import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, test } from 'node:test';
import pngjs from 'pngjs';
import {
  DEFAULT_REGISTRY_PATH,
  verifyScreenshotEvidence
} from '../scripts/verify-screenshot-evidence.mjs';

const { PNG } = pngjs;
const temporaryRoots = [];
const BASE_COMMIT = 'a'.repeat(40);
const PRODUCT_DIFF = 'b'.repeat(64);

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
}

async function fileSha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function writeAppPng(path, {
  width,
  height,
  chrome = [38, 40, 43],
  body = [49, 52, 55],
  structured = true,
  variant = 0
}) {
  const png = new PNG({ width, height });
  const chromeRows = Math.max(1, Math.round(height * 0.1));
  for (let y = 0; y < height; y += 1) {
    const color = y < chromeRows ? chrome : body;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      png.data[index] = color[0];
      png.data[index + 1] = color[1];
      png.data[index + 2] = color[2];
      png.data[index + 3] = 255;
    }
  }
  if (structured) {
    const pageLeft = Math.round(width * (variant === 0 ? 0.27 : 0.34));
    const pageRight = Math.round(width * (variant === 0 ? 0.86 : 0.92));
    const pageTop = Math.round(height * 0.18);
    const pageBottom = Math.round(height * 0.88);
    const cellWidth = Math.max(4, Math.round((pageRight - pageLeft) / 28));
    const cellHeight = Math.max(4, Math.round((pageBottom - pageTop) / 22));
    for (let y = pageTop; y < pageBottom; y += 1) {
      for (let x = pageLeft; x < pageRight; x += 1) {
        const column = Math.floor((x - pageLeft) / cellWidth);
        const row = Math.floor((y - pageTop) / cellHeight);
        const index = (y * width + x) * 4;
        png.data[index] = Math.min(248, 132 + ((column * 17 + row * 5 + variant * 31) % 112));
        png.data[index + 1] = Math.min(248, 142 + ((column * 7 + row * 19 + variant * 13) % 102));
        png.data[index + 2] = Math.min(248, 150 + ((column * 13 + row * 11 + variant * 23) % 96));
      }
    }
    const railRight = Math.round(width * 0.18);
    for (let y = Math.round(height * 0.16); y < Math.round(height * 0.84); y += 1) {
      for (let x = Math.round(width * 0.025); x < railRight; x += 1) {
        if ((Math.floor(y / Math.max(5, height * 0.025)) + Math.floor(x / 9)) % 4 !== 0) {
          continue;
        }
        const index = (y * width + x) * 4;
        png.data[index] = 70 + (x % 37);
        png.data[index + 1] = 76 + (y % 41);
        png.data[index + 2] = 82 + ((x + y) % 43);
      }
    }
  }
  await writeFile(path, PNG.sync.write(png));
}

async function writeHalfDerivative(sourcePath, outputPath) {
  const source = PNG.sync.read(await readFile(sourcePath));
  assert.equal(source.width % 2, 0);
  assert.equal(source.height % 2, 0);
  const output = new PNG({ width: source.width / 2, height: source.height / 2 });
  for (let y = 0; y < output.height; y += 1) {
    for (let x = 0; x < output.width; x += 1) {
      const outputIndex = (y * output.width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        let total = 0;
        for (let dy = 0; dy < 2; dy += 1) {
          for (let dx = 0; dx < 2; dx += 1) {
            const sourceIndex = (((y * 2 + dy) * source.width) + x * 2 + dx) * 4;
            total += source.data[sourceIndex + channel];
          }
        }
        output.data[outputIndex + channel] = Math.round(total / 4);
      }
    }
  }
  await writeFile(outputPath, PNG.sync.write(output));
}

async function makePngBinding(root, relativePath) {
  const file = join(root, relativePath);
  const png = PNG.sync.read(await readFile(file));
  return {
    path: relativePath,
    sha256: await fileSha256(file),
    width: png.width,
    height: png.height
  };
}

async function makeFileBinding(root, relativePath) {
  return {
    path: relativePath,
    sha256: await fileSha256(join(root, relativePath))
  };
}

async function fixtureRepository(options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'polypdf-screenshot-evidence-'));
  temporaryRoots.push(root);
  const screenshotName = options.screenshotName ?? 'workflow-currentdev-dark-web.png';
  const rawSize = options.rawSize ?? { width: 1600, height: 1000 };
  const finalSize = options.finalSize ?? { width: 800, height: 500 };
  const rawPath = 'assets-source/blog-image-validation/captures/workflow-dark.png';
  const proofPath = 'assets-source/blog-image-validation/captures/workflow-dark.proof.json';
  const reportPath = 'assets-source/blog-image-validation/workflow-report.json';
  const sourcePath = 'src/assets/screenshots/' + screenshotName;
  const publicGuidePath = 'public/guides/example-guide.png';
  const ogPath = 'public/og-image.png';
  const ogTemplatePath = 'assets-source/blog-image-validation/og-image.html';
  const registryPath = join(root, DEFAULT_REGISTRY_PATH);

  await Promise.all([
    mkdir(join(root, 'assets-source/blog-image-validation/captures'), { recursive: true }),
    mkdir(join(root, 'src/assets/screenshots'), { recursive: true }),
    mkdir(join(root, 'src/components'), { recursive: true }),
    mkdir(join(root, 'src/content/guides'), { recursive: true }),
    mkdir(join(root, 'src/lib'), { recursive: true }),
    mkdir(join(root, 'public/guides'), { recursive: true })
  ]);

  await writeAppPng(join(root, rawPath), {
    width: rawSize.width,
    height: rawSize.height,
    chrome: options.chrome,
    body: options.body,
    structured: options.structured ?? true
  });
  if (rawSize.width === finalSize.width * 2 && rawSize.height === finalSize.height * 2
    && !options.independentFinal) {
    await writeHalfDerivative(join(root, rawPath), join(root, sourcePath));
  } else {
    await writeAppPng(join(root, sourcePath), {
      width: finalSize.width,
      height: finalSize.height,
      chrome: options.chrome,
      body: options.body,
      structured: options.structured ?? true,
      variant: options.independentFinal ? 1 : 0
    });
  }
  await copyFile(join(root, sourcePath), join(root, publicGuidePath));
  await writeAppPng(join(root, ogPath), {
    width: 1200,
    height: 630,
    chrome: [32, 34, 37],
    body: [32, 34, 37]
  });

  await writeFile(
    join(root, 'src/content/guides/example-guide.js'),
    "import hero from '../../assets/screenshots/" + screenshotName + "';\n"
      + "export default { slug: 'example-guide', heroImage: { src: hero } };\n"
  );
  await writeFile(
    join(root, 'src/components/example.css'),
    ".workflow { background-image: url('../assets/screenshots/" + screenshotName + "'); }\n"
  );
  await writeJson(join(root, 'src/lib/route-metadata.json'), {
    routes: [{ path: '/guides/example-guide', image: '/guides/example-guide.png' }]
  });
  await writeFile(
    join(root, 'public/sitemap.xml'),
    '<image:loc>https://www.polypdf.com/guides/example-guide.png</image:loc>\n'
  );
  await writeFile(
    join(root, 'public/feed.xml'),
    '<enclosure url="https://www.polypdf.com/guides/example-guide.png" type="image/png" />\n'
  );
  await writeFile(
    join(root, 'public/index.html'),
    '<meta property="og:image" content="https://www.polypdf.com/og-image.png">\n'
  );
  await writeFile(
    join(root, ogTemplatePath),
    '<img src="../../src/assets/screenshots/' + screenshotName + '" alt="">\n'
  );

  const raw = await makePngBinding(root, rawPath);
  const proof = {
    source: {
      baseCommit: BASE_COMMIT,
      workingTreeProductDiffSha256: PRODUCT_DIFF
    },
    raw: {
      path: rawPath,
      sha256: raw.sha256
    },
    assertions: {
      darkMode: true,
      nativeMaximized: true,
      viewportEmulation: false,
      fullStyleBarVisible: true,
      pageOnlyCrop: false
    }
  };
  const report = {
    sourceFingerprint: {
      baseCommit: BASE_COMMIT,
      workingTreeProductDiffSha256: PRODUCT_DIFF
    },
    captureSha256: raw.sha256,
    publicationStatus: 'publication-approved'
  };
  await writeJson(join(root, proofPath), proof);
  await writeJson(join(root, reportPath), report);

  const source = await makePngBinding(root, sourcePath);
  const publicGuide = await makePngBinding(root, publicGuidePath);
  const og = await makePngBinding(root, ogPath);
  const registry = {
    schemaVersion: 1,
    records: [
      {
        id: 'workflow',
        publicationStatus: 'publication-approved',
        source: {
          raw,
          proof: await makeFileBinding(root, proofPath),
          report: await makeFileBinding(root, reportPath),
          fingerprint: {
            baseCommit: BASE_COMMIT,
            workingTreeProductDiffSha256: PRODUCT_DIFF
          }
        },
        assertions: {
          darkMode: true,
          nativeMaximized: true,
          viewportEmulation: false,
          fullStyleBarVisible: true,
          pageOnlyCrop: false
        },
        outputs: [
          {
            ...source,
            derivedFrom: rawPath,
            transform: raw.width === source.width * 2 && raw.height === source.height * 2
              ? 'exact-50-percent'
              : 'byte-identical'
          },
          {
            ...publicGuide,
            derivedFrom: sourcePath,
            transform: 'byte-identical'
          }
        ]
      }
    ],
    ogComposites: [
      {
        id: 'site-og',
        publicationStatus: 'publication-approved',
        output: og,
        template: await makeFileBinding(root, ogTemplatePath),
        dependencies: [
          await makeFileBinding(root, sourcePath)
        ]
      }
    ]
  };
  await writeJson(registryPath, registry);

  return {
    root,
    paths: {
      rawPath,
      proofPath,
      reportPath,
      sourcePath,
      publicGuidePath,
      ogPath,
      ogTemplatePath,
      registryPath
    },
    registry
  };
}

function violationCodes(report, fileSuffix) {
  return report.violations
    .filter((violation) => !fileSuffix || violation.file.endsWith(fileSuffix))
    .map((violation) => violation.code)
    .sort();
}

test('complete dark evidence passes and inventories CSS, JSON, public, template, and discovery references', async () => {
  const fixture = await fixtureRepository();
  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, true, JSON.stringify(report.violations, null, 2));
  assert.equal(report.summary.violationCount, 0);
  assert.equal(report.assets.length, 3);
  const source = report.assets.find(
    (asset) => asset.file === fixture.paths.sourcePath
  );
  const publicGuide = report.assets.find(
    (asset) => asset.file === fixture.paths.publicGuidePath
  );
  assert.equal(source.evidenceRecordId, 'workflow');
  assert.equal(source.roles.includes('src-reference'), true);
  assert.equal(source.roles.includes('og-template-dependency'), true);
  assert.equal(
    source.references.some((reference) => reference.startsWith('src/components/example.css')),
    true
  );
  assert.equal(publicGuide.heroSource, fixture.paths.sourcePath);
  assert.equal(
    publicGuide.references.some((reference) => reference.startsWith('src/lib/route-metadata.json')),
    true
  );
  assert.equal(
    publicGuide.references.some((reference) => reference.startsWith('public/sitemap.xml')),
    true
  );
  assert.equal(
    publicGuide.references.some((reference) => reference.startsWith('public/feed.xml')),
    true
  );
});

test('a solid-dark square with a currentdev-dark filename cannot pass as a maximized capture', async () => {
  const fixture = await fixtureRepository({
    screenshotName: 'square-currentdev-dark.png',
    rawSize: { width: 240, height: 240 },
    finalSize: { width: 120, height: 120 }
  });
  const report = await verifyScreenshotEvidence({ root: fixture.root });
  const codes = violationCodes(report);

  assert.equal(report.ok, false);
  assert.equal(codes.includes('evidence-raw-window-shape'), true);
  assert.equal(codes.includes('evidence-final-window-shape'), true);
});

test('a plausible-size flat dark placeholder fails the screenshot structure gate', async () => {
  const fixture = await fixtureRepository({ structured: false });
  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, false);
  assert.equal(
    violationCodes(report, fixture.paths.rawPath).includes('evidence-raw-structure'),
    true
  );
  assert.equal(
    violationCodes(report, fixture.paths.sourcePath).includes('evidence-final-structure'),
    true
  );
});

test('exact-50-percent requires the final pixels to derive from the declared 2x raw source', async () => {
  const fixture = await fixtureRepository({ independentFinal: true });
  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, false);
  assert.equal(
    violationCodes(report, fixture.paths.sourcePath)
      .includes('evidence-pixel-transform-mismatch'),
    true
  );
});

test('proof and report metadata must agree with registry raw hash and source fingerprint', async () => {
  const fixture = await fixtureRepository();
  const proofFile = join(fixture.root, fixture.paths.proofPath);
  const reportFile = join(fixture.root, fixture.paths.reportPath);
  const proof = JSON.parse(await readFile(proofFile, 'utf8'));
  const captureReport = JSON.parse(await readFile(reportFile, 'utf8'));
  proof.raw.sha256 = 'c'.repeat(64);
  captureReport.captureSha256 = 'd'.repeat(64);
  captureReport.sourceFingerprint.workingTreeProductDiffSha256 = 'e'.repeat(64);
  await writeJson(proofFile, proof);
  await writeJson(reportFile, captureReport);

  const registry = JSON.parse(await readFile(fixture.paths.registryPath, 'utf8'));
  registry.records[0].source.proof.sha256 = await fileSha256(proofFile);
  registry.records[0].source.report.sha256 = await fileSha256(reportFile);
  await writeJson(fixture.paths.registryPath, registry);
  const report = await verifyScreenshotEvidence({ root: fixture.root });
  const proofCodes = violationCodes(report, fixture.paths.proofPath);
  const reportCodes = violationCodes(report, fixture.paths.reportPath);

  assert.equal(report.ok, false);
  assert.equal(proofCodes.includes('evidence-proof-raw-hash-mismatch'), true);
  assert.equal(reportCodes.includes('evidence-report-raw-hash-mismatch'), true);
  assert.equal(
    reportCodes.includes('evidence-report-source-fingerprint-mismatch'),
    true
  );
});

test('hash bindings detect an in-place final PNG change', async () => {
  const fixture = await fixtureRepository();
  await writeAppPng(join(fixture.root, fixture.paths.sourcePath), {
    width: 800,
    height: 500,
    chrome: [49, 52, 55],
    body: [38, 40, 43]
  });
  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, false);
  assert.equal(
    violationCodes(report, fixture.paths.sourcePath).includes('evidence-final-hash-mismatch'),
    true
  );
  assert.equal(
    violationCodes(report, fixture.paths.sourcePath).includes('og-dependency-hash-mismatch'),
    true
  );
});

test('a weak approved manifest cannot bypass canonical evidence', async () => {
  const fixture = await fixtureRepository();
  await writeJson(fixture.paths.registryPath, {
    schemaVersion: 1,
    assets: [
      {
        path: fixture.paths.sourcePath,
        status: 'approved'
      }
    ]
  });
  const report = await verifyScreenshotEvidence({ root: fixture.root });
  const codes = violationCodes(report);

  assert.equal(report.ok, false);
  assert.equal(codes.includes('evidence-registry-invalid'), true);
  assert.equal(codes.includes('evidence-record-missing'), true);
  assert.equal(codes.includes('og-evidence-record-missing'), true);
});

test('guide public output must remain byte-identical to its actual source hero', async () => {
  const fixture = await fixtureRepository();
  await writeAppPng(join(fixture.root, fixture.paths.publicGuidePath), {
    width: 800,
    height: 500,
    chrome: [38, 40, 43],
    body: [42, 45, 48]
  });
  const registry = JSON.parse(await readFile(fixture.paths.registryPath, 'utf8'));
  const publicOutput = registry.records[0].outputs.find(
    (output) => output.path === fixture.paths.publicGuidePath
  );
  publicOutput.sha256 = await fileSha256(join(fixture.root, fixture.paths.publicGuidePath));
  await writeJson(fixture.paths.registryPath, registry);

  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, false);
  assert.equal(
    violationCodes(report, fixture.paths.publicGuidePath).includes('evidence-transform-mismatch'),
    true
  );
});

test('OG composite is bound to the exact template hash', async () => {
  const fixture = await fixtureRepository();
  await writeFile(
    join(fixture.root, fixture.paths.ogTemplatePath),
    '<img src="../src/assets/screenshots/workflow-currentdev-dark-web.png" alt="changed">\n'
  );
  const report = await verifyScreenshotEvidence({ root: fixture.root });

  assert.equal(report.ok, false);
  assert.equal(
    violationCodes(report, fixture.paths.ogTemplatePath)
      .includes('evidence-supporting-hash-mismatch'),
    true
  );
});

test('an unreferenced public guide PNG is reported as an orphan and missing evidence', async () => {
  const fixture = await fixtureRepository();
  const orphan = join(fixture.root, 'public/guides/orphan.png');
  await writeAppPng(orphan, { width: 800, height: 500 });
  const report = await verifyScreenshotEvidence({ root: fixture.root });
  const codes = violationCodes(report, 'public/guides/orphan.png');

  assert.equal(report.ok, false);
  assert.equal(codes.includes('orphan-public-guide'), true);
  assert.equal(codes.includes('evidence-record-missing'), true);
});
