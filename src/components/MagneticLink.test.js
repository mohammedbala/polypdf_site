import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useReducedMotion } from 'framer-motion';
import MagneticLink from './MagneticLink';
import { SiteMotionButton, SiteMotionProvider } from './SiteMotion';

// Keep the actual motion element, values, and spring scheduler. Only the OS
// preference is controlled; the tests inspect the transform users actually see.
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useReducedMotion: jest.fn()
}));

let container;
let root;

const frames = async (count = 8) => {
  for (let index = 0; index < count; index += 1) {
    await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
  }
};

const pointer = (target, type = 'mouse', eventType = 'pointermove') => {
  const event = new MouseEvent(eventType, { bubbles: true, clientX: 195, clientY: 70 });
  Object.defineProperty(event, 'pointerType', { value: type });
  target.dispatchEvent(event);
};

const renderLink = async (props = {}) => {
  await act(async () => root.render(
    <SiteMotionProvider>
      <MagneticLink href="/buy/" {...props}>Checkout</MagneticLink>
      <SiteMotionButton />
    </SiteMotionProvider>
  ));
  const link = container.querySelector('a');
  link.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 60 });
  return { link, toggle: container.querySelector('button') };
};

const expectStill = (link) => {
  expect(['', 'none', 'translateX(0px) translateY(0px) translateZ(0)']).toContain(link.style.transform);
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  useReducedMotion.mockReturnValue(false);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  jest.clearAllMocks();
});

test('manual site pause clears an active spring and pointer movement stays inert until resume', async () => {
  const { link, toggle } = await renderLink();
  await act(async () => pointer(link));
  await frames();
  expect(link.style.transform).toMatch(/translate[XY]\((?!0px)/);

  await act(async () => toggle.click());
  await frames(2);
  expectStill(link);
  await act(async () => pointer(link));
  await frames();
  expectStill(link);

  await act(async () => toggle.click());
  await frames(2);
  expectStill(link);
  await act(async () => pointer(link));
  await frames();
  expect(link.style.transform).toMatch(/translate[XY]\((?!0px)/);
});

test('OS reduced motion remains still even when the manual pause is toggled off', async () => {
  useReducedMotion.mockReturnValue(true);
  const { link, toggle } = await renderLink();
  await act(async () => pointer(link));
  await frames(2);
  expectStill(link);
  await act(async () => toggle.click());
  await act(async () => toggle.click());
  await act(async () => pointer(link));
  await frames(2);
  expectStill(link);
});

test('touch stays still, forwards its ref and callbacks, and retains the checkout link', async () => {
  const ref = createRef();
  const onPointerMove = jest.fn();
  const onPointerLeave = jest.fn();
  const { link } = await renderLink({ ref, onPointerMove, onPointerLeave });
  await act(async () => pointer(link, 'touch'));
  await frames(2);
  expectStill(link);
  await act(async () => pointer(link, 'touch', 'pointerout'));
  expect(onPointerMove).toHaveBeenCalledTimes(1);
  expect(onPointerLeave).toHaveBeenCalledTimes(1);
  expect(ref.current).toBe(link);
  expect(link.getAttribute('href')).toBe('/buy/');
});
