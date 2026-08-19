import {
  buyPath,
  canonicalPagePath,
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
  expect(checkoutAttribution('')).toEqual({
    source: 'buy_page',
    utm_source: 'website',
    utm_medium: 'owned',
    utm_campaign: 'founder_launch'
  });
});

test('keeps acquisition UTMs when an on-site placement opens the buy page', () => {
  captureAttribution('?source=directory&utm_source=aec_directory&utm_medium=referral&utm_campaign=july_launch');
  expect(checkoutAttribution('?source=website_hero')).toEqual({
    source: 'website_hero',
    utm_source: 'aec_directory',
    utm_medium: 'referral',
    utm_campaign: 'july_launch'
  });

  expect(checkoutAttribution(
    '?source=free_measurement_limit&utm_source=desktop_app&utm_medium=product&utm_campaign=free_to_pro'
  )).toEqual({
    source: 'free_measurement_limit',
    utm_source: 'desktop_app',
    utm_medium: 'product',
    utm_campaign: 'free_to_pro'
  });
});

test('builds owned links with a placement source', () => {
  expect(buyPath('website_footer')).toBe('/buy/?source=website_footer');
});

test('uses trailing slashes for page links without changing files or external URLs', () => {
  expect(canonicalPagePath('/blog')).toBe('/blog/');
  expect(canonicalPagePath('/buy?source=website')).toBe('/buy/?source=website');
  expect(canonicalPagePath('/downloads/PolyPDFMac.dmg')).toBe('/downloads/PolyPDFMac.dmg');
  expect(canonicalPagePath('https://example.com/page')).toBe('https://example.com/page');
});
