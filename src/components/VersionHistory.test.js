import { fetchWindowsRelease, mergePublishedReleases } from './VersionHistory';

afterEach(() => {
  jest.restoreAllMocks();
});

test('derives the Windows release-notes link from the signed installer name', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => [
      'version: 1.4.1',
      'path: PolyPDFSetup-v1.4.1-18.exe',
      'releaseDate: 2026-08-24T03:36:37.413Z'
    ].join('\n')
  });

  await expect(fetchWindowsRelease()).resolves.toMatchObject({
    platform: 'Windows',
    version: '1.4.1',
    build: 18,
    notes: '/downloads/windows/PolyPDFWin-v1.4.1-18.html'
  });
});


test('merges the single Windows feed entry without losing published history', () => {
  const published = [
    { platform: 'Windows', version: '1.6.20', build: 87, sortKey: 3, notes: 'snapshot' },
    { platform: 'Windows', version: '1.6.19', build: 86, sortKey: 2 },
    { platform: 'macOS', version: '1.6.19', build: 86, sortKey: 2 }
  ];
  const live = { ...published[0], notes: 'live' };
  const merged = mergePublishedReleases([live], published);
  expect(merged).toHaveLength(3);
  expect(merged[0]).toEqual(live);
  expect(merged).toContainEqual(published[1]);
  expect(merged).toContainEqual(published[2]);
});
