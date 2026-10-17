import { commercialOffer } from './commercialOffer';

// Visible editorial answers. Each belongs to the page that explains and demonstrates it.
export const workflowAnswers = {
  '/visual-search-pdf-count': {
    question: 'How do you count repeated symbols in a construction PDF?',
    answer: 'In PolyPDF Pro on Mac or Windows, capture one clean symbol, search the selected pages, review every candidate, and commit accepted matches as a linked Count series. Check the drawing scope and keep different fixture types in separate worksheet subjects. Symbol Search matches graphics, not text characters. Free opens drawings for review but does not run Symbol Search.',
    href: '/visual-search-pdf-count/#check-symbol-count', label: 'Check the fixture-count exercise'
  },
  '/pdf-measuring-tool': {
    question: 'How do you measure a scaled PDF drawing?',
    answer: 'Open the PDF in a measuring tool, calibrate against a known dimension, and verify a second span before measuring. In PolyPDF, trace distances or area boundaries and review the units and quantities in the takeoff worksheet. Check each page or detail with a different scale separately. A single calibration cannot correct a scan that is stretched differently in two directions.',
    href: '/tools/pdf-scale-checker/', label: 'Check your reference measurements'
  },
  '/pdf-takeoff-software': {
    question: 'Is there free construction takeoff software for Mac and Windows?',
    answer: `PolyPDF Free for Mac and Windows includes calibration, markup, review, and up to 3 hand-created measurements per document, with no trial timer. Personal Pro costs ${commercialOffer.price} USD once for PolyPDF 1.x on up to ${commercialOffer.activationLimit} computers. It removes the measurement cap and unlocks Symbol Search and other Pro workflows. Future major upgrades may be paid. Test your drawing and required handoff before buying.`,
    href: '/pdf-takeoff-software/#free-vs-pro', label: 'Compare Free, Pro, and license terms'
  },
  '/measure-pdf-on-mac': {
    question: 'Can you measure construction PDFs on a Mac?',
    answer: 'Yes. PolyPDF is a desktop PDF measuring app for macOS 14 or newer, on Apple silicon and Intel Macs. Open the drawing, calibrate a known dimension, verify a second span, and then measure lengths or areas. The Free edition supports up to 3 hand-created measurements per document. Use the reviewed worksheet quantities for the next estimating step.',
    href: '/measure-pdf-on-mac/#try-mac-measurement', label: 'Try the Mac measurement sample'
  },
  '/electrical-takeoff-software': {
    question: 'What does electrical takeoff software measure?',
    answer: 'Electrical takeoff records quantities such as fixture counts and drawn route lengths from project plans. PolyPDF lets you calibrate PDFs, count items, measure routes, and export a reviewed worksheet. Pro Symbol Search finds candidate symbols that you must check. Plan lengths do not automatically include rises, drops, slack, fittings, or labor; document those allowances separately.',
    href: '/samples/', label: 'Inspect the electrical practice files'
  },
  '/flooring-takeoff-software': {
    question: 'How do you estimate flooring from a PDF plan?',
    answer: 'Calibrate the plan, measure each finish boundary, and subtract excluded areas to obtain net floor quantities. In PolyPDF, review room quantities before exporting the worksheet. Then apply the waste allowance required for the product and installation and round up to whole packs. The free website calculator performs that purchasing calculation; it does not optimize roll layouts, seams, or cuts.',
    href: '/tools/flooring-waste-calculator/', label: 'Calculate waste and whole packs'
  },
  '/bluebeam-alternative': {
    question: 'Can PolyPDF replace Bluebeam for construction PDF work?',
    answer: 'PolyPDF is an option for local PDF measurement, takeoff, markup, and drawing review on Mac and Windows. Its personal Pro license is a one-time purchase for PolyPDF 1.x on up to 3 computers. It cannot join Bluebeam Studio. Test required annotations, exports, and recipient workflows on a representative drawing before switching; a project that requires Studio still needs a supported Bluebeam solution.',
    href: '/bluebeam-alternative-for-mac/', label: 'Review the detailed Mac comparison'
  },
  '/construction-pdf-markup': {
    question: 'How do you make construction PDF markups useful to the next reviewer?',
    answer: 'Anchor each markup to the correct sheet and revision, describe the issue, and identify the action or clarification needed. PolyPDF supports notes, callouts, shapes, highlights, and revision clouds. Save and reopen a representative file, then test it in the recipient’s viewer before standardizing the handoff. The supplied review sample demonstrates a specific saved output, not universal viewer compatibility.',
    href: '/construction-pdf-markup/#review-handoff', label: 'Check the review handoff and saved sample'
  },
  '/compare-pdf-drawings': {
    question: 'How do you compare two revisions of a PDF drawing?',
    answer: 'Confirm that the PDFs represent the same sheet, check revision identifiers, and align their position and scale before comparing. Review detected differences against the actual drawing and record relevant changes with markups or revision clouds. PolyPDF supports drawing comparison, but differences can also come from shifted pages or changed rendering. A comparison does not establish that every design change has been found.',
    href: '/compare-pdf-drawings/#try-drawing-comparison', label: 'Try the drawing pair and check the source changes'
  }
};
