import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { MemoryRouter } from 'react-router';
import WorkflowLanding from './WorkflowLanding';
import ProductFacts from './ProductFacts';
import TakeoffSpreadsheetPage from './TakeoffSpreadsheetPage';
import { GrowthLanding } from './GrowthPages';
import { landingPages } from '../lib/landingPages';

jest.mock('../lib/analytics', () => ({ trackEvent: jest.fn() }));

const render = (element) => {
  const node = document.createElement('div');
  node.innerHTML = renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
  return node;
};

test('the takeoff page answers the Mac question with routes by category and no vendor names', () => {
  const node = render(<WorkflowLanding page={landingPages.pdfTakeoffSoftware} />);
  const section = node.querySelector('.takeoff-on-mac');
  expect(section.querySelector('h2#takeoff-on-mac').textContent).toBe('How do you do a construction takeoff on a Mac?');
  expect(section.textContent).toContain('macOS 14 or newer, on Apple silicon and Intel Macs');
  expect(section.textContent).toContain('Updated November 2026');
  expect(section.textContent).toContain('Counts were not part of that test.');
  expect(node.textContent).toContain('a plan drawn in metric has not been tested');
  expect(section.textContent).not.toContain('this sequence');
  expect(section.querySelectorAll('tbody tr')).toHaveLength(4);
  expect(section.textContent).not.toMatch(/bluebeam|revu|parallels|vmware|togal|planswift|stack/i);
  expect(node.querySelector('h1').textContent).toBe(landingPages.pdfTakeoffSoftware.title);
  const faq = [...node.querySelectorAll('.workflow-faq summary')].map((el) => el.textContent);
  expect(faq).toEqual(expect.arrayContaining(['Can PolyPDF measure scanned drawings?', 'Which units does PolyPDF use?', 'Does PolyPDF include labor and material prices?']));
  expect(node.textContent).toContain('It does not come with labor units, material prices, or assemblies');
});

test('the Mac page gives five steps, each with a screen from the public build that exists on disk', () => {
  const node = render(<WorkflowLanding page={landingPages.measurePdfOnMac} />);
  const steps = [...node.querySelectorAll('.workflow-step-list--illustrated > li')];
  expect(steps).toHaveLength(5);
  steps.forEach((step) => {
    const image = step.querySelector('img.workflow-step-image');
    expect(image.getAttribute('alt').length).toBeGreaterThan(20);
    image.getAttribute('srcset').split(', ').map((entry) => entry.split(' ')[0]).forEach((src) => {
      expect(src).toContain('/samples/evaluation/public-mac-1.6.27-99/guide/');
      expect(fs.existsSync(path.join(process.cwd(), 'public', src))).toBe(true);
    });
  });
  const text = steps.map((step) => step.textContent).join(' ');
  ['File > Open', 'Scale not set', 'View > Snap to Content', 'Calibrate by Drawing Line', 'Known Distance', 'Linear Dimension', 'Shift-L', 'Shift-A', 'Records tab', 'Takeoff Worksheet', 'File > Save As'].forEach((name) => expect(text).toContain(name));
  expect(text).toContain('5,760 sq ft gross, which includes the walls');
  expect(text).toContain('sum of the two lengths, not a perimeter');
  expect(node.textContent).toContain('PolyPDF for Mac 1.6.27 build 99');
});

test('product facts and the spreadsheet page lead with the public record and drop the older wording', () => {
  const facts = render(<ProductFacts />);
  expect(facts.textContent).toContain('Read how the takeoff samples were made');
  expect(facts.textContent).toContain('It does not come with labor units, material prices, or assemblies');
  expect(facts.textContent).not.toMatch(/local Mac build|file hashes|1\.6\.14|408 sq ft of flooring|Excel, CSV/);
  expect(facts.querySelector('a[href$="public-mac-1.6.27-99/willow-creek-a101-takeoff.csv"]')).not.toBeNull();
  const sheet = render(<TakeoffSpreadsheetPage />);
  expect(sheet.querySelector('h1').textContent).toBe('Construction takeoff spreadsheet');
  expect(sheet.querySelector('a[href$="public-mac-1.6.27-99/willow-creek-a101-takeoff.csv"]')).not.toBeNull();
  expect(sheet.textContent).not.toMatch(/real PolyPDF|local Mac build|1\.6\.14/);
});

test('flooring separates area from order quantity and links the calculator', () => {
  const node = render(<GrowthLanding kind="flooring" />);
  const table = node.querySelector('[aria-label="Flooring quantities from the plan to the order"]');
  expect(table.querySelectorAll('tbody tr')).toHaveLength(4);
  expect(table.textContent).toContain('Net area');
  expect(table.textContent).toContain('rounded up to whole packs');
  expect(table.querySelector('a[href="/tools/flooring-waste-calculator/"]')).not.toBeNull();
  expect(render(<GrowthLanding kind="electrical" />).querySelector('#flooring-quantities')).toBeNull();
});

test('the measuring page opens with platforms and the license and shows the public check', () => {
  const node = render(<GrowthLanding kind="measurement" />);
  expect(node.textContent).toContain('macOS 14 or newer and Windows 10 and 11, with one Pro license for up to 3 computers in any mix');
  expect(node.querySelector('#measurement-public-mac-check')).not.toBeNull();
  expect(node.textContent).not.toContain('not new app test results');
  expect(node.textContent).not.toContain('tested local build');
});
