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
    'static',
    'pdf-maps',
    'auto-area',
    'static'
  ]);
});

test('motion overlays avoid fictional routes and leave the full-map workflow to its verified capture', () => {
  const markup = [
    'symbol-search',
    'takeoff-records',
    'calibration-check',
    'auto-area'
  ].map(renderMotion).join('\n');

  expect(markup).not.toContain('dimension-preview');
  expect(markup).not.toContain('map-route-trace');
  expect(markup).not.toContain('map-location-pin');
  expect(markup).not.toContain('auto-area-trace');
  expect(markup).not.toContain('auto-area-cutout');
  expect(markup).not.toContain('placement-route');
  expect(renderMotion('pdf-maps')).toBe('');
  expect(markup).toContain('auto-area-region-mask');
  expect(markup).toContain('M412 328H820V574H412Z');
  expect(markup).toContain('cx="412" cy="328"');
});

test('the map workflow uses a poster plus viewport-activated video and homepage copy contains no steel showcase', () => {
  const mapShot = homeScreenshots.find(({ motion }) => motion === 'pdf-maps');

  expect(mapShot.image).toBeTruthy();
  expect(mapShot.video).toMatch(/\.mp4$/);
  expect(mapShot.framing).toBe('focus');
  expect(mapShot.title).toMatch(/building-level map.*linework/i);
  expect(mapShot.alt).toMatch(/Liberty cartography.*CAD Linework/i);
  expect(mapShot.caption).toMatch(/building-scale map.*MUTCD signs.*intersections/i);
  expect(JSON.stringify(homeScreenshots).toLowerCase()).not.toContain('steel');
});

test('unknown motion types remain safely static', () => {
  expect(renderMotion('not-a-real-motion')).toBe('');
});
