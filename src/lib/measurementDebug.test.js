import { analyticsDebugContext } from './tracking';

test.each([
  ['www.polypdf.com', '', {}],
  ['www.polypdf.com', '?measurement_debug=1&private=never_send', { debug_mode: true }],
  ['www.polypdf.com', '?measurement_debug=true', {}],
  ['www.polypdf.com', '?measurement_debug=0', {}],
  ['localhost', '', { debug_mode: true }],
  ['127.0.0.1', '', { debug_mode: true }],
  ['[::1]', '', { debug_mode: true }]
])('only deliberate QA is marked for %s %s', (hostname, search, expected) => {
  expect(analyticsDebugContext({ hostname, search })).toEqual(expected);
});
