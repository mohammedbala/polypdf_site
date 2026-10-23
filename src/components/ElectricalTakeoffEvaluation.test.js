import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter } from 'react-router';
import ElectricalTakeoffEvaluation from './ElectricalTakeoffEvaluation';

test('scrolls to an electrical exercise reached through same-page client navigation', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const originalScroll = Element.prototype.scrollIntoView;
  const scrolled = [];
  Element.prototype.scrollIntoView = function () { scrolled.push(this.id); };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/electrical-takeoff-software/']}>
        <Link data-exercise-navigation to="/electrical-takeoff-software/#electrical-count-check">Review counts</Link>
        <ElectricalTakeoffEvaluation />
      </MemoryRouter>
    ));
    expect(scrolled).toEqual([]);
    await act(async () => container.querySelector('[data-exercise-navigation]').click());
    expect(scrolled).toEqual(['electrical-count-check']);
  } finally {
    act(() => root.unmount());
    container.remove();
    if (originalScroll) Element.prototype.scrollIntoView = originalScroll;
    else delete Element.prototype.scrollIntoView;
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  }
});
