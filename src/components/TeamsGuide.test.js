import axe from 'axe-core';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import TeamsGuide, { employeeChecklist } from './TeamsGuide';
import { ManagerDownload, qualifiedManagerDownload } from './TeamsJourney';
let root, container, previousFetch;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  previousFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ schema: 1, available: false }) });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); global.fetch = previousFetch; globalThis.IS_REACT_ACT_ENVIRONMENT = false; });
const renderGuide = async () => act(async () => root.render(<MemoryRouter><TeamsGuide /></MemoryRouter>));
test('customer guide has navigable steps and never exposes unavailable installers or historical validation content', async () => {
  await renderGuide();
  for (const link of container.querySelectorAll('a[href^="#"]')) expect(container.querySelector(link.getAttribute('href'))).not.toBeNull();
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  expect(container.textContent).toContain('at least 3 users');
  expect(container.textContent).toContain('they do not create PolyPDF accounts');
  expect(container.textContent).toContain('Microsoft’s cloud');
  for (const text of ['Local invitations', 'Back up now', 'Restore backup', 'Install renewed certificate', '24 hours', 'ten-minute', 'Windows administrator']) expect(container.textContent).toContain(text);
  expect(container.textContent).not.toContain('administrator PowerShell window');
  expect(container.textContent).toContain('License Manager downloads are not available yet');
  expect(Array.from(container.querySelectorAll('a[href$=".exe"]')).map(link => link.getAttribute('href'))).toEqual(['/downloads/collaboration/PolyPDF-Collaboration-Host-Setup.exe']);
  for (const text of ['License Manager 1.0.1', 'PolyPDF 1.6.1', 'Create setup code', 'Check connectivity', 'Connect with company sign-in']) expect(container.textContent).toContain(text);
  expect(container.textContent).not.toMatch(/historical|synthetic|localhost|validation diary|worktree|September 22/i);
});
test('employee instructions copy without a private hostname and provide a manual fallback', async () => {
  const writeText = jest.fn().mockRejectedValue(new Error('denied'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  await renderGuide();
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Copy employee checklist');
  await act(async () => button.click());
  expect(writeText).toHaveBeenCalledWith(employeeChecklist);
  expect(container.textContent).toContain('copy it manually');
  writeText.mockResolvedValue(undefined);
  await act(async () => button.click());
  expect(container.textContent).toContain('Attach your company connection file');
});
test('printing includes collapsed recovery instructions and restores disclosure state', async () => {
  await renderGuide();
  const details = container.querySelector('details');
  expect(details.open).toBe(false);
  act(() => window.dispatchEvent(new Event('beforeprint')));
  expect(Array.from(container.querySelectorAll('details')).every(d => d.open)).toBe(true);
  act(() => window.dispatchEvent(new Event('afterprint')));
  expect(details.open).toBe(false);
});
test('download failure is recoverable and a qualified release exposes its matching hash', async () => {
  global.fetch.mockRejectedValueOnce(new Error('offline'));
  await act(async () => root.render(<ManagerDownload />));
  expect(container.textContent).toContain('couldn’t check downloads');
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ schema: 1, available: true, manager: { version: '1.0.0', sha256: 'a'.repeat(64), url: 'https://www.polypdf.com/downloads/manager.exe' } }) });
  await act(async () => container.querySelector('button').click());
  expect(container.querySelector('a').href).toBe('https://www.polypdf.com/downloads/manager.exe');
  expect(container.textContent).toContain('a'.repeat(64));
});
test.each([
  { available: false }, { schema: 2 }, { manager: { url: 'https://attacker.example/manager.exe' } },
  { manager: { sha256: null } }, { manager: { url: 'https://www.polypdf.com/downloads/manager.exe?redirect=external' } }
])('download metadata fails closed for invalid or unqualified release %j', overrides => {
  const release = { schema: 1, available: true, manager: { url: 'https://www.polypdf.com/downloads/manager.exe', version: '1.0.0', sha256: 'a'.repeat(64) } };
  expect(qualifiedManagerDownload({ ...release, ...overrides, manager: { ...release.manager, ...overrides.manager } })).toBeNull();
});

test('guide controls and content satisfy automated accessibility checks', async () => {
  await renderGuide();
  const result = await axe.run(container, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
});
