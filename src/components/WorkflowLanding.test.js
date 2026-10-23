import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import WorkflowLanding, { CURRENT_INTERFACE_LABEL } from './WorkflowLanding';
import { landingPages } from '../lib/landingPages';

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

test('client navigation between workflows mounts the correct new video instead of retaining the previous clip', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() {}
    unobserve() {}
  };
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'polypdf_pro_1x_2026', kind: 'standard', available: true, price: 74.95, currency: 'USD' }) });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/pdf-takeoff-software']}>
        <Link to="/compare-pdf-drawings" data-navigation-test>Compare</Link>
        <Routes>
          <Route path="/pdf-takeoff-software" element={<WorkflowLanding page={landingPages.pdfTakeoffSoftware} />} />
          <Route path="/compare-pdf-drawings" element={<WorkflowLanding page={landingPages.comparePdfDrawings} />} />
        </Routes>
      </MemoryRouter>
    ));
    const firstObserver = observers.find((observer) => observer.target?.matches('.workflow-demo-media'));
    await act(async () => firstObserver.callback([{ isIntersecting: true }]));
    const firstVideo = container.querySelector('video');
    expect(firstVideo.querySelector('source').getAttribute('src')).toBe('/images/workflows/takeoff.webm');

    await act(async () => container.querySelector('[data-navigation-test]').click());
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.workflow-demo-media img').getAttribute('src')).toBe('/images/workflows/compare.webp');
    const nextObserver = observers.filter((observer) => observer.target?.matches('.workflow-demo-media')).at(-1);
    await act(async () => nextObserver.callback([{ isIntersecting: true }]));
    const nextVideo = container.querySelector('video');
    expect(nextVideo).not.toBe(firstVideo);
    expect(nextVideo.querySelector('source').getAttribute('src')).toBe('/images/workflows/compare.webm');
  } finally {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
    delete global.fetch;
    delete window.IntersectionObserver;
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  }
});
