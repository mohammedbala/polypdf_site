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

test('motion overlays do not redraw baked dimensions, map routes, or Auto Area boundaries', () => {
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
  expect(markup).toContain('map-tour-focus');
  expect(markup).toContain('auto-area-region-mask');
});

test('unknown motion types remain safely static', () => {
  expect(renderMotion('not-a-real-motion')).toBe('');
});
