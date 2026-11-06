import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server.node';
import MetricPracticePlan from './MetricPracticePlan';

jest.mock('../lib/analytics', () => ({ trackEvent: jest.fn() }));

const render = () => {
  const node = document.createElement('div');
  node.innerHTML = renderToStaticMarkup(<MetricPracticePlan source="test" />);
  return node;
};

test('the metric plan sets the unit first and states what was measured', () => {
  const node = render();
  const steps = [...node.querySelectorAll('.takeoff-evaluation-steps li')].map((li) => li.textContent);
  expect(steps).toHaveLength(5);
  expect(steps[0]).toContain('set Unit system to Metric');
  expect(steps[1]).toContain('set Length to Meters');
  expect(steps[2]).toContain('10 m scale bar');
  expect(steps[3]).toContain('40.00 m width and the 20.00 m depth');
  expect(steps[4]).toContain('800.00 sq m gross area, including walls');
  expect(node.textContent).toContain('public Mac 1.6.29 build 101');
  expect(node.textContent).toContain('85.00 sq m');
  expect(node.textContent).toContain('set Length to Meters, calibrate it');
  expect(node.textContent).toContain('outer face of the wall');
  expect(node.textContent).toContain('on the French sheet, and measured the German sheet using the Metric button');
  expect(node.textContent).toContain('the saved German PDF');
  expect(node.textContent).toContain('feet and inches');
  expect(node.textContent).toContain('not the two dimension labels');
  expect(node.textContent).toContain('not reviewed by a local construction professional');
  expect(node.textContent).not.toMatch(/regionally correct|compliant|conforms/i);
});

test('every file the metric plan links to is published', () => {
  const node = render();
  const local = [...node.querySelectorAll('a[href], img[src]')].map((el) => el.getAttribute('href') || el.getAttribute('src'));
  expect(local.length).toBeGreaterThanOrEqual(3);
  const srcset = node.querySelector('img').getAttribute('srcset').split(',').map((part) => part.trim().split(' ')[0]);
  for (const file of [...local, ...srcset]) expect(fs.existsSync(path.join(process.cwd(), 'public', file))).toBe(true);
  for (const id of ['en', 'de', 'fr', 'es', 'pt-br']) {
    expect(fs.existsSync(path.join(process.cwd(), `public/samples/metric/polypdf-metric-practice-plan-${id}.pdf`))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), `public/samples/metric/previews/polypdf-metric-practice-plan-${id}-1600.webp`))).toBe(true);
  }
  for (const file of ['polypdf-metric-practice-plan-de-measured.pdf', 'polypdf-metric-practice-plan-fr-measured.pdf', 'metric-de-takeoff.csv', 'metric-fr-takeoff.csv', 'metric-fr-flooring-f2.csv', 'metric-verification.json']) {
    expect(fs.existsSync(path.join(process.cwd(), 'public/samples/evaluation/public-mac-1.6.29-101', file))).toBe(true);
  }
});

test('the saved metric worksheets show two lengths and one area in metres', () => {
  const read = (file) => fs.readFileSync(path.join(process.cwd(), 'public/samples/evaluation/public-mac-1.6.29-101', file), 'utf8');
  for (const file of ['metric-de-takeoff.csv', 'metric-fr-takeoff.csv']) {
    expect(read(file)).toContain('Area,1,SUM(800),800,sq m,1');
    expect(read(file)).toContain('Length,2,SUM(40 + 20),60,m,1');
  }
  expect(read('metric-fr-flooring-f2.csv')).toContain('Area,1,SUM(85),85,sq m,1');
});
