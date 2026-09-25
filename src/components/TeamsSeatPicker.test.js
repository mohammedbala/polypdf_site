import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TeamsSeatPicker, { estimateTeamPurchase } from './TeamsSeatPicker';

test.each([[1, 2498], [24, 59952], [25, 56200], [99, 222552], [100, 199800]])(
  '%i purchased users display the approved total of %i cents', (quantity, total) => {
    expect(estimateTeamPurchase(quantity).total).toBe(total);
  }
);
test('add-on pricing uses the resulting pool and charges only new seats', () => {
  expect(estimateTeamPurchase(1, 24)).toEqual({ quantity: 1, unitAmount: 2248, total: 2248, resultingSeats: 25 });
  expect(estimateTeamPurchase(5, 95)).toEqual({ quantity: 5, unitAmount: 1998, total: 9990, resultingSeats: 100 });
});
test.each(['', 0, -1, 1.5, 10001, NaN])('invalid quantity %s has no displayed purchase estimate', quantity => {
  expect(estimateTeamPurchase(quantity)).toBeNull();
});
test('the accessible picker supports exact quantities larger than its initial range', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const onChange = jest.fn();
  act(() => root.render(<TeamsSeatPicker quantity={500} onChange={onChange} />));
  expect(container.querySelector('input[type=range]').max).toBe('500');
  expect(container.querySelector('input[type=number]').value).toBe('500');
  expect(container.textContent).toContain('$9,990.00');
  act(() => container.querySelectorAll('button')[1].click());
  expect(onChange).toHaveBeenCalledWith(25);
  act(() => root.unmount());
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});
