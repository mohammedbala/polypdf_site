import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ScaleChecker from './ScaleChecker';
import { trackEvent } from '../lib/analytics';
jest.mock('../lib/analytics', () => ({ trackEvent: jest.fn() }));

test('validates empty fields, compares a worked example, and discards results when units or inputs change', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const click = async text => act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === text).click());
  const submit = async () => act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  try {
    await act(async () => root.render(<ScaleChecker />));
    await submit();
    expect(document.activeElement.id).toBe('scale-horizontalKnown');
    expect(container.querySelectorAll('[aria-invalid=true]')).toHaveLength(5);
    expect(trackEvent).not.toHaveBeenCalled();
    await click('Load worked example');
    await submit();
    expect(container.textContent).toContain('1% error');
    expect(container.textContent).toContain('Outside entered tolerance');
    expect(document.activeElement.id).toBe('scale-results-heading');
    expect(trackEvent).toHaveBeenCalledWith('calculator_complete', { source: 'scale_checker', feature: 'scale_verification' });
    const unit = container.querySelector('select');
    await act(async () => { unit.value = 'mm'; unit.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('#scale-horizontalKnown').value).toBe('6096');
    expect(container.textContent).not.toContain('Download check CSV');
    await submit();
    expect(container.textContent).toContain('1% error');
    expect(container.textContent).toContain('6,096 mm');
    await click('Clear');
    expect(container.textContent).not.toContain('Download check CSV');
    expect(container.querySelector('#scale-tolerance').value).toBe('');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
