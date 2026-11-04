import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { MemoryRouter } from 'react-router';
import WorkflowLanding from './WorkflowLanding';
import { landingPages } from '../lib/landingPages';

test.each([
  [landingPages.pdfTakeoffSoftware, 'try-a-takeoff', 'takeoff-files-title'],
  [landingPages.measurePdfOnMac, 'try-mac-measurement', 'mac-measurement-files']
])('one architectural evaluation preserves source, anchors and historical evidence on $path', (page, anchor, filesId) => {
  const node = document.createElement('div');
  node.innerHTML = renderToStaticMarkup(<MemoryRouter><WorkflowLanding page={page} /></MemoryRouter>);
  const evaluation = node.querySelector('#construction-example-takeoff');
  expect(node.querySelectorAll('#construction-example-takeoff')).toHaveLength(1);
  expect(evaluation.querySelector('#' + anchor)).not.toBeNull();
  expect(evaluation.querySelector('#' + filesId)).not.toBeNull();
  const steps = evaluation.querySelector('.takeoff-evaluation-steps');
  expect(steps.children).toHaveLength(3);
  expect(steps.textContent).toContain('96 ft width and 60 ft depth');
  expect(steps.textContent).toContain('5,760 sq ft gross area');
  expect(steps.textContent).not.toContain('408');
  expect(evaluation.querySelector('a[href="/samples/construction/02-Architectural-Revision-A.pdf"]')).not.toBeNull();
  expect(evaluation.querySelector('a[href$="willow-creek-a101-takeoff.csv"]')).not.toBeNull();
  expect(evaluation.textContent).toContain('local Mac build 1.6.14 build 76');
  const historical = evaluation.querySelector('.takeoff-historical');
  expect(historical.open).toBe(false);
  expect(historical.textContent).toContain('408 sq ft');
  expect(historical.textContent).toContain('1.6.6 build 38');
  expect(historical.textContent).toContain('do not establish current-release or Windows parity');
  expect(historical.querySelector('a[href="/samples/takeoff/flooring-mac-measured.pdf"]')).not.toBeNull();
  const ids = [...node.querySelectorAll('[id]')].map(el => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(node.querySelector('.workflow-hero .dl-evaluation details')).toBeNull();
  expect(node.querySelector('.workflow-hero .dl-evaluation a').getAttribute('href')).toBe('#' + anchor);
});
