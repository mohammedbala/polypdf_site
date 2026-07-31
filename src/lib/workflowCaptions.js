const captionTracks = Object.freeze({
  'revision-comparison': Object.freeze({
    short: `WEBVTT

00:00.000 --> 00:02.700
Turn a detected drawing change into a reviewable action.

00:02.700 --> 00:05.800
Confirm both revisions.

00:05.800 --> 00:08.900
Inspect meaningful differences.

00:08.900 --> 00:12.000
Mark the required response with a cloud or callout.

00:12.000 --> 00:15.000
Download PolyPDF free at polypdf.com.`,
    narrated: `WEBVTT

00:00.000 --> 00:05.000
Drawing comparison is useful when it leads to a clear review action.

00:05.000 --> 00:16.000
Confirm both PDFs represent the intended revisions with compatible size, orientation, and scale.

00:16.000 --> 00:27.000
Inspect highlighted regions and separate design changes from title-block, scan, or alignment noise.

00:27.000 --> 00:38.000
Use a cloud, callout, note, or stamp to record what the team needs to coordinate or clarify.

00:38.000 --> 00:44.000
Save the marked PDF, then download PolyPDF free at polypdf.com.`
  }),
  'takeoff-export': Object.freeze({
    short: `WEBVTT

00:00.000 --> 00:02.700
Move from drawing scale to an organized quantity record.

00:02.700 --> 00:05.800
Calibrate the sheet.

00:05.800 --> 00:08.900
Measure directly on the PDF.

00:08.900 --> 00:12.000
Export the worksheet to CSV or PDF.

00:12.000 --> 00:15.000
Download PolyPDF free at polypdf.com.`,
    narrated: `WEBVTT

00:00.000 --> 00:05.000
PolyPDF keeps a quantity connected to the drawing it came from.

00:05.000 --> 00:16.000
Choose the sheet scale or calibrate against a known printed distance.

00:16.000 --> 00:27.000
Place lengths, areas, perimeters, angles, and counts directly on the calibrated PDF.

00:27.000 --> 00:38.000
Review the organized worksheet, then export to CSV for pricing or PDF for handoff.

00:38.000 --> 00:44.000
Download PolyPDF free at polypdf.com and test a plan you already know.`
  }),
  'visual-search': Object.freeze({
    short: `WEBVTT

00:00.000 --> 00:02.700
Count repeated symbols without losing the review step.

00:02.700 --> 00:05.800
Capture one clean symbol.

00:05.800 --> 00:08.900
Review the visual matches.

00:08.900 --> 00:12.000
Commit the accepted set as a numbered count series.

00:12.000 --> 00:15.000
Download PolyPDF free at polypdf.com.`,
    narrated: `WEBVTT

00:00.000 --> 00:05.000
Visual Search turns one clean symbol into a reviewable count.

00:05.000 --> 00:16.000
Draw a tight capture around a representative fixture or device, then scan for visually similar regions.

00:16.000 --> 00:27.000
Inspect the candidates before accepting them because line weight, rotation, and nearby geometry can vary.

00:27.000 --> 00:38.000
Commit the matches as numbered markers that remain visible and feed the takeoff worksheet.

00:38.000 --> 00:44.000
Visual Search is uncapped in Free and Pro. Download PolyPDF free at polypdf.com.`
  })
});

export const captionTrackUrl = (workflow, mode) => {
  const captions = captionTracks[workflow]?.[mode];
  if (!captions) throw new Error(`Unknown workflow caption track: ${workflow}/${mode}`);
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(captions)}`;
};
