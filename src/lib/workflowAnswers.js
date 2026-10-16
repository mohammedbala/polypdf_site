// Visible editorial answers. Each belongs to the page that explains and demonstrates it.
export const workflowAnswers = {
  '/pdf-measuring-tool': {
    question: 'How do you measure a scaled PDF drawing?',
    answer: 'Open the PDF in a measuring tool, calibrate against a known dimension, and verify a second span before measuring. In PolyPDF, trace distances or area boundaries and review the units and quantities in the takeoff worksheet. Check each page or detail with a different scale separately. A single calibration cannot correct a scan that is stretched differently in two directions.',
    href: '/tools/pdf-scale-checker/', label: 'Check your reference measurements'
  },
  '/pdf-takeoff-software': {
    question: 'Is there free construction takeoff software for Mac and Windows?',
    answer: 'PolyPDF has a Free desktop edition for Mac and Windows with calibration and up to 3 hand-created measurements per document, plus markup and review. Pro removes that measurement cap and adds Symbol Search and other Pro workflows. Use the free edition to check your own drawing scale and file handoff before deciding whether the paid workflow fits your project.',
    href: '/product-facts/#free-and-pro', label: 'Check Free and Pro limits'
  },
  '/measure-pdf-on-mac': {
    question: 'Can you measure construction PDFs on a Mac?',
    answer: 'Yes. PolyPDF is a desktop PDF measuring app for macOS 14 or newer, on Apple silicon and Intel Macs. Open the drawing, calibrate a known dimension, verify a second span, and then measure lengths or areas. The Free edition supports up to 3 hand-created measurements per document. Use the reviewed worksheet quantities for the next estimating step.',
    href: '/pdf-measuring-tool/', label: 'See the PDF measurement workflow'
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
    href: '/samples/', label: 'Inspect the saved review sample'
  },
  '/compare-pdf-drawings': {
    question: 'How do you compare two revisions of a PDF drawing?',
    answer: 'Confirm that the PDFs represent the same sheet, check revision identifiers, and align their position and scale before comparing. Review detected differences against the actual drawing and record relevant changes with markups or revision clouds. PolyPDF supports drawing comparison, but differences can also come from shifted pages or changed rendering. A comparison does not establish that every design change has been found.',
    href: '/samples/', label: 'Review the drawing-comparison example'
  }
};
