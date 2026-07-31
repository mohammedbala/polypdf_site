import {
  buyPath,
  captureAttribution,
  checkoutAttribution,
  normalizeAttribution
} from './attribution';

beforeEach(() => {
  window.localStorage.clear();
});

test('normalizes only allow-listed, content-free campaign values', () => {
  expect(normalizeAttribution({
    source: ' Website_Hero ',
    utm_campaign: 'Founder-Launch',
    email: 'person@example.com',
    utm_content: 'spaces are rejected'
  })).toEqual({
    source: 'website_hero',
    utm_campaign: 'founder-launch'
  });
});

test('keeps first-party attribution for checkout and falls back safely', () => {
  captureAttribution('?source=website_pricing&utm_source=website&utm_medium=owned&utm_campaign=founder_launch');
  expect(checkoutAttribution('')).toEqual({
    source: 'website_pricing',
    utm_source: 'website',
    utm_medium: 'owned',
    utm_campaign: 'founder_launch'
  });

  window.localStorage.clear();
  expect(checkoutAttribution('')).toEqual({ source: 'buy_page' });
});

test('builds owned links with a placement source', () => {
  expect(buyPath('website_footer')).toBe(
    '/buy?source=website_footer&utm_source=website&utm_medium=owned&utm_campaign=founder_launch'
  );
});
