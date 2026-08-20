import fs from 'node:fs';
import path from 'node:path';
import { CURRENT_INTERFACE_LABEL } from './WorkflowLanding';

test('keeps workflow pages on the shared site palette and a versioned capture label', () => {
  const stylesheet = fs.readFileSync(path.join(process.cwd(), 'src/components/WorkflowLanding.css'), 'utf8');

  expect(CURRENT_INTERFACE_LABEL).toBe('PolyPDF for Mac and Windows');
  expect(stylesheet).toContain('--workflow-green: var(--accent);');
  expect(stylesheet).toContain('background: var(--accent-soft);');
  expect(stylesheet).not.toContain('#d8f85d');
  expect(stylesheet).not.toMatch(/\.workflow-steps\s*\{[^}]*background:\s*var\(--workflow-ink\)/s);
});

test('does not expose the retired landing-page video experience', () => {
  const component = fs.readFileSync(path.join(process.cwd(), 'src/components/WorkflowLanding.js'), 'utf8');
  const stylesheet = fs.readFileSync(path.join(process.cwd(), 'src/components/WorkflowLanding.css'), 'utf8');

  expect(component).not.toMatch(/<video|<track|\/videos\/|captionTrackUrl|mediaMode|mediaCopy|#watch|>Watch</);
  expect(stylesheet).not.toMatch(/\.workflow-(?:media|video)/);
});
