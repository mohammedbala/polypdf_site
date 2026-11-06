import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { MemoryRouter } from 'react-router';
import WorkflowLanding from './WorkflowLanding';
import { landingPages } from '../lib/landingPages';

test.each([
  [landingPages.pdfTakeoffSoftware, 'try-a-takeoff', 'takeoff-files-title'],
  [landingPages.measurePdfOnMac, 'try-mac-measurement', 'mac-measurement-files']
])('one architectural evaluation keeps its source and anchors and leads with the public Mac record on $path', (page, anchor, filesId) => {
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
  expect(evaluation.querySelector('a[href$="public-mac-1.6.27-99/willow-creek-a101-measured.pdf"]')).not.toBeNull();
  expect(evaluation.querySelector('a[href$="public-mac-1.6.27-99/willow-creek-a101-takeoff.csv"]')).not.toBeNull();
  expect(evaluation.querySelector('a[href$="public-mac-1.6.27-99/verification.html"]')).not.toBeNull();
  expect(evaluation.textContent).toContain('public Mac 1.6.27 build 99');
  expect(evaluation.textContent).toContain('535.12 sq m');
  expect(evaluation.textContent).toContain('a plan drawn in metric has not been tested');
  expect(evaluation.textContent).not.toMatch(/1\.6\.14|1\.6\.6|local Mac build|file hashes|republished/);
  expect(evaluation.querySelector('.takeoff-historical')).toBeNull();
  const ids = [...node.querySelectorAll('[id]')].map(el => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(node.querySelector('.workflow-hero .dl-evaluation details')).toBeNull();
  expect(node.querySelector('.workflow-hero .dl-evaluation a').getAttribute('href')).toBe('#' + anchor);
});
