import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { MemoryRouter } from 'react-router';
import ConstructionExample from './ConstructionExample';

jest.mock('../lib/analytics', () => ({ trackEvent: jest.fn() }));

const render = props => renderToStaticMarkup(<MemoryRouter><ConstructionExample {...props} /></MemoryRouter>);
const shared = 'Drawing reference values, not new app test results. Work on a copy and check your own saved output.';

test('the electrical landing example does not deny the route measured in the check above it', () => {
  const html = render({ kind: 'electrical', context: 'landing' });
  expect(html).not.toContain('46 ft are drawing references');
  expect(html).not.toContain('not new app test results');
  expect(html).toContain('The 24 fixtures are a drawing reference, not an app result.');
  expect(html).toContain('measured the 46 ft route in the app; the fixture count was not run.');
  expect(html).toContain('Work on a copy and check your own saved output.');
});

test('the flooring landing example names the check above it and keeps the schedule basis', () => {
  const html = render({ kind: 'flooring', context: 'landing' });
  expect(html).not.toContain('not new app test results');
  expect(html).toContain('measured the F1 and F2 areas in the app.');
  expect(html).toContain('These exercise areas are not net installed quantities');
});

test.each([
  ['electrical', 'workflow'], ['electrical', 'guide'], ['flooring', 'samples'], ['takeoff', 'landing'], ['compare', 'landing']
])('%s on a %s page keeps the shared sentences whole', (kind, context) => {
  const html = render({ kind, context });
  expect(html).toContain(shared);
  if (kind === 'electrical') expect(html).toContain('The 24 fixtures and 46 ft are drawing references, not app results.');
});
