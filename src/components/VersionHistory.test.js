import { fetchWindowsRelease } from './VersionHistory';

afterEach(() => {
  jest.restoreAllMocks();
});

test('derives the Windows release-notes link from the signed installer name', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    text: async () => [
      'version: 1.4.0',
      'path: PolyPDFSetup-v1.4.0-17.exe',
      'releaseDate: 2026-08-23T12:20:38.000Z'
    ].join('\n')
  });

  await expect(fetchWindowsRelease()).resolves.toMatchObject({
    platform: 'Windows',
    version: '1.4.0',
    build: 17,
    notes: '/downloads/windows/PolyPDFWin-v1.4.0-17.html'
  });
});
