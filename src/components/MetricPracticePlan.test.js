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
  expect(steps[2]).toContain('between snapped endpoints');
  expect(steps[3]).toContain('40.00 m width');
  expect(steps[4]).toContain('800.00 sq m gross area, including walls');
  expect(steps[4]).toContain('85.00 sq m');
  expect(steps[4]).toContain('outer face of the wall');
  expect(node.textContent).toContain('public Mac 1.6.29 build 101');
  expect(node.textContent).toContain('adds the two areas into one total');
  expect(node.textContent).toContain('own plan, drawn for one market');
  expect(node.textContent).toContain('feet and inches');
  expect(node.textContent).toContain('not the dimension label');
  expect(node.textContent).toContain('not reviewed by a local construction professional');
  expect(node.textContent).not.toMatch(/regionally correct|compliant|conforms/i);
});

const IDS = ['en', 'de', 'fr', 'es', 'pt-br', 'ja', 'zh-cn', 'hi', 'ar'];
const recordFile = (file) => path.join(process.cwd(), 'public/samples/evaluation/public-mac-1.6.29-101', file);

test('every file the metric plan links to is published', () => {
  const node = render();
  const local = [...node.querySelectorAll('a[href], img[src]')].map((el) => el.getAttribute('href') || el.getAttribute('src'));
  expect(local.length).toBeGreaterThanOrEqual(3);
  const srcset = node.querySelector('img').getAttribute('srcset').split(',').map((part) => part.trim().split(' ')[0]);
  for (const file of [...local, ...srcset]) expect(fs.existsSync(path.join(process.cwd(), 'public', file))).toBe(true);
  for (const id of IDS) {
    expect(fs.existsSync(path.join(process.cwd(), `public/samples/metric/polypdf-metric-practice-plan-${id}.pdf`))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), `public/samples/metric/previews/polypdf-metric-practice-plan-${id}-1600.webp`))).toBe(true);
    expect(fs.existsSync(recordFile(`metric-${id}-takeoff.csv`))).toBe(true);
  }
  for (const file of ['polypdf-metric-practice-plan-de-measured.pdf', 'polypdf-metric-practice-plan-ar-measured.pdf', 'metric-verification.html', 'metric-verification.json']) {
    expect(fs.existsSync(recordFile(file))).toBe(true);
  }
});

test('each market worksheet holds one check length and the two traced areas that the record states', () => {
  const record = JSON.parse(fs.readFileSync(recordFile('metric-verification.json'), 'utf8'));
  expect(record.plans.map((plan) => plan.id).sort()).toEqual([...IDS].sort());
  for (const plan of record.plans) {
    const csv = fs.readFileSync(recordFile(`metric-${plan.id}-takeoff.csv`), 'utf8');
    expect(csv).toContain(`Length,1,SUM(${Number(plan.check)}),${Number(plan.check)},m,1`);
    expect(csv).toMatch(/Area,2,SUM\([\d.]+ \+ [\d.]+\)/);
    const [gross, floor] = csv.match(/Area,2,SUM\(([\d.]+) \+ ([\d.]+)\)/).slice(1).map(Number);
    expect(Math.abs(gross - Number(plan.gross))).toBeLessThan(0.006);
    expect(Math.abs(floor - Number(plan.floor))).toBeLessThan(0.006);
  }
});
