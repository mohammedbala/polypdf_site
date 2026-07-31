import routeMetadata from './route-metadata.json';

const expectedRoutes = ['/', '/buy', '/account', '/privacy', '/refund', '/support', '/windows', '/terms', '/versions'];

test('defines unique, server-renderable metadata for every public route', () => {
  expect(Object.keys(routeMetadata).sort()).toEqual(expectedRoutes.sort());
  expect(new Set(Object.values(routeMetadata).map(({ title }) => title)).size).toBe(expectedRoutes.length);

  Object.entries(routeMetadata).forEach(([route, entry]) => {
    expect(route.startsWith('/')).toBe(true);
    expect(entry.title.length).toBeGreaterThan(10);
    expect(entry.description.length).toBeGreaterThan(50);
    expect(['index, follow', 'noindex, nofollow']).toContain(entry.robots);
  });
  expect(routeMetadata['/account'].robots).toBe('noindex, nofollow');
});
