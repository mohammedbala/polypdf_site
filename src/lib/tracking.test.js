import { saveConsent } from './consent';
import { safeAdsPageContext, safePageContext } from './tracking';

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { window.history.replaceState({}, '', '/'); });

test('only the advertising destination receives allowlisted click IDs after advertising consent', () => {
  window.history.replaceState({}, '', '/?gclid=Click_123-x&gbraid=Braid_456&wbraid=Web_789&email=private%40example.com&session_id=secret#token');
  saveConsent({ analytics: true });
  expect(safeAdsPageContext().page_location).toBe('http://localhost/');
  saveConsent({ analytics: true, marketing: true });
  expect(safeAdsPageContext().page_location).toBe('http://localhost/?gclid=Click_123-x&gbraid=Braid_456&wbraid=Web_789');
  expect(safePageContext().page_location).toBe('http://localhost/');
  expect(JSON.stringify(safeAdsPageContext())).not.toMatch(/email|private|session_id|secret|token/);
});

test.each(['/account/', '/unknown-private-path/'])('never passes query data from %s', (path) => {
  saveConsent({ marketing: true });
  window.history.replaceState({}, '', `${path}?gclid=Click_123&session_id=cs_private#secret`);
  expect(safeAdsPageContext().page_location).not.toMatch(/[?#]|Click_123|private|secret/);
});

test('rejects malformed click identifiers and stops forwarding them when consent is withdrawn', () => {
  saveConsent({ marketing: true });
  window.history.replaceState({}, '', '/?gclid=person%40example.com&gbraid=' + 'x'.repeat(513));
  expect(safeAdsPageContext().page_location).toBe('http://localhost/');
  window.history.replaceState({}, '', '/?gclid=Click_123');
  saveConsent({});
  expect(safeAdsPageContext().page_location).toBe('http://localhost/');
});
