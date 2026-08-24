import { fetchWindowsRelease } from './VersionHistory';

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
