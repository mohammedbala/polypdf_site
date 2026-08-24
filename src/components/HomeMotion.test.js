import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { homeScreenshots, ShowcaseMotionLayer } from './Home';

const renderMotion = (motionType) => renderToStaticMarkup(
  <ShowcaseMotionLayer motionType={motionType} />
);

test('adds motion only where it can clarify real screenshot state', () => {
  expect(homeScreenshots.map(({ motion }) => motion || 'static')).toEqual([
    'symbol-search',
    'takeoff-records',
    'static',
    'static',
    'aisc-insert',
    'pdf-maps',
    'auto-area',
    'static'
  ]);
});

test('motion overlays use real map and MUTCD pixels without fictional routes or redrawn geometry', () => {
  const markup = [
    'symbol-search',
    'takeoff-records',
    'calibration-check',
    'aisc-insert',
    'pdf-maps',
    'auto-area'
  ].map(renderMotion).join('\n');

  expect(markup).not.toContain('dimension-preview');
  expect(markup).not.toContain('map-route-trace');
  expect(markup).not.toContain('map-location-pin');
  expect(markup).not.toContain('auto-area-trace');
  expect(markup).not.toContain('auto-area-cutout');
  expect(markup).not.toContain('placement-route');
  expect(markup).toContain('map-placement-source-clip');
  expect(markup).toContain('map-placement-tile');
  expect(markup).toContain('map-insert-click');
  expect(markup).toContain('map-insert-cursor');
  expect(markup).toContain('map-resize-frame');
  expect(markup).toContain('map-resize-cursor');
  expect(markup).toContain('map-mutcd-stop-clip');
  expect(markup).toContain('map-mutcd-yield-clip');
  expect(markup).toContain('map-mutcd-stop');
  expect(markup).toContain('map-mutcd-yield');
  expect(markup).toContain('map-sign-cursor');
  expect(markup).toContain('x="97" y="238" width="145" height="145"');
  expect(markup).toContain('x="620" y="170" width="780" height="780"');
  expect(markup).toContain('auto-area-region-mask');
  expect(markup).toContain('M412 328H820V574H412Z');
  expect(markup).toContain('cx="412" cy="328"');
});

test('unknown motion types remain safely static', () => {
  expect(renderMotion('not-a-real-motion')).toBe('');
});
