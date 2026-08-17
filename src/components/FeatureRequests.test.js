import { FEATURE_REQUEST_EMAIL_URL } from './FeatureRequests';

test('routes feature requests directly to support without a public tracker', () => {
  expect(FEATURE_REQUEST_EMAIL_URL).toMatch(/^mailto:support@polypdf\.com\?/);
  expect(FEATURE_REQUEST_EMAIL_URL).toContain('Workflow%20I%27m%20trying%20to%20improve');
  expect(FEATURE_REQUEST_EMAIL_URL).not.toContain('github.com');
});
