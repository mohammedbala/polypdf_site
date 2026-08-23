import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import {
  FeatureIndex,
  featureFamilies,
  homeScreenshots,
  WorkflowGrid
} from './Home';

class TestIntersectionObserver {
  observe() {}
  disconnect() {}
}

const renderComponent = async (component) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.IntersectionObserver = TestIntersectionObserver;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {component}
      </MemoryRouter>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    }
  };
};

afterEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  delete window.IntersectionObserver;
});

test('renders a semantic overall capability index without pricing-tier columns', async () => {
  const view = await renderComponent(<FeatureIndex />);
  const table = view.container.querySelector('table');

  expect(table).not.toBeNull();
  expect(table.querySelectorAll('thead th')).toHaveLength(3);
  expect(table.querySelectorAll('tbody tr')).toHaveLength(featureFamilies.length);
  expect(Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent)).toEqual([
    'Workflow',
    'Included tools',
    'What it gives you'
  ]);
  expect(table.textContent).toContain('Measure & takeoff');
  expect(table.textContent).toContain('OCR');
  expect(table.textContent).toContain('custom keyboard shortcuts');
  expect(table.textContent).not.toContain('$49.99');
  view.unmount();
});

test('places all eight shipping workflows in one compact grid', async () => {
  const view = await renderComponent(<WorkflowGrid />);
  const grid = view.container.querySelector('.workflow-grid');

  expect(grid).not.toBeNull();
  expect(grid.querySelectorAll('.workflow-card')).toHaveLength(8);
  expect(grid.querySelectorAll('img[loading="lazy"]')).toHaveLength(8);
  expect(grid.querySelectorAll('.workflow-card.theme-light')).toHaveLength(3);
  expect(grid.querySelectorAll('.workflow-card.theme-dark')).toHaveLength(5);
  expect(grid.querySelectorAll('.workflow-card.is-focus')).toHaveLength(7);
  expect(grid.querySelectorAll('.workflow-card.is-context')).toHaveLength(1);
  expect(homeScreenshots).toHaveLength(8);
  view.unmount();
});
