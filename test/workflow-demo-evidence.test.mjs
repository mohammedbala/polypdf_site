import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { verifyWorkflowHomeMarkup, verifyWorkflowResource, workflowResources } from '../scripts/workflow-demo-evidence.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hash = 'a'.repeat(64);
const manifest = () => ({
  schemaVersion: 1,
  capture: {
    version: '1.5.4', build: '26', date: '2026-09-22', mode: 'development', sourceRevision: 'a'.repeat(40), rendererSha256: hash,
    rendererUrl: 'file:///workspace/polypdf/dist/renderer/index.html', appBundle: '/workspace/node_modules/electron/dist/Electron.app'
  },
  demos: ['takeoff', 'compare', 'review'].map((id) => ({
    id, outcome: 'A verified drawing workflow', width: 1280, height: 800, duration: 12,
    outputs: ['gif', 'mp4', 'webm', 'webp'].map((extension) => ({ path: `/images/workflows/${id}.${extension}`, sha256: hash, bytes: 1024 })),
    samples: (id === 'compare' ? ['a', 'b'] : ['a']).map((revision) => ({ path: `/samples/conversion/northline-studio-rev-${revision}.pdf`, sha256: hash }))
  }))
});

test('requires all three workflows, four formats and the comparison source pair', () => {
  assert.equal(workflowResources(manifest()).length, 14);
  const incomplete = manifest();
  incomplete.demos[1].samples.pop();
  assert.throws(() => workflowResources(incomplete), /missing the source hash.*rev-b\.pdf/);
  const missingGif = manifest();
  missingGif.demos[0].outputs.pop();
  assert.throws(() => workflowResources(missingGif), /needs GIF, MP4, WebM, and WebP/);
});

test('requires capture source identity separately from the advertised release', () => {
  const evidence = manifest();
  evidence.capture.mode = 'current';
  assert.throws(() => workflowResources(evidence), /distinguish development from release/);
  evidence.capture.mode = 'development';
  evidence.capture.rendererSha256 = '';
  assert.throws(() => workflowResources(evidence), /renderer hash is missing/);
});

test('detects changed media bytes and HTML masquerading as an image', () => {
  const gif = Buffer.from('GIF89a-verifier-signature-fixture');
  const resource = { path: '/images/workflows/takeoff.gif', sha256: sha256(gif), bytes: gif.length };
  assert.doesNotThrow(() => verifyWorkflowResource(gif, resource));
  assert.throws(() => verifyWorkflowResource(Buffer.from('changed'), resource), /hash does not match/);
  const html = Buffer.from('<!doctype html><div id="root"></div>');
  assert.throws(() => verifyWorkflowResource(html, { ...resource, sha256: sha256(html), bytes: html.length }), /wrong file signature/);
});

test('the old screenshot label alone cannot satisfy the new homepage proof requirements', () => {
  assert.throws(() => verifyWorkflowHomeMarkup('Authentic 1.5.1 build 23 interface'), /not associated with the capture manifest/);
  assert.throws(() => verifyWorkflowHomeMarkup('<section data-workflow-capture-manifest="/images/workflows/manifest.json">Actual PolyPDF interface</section>'), /takeoff poster is missing/);
});
