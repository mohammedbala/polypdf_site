import {
  CLOUD_LINE_REQUEST_URL,
  FEATURE_REQUEST_URL,
  FEATURE_REQUESTS_URL
} from './FeatureRequests';

test('points customers to the structured public request workflow', () => {
  expect(FEATURE_REQUEST_URL).toBe(
    'https://github.com/mohammedbala/polypdfmac/issues/new?template=feature_request.yml'
  );
  expect(FEATURE_REQUESTS_URL).toContain('label%3Aenhancement');
});

test('links the outstanding cloud-line request to its public tracker', () => {
  expect(CLOUD_LINE_REQUEST_URL).toBe('https://github.com/mohammedbala/polypdfmac/issues/18');
});
