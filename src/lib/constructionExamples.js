export const constructionExamples = {
  takeoff: {
    title: 'Measure the Willow Creek architectural plan',
    files: ['02-Architectural-Revision-A'], sheets: 'A101 · A201',
    steps: [
      'Open A101, Revision A. Calibrate the printed 20 ft reference; it spans 360 PDF points.',
      'Check the independent 96 ft width and 60 ft depth, then trace the outside building boundary.',
      'Compare the gross area with 5,760 sq ft. Keep sheet, revision, subject, unit, and total with the exported record.'
    ],
    scope: 'This is a gross footprint exercise. It does not measure net flooring or subtract walls. The two length checks and one area use three manual measurements.',
    guide: '/blog/pdf-takeoff-worked-example/'
  },
  flooring: {
    title: 'Take off finishes from the Willow Creek interiors plan',
    files: ['10-Interiors-Finishes-and-Millwork'], sheets: 'I101 · I501',
    steps: [
      'Open I101 and calibrate its 20 ft reference. Read the F1 and F2 finish key before measuring.',
      'Trace the dimension-boundary zones for tiled rooms 107 and 108 separately: 288 sq ft each, or 576 sq ft together.',
      'Compare F2 tile with 576 sq ft and F1 resilient flooring with 5,184 sq ft. Apply any waste allowance separately.'
    ],
    scope: 'The authored finish schedule uses room dimension boundaries without wall-thickness deductions. These exercise areas are not net installed quantities; I501 details use different scales.',
    guide: '/tools/flooring-waste-calculator/'
  },
  electrical: {
    title: 'Count the Willow Creek lighting plan',
    files: ['06-Electrical-Lighting-and-Power'], sheets: 'E101 · E601',
    steps: [
      'Open E101 and identify the luminaire symbol in the legend. Count only the plan, excluding legend and detail examples.',
      'Review 24 plan luminaires, including 4 emergency luminaires. The emergency subset is included in 24, not added to it.',
      'Calibrate the 20 ft reference. Trace the LP-1 / CKTS 1, 3, 5, 7 diagram from the panel, then north and east: 8 + 38 = 46 ft.'
    ],
    scope: 'The dashed wiring is a circuit diagram, not a conduit takeoff. Pro is required for Symbol Search; review every candidate. The 24 fixtures and 46 ft are drawing references, not app results.',
    guide: '/blog/count-pdf-symbols/'
  },
  compare: {
    title: 'Compare the Willow Creek architectural revisions',
    files: ['02-Architectural-Revision-A', '03-Architectural-Revision-B'], sheets: 'A101 · A201',
    steps: [
      'Open Revision A and Revision B. Pair A101 with A101 and A201 with A201; keep the full sheet extents aligned.',
      'On A101, review the 6 ft partition shift between rooms 103 and 104 and the 3 ft movement of the room 104 door.',
      'Review the added 6 ft south glazing on A101 and A201, then check the revised issue fields and notes.'
    ],
    scope: 'Room 103 changes from 576 to 720 sq ft; room 104 changes from 576 to 432 sq ft. The gross footprint stays 5,760 sq ft. These are authored changes, not a promised detection count.',
    guide: '/blog/compare-pdf-drawing-revisions/'
  },
  review: {
    title: 'Review the Willow Creek coordination sheets',
    files: ['11-Coordination-and-Review'], sheets: 'X101 · X102',
    steps: [
      'Open X101 and inspect the three numbered coordination issues and their existing sticky notes.',
      'Use X102 to match each location to its issue, trade, status, and requested response. Add your own review markup on a copy.',
      'Save the copy, reopen it, and inspect the annotations and any exported Markup Table before handing it off.'
    ],
    scope: 'The source contains three authored issues and four PDF layers. These are fictional coordination exercises; no engineering or code-compliance conclusion is established.',
    guide: '/blog/pdf-markup-table-rfi-punch-list/'
  },
  ocr: {
    title: 'Test OCR on the Willow Creek scanned sheets',
    files: ['12-Scanned-Legacy-Drawings'], sheets: 'A101 · C101',
    steps: [
      'Open the scanned set and try searching for WILLOW CREEK. The original two-page PDF contains images without native text.',
      'Run OCR on a working copy. Search for COMMUNITY ROOM on A101 and SITE PLAN on C101, then inspect the recognized text.',
      'Save and reopen the result. Repeat the searches and visually check dimensions before measuring the scanned drawing.'
    ],
    scope: 'Search targets are printed source text, not a promise of recognition accuracy. OCR does not repair drawing scale or scan distortion.',
    guide: '/blog/ocr-scanned-pdf-drawings/'
  }
};
export const constructionExampleForPath = {
  '/pdf-takeoff-software': 'takeoff', '/pdf-measuring-tool': 'takeoff', '/measure-pdf-on-mac': 'takeoff',
  '/flooring-takeoff-software': 'flooring', '/electrical-takeoff-software': 'electrical',
  '/visual-search-pdf-count': 'electrical', '/compare-pdf-drawings': 'compare', '/construction-pdf-markup': 'review'
};
export const constructionExampleForGuide = {
  'quantity-takeoff': 'takeoff', 'pdf-takeoff-worked-example': 'takeoff',
  'calibrate-pdf-drawing-scale': 'takeoff', 'why-pdf-measurements-are-wrong': 'takeoff',
  'measure-pdf-area-cutouts-depth': 'flooring', 'count-pdf-symbols': 'electrical',
  'compare-pdf-drawing-revisions': 'compare', 'pdf-markup-table-rfi-punch-list': 'review',
  'ocr-scanned-pdf-drawings': 'ocr'
};
