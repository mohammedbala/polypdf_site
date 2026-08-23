#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;

export const DEFAULT_REGISTRY_PATH =
  'assets-source/blog-image-validation/screenshot-evidence.registry.json';
export const OG_TEMPLATE_PATH =
  'assets-source/blog-image-validation/og-image.html';

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mjs',
  '.rss',
  '.scss',
  '.ts',
  '.tsx',
  '.txt',
  '.xml'
]);
const DARK_TOKENS = ['#1e1e1e', '#242424', '#2c2c2c', '#26282b', '#313437', '#2a2d30', '#202225', '#46484b'].map(hexRgb);
const LIGHT_TOKENS = ['#f7f7f4', '#fdfdfc', '#f1f0ec', '#7b7c7a', '#f1f1ed'].map(hexRgb);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const PUBLICATION_STATUS = 'publication-approved';
const TRANSFORMS = new Set(['byte-identical', 'exact-50-percent']);
const STRUCTURE_GATE = Object.freeze({
  minimumQuantizedColors: 32,
  minimumLuminanceStandardDeviation: 25,
  minimumLightLuminanceStandardDeviation: 18,
  minimumEdgeRatio: 0.01
});
const EXACT_HALF_GATE = Object.freeze({
  maximumMeanAbsoluteError: 5,
  maximumRootMeanSquareError: 12,
  minimumLuminanceCorrelation: 0.99
});
const BASE_COMMIT_FIELD_NAMES = new Set([
  'baseCommit',
  'commit',
  'expectedBaseCommit',
  'expectedHead',
  'head',
  'sourceBaseCommit',
  'sourceCommit'
]);
const PRODUCT_DIFF_FIELD_NAMES = new Set([
  'currentProductDiffSha256',
  'diffSha256',
  'expectedProductDiffSha256',
  'expectedWorkingTreeDiffSha256',
  'productDiffSha256',
  'sourceFingerprint',
  'trackedWorkingTreeDiffSha256',
  'workingTreeDiffSha256',
  'workingTreeProductDiffSha256'
]);
const ASSERTION_CONTRACT = Object.freeze({
  nativeMaximized: true,
  viewportEmulation: false,
  styleToolbarStateValidated: true,
  pageOnlyCrop: false
});

function hexRgb(value) {
  const hex = value.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function isInside(parent, candidate) {
  const child = relative(parent, candidate);
  return child === ''
    || (child !== '..' && !child.startsWith('..' + sep) && !isAbsolute(child));
}

function repoPath(root, file) {
  const path = relative(root, file);
  return path === '' ? '.' : path.split(sep).join('/');
}

function stripQueryAndHash(value) {
  return value.split(/[?#]/, 1)[0];
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function walkFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function finalRoots(root) {
  return {
    sourceScreenshots: resolve(root, 'src/assets/screenshots'),
    publicGuides: resolve(root, 'public/guides'),
    publicOg: resolve(root, 'public/og-image.png')
  };
}

function classifyFinalPath(root, file) {
  const roots = finalRoots(root);
  if (isInside(roots.sourceScreenshots, file)) return 'site-screenshot';
  if (isInside(roots.publicGuides, file)) return 'public-guide';
  if (file === roots.publicOg) return 'public-og';
  return null;
}

function addAsset(records, file, role, reference) {
  const absolute = resolve(file);
  const record = records.get(absolute) ?? {
    file: absolute,
    roles: new Set(),
    references: new Set(),
    heroSource: null
  };
  record.roles.add(role);
  if (reference) record.references.add(reference);
  records.set(absolute, record);
  return record;
}

function extractPngReferences(text) {
  const references = new Set();
  const pattern = /(?:https?:\/\/[^\s"'()<>\x60]+|%PUBLIC_URL%\/[^\s"'()<>\x60]+|(?:\.\.?\/|\/)?(?:[A-Za-z0-9_@%.-]+\/)*[A-Za-z0-9_@%.$}{-]+\.png)(?:[?#][^\s"'()<>\x60]*)?/gi;
  for (const match of text.matchAll(pattern)) references.add(match[0]);
  return [...references].sort();
}

function resolveRenderedReference(root, sourceFile, reference) {
  const clean = stripQueryAndHash(reference.trim());
  if (!clean || clean.includes('${')) return null;
  if (/^https?:/i.test(clean)) {
    let url;
    try {
      url = new URL(clean);
    } catch {
      return null;
    }
    if (!/(^|\.)polypdf\.com$/i.test(url.hostname)) return null;
    return resolve(root, 'public', url.pathname.replace(/^\/+/, ''));
  }
  if (clean.startsWith('%PUBLIC_URL%/')) {
    return resolve(root, 'public', clean.slice('%PUBLIC_URL%/'.length));
  }
  if (clean.startsWith('/')) return resolve(root, 'public', clean.slice(1));
  if (/^(?:public|src)\//.test(clean)) return resolve(root, clean);
  return resolve(dirname(sourceFile), clean);
}

function isRenderedSourceFile(file) {
  if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) return false;
  const name = basename(file);
  if (/\.(?:test|spec)\.[^.]+$/i.test(name)) return false;
  return name !== 'verify-screenshot-evidence.mjs';
}

async function renderedReferenceFiles(root) {
  const files = [];
  for (const directory of ['src', 'public', 'scripts']) {
    files.push(...await walkFiles(resolve(root, directory)));
  }
  return files.filter(isRenderedSourceFile).sort();
}

function parseStaticImports(text, root, sourceFile) {
  const imports = new Map();
  const pattern = /\bimport\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+\.png(?:[?#][^'"]*)?)['"]/g;
  for (const match of text.matchAll(pattern)) {
    imports.set(match[1], resolveRenderedReference(root, sourceFile, match[2]));
  }
  return imports;
}

async function discoverGuideHeroRelations(root, records) {
  const directory = resolve(root, 'src/content/guides');
  const files = (await walkFiles(directory))
    .filter((file) => extname(file).toLowerCase() === '.js' && !/\.(?:test|spec)\.js$/i.test(file))
    .sort();
  const productPosts = resolve(root, 'src/lib/blogPosts.js');
  try {
    await readFile(productPosts, 'utf8');
    files.push(productPosts);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const relations = [];
  const issues = [];

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const declaredSlug = text.match(/\bslug\s*:\s*['"]([^'"]+)['"]/)?.[1];
    const heroIdentifier = text.match(/\bheroImage\s*:\s*\{[\s\S]{0,1600}?\bsrc\s*:\s*([A-Za-z_$][\w$]*)/)?.[1];
    if (!declaredSlug && !heroIdentifier) continue;
    const slug = declaredSlug ?? basename(file, '.js');
    const imports = parseStaticImports(text, root, file);
    const heroFile = heroIdentifier ? imports.get(heroIdentifier) : null;
    const publicFile = resolve(root, 'public/guides', slug + '.png');
    const relation = {
      slug,
      guideFile: file,
      heroFile: heroFile ?? null,
      publicFile
    };
    relations.push(relation);

    if (!heroFile || classifyFinalPath(root, heroFile) !== 'site-screenshot') {
      issues.push({
        code: 'guide-hero-unresolved',
        file: repoPath(root, file),
        message: 'Could not resolve heroImage.src to a local file under src/assets/screenshots.',
        references: []
      });
      continue;
    }

    addAsset(
      records,
      heroFile,
      'guide-hero-source',
      repoPath(root, file) + ' -> heroImage.src'
    );
    const publicRecord = addAsset(
      records,
      publicFile,
      'guide-public-hero',
      repoPath(root, file) + ' -> public/guides/' + slug + '.png'
    );
    publicRecord.heroSource = heroFile;
  }

  return { relations, issues };
}

function htmlDependencyReferences(text) {
  const references = new Set();
  for (const match of text.matchAll(/\b(?:src|srcset)\s*=\s*['"]([^'"]+)['"]/gi)) {
    for (const candidate of match[1].split(',').map((part) => part.trim().split(/\s+/, 1)[0])) {
      if (/\.png(?:[?#]|$)/i.test(candidate)) references.add(candidate);
    }
  }
  for (const match of text.matchAll(/\burl\(\s*['"]?([^'"\s)]+\.png(?:[?#][^'"\s)]*)?)['"]?\s*\)/gi)) {
    references.add(match[1]);
  }
  return [...references].sort();
}

async function discoverOgDependencies(root) {
  const template = resolve(root, OG_TEMPLATE_PATH);
  let text;
  try {
    text = await readFile(template, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return { template, dependencies: [], unreadable: error };
    throw error;
  }
  const dependencies = [];
  for (const reference of htmlDependencyReferences(text)) {
    const file = resolveRenderedReference(root, template, reference);
    if (file && file !== resolve(root, 'public/og-image.png')) {
      dependencies.push({ file, reference });
    }
  }
  dependencies.sort((left, right) => left.file.localeCompare(right.file));
  return { template, dependencies, unreadable: null };
}

export async function discoverScreenshotEvidence(rootValue = process.cwd()) {
  const root = resolve(rootValue);
  const roots = finalRoots(root);
  const records = new Map();

  for (const file of (await walkFiles(roots.sourceScreenshots))
    .filter((candidate) => extname(candidate).toLowerCase() === '.png')) {
    addAsset(records, file, 'site-screenshot-root', repoPath(root, file));
  }
  for (const file of (await walkFiles(roots.publicGuides))
    .filter((candidate) => extname(candidate).toLowerCase() === '.png')) {
    addAsset(records, file, 'public-guide-root', repoPath(root, file));
  }
  addAsset(records, roots.publicOg, 'public-og', 'public/og-image.png');

  for (const sourceFile of await renderedReferenceFiles(root)) {
    const text = await readFile(sourceFile, 'utf8');
    for (const reference of extractPngReferences(text)) {
      const file = resolveRenderedReference(root, sourceFile, reference);
      const classification = file ? classifyFinalPath(root, file) : null;
      if (!classification) continue;
      const sourcePath = repoPath(root, sourceFile);
      const record = addAsset(
        records,
        file,
        'rendered-data-reference',
        sourcePath + ' -> ' + reference
      );
      if (isInside(resolve(root, 'src'), sourceFile)) record.roles.add('src-reference');
      if (isInside(resolve(root, 'public'), sourceFile)) record.roles.add('public-reference');
      if (isInside(resolve(root, 'scripts'), sourceFile)) record.roles.add('script-reference');
      if (sourceFile === resolve(root, OG_TEMPLATE_PATH)) {
        record.roles.add('og-template-dependency');
      }
    }
  }

  const guideHeroes = await discoverGuideHeroRelations(root, records);
  const og = await discoverOgDependencies(root);
  for (const dependency of og.dependencies) {
    if (classifyFinalPath(root, dependency.file) === 'site-screenshot') {
      addAsset(
        records,
        dependency.file,
        'og-template-dependency',
        OG_TEMPLATE_PATH + ' -> ' + dependency.reference
      );
    }
  }

  const assets = [...records.values()]
    .map((record) => ({
      file: record.file,
      roles: [...record.roles].sort(),
      references: [...record.references].sort(),
      heroSource: record.heroSource
    }))
    .sort((left, right) => left.file.localeCompare(right.file));

  return {
    assets,
    guideHeroRelations: guideHeroes.relations,
    discoveryIssues: guideHeroes.issues,
    og,
    roots: [
      { role: 'site-screenshot-root', path: roots.sourceScreenshots },
      { role: 'public-guide-root', path: roots.publicGuides },
      { role: 'public-og', path: roots.publicOg }
    ]
  };
}

function nearToken(pixel, token, tolerance = 3) {
  return Math.abs(pixel[0] - token[0]) <= tolerance
    && Math.abs(pixel[1] - token[1]) <= tolerance
    && Math.abs(pixel[2] - token[2]) <= tolerance;
}

function rgbOnWhite(data, index) {
  const alpha = data[index + 3] / 255;
  return [0, 1, 2].map(
    (channel) => Math.round(data[index + channel] * alpha + 255 * (1 - alpha))
  );
}

export function inspectScreenshotPng(buffer) {
  const image = PNG.sync.read(buffer);
  if (!Number.isInteger(image.width) || image.width <= 0
    || !Number.isInteger(image.height) || image.height <= 0) {
    throw new Error('Invalid PNG dimensions ' + image.width + 'x' + image.height + '.');
  }

  const topRows = Math.min(
    image.height,
    Math.max(1, Math.round(image.height * (90 / 1073)))
  );
  const sampleStride = Math.max(
    1,
    Math.floor(Math.sqrt((image.width * image.height) / 1_500_000))
  );
  let sampled = 0;
  let topSampled = 0;
  let darkTokenHits = 0;
  let lightTokenHits = 0;
  let topDarkTokenHits = 0;
  let topLightTokenHits = 0;
  let lowLuminanceHits = 0;
  let highLuminanceHits = 0;

  for (let y = 0; y < image.height; y += sampleStride) {
    for (let x = 0; x < image.width; x += sampleStride) {
      const index = (y * image.width + x) * 4;
      const pixel = rgbOnWhite(image.data, index);
      const dark = DARK_TOKENS.some((token) => nearToken(pixel, token));
      const light = LIGHT_TOKENS.some((token) => nearToken(pixel, token));
      const luminance = (0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]) / 255;
      sampled += 1;
      if (dark) darkTokenHits += 1;
      if (light) lightTokenHits += 1;
      if (luminance <= 0.35) lowLuminanceHits += 1;
      if (luminance >= 0.85) highLuminanceHits += 1;
      if (y < topRows) {
        topSampled += 1;
        if (dark) topDarkTokenHits += 1;
        if (light) topLightTokenHits += 1;
      }
    }
  }

  const darkRatio = darkTokenHits / sampled;
  const lightRatio = lightTokenHits / sampled;
  const topDarkRatio = topDarkTokenHits / topSampled;
  const topLightRatio = topLightTokenHits / topSampled;
  const lowLuminanceRatio = lowLuminanceHits / sampled;
  const highLuminanceRatio = highLuminanceHits / sampled;

  // A dark rectangle can satisfy the token checks above while proving no app state at all. Sample
  // a coarser deterministic grid for actual visual structure: enough quantized colour diversity,
  // luminance variance, and local edges to distinguish a full application frame from a placeholder.
  const structureStride = Math.max(
    1,
    Math.floor(Math.sqrt((image.width * image.height) / 200_000))
  );
  const quantizedColors = new Set();
  let structureSampled = 0;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;
  let edgeComparisons = 0;
  let edgeHits = 0;
  const pixelAt = (x, y) => {
    const index = (y * image.width + x) * 4;
    const pixel = rgbOnWhite(image.data, index);
    const luminance = 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
    return { pixel, luminance };
  };
  for (let y = 0; y < image.height; y += structureStride) {
    for (let x = 0; x < image.width; x += structureStride) {
      const { pixel, luminance } = pixelAt(x, y);
      quantizedColors.add(
        ((pixel[0] >> 4) << 8) | ((pixel[1] >> 4) << 4) | (pixel[2] >> 4)
      );
      structureSampled += 1;
      luminanceSum += luminance;
      luminanceSquaredSum += luminance * luminance;
      if (x + structureStride < image.width) {
        edgeComparisons += 1;
        if (Math.abs(luminance - pixelAt(x + structureStride, y).luminance) >= 12) {
          edgeHits += 1;
        }
      }
      if (y + structureStride < image.height) {
        edgeComparisons += 1;
        if (Math.abs(luminance - pixelAt(x, y + structureStride).luminance) >= 12) {
          edgeHits += 1;
        }
      }
    }
  }
  const meanLuminance = luminanceSum / structureSampled;
  const luminanceVariance = Math.max(
    0,
    luminanceSquaredSum / structureSampled - meanLuminance * meanLuminance
  );
  const luminanceStandardDeviation = Math.sqrt(luminanceVariance);
  const edgeRatio = edgeComparisons === 0 ? 0 : edgeHits / edgeComparisons;
  const quantizedColorCount = quantizedColors.size;
  const structurePass = quantizedColorCount >= STRUCTURE_GATE.minimumQuantizedColors
    && luminanceStandardDeviation >= STRUCTURE_GATE.minimumLuminanceStandardDeviation
    && edgeRatio >= STRUCTURE_GATE.minimumEdgeRatio;
  return {
    width: image.width,
    height: image.height,
    sampleStride,
    sampled,
    topRows,
    darkRatio,
    lightRatio,
    topDarkRatio,
    topLightRatio,
    lowLuminanceRatio,
    highLuminanceRatio,
    structureStride,
    structureSampled,
    quantizedColorCount,
    luminanceStandardDeviation,
    edgeRatio,
    structurePass,
    darkAppChromePass: darkRatio >= 0.02
      && topDarkRatio >= 0.25
      && topDarkTokenHits > topLightTokenHits * 10,
    lightAppChromePass: lightRatio >= 0.02
      && topLightRatio >= 0.25
      && topLightTokenHits > topDarkTokenHits * 10,
    darkCompositePass: lowLuminanceRatio >= 0.35
      && lowLuminanceHits > highLuminanceHits
  };
}

/**
 * Compare a declared 50% derivative with the actual 2x source pixels. The source is reduced with a
 * deterministic 2x2 box average, then compared using absolute RGB error and luminance correlation.
 * The tolerances admit normal Lanczos/bicubic resampling around edges while rejecting a different
 * screenshot that merely has the expected dimensions and a dark toolbar.
 */
export function compareExactHalfPng(sourceBuffer, outputBuffer) {
  const source = PNG.sync.read(sourceBuffer);
  const output = PNG.sync.read(outputBuffer);
  if (source.width !== output.width * 2 || source.height !== output.height * 2) {
    return {
      pass: false,
      reason: 'dimensions',
      sourceWidth: source.width,
      sourceHeight: source.height,
      outputWidth: output.width,
      outputHeight: output.height
    };
  }

  const sampleStride = Math.max(
    1,
    Math.floor(Math.sqrt((output.width * output.height) / 200_000))
  );
  let sampled = 0;
  let absoluteErrorSum = 0;
  let squaredErrorSum = 0;
  let sourceLuminanceSum = 0;
  let outputLuminanceSum = 0;
  let sourceLuminanceSquaredSum = 0;
  let outputLuminanceSquaredSum = 0;
  let luminanceProductSum = 0;

  for (let y = 0; y < output.height; y += sampleStride) {
    for (let x = 0; x < output.width; x += sampleStride) {
      const sourceAverage = [0, 0, 0];
      for (let dy = 0; dy < 2; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          const sourceIndex = (((y * 2 + dy) * source.width) + x * 2 + dx) * 4;
          const sourcePixel = rgbOnWhite(source.data, sourceIndex);
          for (let channel = 0; channel < 3; channel += 1) {
            sourceAverage[channel] += sourcePixel[channel] / 4;
          }
        }
      }
      const outputIndex = (y * output.width + x) * 4;
      const outputPixel = rgbOnWhite(output.data, outputIndex);
      let pixelSquaredError = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const error = sourceAverage[channel] - outputPixel[channel];
        absoluteErrorSum += Math.abs(error);
        pixelSquaredError += error * error;
      }
      squaredErrorSum += pixelSquaredError;

      const sourceLuminance = 0.2126 * sourceAverage[0]
        + 0.7152 * sourceAverage[1]
        + 0.0722 * sourceAverage[2];
      const outputLuminance = 0.2126 * outputPixel[0]
        + 0.7152 * outputPixel[1]
        + 0.0722 * outputPixel[2];
      sourceLuminanceSum += sourceLuminance;
      outputLuminanceSum += outputLuminance;
      sourceLuminanceSquaredSum += sourceLuminance * sourceLuminance;
      outputLuminanceSquaredSum += outputLuminance * outputLuminance;
      luminanceProductSum += sourceLuminance * outputLuminance;
      sampled += 1;
    }
  }

  const channelSamples = sampled * 3;
  const meanAbsoluteError = absoluteErrorSum / channelSamples;
  const rootMeanSquareError = Math.sqrt(squaredErrorSum / channelSamples);
  const sourceMean = sourceLuminanceSum / sampled;
  const outputMean = outputLuminanceSum / sampled;
  const covariance = luminanceProductSum - sampled * sourceMean * outputMean;
  const sourceVariance = Math.max(
    0,
    sourceLuminanceSquaredSum - sampled * sourceMean * sourceMean
  );
  const outputVariance = Math.max(
    0,
    outputLuminanceSquaredSum - sampled * outputMean * outputMean
  );
  const denominator = Math.sqrt(sourceVariance * outputVariance);
  const luminanceCorrelation = denominator > 1e-9
    ? Math.max(-1, Math.min(1, covariance / denominator))
    : (meanAbsoluteError === 0 ? 1 : 0);
  const pass = meanAbsoluteError <= EXACT_HALF_GATE.maximumMeanAbsoluteError
    && rootMeanSquareError <= EXACT_HALF_GATE.maximumRootMeanSquareError
    && luminanceCorrelation >= EXACT_HALF_GATE.minimumLuminanceCorrelation;

  return {
    pass,
    reason: pass ? null : 'pixels',
    sampleStride,
    sampled,
    meanAbsoluteError,
    rootMeanSquareError,
    luminanceCorrelation
  };
}

function percent(value) {
  return (value * 100).toFixed(1) + '%';
}

function addViolation(violations, code, file, message, extras = {}) {
  violations.push({
    code,
    file,
    message,
    references: extras.references ?? [],
    ...(extras.recordId ? { recordId: extras.recordId } : {})
  });
}

function canonicalRegistryFile(root, value) {
  return resolve(root, value ?? DEFAULT_REGISTRY_PATH);
}

async function loadEvidenceRegistry(root, registryPathValue) {
  const file = canonicalRegistryFile(root, registryPathValue);
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return { file, parsed, error: null };
  } catch (error) {
    return { file, parsed: null, error };
  }
}

function resolveRegistryPath(root, value) {
  if (typeof value !== 'string' || value.trim() === '' || isAbsolute(value)) return null;
  const file = resolve(root, value);
  return isInside(root, file) ? file : null;
}

function validPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function fullWindowShapePass(width, height, raw) {
  const minimumWidth = raw ? 1200 : 800;
  const minimumHeight = raw ? 700 : 500;
  const ratio = width / height;
  return width >= minimumWidth
    && height >= minimumHeight
    && ratio >= 1.3
    && ratio <= 2.1;
}

async function cachedFileInspection(file, cache, png) {
  const key = file + '\0' + (png ? 'png' : 'file');
  if (cache.has(key)) return cache.get(key);
  const promise = (async () => {
    const buffer = await readFile(file);
    return {
      buffer,
      sha256: sha256(buffer),
      metrics: png ? inspectScreenshotPng(buffer) : null
    };
  })();
  cache.set(key, promise);
  return promise;
}

function validateHashValue(value) {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

async function validatePngBinding({
  root,
  binding,
  label,
  recordId,
  cache,
  violations,
  raw,
  theme
}) {
  const registryLabel = 'Evidence record ' + recordId + ' ' + label;
  if (!binding || typeof binding !== 'object') {
    addViolation(
      violations,
      'evidence-binding-invalid',
      DEFAULT_REGISTRY_PATH,
      registryLabel + ' must be an object with path, sha256, width, and height.',
      { recordId }
    );
    return null;
  }
  const file = resolveRegistryPath(root, binding.path);
  if (!file || !validateHashValue(binding.sha256)
    || !validPositiveInteger(binding.width) || !validPositiveInteger(binding.height)) {
    addViolation(
      violations,
      'evidence-binding-invalid',
      typeof binding.path === 'string' ? binding.path : DEFAULT_REGISTRY_PATH,
      registryLabel + ' has an invalid repository-relative path, SHA-256, or dimensions.',
      { recordId }
    );
    return null;
  }
  if (raw && !isInside(resolve(root, 'assets-source'), file)) {
    addViolation(
      violations,
      'evidence-raw-path-invalid',
      repoPath(root, file),
      'Raw captures must live under assets-source so publication assets cannot self-authorize.',
      { recordId }
    );
  }

  let inspection;
  try {
    inspection = await cachedFileInspection(file, cache, true);
  } catch (error) {
    addViolation(
      violations,
      'evidence-png-unreadable',
      repoPath(root, file),
      registryLabel + ' could not be decoded: ' + error.message,
      { recordId }
    );
    return { file, binding, inspection: null };
  }

  if (inspection.sha256 !== binding.sha256) {
    addViolation(
      violations,
      raw ? 'evidence-raw-hash-mismatch' : 'evidence-final-hash-mismatch',
      repoPath(root, file),
      registryLabel + ' SHA-256 does not match the current bytes.',
      { recordId }
    );
  }
  if (inspection.metrics.width !== binding.width || inspection.metrics.height !== binding.height) {
    addViolation(
      violations,
      raw ? 'evidence-raw-dimensions-mismatch' : 'evidence-final-dimensions-mismatch',
      repoPath(root, file),
      registryLabel + ' records ' + binding.width + 'x' + binding.height
        + ' but the PNG is ' + inspection.metrics.width + 'x' + inspection.metrics.height + '.',
      { recordId }
    );
  }
  if (!fullWindowShapePass(inspection.metrics.width, inspection.metrics.height, raw)) {
    addViolation(
      violations,
      raw ? 'evidence-raw-window-shape' : 'evidence-final-window-shape',
      repoPath(root, file),
      registryLabel + ' is not a plausible full maximized application window.',
      { recordId }
    );
  }
  const appChromePass = theme === 'light'
    ? inspection.metrics.lightAppChromePass
    : inspection.metrics.darkAppChromePass;
  if (!appChromePass) {
    addViolation(
      violations,
      raw ? 'evidence-raw-' + theme + '-chrome' : theme + '-top-chrome-gate',
      repoPath(root, file),
      theme + ' app-chrome pixels failed: whole dark tokens '
        + percent(inspection.metrics.darkRatio) + ', whole light tokens '
        + percent(inspection.metrics.lightRatio) + ', top dark tokens '
        + percent(inspection.metrics.topDarkRatio) + ', top light tokens '
        + percent(inspection.metrics.topLightRatio) + '.',
      { recordId }
    );
  }
  const structurePass = inspection.metrics.quantizedColorCount >= STRUCTURE_GATE.minimumQuantizedColors
    && inspection.metrics.luminanceStandardDeviation >= (
      theme === 'light'
        ? STRUCTURE_GATE.minimumLightLuminanceStandardDeviation
        : STRUCTURE_GATE.minimumLuminanceStandardDeviation
    )
    && inspection.metrics.edgeRatio >= STRUCTURE_GATE.minimumEdgeRatio;
  if (!structurePass) {
    addViolation(
      violations,
      raw ? 'evidence-raw-structure' : 'evidence-final-structure',
      repoPath(root, file),
      registryLabel + ' lacks screenshot structure: '
        + inspection.metrics.quantizedColorCount + ' quantized colours, luminance SD '
        + inspection.metrics.luminanceStandardDeviation.toFixed(1) + ', edge ratio '
        + percent(inspection.metrics.edgeRatio) + '.',
      { recordId }
    );
  }

  return { file, binding, inspection };
}

async function validateFileBinding({
  root,
  binding,
  label,
  recordId,
  cache,
  violations,
  requireJson = true
}) {
  const registryLabel = 'Evidence record ' + recordId + ' ' + label;
  if (!binding || typeof binding !== 'object') {
    addViolation(
      violations,
      'evidence-binding-invalid',
      DEFAULT_REGISTRY_PATH,
      registryLabel + ' must be an object with path and sha256.',
      { recordId }
    );
    return null;
  }
  const file = resolveRegistryPath(root, binding.path);
  if (!file || !validateHashValue(binding.sha256)) {
    addViolation(
      violations,
      'evidence-binding-invalid',
      typeof binding.path === 'string' ? binding.path : DEFAULT_REGISTRY_PATH,
      registryLabel + ' has an invalid repository-relative path or SHA-256.',
      { recordId }
    );
    return null;
  }

  let inspection;
  try {
    inspection = await cachedFileInspection(file, cache, false);
  } catch (error) {
    addViolation(
      violations,
      'evidence-file-unreadable',
      repoPath(root, file),
      registryLabel + ' could not be read: ' + error.message,
      { recordId }
    );
    return { file, binding, inspection: null, text: null, json: null };
  }
  if (inspection.sha256 !== binding.sha256) {
    addViolation(
      violations,
      'evidence-supporting-hash-mismatch',
      repoPath(root, file),
      registryLabel + ' SHA-256 does not match the current bytes.',
      { recordId }
    );
  }

  const text = inspection.buffer.toString('utf8');
  let json = null;
  if (requireJson) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      addViolation(
        violations,
        'evidence-supporting-json-invalid',
        repoPath(root, file),
        registryLabel + ' must be readable JSON: ' + error.message,
        { recordId }
      );
    }
  }
  return { file, binding, inspection, text, json };
}

function collectNamedStringFields(value, fieldNames, path = [], result = []) {
  if (!value || typeof value !== 'object') return result;
  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];
    if (fieldNames.has(key) && typeof child === 'string') {
      result.push({ path: childPath.join('.'), value: child });
    }
    collectNamedStringFields(child, fieldNames, childPath, result);
  }
  return result;
}

const RAW_PATH_FIELD_NAMES = new Set([
  'capturePng',
  'file',
  'filename',
  'imagePath',
  'path',
  'rawPath',
  'sourcePng'
]);
const RAW_HASH_FIELD_NAMES = new Set([
  'artifactSha256',
  'captureSha256',
  'sha256',
  'sourceSha256',
  'screenshotSha256'
]);
const DIRECT_RAW_HASH_FIELD_NAMES = new Set([
  'artifactSha256',
  'captureSha256',
  'screenshotSha256'
]);

function supportPathMatchesRaw(root, supportFile, value, rawFile) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const candidates = [
    resolve(dirname(supportFile), value),
    resolve(root, value)
  ];
  return candidates.includes(rawFile);
}

function collectRawHashDeclarations(root, supportFile, value, rawFile, path = [], result = []) {
  if (!value || typeof value !== 'object') return result;
  const entries = Object.entries(value);
  const pathMatches = entries.some(([key, child]) => (
    RAW_PATH_FIELD_NAMES.has(key)
      && supportPathMatchesRaw(root, supportFile, child, rawFile)
  ));
  for (const [key, child] of entries) {
    const childPath = [...path, key];
    if (typeof child === 'string'
      && RAW_HASH_FIELD_NAMES.has(key)
      && (pathMatches || DIRECT_RAW_HASH_FIELD_NAMES.has(key))) {
      result.push({ path: childPath.join('.'), value: child });
    }
    collectRawHashDeclarations(root, supportFile, child, rawFile, childPath, result);
  }
  return result;
}

function validateSupportingEvidenceMetadata({
  root,
  kind,
  support,
  rawFile,
  rawSha256,
  fingerprint,
  recordId,
  violations
}) {
  if (!support?.json || !support.file || !rawFile || !fingerprint) return;
  const baseDeclarations = collectNamedStringFields(
    support.json,
    BASE_COMMIT_FIELD_NAMES
  );
  const diffDeclarations = collectNamedStringFields(
    support.json,
    PRODUCT_DIFF_FIELD_NAMES
  );
  const fingerprintMismatches = [
    ...baseDeclarations.filter(({ value }) => value !== fingerprint.baseCommit),
    ...diffDeclarations.filter(
      ({ value }) => value !== fingerprint.workingTreeProductDiffSha256
    )
  ];
  if (fingerprintMismatches.length > 0) {
    addViolation(
      violations,
      'evidence-' + kind + '-source-fingerprint-mismatch',
      repoPath(root, support.file),
      'Evidence record ' + recordId + ' ' + kind
        + ' source fingerprint disagrees with the registry at '
        + fingerprintMismatches.map(({ path }) => path).join(', ') + '.',
      { recordId }
    );
  }

  const rawDeclarations = collectRawHashDeclarations(
    root,
    support.file,
    support.json,
    rawFile
  );
  const rawMismatches = rawDeclarations.filter(({ value }) => value !== rawSha256);
  if (rawMismatches.length > 0) {
    addViolation(
      violations,
      'evidence-' + kind + '-raw-hash-mismatch',
      repoPath(root, support.file),
      'Evidence record ' + recordId + ' ' + kind
        + ' raw capture hash disagrees with the registry at '
        + rawMismatches.map(({ path }) => path).join(', ') + '.',
      { recordId }
    );
  }
}

function validateAssertions(record, registryPath, violations) {
  if (!['dark', 'light'].includes(record.assertions?.theme)) {
    addViolation(
      violations,
      'evidence-theme-invalid',
      registryPath,
      'Evidence record ' + record.id + ' must assert theme=dark or theme=light.',
      { recordId: record.id }
    );
  }
  for (const [key, required] of Object.entries(ASSERTION_CONTRACT)) {
    if (record.assertions?.[key] !== required) {
      addViolation(
        violations,
        'evidence-assertion-missing',
        registryPath,
        'Evidence record ' + record.id + ' must assert ' + key + '=' + required + '.',
        { recordId: record.id }
      );
    }
  }
}

function validateFingerprint(record, registryPath, violations) {
  const fingerprint = record.source?.fingerprint;
  if (!fingerprint || !COMMIT_PATTERN.test(fingerprint.baseCommit ?? '')
    || !SHA256_PATTERN.test(fingerprint.workingTreeProductDiffSha256 ?? '')) {
    addViolation(
      violations,
      'evidence-source-fingerprint-invalid',
      registryPath,
      'Evidence record ' + record.id
        + ' requires a 40-character baseCommit and 64-character workingTreeProductDiffSha256.',
      { recordId: record.id }
    );
    return null;
  }
  return fingerprint;
}

async function validateOutputTransform({
  root,
  record,
  output,
  bindingByPath,
  rawPath,
  cache,
  violations
}) {
  const outputPath = resolveRegistryPath(root, output.path);
  const derivedFrom = resolveRegistryPath(root, output.derivedFrom);
  if (!outputPath || !derivedFrom || !TRANSFORMS.has(output.transform)) {
    addViolation(
      violations,
      'evidence-transform-invalid',
      typeof output.path === 'string' ? output.path : DEFAULT_REGISTRY_PATH,
      'Evidence record ' + record.id
        + ' output requires a repository-relative derivedFrom and a supported transform.',
      { recordId: record.id }
    );
    return;
  }
  const sourceBinding = bindingByPath.get(derivedFrom);
  if (!sourceBinding || (derivedFrom !== rawPath && !bindingByPath.has(derivedFrom))) {
    addViolation(
      violations,
      'evidence-transform-source-missing',
      repoPath(root, outputPath),
      'derivedFrom must point to this record raw capture or another output in the same record.',
      { recordId: record.id }
    );
    return;
  }

  if (output.transform === 'byte-identical') {
    if (output.sha256 !== sourceBinding.sha256
      || output.width !== sourceBinding.width
      || output.height !== sourceBinding.height) {
      addViolation(
        violations,
        'evidence-transform-mismatch',
        repoPath(root, outputPath),
        'byte-identical requires identical recorded hashes and dimensions.',
        { recordId: record.id }
      );
    }
  } else {
    if (output.width * 2 !== sourceBinding.width
      || output.height * 2 !== sourceBinding.height) {
      addViolation(
        violations,
        'evidence-transform-mismatch',
        repoPath(root, outputPath),
        'exact-50-percent requires source dimensions to be exactly twice the output dimensions.',
        { recordId: record.id }
      );
      return;
    }
    try {
      const [sourceInspection, outputInspection] = await Promise.all([
        cachedFileInspection(derivedFrom, cache, true),
        cachedFileInspection(outputPath, cache, true)
      ]);
      const comparison = compareExactHalfPng(
        sourceInspection.buffer,
        outputInspection.buffer
      );
      if (!comparison.pass) {
        addViolation(
          violations,
          'evidence-pixel-transform-mismatch',
          repoPath(root, outputPath),
          'exact-50-percent pixels do not match the 2x source: MAE '
            + comparison.meanAbsoluteError.toFixed(2) + ', RMSE '
            + comparison.rootMeanSquareError.toFixed(2) + ', luminance correlation '
            + comparison.luminanceCorrelation.toFixed(5) + '.',
          { recordId: record.id }
        );
      }
    } catch {
      // PNG binding validation emits the actionable unreadable-file violation.
    }
  }
}

function validateTransformChains(root, record, rawPath, outputByPath, violations) {
  for (const outputPath of outputByPath.keys()) {
    const visited = new Set();
    let cursor = outputPath;
    while (cursor !== rawPath) {
      if (visited.has(cursor)) {
        addViolation(
          violations,
          'evidence-transform-cycle',
          repoPath(root, outputPath),
          'Evidence record ' + record.id + ' transform chain contains a cycle.',
          { recordId: record.id }
        );
        break;
      }
      visited.add(cursor);
      const output = outputByPath.get(cursor);
      const parent = output ? resolveRegistryPath(root, output.derivedFrom) : null;
      if (!parent || (parent !== rawPath && !outputByPath.has(parent))) {
        break;
      }
      cursor = parent;
    }
  }
}

async function validateEvidenceRecord({
  root,
  record,
  registryPath,
  discoveredPaths,
  outputOwners,
  cache,
  violations
}) {
  if (!record || typeof record !== 'object' || typeof record.id !== 'string' || record.id === '') {
    addViolation(
      violations,
      'evidence-record-invalid',
      registryPath,
      'Every evidence record requires a non-empty id.',
      {}
    );
    return;
  }
  if (record.publicationStatus !== PUBLICATION_STATUS) {
    addViolation(
      violations,
      'evidence-publication-status',
      registryPath,
      'Evidence record ' + record.id + ' must use publicationStatus=' + PUBLICATION_STATUS + '.',
      { recordId: record.id }
    );
  }
  validateAssertions(record, registryPath, violations);
  const fingerprint = validateFingerprint(record, registryPath, violations);

  const raw = await validatePngBinding({
    root,
    binding: record.source?.raw,
    label: 'source.raw',
    recordId: record.id,
    cache,
    violations,
    raw: true,
    theme: record.assertions?.theme
  });
  const proof = await validateFileBinding({
    root,
    binding: record.source?.proof,
    label: 'source.proof',
    recordId: record.id,
    cache,
    violations
  });
  const report = await validateFileBinding({
    root,
    binding: record.source?.report,
    label: 'source.report',
    recordId: record.id,
    cache,
    violations
  });

  const rawPath = raw?.file ?? resolveRegistryPath(root, record.source?.raw?.path);
  if (rawPath && validateHashValue(record.source?.raw?.sha256) && fingerprint) {
    validateSupportingEvidenceMetadata({
      root,
      kind: 'proof',
      support: proof,
      rawFile: rawPath,
      rawSha256: record.source.raw.sha256,
      fingerprint,
      recordId: record.id,
      violations
    });
    validateSupportingEvidenceMetadata({
      root,
      kind: 'report',
      support: report,
      rawFile: rawPath,
      rawSha256: record.source.raw.sha256,
      fingerprint,
      recordId: record.id,
      violations
    });
  }

  if (!Array.isArray(record.outputs) || record.outputs.length === 0) {
    addViolation(
      violations,
      'evidence-outputs-invalid',
      registryPath,
      'Evidence record ' + record.id + ' requires at least one final output.',
      { recordId: record.id }
    );
    return;
  }

  const bindingByPath = new Map();
  const outputByPath = new Map();
  if (rawPath && record.source?.raw) bindingByPath.set(rawPath, record.source.raw);

  for (const output of record.outputs) {
    const outputPath = resolveRegistryPath(root, output?.path);
    if (outputPath) {
      if (outputOwners.has(outputPath)) {
        addViolation(
          violations,
          'evidence-output-duplicate',
          repoPath(root, outputPath),
          'Final output is claimed by more than one evidence record.',
          { recordId: record.id }
        );
      } else {
        outputOwners.set(outputPath, { record, output });
      }
      outputByPath.set(outputPath, output);
      bindingByPath.set(outputPath, output);
      if (!discoveredPaths.has(outputPath)) {
        addViolation(
          violations,
          'evidence-output-orphan',
          repoPath(root, outputPath),
          'Registry output is not present in any final website screenshot root or reference.',
          { recordId: record.id }
        );
      }
    }
    await validatePngBinding({
      root,
      binding: output,
      label: 'output',
      recordId: record.id,
      cache,
      violations,
      raw: false,
      theme: record.assertions?.theme
    });
  }

  for (const output of record.outputs) {
    await validateOutputTransform({
      root,
      record,
      output,
      bindingByPath,
      rawPath,
      cache,
      violations
    });
  }
  if (rawPath) validateTransformChains(root, record, rawPath, outputByPath, violations);
}

async function validateOgComposite({
  root,
  entries,
  ogDiscovery,
  registryPath,
  cache,
  violations
}) {
  const outputPath = resolve(root, 'public/og-image.png');
  const matches = entries.filter(
    (entry) => resolveRegistryPath(root, entry?.output?.path) === outputPath
  );
  if (matches.length === 0) {
    addViolation(
      violations,
      'og-evidence-record-missing',
      'public/og-image.png',
      'The OG composite requires a canonical record binding output, template, and dependencies.'
    );
    return;
  }
  if (matches.length > 1) {
    addViolation(
      violations,
      'og-evidence-record-duplicate',
      'public/og-image.png',
      'The OG composite is claimed by more than one registry record.'
    );
  }

  const entry = matches[0];
  const id = typeof entry.id === 'string' && entry.id ? entry.id : 'og-composite';
  if (entry.publicationStatus !== PUBLICATION_STATUS) {
    addViolation(
      violations,
      'og-publication-status',
      registryPath,
      'OG record ' + id + ' must use publicationStatus=' + PUBLICATION_STATUS + '.',
      { recordId: id }
    );
  }

  let output;
  try {
    output = await cachedFileInspection(outputPath, cache, true);
  } catch (error) {
    addViolation(
      violations,
      'og-output-unreadable',
      'public/og-image.png',
      'OG output could not be decoded: ' + error.message,
      { recordId: id }
    );
    output = null;
  }
  if (!entry.output || !validateHashValue(entry.output.sha256)
    || !validPositiveInteger(entry.output.width) || !validPositiveInteger(entry.output.height)) {
    addViolation(
      violations,
      'og-output-binding-invalid',
      registryPath,
      'OG output requires path, sha256, width, and height.',
      { recordId: id }
    );
  } else if (output) {
    if (entry.output.sha256 !== output.sha256) {
      addViolation(
        violations,
        'og-output-hash-mismatch',
        'public/og-image.png',
        'OG output SHA-256 does not match the current bytes.',
        { recordId: id }
      );
    }
    if (entry.output.width !== output.metrics.width
      || entry.output.height !== output.metrics.height) {
      addViolation(
        violations,
        'og-output-dimensions-mismatch',
        'public/og-image.png',
        'OG output dimensions do not match the current PNG.',
        { recordId: id }
      );
    }
    if (!output.metrics.structurePass) {
      addViolation(
        violations,
        'og-structure-gate',
        'public/og-image.png',
        'OG output lacks visual structure: '
          + output.metrics.quantizedColorCount + ' quantized colours, luminance SD '
          + output.metrics.luminanceStandardDeviation.toFixed(1) + ', edge ratio '
          + percent(output.metrics.edgeRatio) + '.',
        { recordId: id }
      );
    }
  }

  const template = await validateFileBinding({
    root,
    binding: entry.template,
    label: 'OG template',
    recordId: id,
    cache,
    violations,
    requireJson: false
  });
  if (template?.file !== ogDiscovery.template) {
    addViolation(
      violations,
      'og-template-path-mismatch',
      registryPath,
      'OG template binding must point to ' + OG_TEMPLATE_PATH + '.',
      { recordId: id }
    );
  }
  if (ogDiscovery.unreadable) {
    addViolation(
      violations,
      'og-template-unreadable',
      OG_TEMPLATE_PATH,
      'OG source template could not be read: ' + ogDiscovery.unreadable.message,
      { recordId: id }
    );
  }

  const declaredDependencies = Array.isArray(entry.dependencies) ? entry.dependencies : [];
  if (!Array.isArray(entry.dependencies)) {
    addViolation(
      violations,
      'og-dependencies-invalid',
      registryPath,
      'OG record ' + id + ' requires a dependencies array.',
      { recordId: id }
    );
  }
  const declaredByPath = new Map();
  for (const dependency of declaredDependencies) {
    const file = resolveRegistryPath(root, dependency?.path);
    if (!file || !validateHashValue(dependency?.sha256)) {
      addViolation(
        violations,
        'og-dependency-binding-invalid',
        registryPath,
        'Every OG dependency requires a repository-relative path and SHA-256.',
        { recordId: id }
      );
      continue;
    }
    declaredByPath.set(file, dependency);
    let inspection;
    try {
      inspection = await cachedFileInspection(file, cache, false);
    } catch (error) {
      addViolation(
        violations,
        'og-dependency-unreadable',
        repoPath(root, file),
        'OG dependency could not be read: ' + error.message,
        { recordId: id }
      );
      continue;
    }
    if (inspection.sha256 !== dependency.sha256) {
      addViolation(
        violations,
        'og-dependency-hash-mismatch',
        repoPath(root, file),
        'OG dependency SHA-256 does not match the current bytes.',
        { recordId: id }
      );
    }
  }

  const actualPaths = new Set(ogDiscovery.dependencies.map((dependency) => dependency.file));
  for (const dependency of ogDiscovery.dependencies) {
    if (!declaredByPath.has(dependency.file)) {
      addViolation(
        violations,
        'og-dependency-unbound',
        repoPath(root, dependency.file),
        'Local OG template dependency is missing from the canonical record.',
        { recordId: id }
      );
    }
  }
  for (const file of declaredByPath.keys()) {
    if (!actualPaths.has(file)) {
      addViolation(
        violations,
        'og-dependency-stale',
        repoPath(root, file),
        'Canonical OG dependency is no longer referenced by the template.',
        { recordId: id }
      );
    }
  }
}

function registryShapeViolations(root, loaded, violations) {
  const registryPath = repoPath(root, loaded.file);
  if (loaded.error) {
    addViolation(
      violations,
      loaded.error.code === 'ENOENT' ? 'evidence-registry-missing' : 'evidence-registry-unreadable',
      registryPath,
      'Could not read the canonical screenshot evidence registry: ' + loaded.error.message
    );
    return { records: [], ogComposites: [] };
  }
  const parsed = loaded.parsed;
  if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1
    || !Array.isArray(parsed.records) || !Array.isArray(parsed.ogComposites)) {
    addViolation(
      violations,
      'evidence-registry-invalid',
      registryPath,
      'Registry must use schemaVersion 1 with records and ogComposites arrays.'
    );
    return { records: [], ogComposites: [] };
  }
  return parsed;
}

export async function verifyScreenshotEvidence(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const discovery = await discoverScreenshotEvidence(root);
  const loadedRegistry = await loadEvidenceRegistry(root, options.registryPath);
  const violations = [...discovery.discoveryIssues];
  const registry = registryShapeViolations(root, loadedRegistry, violations);
  const cache = new Map();
  const discoveredPaths = new Set(discovery.assets.map((asset) => asset.file));
  const outputOwners = new Map();
  const registryPath = repoPath(root, loadedRegistry.file);

  const recordIds = new Set();
  for (const record of registry.records) {
    if (record && typeof record.id === 'string' && record.id !== '') {
      if (recordIds.has(record.id)) {
        addViolation(
          violations,
          'evidence-record-id-duplicate',
          registryPath,
          'Evidence record id is duplicated: ' + record.id + '.',
          { recordId: record.id }
        );
      }
      recordIds.add(record.id);
    }
    await validateEvidenceRecord({
      root,
      record,
      registryPath,
      discoveredPaths,
      outputOwners,
      cache,
      violations
    });
  }

  const results = [];
  for (const asset of discovery.assets) {
    const path = repoPath(root, asset.file);
    const isOg = asset.roles.includes('public-og');
    const owner = outputOwners.get(asset.file);
    if (!isOg && !owner) {
      addViolation(
        violations,
        'evidence-record-missing',
        path,
        'Final website screenshot is not bound by a canonical publication evidence record.',
        { references: asset.references }
      );
    }
    if (asset.roles.includes('public-guide-root')
      && !asset.roles.includes('rendered-data-reference')) {
      addViolation(
        violations,
        'orphan-public-guide',
        path,
        'Public guide screenshot is not referenced by rendered source or generated discovery data.',
        { references: asset.references }
      );
    }

    const result = {
      file: path,
      roles: asset.roles,
      references: asset.references,
      heroSource: asset.heroSource ? repoPath(root, asset.heroSource) : null,
      evidenceRecordId: owner?.record?.id ?? null
    };
    try {
      const inspection = await cachedFileInspection(asset.file, cache, true);
      result.sha256 = inspection.sha256;
      result.metrics = inspection.metrics;
      const theme = owner?.record?.assertions?.theme ?? 'dark';
      const appChromePass = theme === 'light'
        ? inspection.metrics.lightAppChromePass
        : inspection.metrics.darkAppChromePass;
      if (!isOg && !appChromePass) {
        addViolation(
          violations,
          theme + '-top-chrome-gate',
          path,
          theme + ' app-chrome pixels failed: whole dark tokens '
            + percent(inspection.metrics.darkRatio) + ', whole light tokens '
            + percent(inspection.metrics.lightRatio) + ', top dark tokens '
            + percent(inspection.metrics.topDarkRatio) + ', top light tokens '
            + percent(inspection.metrics.topLightRatio) + '.',
          { references: asset.references }
        );
      }
      if (isOg && !inspection.metrics.darkCompositePass) {
        addViolation(
          violations,
          'dark-og-composite-gate',
          path,
          'Dark OG composite pixels failed: low-luminance '
            + percent(inspection.metrics.lowLuminanceRatio) + ', high-luminance '
            + percent(inspection.metrics.highLuminanceRatio) + '.',
          { references: asset.references }
        );
      }
    } catch (error) {
      addViolation(
        violations,
        'png-unreadable',
        path,
        'Could not decode a readable PNG with valid dimensions: ' + error.message,
        { references: asset.references }
      );
    }
    results.push(result);
  }

  for (const relation of discovery.guideHeroRelations) {
    const publicOwner = outputOwners.get(relation.publicFile);
    if (!relation.heroFile || !publicOwner) continue;
    const declaredParent = resolveRegistryPath(root, publicOwner.output.derivedFrom);
    if (declaredParent !== relation.heroFile
      || !TRANSFORMS.has(publicOwner.output.transform)) {
      addViolation(
        violations,
        'guide-public-hero-relation-mismatch',
        repoPath(root, relation.publicFile),
        'Public guide image must derive from its actual heroImage.src by byte identity or exact 50% transform.',
        { recordId: publicOwner.record.id }
      );
    }
  }

  await validateOgComposite({
    root,
    entries: registry.ogComposites,
    ogDiscovery: discovery.og,
    registryPath,
    cache,
    violations
  });

  violations.sort((left, right) => (
    (left.file + '\0' + left.code + '\0' + (left.recordId ?? ''))
      .localeCompare(right.file + '\0' + right.code + '\0' + (right.recordId ?? ''))
  ));
  const roleCounts = {};
  for (const asset of discovery.assets) {
    for (const role of asset.roles) roleCounts[role] = (roleCounts[role] ?? 0) + 1;
  }
  const violationCounts = {};
  for (const violation of violations) {
    violationCounts[violation.code] = (violationCounts[violation.code] ?? 0) + 1;
  }

  return {
    ok: violations.length === 0,
    root,
    registry: {
      path: registryPath,
      schemaVersion: loadedRegistry.parsed?.schemaVersion ?? null,
      recordCount: registry.records.length,
      ogCompositeCount: registry.ogComposites.length
    },
    screenshotRoots: discovery.roots.map((entry) => ({
      ...entry,
      path: repoPath(root, entry.path)
    })),
    assets: results,
    guideHeroRelations: discovery.guideHeroRelations.map((relation) => ({
      slug: relation.slug,
      guideFile: repoPath(root, relation.guideFile),
      heroFile: relation.heroFile ? repoPath(root, relation.heroFile) : null,
      publicFile: repoPath(root, relation.publicFile)
    })),
    og: {
      template: repoPath(root, discovery.og.template),
      dependencies: discovery.og.dependencies.map((dependency) => ({
        file: repoPath(root, dependency.file),
        reference: dependency.reference
      }))
    },
    roleCounts,
    summary: {
      assetCount: results.length,
      violationCount: violations.length,
      missingEvidenceRecordCount: violationCounts['evidence-record-missing'] ?? 0,
      orphanPublicGuideCount: violationCounts['orphan-public-guide'] ?? 0,
      violationCounts
    },
    violations
  };
}

function parseCli(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--root') options.root = argv[++index];
    else if (value === '--registry' || value === '--manifest') {
      if (options.registryPath) throw new Error('Specify only one evidence registry.');
      options.registryPath = argv[++index];
    } else if (value === '--json') options.json = true;
    else if (value === '--report-only') options.reportOnly = true;
    else if (value === '--help') options.help = true;
    else throw new Error('Unknown argument: ' + value);
  }
  if (!options.root && argv.includes('--root')) throw new Error('--root requires a path.');
  if (!options.registryPath && (argv.includes('--registry') || argv.includes('--manifest'))) {
    throw new Error('--registry requires a path.');
  }
  return options;
}

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/verify-screenshot-evidence.mjs [options]',
    '',
    'Options:',
    '  --root <path>       Repository root (default: current directory)',
    '  --registry <path>   Canonical evidence registry (default: ' + DEFAULT_REGISTRY_PATH + ')',
    '  --json              Emit the complete machine-readable report',
    '  --report-only       Report violations but exit successfully during migration',
    '  --help              Show this help',
    ''
  ].join('\n'));
}

function printTextReport(report, reportOnly) {
  const status = report.ok ? 'PASS' : reportOnly ? 'REPORT' : 'FAIL';
  process.stdout.write(
    status + ' screenshot evidence: ' + report.summary.assetCount + ' PNG(s), '
      + report.summary.violationCount + ' violation(s), '
      + report.registry.recordCount + ' evidence record(s).\n'
  );
  const roleSummary = Object.entries(report.roleCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([role, count]) => role + '=' + count)
    .join(', ');
  if (roleSummary) process.stdout.write('Inventory: ' + roleSummary + '.\n');
  process.stdout.write(
    'Missing records: ' + report.summary.missingEvidenceRecordCount
      + '; orphan public guides: ' + report.summary.orphanPublicGuideCount + '.\n'
  );
  for (const violation of report.violations) {
    process.stdout.write('- [' + violation.code + '] ' + violation.file + ': '
      + violation.message + '\n');
    for (const reference of violation.references ?? []) {
      process.stdout.write('    referenced by ' + reference + '\n');
    }
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const options = parseCli(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const report = await verifyScreenshotEvidence(options);
      if (options.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      else printTextReport(report, options.reportOnly);
      if (!report.ok && !options.reportOnly) process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write('Screenshot evidence verification failed to run: '
      + (error.stack ?? error) + '\n');
    process.exitCode = 2;
  }
}
