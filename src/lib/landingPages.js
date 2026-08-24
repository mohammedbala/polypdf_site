import shotCalibration from '../assets/screenshots/calibration-verified-second-span-v1-4-dark-web.png';
import shotMarkup from '../assets/screenshots/markup-v1-4-dark-web.png';
import shotRevisionCompare from '../assets/screenshots/compare-editable-clouds-v1-4-dark-web.png';
import shotSymbolSearch from '../assets/screenshots/symbol-search-review-v1-4-dark-web.png';
import shotTakeoff from '../assets/screenshots/takeoff-v1-4-dark-web.png';

const landingPage = (page) => Object.freeze(page);

export const landingPages = Object.freeze({
  pdfTakeoffSoftware: landingPage({
    path: '/pdf-takeoff-software',
    source: 'landing_pdf_takeoff',
    eyebrow: 'PDF takeoff for Mac and Windows',
    title: 'Turn scaled PDF drawings into an organized takeoff worksheet.',
    lede: 'Calibrate a sheet once, measure lengths, areas, perimeters, angles, and counts, then keep the results beside the drawing and export them to CSV or PDF.',
    qualifier: 'Built for estimators and contractors who receive PDFs—not perfect CAD files—and need a direct path from drawing to quantity record.',
    image: shotTakeoff,
    imageWidth: 1710,
    imageHeight: 1073,
    imageAlt: 'PolyPDF takeoff worksheet showing 14 items beside a sample plan with a 540 square foot area, a 30 foot length, and 12 supply diffusers',
    audience: 'For preconstruction, estimating, and trade workflows that need quantities from architectural or engineering PDF sheets.',
    proofPoints: [
      ['Calibrate once', 'Preset or custom scale'],
      ['Measure directly', 'Length, area, count, angle'],
      ['Hand off cleanly', 'CSV and PDF export']
    ],
    problemTitle: 'Keep the quantity and its drawing context together.',
    problemCopy: 'A takeoff is easier to audit when every result still points back to the sheet it came from. PolyPDF places measurements on the drawing while the worksheet tracks subject, quantity, units, and totals in one desktop workspace.',
    workflow: [
      ['Confirm the page scale', 'Choose a common architectural or engineering preset, or calibrate against a known distance. Use imperial or metric units to match the source sheet.'],
      ['Create measurement subjects', 'Organize results by the material, assembly, or scope you are quantifying so repeated measurements land in a consistent worksheet row.'],
      ['Measure and count on the sheet', 'Place distance, area, perimeter, angle, and count annotations directly on the drawing while PolyPDF updates the worksheet.'],
      ['Export for pricing or review', 'Send the worksheet to CSV for estimating calculations or PDF for a readable project record.']
    ],
    outcomeTitle: 'Useful takeoff fundamentals without a recurring seat fee.',
    outcomes: [
      'Works with ordinary PDF plan sets from designers, owners, and general contractors.',
      'Supports architectural and engineering scale calibration in imperial or metric units.',
      'Keeps measurements visible on the sheet and organized in the takeoff worksheet.',
      'Exports results without requiring a CAD source file.',
      'Lets you verify the workflow free before unlocking unlimited hand-created measurements.'
    ],
    faq: [
      ['What measurements can PolyPDF create?', 'PolyPDF supports distance, area, perimeter, angle, dimension, and count workflows on calibrated PDF drawings.'],
      ['Can I export takeoff results?', 'Yes. The takeoff worksheet can be exported to CSV for downstream calculations or PDF for a readable record.'],
      ['Do I need the original CAD file?', 'No. PolyPDF works from the PDF drawing. You calibrate the page using its stated scale or a known distance.']
    ],
    related: [
      ['/blog/pdf-takeoff-worked-example', 'PDF takeoff worked example'],
      ['/blog/calibrate-pdf-drawing-scale', 'Calibrate a drawing scale'],
      ['/blog/measure-pdf-area-cutouts-depth', 'Measure net area and cutouts'],
      ['/measure-pdf-on-mac', 'Measure PDF drawings on Mac'],
      ['/visual-search-pdf-count', 'Count repeated symbols'],
      ['/construction-pdf-markup', 'Mark up construction PDFs']
    ]
  }),
  measurePdfOnMac: landingPage({
    path: '/measure-pdf-on-mac',
    source: 'landing_measure_pdf_mac',
    eyebrow: 'Measure drawings on macOS',
    title: 'Measure a PDF on Mac without redrawing it in CAD.',
    lede: 'Open the plan, set its scale, and pull real distances, areas, perimeters, angles, and counts directly from the PDF in a desktop app for macOS.',
    qualifier: 'Start with the free Mac download and validate scale accuracy on a drawing you already know. Upgrade only when you need more than 3 hand-created measurements in a document.',
    image: shotCalibration,
    imageWidth: 1710,
    imageHeight: 1073,
    imageAlt: 'PolyPDF for Mac showing a calibrated quarter-inch equals one-foot page scale and a second known span measured as 12 feet',
    audience: 'For architects, engineers, facilities teams, contractors, and homeowners who need dimensions from a PDF drawing on a Mac.',
    proofPoints: [
      ['Mac ready', 'Signed, notarized DMG'],
      ['Real units', 'Imperial and metric'],
      ['No conversion', 'Measure the PDF itself']
    ],
    problemTitle: 'The scale is what turns pixels into useful dimensions.',
    problemCopy: 'A PDF viewer can show a drawing, but the measurement only becomes meaningful after the page is calibrated. PolyPDF lets you use a printed scale preset or define a known distance, then applies that calibration to the measurements you place on the sheet.',
    workflow: [
      ['Open the PDF on your Mac', 'Launch PolyPDF from Applications and open the plan set from Finder or from inside the app.'],
      ['Set or verify the scale', 'Select the sheet’s architectural or engineering scale, or calibrate against a dimension printed on the drawing.'],
      ['Choose the quantity you need', 'Use distance for runs, area for finishes, perimeter for boundaries, angle for geometry, or count for repeated items.'],
      ['Read and export the result', 'Keep the value on the drawing, review it in the worksheet, and export when the result needs to move into another process.']
    ],
    outcomeTitle: 'A direct Mac workflow for everyday drawing questions.',
    outcomes: [
      'Measures from the PDF without uploading the drawing to a browser service.',
      'Supports common architectural and engineering scales plus custom calibration.',
      'Shows measurement labels directly on the sheet for visual verification.',
      'Keeps related quantities organized in the Measurements panel.',
      'Includes the complete measurement workflow in the free download for evaluation.'
    ],
    faq: [
      ['How do I know a PDF measurement is accurate?', 'Start by calibrating against the stated sheet scale or a known printed dimension. Then measure that known distance again as a check before using the page for quantities.'],
      ['Can PolyPDF measure scanned drawings?', 'You can measure a raster or scanned drawing when it has a reliable scale or known reference distance. The source image quality and the accuracy of that reference still matter.'],
      ['Does PolyPDF upload my plans?', 'The desktop app processes PDF content locally. Your files stay on your computer unless you choose to export or share them; activation, update checks, and optional support services are separate from document processing.']
    ],
    related: [
      ['/blog/calibrate-pdf-drawing-scale', 'Calibrate a drawing scale'],
      ['/blog/why-pdf-measurements-are-wrong', 'Troubleshoot a wrong measurement'],
      ['/blog/ocr-scanned-pdf-drawings', 'OCR a scanned drawing'],
      ['/pdf-takeoff-software', 'PDF takeoff software'],
      ['/compare-pdf-drawings', 'Compare drawing revisions'],
      ['/visual-search-pdf-count', 'Count repeated PDF symbols']
    ]
  }),
  constructionPdfMarkup: landingPage({
    path: '/construction-pdf-markup',
    source: 'landing_construction_markup',
    eyebrow: 'Construction drawing review',
    title: 'Mark up construction PDFs so every comment stays tied to the sheet.',
    lede: 'Add callouts, text, highlights, shapes, stamps, and revision clouds directly to plan sets, then use the Markup Table to track what has been flagged.',
    qualifier: 'A local desktop workflow for design review, RFIs, field observations, punch notes, and drawing handoff on Mac or Windows.',
    image: shotMarkup,
    imageWidth: 1710,
    imageHeight: 1073,
    imageAlt: 'PolyPDF showing an open RFI callout, an in-progress revision cloud, and a completed green rectangle with three matching Markup Table rows',
    audience: 'For project teams that need comments to remain visually connected to the exact room, detail, symbol, or revision they describe.',
    proofPoints: [
      ['Clear context', 'Notes live on the sheet'],
      ['Review tools', 'Callouts, clouds, stamps'],
      ['Local files', 'Desktop PDF workflow']
    ],
    problemTitle: 'A useful markup should survive the handoff.',
    problemCopy: 'Construction comments lose value when the recipient cannot tell which part of the drawing they describe. PolyPDF keeps each annotation on the page and lists it in the sidebar, so reviewers can scan the record and jump back to the visual context.',
    workflow: [
      ['Open the issued drawing set', 'Review the same PDF sheets your team already distributes instead of converting the project into another proprietary format.'],
      ['Place the comment where it belongs', 'Use a leader callout for a specific condition, a revision cloud for an affected region, or text, shapes, highlights, and stamps for the rest.'],
      ['Check the Markup Table', 'Use the table to see annotations together and reduce the chance that a note disappears in a visually dense plan.'],
      ['Save or export the reviewed PDF', 'Create a marked drawing that can be sent through the project’s existing document-control process.']
    ],
    outcomeTitle: 'Review tools built around the drawing, not a chat thread.',
    outcomes: [
      'Callouts connect a readable note to an exact point on the sheet.',
      'Revision clouds make changed or questioned regions visible at a glance.',
      'Text sizing can be adjusted for on-screen and printed readability.',
      'The Markup Table keeps annotations discoverable across a busy page.',
      'Measurement tools remain available when a review question also needs a quantity.'
    ],
    faq: [
      ['What construction markups does PolyPDF support?', 'The current app includes text, callouts, highlights, shapes, freehand drawing, stamps, revision clouds, and measurement annotations.'],
      ['Can I use PolyPDF for RFIs or punch notes?', 'You can place RFI and punch-related comments directly on the relevant sheet and save the marked PDF. PolyPDF is the drawing workspace; your project’s formal routing and approval process can remain unchanged.'],
      ['Can recipients read the marked PDF without PolyPDF?', 'PolyPDF can save and export PDF output for normal document handoff. As with any PDF workflow, verify the exported file in the recipient’s viewer when interoperability is critical.']
    ],
    related: [
      ['/blog/pdf-markup-table-rfi-punch-list', 'Build an RFI or punch register'],
      ['/blog/compare-pdf-drawing-revisions', 'Review drawing revisions'],
      ['/blog/digital-signature-vs-visual-signature-vs-seal', 'Signature and seal reference'],
      ['/compare-pdf-drawings', 'Compare drawing revisions'],
      ['/measure-pdf-on-mac', 'Measure PDF drawings on Mac'],
      ['/pdf-takeoff-software', 'PDF takeoff software']
    ]
  }),
  visualSearchPdfCount: landingPage({
    path: '/visual-search-pdf-count',
    source: 'landing_visual_search_count',
    eyebrow: 'Symbol Search (formerly Visual Search)',
    title: 'Find one drawing symbol, then count matching instances across the PDF.',
    lede: 'Capture a symbol from the sheet, let PolyPDF find visual matches, review the results, and commit the accepted set as a count series.',
    qualifier: 'Symbol Search is a PolyPDF Pro workflow. Capture one example, review every candidate, and commit the accepted matches as one linked Count series.',
    image: shotSymbolSearch,
    imageWidth: 1710,
    imageHeight: 1073,
    imageAlt: 'PolyPDF Symbol Search review showing five matches, all five selected, with five candidate boxes and Count 5 ready',
    audience: 'For estimators and reviewers counting fixtures, devices, diffusers, outlets, symbols, or other repeated graphics on PDF drawings.',
    proofPoints: [
      ['Start with one', 'Capture a visual example'],
      ['Review matches', 'Accept the useful result set'],
      ['Commit counts', 'Numbered series + worksheet']
    ],
    problemTitle: 'Auto-count is fastest when the human stays in control.',
    problemCopy: 'Drawing symbols vary with scan quality, line weight, rotation, and nearby geometry. PolyPDF treats Symbol Search as a reviewable workflow: you choose the example, inspect the candidate matches, and commit the results you are prepared to use.',
    workflow: [
      ['Select a clean example', 'Draw a capture box tightly around one representative symbol and avoid unrelated labels or lines when possible.'],
      ['Run Symbol Search', 'PolyPDF scans the PDF for visually similar regions and returns candidate matches without requiring OCR text or a CAD model.'],
      ['Review the candidates', 'Inspect the highlighted results and adjust the selection or search threshold when the drawing contains similar-looking symbols.'],
      ['Commit the count series', 'Turn the accepted matches into numbered count annotations that feed the takeoff worksheet and remain visible on the page.']
    ],
    outcomeTitle: 'A repeatable count you can check against the drawing.',
    outcomes: [
      'Works from visual symbol appearance rather than relying on searchable text.',
      'Keeps candidate matches reviewable and adjustable before the count is committed.',
      'Creates numbered count markers that can be audited against the sheet.',
      'Feeds accepted counts into the same worksheet as lengths and areas.',
      'Included with PolyPDF Pro, with no separate per-search count cap.'
    ],
    faq: [
      ['Is Symbol Search the same as OCR?', 'No. OCR looks for text. Symbol Search looks for regions that resemble the symbol example you capture from the drawing.'],
      ['Will it find every symbol perfectly?', 'Not on every drawing. Match quality depends on the source PDF, symbol consistency, rotation, scan quality, and the capture selection. Review the candidates before committing a count.'],
      ['Is Symbol Search included in the free version?', 'No. In PolyPDF 1.4.1, Symbol Search is a Pro workflow. The same Pro license also removes the limit on hand-created measurements and unlocks installed plugins.']
    ],
    related: [
      ['/blog/count-pdf-symbols', 'Count symbols with Symbol Search'],
      ['/blog/pdf-takeoff-worked-example', 'PDF takeoff worked example'],
      ['/blog/calibrate-pdf-drawing-scale', 'Calibrate before measuring'],
      ['/pdf-takeoff-software', 'PDF takeoff software'],
      ['/measure-pdf-on-mac', 'Measure a PDF on Mac'],
      ['/construction-pdf-markup', 'Construction PDF markup']
    ]
  }),
  comparePdfDrawings: landingPage({
    path: '/compare-pdf-drawings',
    source: 'landing_drawing_comparison',
    eyebrow: 'Drawing revision comparison',
    title: 'Compare PDF drawings and make revision changes easier to inspect.',
    lede: 'Bring drawing versions into one desktop review workflow, inspect their differences, and mark the areas that need a decision, RFI, or handoff note.',
    qualifier: 'Built for the review that follows an addendum or revised issue: compare the two sheets, then record the decision, RFI, or coordination note on the drawing.',
    image: shotRevisionCompare,
    imageWidth: 1710,
    imageHeight: 1073,
    imageAlt: 'PolyPDF comparison result showing four editable purple revision clouds and four matching rows in the Markup Table',
    audience: 'For architects, engineers, contractors, and owners reviewing addenda, coordination updates, redlines, and issued drawing revisions.',
    proofPoints: [
      ['See change', 'Revision-aware review'],
      ['Add context', 'Clouds and callouts'],
      ['Keep a record', 'Save the marked PDF']
    ],
    problemTitle: 'A detected change still needs project context.',
    problemCopy: 'A comparison can show that pixels differ, but the reviewer decides whether the change affects scope, constructability, pricing, or coordination. PolyPDF pairs visual comparison with markup tools so the next action can be recorded on the drawing.',
    workflow: [
      ['Confirm the two source sheets', 'Check sheet number, revision, page size, orientation, and scale before treating visual differences as design changes.'],
      ['Run the drawing comparison', 'Use the current and prior PDFs to surface regions that differ and focus the review on likely revision areas.'],
      ['Inspect each meaningful change', 'Distinguish actual design revisions from title-block updates, raster noise, shifted scans, or alignment differences.'],
      ['Mark the required response', 'Add a revision cloud, callout, note, or stamp where the team needs clarification, pricing, coordination, or acknowledgement.']
    ],
    outcomeTitle: 'Move from “something changed” to a reviewable action.',
    outcomes: [
      'Supports a local desktop workflow for sensitive drawing sets.',
      'Keeps comparison findings beside normal PDF navigation and review tools.',
      'Lets reviewers add clouds and callouts around meaningful revision areas.',
      'Preserves a marked PDF that can enter the existing project record.',
      'Works on Mac and Windows for mixed-platform project teams.'
    ],
    faq: [
      ['What should I check before comparing two drawings?', 'Confirm the sheet identity, revision, orientation, page size, and scale. A shifted scan or differently cropped sheet can create visual differences that are not design changes.'],
      ['Does comparison replace a formal revision review?', 'No. It helps focus attention, but the issued revision record and a qualified reviewer remain authoritative. Every detected difference still needs context.'],
      ['Can I mark up the differences afterward?', 'Yes. Use revision clouds, callouts, text, shapes, and stamps to record what the team needs to review or act on.']
    ],
    related: [
      ['/blog/compare-pdf-drawing-revisions', 'Drawing revision review guide'],
      ['/blog/pdf-markup-table-rfi-punch-list', 'Turn findings into a review register'],
      ['/blog/prepare-issued-pdf-set', 'Prepare an issued PDF set'],
      ['/construction-pdf-markup', 'Construction PDF markup'],
      ['/visual-search-pdf-count', 'Count repeated PDF symbols'],
      ['/measure-pdf-on-mac', 'Measure PDF drawings on Mac']
    ]
  })
});

export const landingPageRoutes = Object.values(landingPages);
