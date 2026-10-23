import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import GrowthNav from './GrowthNav';
import LanguageSelector from './LanguageSelector';

let container;
let root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<MemoryRouter><GrowthNav /><LanguageSelector /></MemoryRouter>));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

function open(details) {
  act(() => {
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
  });
}

test('opening another navigation group closes the previous menu', () => {
  const groups = container.querySelectorAll('.growth-nav details');
  open(groups[0]);
  open(groups[1]);
  expect(groups[0].open).toBe(false);
  expect(groups[1].open).toBe(true);
  expect(container.querySelectorAll('.growth-nav details[open]')).toHaveLength(1);
});

test('Escape closes navigation and language menus and returns keyboard focus', () => {
  for (const details of container.querySelectorAll('details')) {
    open(details);
    const link = details.querySelector('a');
    link.focus();
    act(() => link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(details.querySelector('summary'));
  }
});

test('following a navigation link closes its menu', () => {
  const details = container.querySelector('.growth-nav details');
  open(details);
  act(() => details.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 })));
  expect(details.open).toBe(false);
});
