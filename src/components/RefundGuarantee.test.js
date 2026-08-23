import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Refund from './Refund';
import Support from './Support';
import Terms from './Terms';

class TestIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const renderRoute = async (Component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Component />
      </MemoryRouter>
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const markup = container.innerHTML;
  act(() => root.unmount());
  container.remove();
  return markup;
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = jest.fn();
  window.IntersectionObserver = TestIntersectionObserver;
  global.IntersectionObserver = TestIntersectionObserver;
});

afterEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  delete window.IntersectionObserver;
  delete global.IntersectionObserver;
});

test('legal and support routes state the same 14-day money-back guarantee', async () => {
  const refund = await renderRoute(Refund);
  const terms = await renderRoute(Terms);
  const support = await renderRoute(Support);
  const combined = `${refund}\n${terms}\n${support}`;

  expect(refund).toContain('14-day money-back guarantee');
  expect(refund).toContain('You do not need to prove a defect');
  expect(terms).toContain('Submit the request within 14 calendar days');
  expect(support).toContain('14-day money-back guarantee');
  expect(combined).not.toContain('generally non-refundable');
  expect(combined).not.toContain('does not guarantee a refund');
});
