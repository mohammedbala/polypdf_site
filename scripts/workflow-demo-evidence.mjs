import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const workflowIds = ['takeoff', 'compare', 'review'];
export const workflowManifestPath = '/images/workflows/manifest.json';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const requireEvidence = (condition, message) => {
  if (!condition) throw new Error(`workflow demos: ${message}`);
};

export function workflowResources(manifest) {
  requireEvidence(manifest?.schemaVersion === 1, 'unsupported or missing manifest schema');
  const capture = manifest.capture;
  requireEvidence(/^\d+\.\d+\.\d+$/.test(capture?.version || ''), 'capture version is missing');
  requireEvidence(/^\d+$/.test(String(capture?.build || '')), 'capture build is missing');
  requireEvidence(Number.isFinite(Date.parse(capture?.date)), 'capture date is missing');
  requireEvidence(['development', 'release'].includes(capture?.mode), 'capture mode must distinguish development from release');
  requireEvidence(/^[a-f0-9]{40}$/.test(capture?.sourceRevision || ''), 'source revision is missing');
  requireEvidence(/^[a-f0-9]{64}$/.test(capture?.rendererSha256 || ''), 'renderer hash is missing');
  requireEvidence(/\/polypdf\/dist\/renderer\/index\.html$/.test(capture?.rendererUrl || ''), 'capture does not identify the Electron renderer');
  requireEvidence(/\/node_modules\/electron\/dist\/Electron\.app$/.test(capture?.appBundle || ''), 'capture does not identify the Electron app bundle');
  requireEvidence(Array.isArray(manifest.demos) && manifest.demos.length === 3, 'exactly three workflow records are required');
  const resources = new Map();
  for (const id of workflowIds) {
    const demo = manifest.demos.find((entry) => entry.id === id);
    requireEvidence(demo, `${id} record is missing`);
    requireEvidence(typeof demo.outcome === 'string' && demo.outcome.length > 12, `${id} has no verified outcome`);
    requireEvidence(demo.width === 1280 && demo.height === 800 && demo.duration > 0, `${id} dimensions or duration are missing`);
    requireEvidence(Array.isArray(demo.outputs) && demo.outputs.length === 4, `${id} needs GIF, MP4, WebM, and WebP outputs`);
    for (const extension of ['gif', 'mp4', 'webm', 'webp']) {
      const expectedPath = `/images/workflows/${id}.${extension}`;
      const output = demo.outputs.find((entry) => entry.path === expectedPath);
      requireEvidence(output && /^[a-f0-9]{64}$/.test(output.sha256 || ''), `${expectedPath} hash is missing`);
      requireEvidence(Number.isInteger(output.bytes) && output.bytes > 100, `${expectedPath} length is missing`);
      resources.set(expectedPath, output);
    }
    const expectedSamples = id === 'compare' ? ['a', 'b'] : ['a'];
    requireEvidence(Array.isArray(demo.samples), `${id} source drawings are missing`);
    for (const revision of expectedSamples) {
      const samplePath = `/samples/conversion/northline-studio-rev-${revision}.pdf`;
      const sample = demo.samples.find((entry) => entry.path === samplePath);
      requireEvidence(sample && /^[a-f0-9]{64}$/.test(sample.sha256 || ''), `${id} is missing the source hash for ${samplePath}`);
      resources.set(samplePath, sample);
    }
  }
  return [...resources.values()];
}

export function verifyWorkflowResource(bytes, resource) {
  requireEvidence(hash(bytes) === resource.sha256, `${resource.path} hash does not match the capture manifest`);
  if (resource.bytes !== undefined) requireEvidence(bytes.length === resource.bytes, `${resource.path} file length changed`);
  const extension = path.extname(resource.path);
  const signatureIsValid = {
    '.gif': bytes.subarray(0, 6).toString() === 'GIF89a' || bytes.subarray(0, 6).toString() === 'GIF87a',
    '.webp': bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
    '.mp4': bytes.subarray(4, 8).toString() === 'ftyp',
    '.webm': bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
    '.pdf': bytes.subarray(0, 5).toString() === '%PDF-'
  }[extension];
  requireEvidence(signatureIsValid, `${resource.path} has the wrong file signature`);
}

export function verifyWorkflowFiles(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, workflowManifestPath), 'utf8'));
  const resources = workflowResources(manifest);
  for (const resource of resources) {
    verifyWorkflowResource(fs.readFileSync(path.join(directory, resource.path)), resource);
  }
  return { manifest, resources };
}

export function verifyWorkflowHomeMarkup(html) {
  requireEvidence(html.includes(`data-workflow-capture-manifest="${workflowManifestPath}"`), 'homepage is not associated with the capture manifest');
  requireEvidence(html.includes('Actual PolyPDF interface'), 'homepage lacks an authentic capture label');
  for (const id of workflowIds) {
    requireEvidence(html.includes(`src="/images/workflows/${id}.webp"`), `homepage ${id} poster is missing`);
    for (const extension of ['gif', 'mp4']) {
      requireEvidence(html.includes(`href="/images/workflows/${id}.${extension}"`), `homepage ${id} ${extension} link is missing`);
    }
  }
  for (const revision of ['a', 'b']) {
    requireEvidence(html.includes(`href="/samples/conversion/northline-studio-rev-${revision}.pdf"`), `homepage sample revision ${revision} link is missing`);
  }
}
