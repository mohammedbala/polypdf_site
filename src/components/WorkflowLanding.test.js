import fs from 'node:fs';
import path from 'node:path';
import { CURRENT_INTERFACE_LABEL } from './WorkflowLanding';

test('keeps workflow pages on the shared site palette and current product label', () => {
  const stylesheet = fs.readFileSync(path.join(process.cwd(), 'src/components/WorkflowLanding.css'), 'utf8');

  expect(CURRENT_INTERFACE_LABEL).toBe('Current shipping interface · PolyPDF 1.3.4');
  expect(stylesheet).toContain('--workflow-green: var(--accent);');
  expect(stylesheet).toContain('background: var(--accent-soft);');
  expect(stylesheet).not.toContain('#d8f85d');
  expect(stylesheet).not.toMatch(/\.workflow-steps\s*\{[^}]*background:\s*var\(--workflow-ink\)/s);
});
