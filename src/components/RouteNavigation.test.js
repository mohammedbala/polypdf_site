import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import RouteNavigation from './RouteNavigation';

let container, root, frames, scrolled;
const originalScroll = Element.prototype.scrollIntoView;
const originalWindowScroll = window.scrollTo;
const originalRaf = window.requestAnimationFrame;
const originalCancel = window.cancelAnimationFrame;
const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  frames = new Map(); scrolled = [];
  let id = 0;
  window.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = function () { scrolled.push(this.id); };
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  Element.prototype.scrollIntoView = originalScroll;
  window.scrollTo = originalWindowScroll;
  window.requestAnimationFrame = originalRaf;
  window.cancelAnimationFrame = originalCancel;
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts); else delete document.fonts;
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});
const flush = async () => { await act(async () => {}); act(() => { for (const callback of frames.values()) callback(); frames.clear(); }); };
const render = async (entry = '/source') => {
  await act(async () => root.render(<MemoryRouter initialEntries={[entry]}>
    <RouteNavigation />
    <nav><Link to="/facts#saved-example">Saved example</Link><Link to="/facts#caf%C3%A9">Second section</Link><Link to="/source">Plain page</Link><Link to="/facts?view=details">Query only</Link></nav>
    <div id="site-content"><Routes>
      <Route path="/source" element={<h1>Source page</h1>} />
      <Route path="/facts" element={<><h1>Facts</h1><section id="saved-example">Saved example details</section><details><summary>More</summary><section id="café">Decoded section</section></details></>} />
    </Routes></div>
  </MemoryRouter>));
  await flush();
};
const follow = async name => { await act(async () => [...container.querySelectorAll('nav a')].find(link => link.textContent === name).click()); await flush(); };

test('cross-page and same-page section links scroll and focus the requested destination', async () => {
  await render();
  await follow('Saved example');
  expect(scrolled).toEqual(['saved-example']);
  expect(document.activeElement.id).toBe('saved-example');
  await follow('Second section');
  expect(scrolled).toEqual(['saved-example', 'café']);
  expect(document.activeElement.id).toBe('café');
  expect(container.querySelector('details').open).toBe(true);
});

test('direct section URLs work on initial render', async () => {
  await render('/facts#saved-example');
  expect(scrolled).toEqual(['saved-example']);
});

test('plain page navigation returns to its heading while query-only changes preserve position', async () => {
  await render('/facts');
  await follow('Query only');
  expect(window.scrollTo).not.toHaveBeenCalled();
  await follow('Plain page');
  expect(document.activeElement.textContent).toBe('Source page');
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
});

test('a delayed font load cannot scroll an old destination after the user leaves', async () => {
  let resolveFonts;
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(resolve => { resolveFonts = resolve; }) } });
  await render('/facts#saved-example');
  await follow('Plain page');
  await act(async () => resolveFonts());
  await flush();
  expect(scrolled).toEqual([]);
  expect(document.activeElement.textContent).toBe('Source page');
});
