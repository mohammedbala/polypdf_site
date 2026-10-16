import { landingPages } from './landingPages';

export const BLUEBEAM_MAC_SOURCE = 'https://www.bluebeam.com/bluebeam-on-mac/';
export const COMPARISON_REVIEWED = 'October 15, 2026';

export const bluebeamMacPage = Object.freeze({
  path: '/bluebeam-alternative-for-mac',
  source: 'landing_bluebeam_mac',
  demoId: 'takeoff',
  eyebrow: 'A Bluebeam alternative for Mac',
  title: 'A Bluebeam alternative for PDF takeoff on Mac.',
  lede: 'Calibrate drawings, take off quantities, review markups, and compare revisions in a desktop app for Mac and Windows.',
  qualifier: 'Try your own PDFs free. PolyPDF Pro is one payment for up to 3 computers. Before switching, check the PDF handoff and collaboration features your team needs.',
  image: landingPages.pdfTakeoffSoftware.image,
  imageAlt: landingPages.pdfTakeoffSoftware.imageAlt,
  audience: 'For architects, estimators, and contractors considering a local desktop drawing workflow on Mac.',
  proofPoints: [
    ['Mac + Windows', 'One desktop workflow'],
    ['Start free', 'Markup + 3 measurements'],
    ['Pro license', 'One payment · 3 computers']
  ],
  problemTitle: 'Choose by the work you need to carry forward.',
  problemCopy: 'A useful Bluebeam alternative needs to fit the drawings, quantities, and review process you already use. Check local measurement, PDF markup, exports, and collaboration separately, then test a representative file with the people who receive it.',
  workflow: [
    ['Open a representative drawing', 'Use a working copy of your PDF or the provided sample drawing. Keep the original unchanged.'],
    ['Calibrate and check the result', 'Set the page scale, then verify a different known dimension. Free includes calibration and up to 3 hand-created measurements per document.'],
    ['Review quantities and markups', 'Try a length, an area, and a review note. Inspect the worksheet before exporting. Symbol Search, colored overlays, and toolset placement require Pro.'],
    ['Check the handoff', 'Save a separate PDF, close and reopen it, and check the result in your recipient’s required viewer. Test editable markups, comments, measurement values, and any signature or form requirements separately.']
  ],
  outcomeTitle: 'A good fit for local drawing work.',
  outcomes: [
    'Calibrated distance, area, perimeter, angle, radius, diameter, dimension, and count workflows.',
    'PDF callouts, notes, highlights, shapes, review stamps, and revision clouds.',
    'Takeoff worksheet exports to CSV and PDF for estimating and review.',
    'Core PDF work runs locally. Licensing, updates, and optional connected features use the internet.',
    'One personal Pro license covers PolyPDF 1.x on up to 3 Mac or Windows computers; public 1.x updates are included.'
  ],
  faq: [
    ['Can I use Bluebeam on a Mac today?', 'Yes. Bluebeam documents browser access, its iOS app on supported Apple Silicon Macs, and Revu for Windows through virtualization. Compare those options with the workflow you need; the retired Revu for Mac desktop app is a separate product.'],
    ['Does PolyPDF replace Bluebeam Studio?', 'PolyPDF does not join Bluebeam Studio Sessions or Projects. PolyPDF company collaboration uses a separately configured company host and its own access setup. If your project requires Studio, keep a supported Bluebeam route for that work.'],
    ['Can I try PolyPDF before paying?', 'Yes. Free includes PDF markup, review, scale calibration, up to 3 hand-created measurements per document, and Revision Package viewing, with no trial timer. Symbol Search, colored overlays, PDF content editing, toolset placement, plugins, and Revision Package changes require Pro.'],
    ['Will every Bluebeam PDF feature work the same way?', 'Compatibility depends on the file and feature. A PDF that looks correct does not prove that custom columns, calculations, toolsets, forms, signatures, or collaboration will behave identically. Test a saved copy with the recipient’s viewer before changing your project workflow.'],
    ['What does the personal Pro license include?', 'PolyPDF Pro is a one-time purchase for perpetual use of PolyPDF 1.x on up to 3 Mac or Windows computers. Public 1.x updates are included; future major versions may be optional paid upgrades. Teams licensing and company-hosted collaboration have separate setup and terms.']
  ],
  related: [
    ['/measure-pdf-on-mac', 'Measure a PDF on Mac'],
    ['/pdf-takeoff-software', 'Explore the takeoff worksheet'],
    ['/blog/calibrate-pdf-drawing-scale', 'Verify a drawing scale'],
    ['/blog/pdf-takeoff-worked-example', 'Follow a worked takeoff'],
    ['/construction-pdf-markup', 'Review PDF markups'],
    ['/compare-pdf-drawings', 'Compare drawing revisions'],
    ['/teams/guide', 'Check company collaboration setup']
  ]
});
