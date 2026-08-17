import { fetchWindowsRelease } from './VersionHistory';

afterEach(() => {
  jest.restoreAllMocks();
});

test('derives the Windows release-notes link from the signed installer name', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => [
      'version: 1.3.4',
      'path: PolyPDFSetup-v1.3.4-16.exe',
      'releaseDate: 2026-08-17T14:05:17.087Z'
    ].join('\n')
  });

  await expect(fetchWindowsRelease()).resolves.toMatchObject({
    platform: 'Windows',
    version: '1.3.4',
    build: 16,
    notes: '/downloads/windows/PolyPDFSetup-v1.3.4-16.html'
  });
});
