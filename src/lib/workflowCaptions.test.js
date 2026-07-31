import { captionTrackUrl } from './workflowCaptions';

test('builds browser-safe text/vtt data URLs for every workflow video', () => {
  for (const workflow of ['visual-search', 'takeoff-export', 'revision-comparison']) {
    for (const mode of ['short', 'narrated']) {
      const url = captionTrackUrl(workflow, mode);
      expect(url).toMatch(/^data:text\/vtt;charset=utf-8,/);
      expect(decodeURIComponent(url.split(',')[1])).toMatch(/^WEBVTT\n/);
    }
  }
});
