import { initializeOpenAIAdsMeasurement, OPENAI_ADS_SDK_URL } from './openaiAds';

beforeEach(() => {
  delete window.oaiq;
  document.querySelectorAll(`script[src="${OPENAI_ADS_SDK_URL}"]`).forEach((script) => script.remove());
});

afterEach(() => {
  delete window.oaiq;
  document.querySelectorAll(`script[src="${OPENAI_ADS_SDK_URL}"]`).forEach((script) => script.remove());
});

test('loads and initializes the OpenAI Ads pixel with an approved public pixel ID', () => {
  expect(initializeOpenAIAdsMeasurement({ pixelID: 'pxl_polypdf_123', debug: false })).toBe(true);

  expect(document.querySelector(`script[src="${OPENAI_ADS_SDK_URL}"]`)).not.toBeNull();
  expect(window.oaiq.q).toHaveLength(1);
  expect(Array.from(window.oaiq.q[0])).toEqual([
    'init',
    { pixelId: 'pxl_polypdf_123' }
  ]);
});

test('does not load the SDK without a valid configured pixel ID', () => {
  expect(initializeOpenAIAdsMeasurement({ pixelID: '', debug: false })).toBe(false);
  expect(initializeOpenAIAdsMeasurement({ pixelID: '<YOUR-PIXEL-ID>', debug: false })).toBe(false);
  expect(window.oaiq).toBeUndefined();
  expect(document.querySelector(`script[src="${OPENAI_ADS_SDK_URL}"]`)).toBeNull();
});
