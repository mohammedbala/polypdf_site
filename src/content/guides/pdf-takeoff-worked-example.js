import screenshot from '../../assets/screenshots/takeoff-v1-4-dark-web.png';

const screenshotCaption =
  'A small takeoff on a sample plan, with Measurements › Records and the Markup Table open beside it: 14 records covering one 540.00 sq ft area, one 30.00 ft partition length, and 12 Supply diffuser counts. Each record keeps its own subject, status, unit, and formula, so a reviewer can trace a total back to the rows that produced it.';

const post = {
  slug: 'pdf-takeoff-worked-example',
  title: 'PDF Takeoff Worked Example: Scale, Area, Length, and Count',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-09-03',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Measure & Takeoff',
  excerpt:
    'Follow one small plan takeoff from calibration through area, wall lengths, diffuser count, worksheet review, and CSV or PDF export.',
  metaTitle: 'PDF Takeoff Worked Example | PolyPDF Guide',
  metaDescription:
    'Follow a practical PDF takeoff example: calibrate the plan, measure area and lengths, auto-count symbols, review records, and export CSV or PDF.',
  lede:
    'This worked example follows one small takeoff end to end: calibrate the page, trace an area and a length, count a repeated symbol, review the worksheet, export. The same sequence applies to your own drawing once you have verified its scale.',
  quickAnswer:
    'A reliable PDF takeoff follows this order: confirm the sheet and revision, calibrate the current page, verify a second known dimension, trace area and length quantities, review any repeated-symbol candidates, inspect the Takeoff Worksheet, then export CSV or a PDF summary. The plan used here is plotted at 1/4 inch = 1 foot, or 18 PDF points per foot, and it carries 540.00 sq ft of floor finish, 30.00 ft of partition length, and 12 committed Supply diffuser counts across 14 records.',
  lastVerified: '2026-09-03',
  productVersion: 'PolyPDF 1.5.0 (build 22); screenshots from 1.4.0 (build 17)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: screenshot,
    alt: 'PolyPDF dark-mode takeoff with a 540 square foot area, 30 foot length, 12 count markers, Records panel, and Markup Table',
    caption: screenshotCaption,
    width: 1710,
    height: 1073,
    provenance:
      'Your own quantities will depend on your drawing, its calibration, and where you place each boundary.'
  },
  keywords: [
    'PDF takeoff example',
    'construction takeoff workflow',
    'measure PDF plan',
    'PDF quantity takeoff',
    'export takeoff CSV'
  ],
  sections: [
    {
      icon: 'document',
      title: 'The sample and the takeoff question',
      body: [
        {
          kind: 'p',
          text:
            'The sheet is T-101, Revision B: a one-page community workshop plotted at 1/4 inch = 1 foot. One screen holds everything the example needs—a calibrated area, a partition length, a committed count series, the Records panel, and the Markup Table. Copy the workflow rather than the numbers; the quantities belong to this drawing.'
        },
        {
          kind: 'ul',
          items: [
            'Area question: does the traced floor-finish boundary produce the displayed 540.00 sq ft?',
            'Length question: does the south partition run produce the displayed 30.00 ft?',
            'Count question: do the 12 committed markers and the worksheet total agree?',
            'Output question: can a reviewer see the items, totals, formula, pages, subject, and status before export?'
          ]
        },
        {
          kind: 'figure',
          src: screenshot,
          alt: 'The T-101 sample plan with area, length, 12 count markers, Records, and the Markup Table open',
          caption: screenshotCaption,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'ruler',
      title: 'Step 1: establish and check the page scale',
      body: [
        {
          kind: 'p',
          text:
            'This sheet is plotted at 1/4 inch = 1 foot. At 72 PDF points per inch, that preset corresponds to 18 PDF points per foot. Apply the printed architectural preset to the page, then verify it against the labeled 30-foot horizontal span or another independent dimension before relying on quantities.'
        },
        {
          kind: 'formula',
          label: 'Sample page scale',
          formula: '72 PDF pt/in × 1/4 in/ft = 18 PDF pt/ft',
          explanation:
            'This ratio follows the scale printed on this sheet. Do not carry 18 PDF pt/ft into another drawing unless that file’s own geometry shows the same plotted relationship.'
        },
        {
          kind: 'p',
          text:
            'Before adding quantities, draw a temporary measurement over a different labeled span. A second check is what catches a wrong endpoint, a mistyped distance, or an incorrect unit. For a scanned plan, also compare a reference in the other direction because a single proportional scale cannot correct unequal horizontal and vertical stretch.'
        },
        {
          kind: 'note',
          text:
            'The scale here is deliberately simple. Your plan may use an architectural, engineering, or metric preset, or need calibration from a dimension printed on the sheet.'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Step 2: trace area and linear quantities',
      body: [
        {
          kind: 'p',
          text:
            'Choose Area and click around the floor boundary, using enough vertices to follow the intended face. Close the polygon at the starting point. The screenshot shows a rectangular 540.00 sq ft floor-finish area and a 30.00 ft south partition run. An area measurement reports the boundary you traced; whether that boundary means usable, rentable, finish, or code area is a judgment you make.'
        },
        {
          kind: 'ol',
          items: [
            'Name the area’s Subject so its worksheet row explains what the polygon represents.',
            'Inspect the boundary at corners and openings. Add area cutouts when a void must be excluded rather than mentally subtracting it later.',
            'Use Line Measurement, Dimension, Path Length, or Perimeter according to the quantity. An open run and a closed perimeter answer different questions.',
            'Give unlike assemblies distinct Subjects. A wall, curb, cable tray, and pipe should not collapse into one length total merely because they share units.',
            'Use Status to distinguish accepted work from an item that still needs checking before export.'
          ]
        },
        {
          kind: 'p',
          text:
            'In the screenshot, the selected 30.00 ft partition-length record sits beside the 540.00 sq ft area record. Each one stays identifiable on the page and in the worksheet, carrying its own subject, status, unit, and formula.'
        }
      ]
    },
    {
      icon: 'search',
      title: 'Step 3: count repeated symbols with Symbol Search',
      body: [
        {
          kind: 'p',
          text:
            'For repeated symbols, open Symbol Search, draw a box tightly around one clean example, run the search, and review the candidates before accepting them as counts. A committed count series looks like the screenshot above: 12 Supply diffuser markers on the plan and a worksheet total of 12. Our symbol-count guide covers the search and candidate-review step, one candidate at a time.'
        },
        {
          kind: 'ol',
          items: [
            'Choose a representative symbol with clear linework and little surrounding text.',
            'Keep the query box tight enough to describe the symbol, but include the features that distinguish it from nearby objects.',
            'Review each candidate overlay rather than treating the match count as an unquestionable total.',
            'Accept the reviewed matches so they become ordinary count records on the document.',
            'Set the Subject to the actual item, such as Supply Diffuser, instead of leaving unlike count series ambiguous.'
          ]
        },
        {
          kind: 'note',
          text:
            'Free includes calibration and up to three hand-created measurements per document. Symbol Search requires PolyPDF Pro in the current release and is separate from that manual-measurement allowance.'
        }
      ]
    },
    {
      icon: 'table',
      title: 'Step 4: review the Takeoff Worksheet',
      body: [
        {
          kind: 'p',
          text:
            'Open Measurements › Records after placing the quantities. PolyPDF builds worksheet rows from the measurements and counts in the document. Rows keep distinct workspace or space assignment, Subject, Status, quantity kind, unit, and count series separate so unlike work does not become one unexplained number.'
        },
        {
          kind: 'table',
          caption: 'Review gates before export',
          headers: ['Field', 'Question to ask', 'Why it matters'],
          rows: [
            ['Workspace / Space', 'Is the item assigned to the intended room, zone, or unassigned bucket?', 'Prevents totals from being attributed to the wrong work area'],
            ['Subject', 'Does the label name the assembly or item?', 'Keeps different scopes from merging under a generic name'],
            ['Status', 'Is the value accepted, pending, or rejected?', 'Makes unresolved review work visible'],
            ['Qty and Total', 'Do the item count and aggregate agree with the page?', 'Catches duplicate or missing records'],
            ['Formula', 'Can you trace the displayed SUM or COUNT to its components?', 'Provides a compact arithmetic audit trail'],
            ['Unit', 'Are lengths, areas, volumes, angles, and counts separated?', 'Stops unlike quantities from being added']
          ]
        },
        {
          kind: 'p',
          text:
            'Select suspicious rows and return to the page before exporting. The worksheet is a review surface, not a replacement for understanding what each traced boundary or accepted match represents.'
        }
      ]
    },
    {
      icon: 'export',
      title: 'Step 5: export a reviewable result',
      body: [
        {
          kind: 'p',
          text:
            'Use CSV when the next step is spreadsheet estimating, filtering, or joining quantities to a cost database. Use the PDF summary when a person needs a fixed, readable handoff. PolyPDF exports the worksheet as it stands, so the drawing, the scale, the boundaries, the subjects, and the accepted matches all need to be right before the export leaves your hands.'
        },
        {
          kind: 'ul',
          items: [
            'Keep the source PDF revision with the export so a reviewer knows which drawing produced the quantities.',
            'Record assumptions such as gross versus net area, centerline versus face-of-wall length, and whether cutouts were included.',
            'Spot-check at least one row of each quantity kind against the annotated page.',
            'After a drawing revision, rerun the affected takeoff rather than silently carrying forward values from the old geometry.'
          ]
        },
        {
          kind: 'note',
          text:
            'This example demonstrates the software workflow, not a professional estimate or bid. The person preparing the takeoff remains responsible for source documents, scope interpretation, waste factors, assemblies, pricing, and review.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'What should I do first in a PDF takeoff?',
      answer:
        'Confirm the sheet and revision, calibrate the current page, and verify a different known dimension before tracing any quantities.'
    },
    {
      question: 'Can PolyPDF export a takeoff to CSV?',
      answer:
        'Yes. The Takeoff Worksheet exports CSV for downstream spreadsheet work and a PDF summary for a fixed review handoff.'
    },
    {
      question: 'Does Symbol Search accept every match automatically?',
      answer:
        'The workflow is designed for review: draw a query around one symbol, inspect the candidates, then accept the matches that should become counts.'
    },
    {
      question: 'Is the 540-square-foot value a recommendation for my project?',
      answer:
        'No. It is the floor-finish area measured on the sample plan used in this guide. Your own number depends on your drawing, its calibration, and the boundary you choose to trace.'
    }
  ],
  relatedSlugs: [
    'calibrate-pdf-drawing-scale',
    'measure-pdf-area-cutouts-depth',
    'why-pdf-measurements-are-wrong'
  ],
  sources: [
    {
      label: 'PolyPDF: PDF takeoff software',
      url: 'https://www.polypdf.com/pdf-takeoff-software/'
    },
    {
      label: 'PolyPDF: Visual Search PDF count',
      url: 'https://www.polypdf.com/visual-search-pdf-count/'
    }
  ],
  cta: {
    title: 'Run the same sequence on your drawing',
    text:
      'PolyPDF is a free download for macOS and Windows. Start with one verified page, create a small takeoff, and inspect the worksheet before deciding whether the full workflow fits your work.',
    buyLabel: 'See the one-time license',
    downloadSource: 'blog_pdf_takeoff_example',
    buySource: 'website_blog_pdf_takeoff_example'
  }
};

export default post;
