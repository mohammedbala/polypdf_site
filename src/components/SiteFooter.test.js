import { footerLinkGroups } from './SiteFooter';
import { landingPageRoutes } from '../lib/landingPages';
import routeMetadata from '../lib/route-metadata.json';

test('keeps one complete, unique footer route map for every page', () => {
  const links = footerLinkGroups.flatMap((group) => group.links);
  const paths = links.map((link) => link.to.split('?')[0]);

  expect(new Set(paths).size).toBe(paths.length);
  expect(paths).toEqual(expect.arrayContaining(landingPageRoutes.map((page) => page.path)));
  expect(paths).toContain('/feature-requests');
  expect(paths).not.toContain(expect.stringContaining('github.com'));

  paths.forEach((path) => {
    expect(routeMetadata[path]).toBeDefined();
  });
});
