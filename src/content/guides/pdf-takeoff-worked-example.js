import screenshot from '../../assets/screenshots/takeoff-currentdev-dark-web.png';

const screenshotCaption =
  'Current-development PolyPDF 1.3.4 (build 16) capture in dark mode on the owned Takeoff Demonstration fixture. Measurements › Records and the Markup Table show 14 deterministic demonstration records: one 540.00 sq ft area, one 30.00 ft length, and 12 Supply diffuser count markers. These seeded records prove the committed takeoff and worksheet presentation, not a Symbol Search run or a professional estimate.';

const post = {
  slug: 'pdf-takeoff-worked-example',
  title: 'PDF Takeoff Worked Example: Scale, Area, Length, and Count',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Measure & Takeoff',
  excerpt:
    'Follow one small plan takeoff from calibration through area, wall lengths, diffuser count, worksheet review, and CSV or PDF export.',
  metaTitle: 'PDF Takeoff Worked Example | PolyPDF Guide',
  metaDescription:
    'Follow a practical PDF takeoff example: calibrate the plan, measure area and lengths, auto-count symbols, review records, and export CSV or PDF.',
  lede:
    'This worked example uses an owned one-page community-workshop fixture so the source, calibration, and expected on-screen evidence are reproducible. The same sequence applies to your own drawing after you verify its scale.',
  quickAnswer:
    'A reliable PDF takeoff follows this order: confirm the sheet and revision, calibrate the current page, verify a second known dimension, trace area and length quantities, review any repeated-symbol candidates, inspect the Takeoff Worksheet, then export CSV or a PDF summary. The owned 1/4-inch-equals-1-foot fixture uses 18 PDF points per foot; the current capture shows 540.00 sq ft of floor finish, 30.00 ft of partition length, and 12 committed Supply diffuser counts across 14 records.',
  lastVerified: '2026-08-19',
  productVersion: 'PolyPDF current-development snapshot (1.3.4 build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: screenshot,
    alt: 'PolyPDF dark-mode takeoff with a 540 square foot area, 30 foot length, 12 count markers, Records panel, and Markup Table',
    caption: screenshotCaption,
    width: 1710,
    height: 1073,
    provenance:
      'Real current-development product UI. The owned fixture and deterministic demonstration annotations contain no customer data; the image is an uncropped 50 percent derivative of the native-maximized capture.'
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
            'Open the owned Takeoff Demonstration fixture, a one-page fictional community-workshop plan labeled T-101 and Revision B. The capture records a calibrated area, a partition length, a committed count series, the Records panel, and the Markup Table on one screen. It is a teaching fixture rather than a bid document, so use the workflow—not its quantities—as the template for your project.'
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
          alt: 'The fictional T-101 takeoff fixture with area, length, 12 count markers, Records, and the Markup Table open',
          caption: screenshotCaption,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'ruler',
      title: 'Step 1: establish and prove the page scale',
      body: [
        {
          kind: 'p',
          text:
            'The fixture is plotted at 1/4 inch = 1 foot. At 72 PDF points per inch, that preset corresponds to 18 PDF points per foot. Apply the printed architectural preset to this page, then verify it against the labeled 30-foot horizontal span or another independent dimension before relying on quantities.'
        },
        {
          kind: 'formula',
          label: 'Sample page scale',
          formula: '72 PDF pt/in × 1/4 in/ft = 18 PDF pt/ft',
          explanation:
            'This ratio follows the fixture’s printed scale. Do not copy 18 PDF pt/ft into an unrelated drawing unless that file’s own geometry proves the same plotted relationship.'
        },
        {
          kind: 'p',
          text:
            'Before adding quantities, draw a temporary measurement over a different labeled span. A second check is what catches a wrong endpoint, a mistyped distance, or an incorrect unit. For a scanned plan, also compare a reference in the other direction because a single proportional scale cannot correct unequal horizontal and vertical stretch.'
        },
        {
          kind: 'note',
          text:
            'The scale shown in this sample is intentionally simple for onboarding. A real plan may use an architectural, engineering, or metric preset, or require calibration from its own known dimension.'
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
            'Choose Area and click around the floor boundary, using enough vertices to follow the intended face. Close the polygon at the starting point. The current capture shows a rectangular 540.00 sq ft floor-finish area and a 30.00 ft south partition run. Those values describe the synthetic fixture geometry; they are not estimates of usable, rentable, finish, or code area for a real project.'
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
            'The capture shows one selected 30.00 ft partition-length record beside the 540.00 sq ft area record. Their value is that each measurement remains identifiable on the page and in the worksheet, with its own subject, status, unit, and formula.'
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
            'For repeated symbols, open Symbol Search, draw a box tightly around one clean example, run the search, and review the candidates before accepting them as counts. This takeoff capture shows the committed outcome—12 Supply diffuser markers and a worksheet total of 12—but those markers were loaded as deterministic demonstration annotations. The image does not prove how candidates were found. See the dedicated symbol-count guide for a genuine five-match live review capture.'
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
            'Symbol Search auto-count is uncapped in Free. The separate Free limit is three hand-created measurements per document, so a user can test calibration, area or length, and a real auto-count workflow without a paid license.'
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
            'Use CSV when the next step is spreadsheet estimating, filtering, or joining quantities to a cost database. Use the PDF summary when a person needs a fixed, readable handoff. PolyPDF exports the current worksheet; it does not certify that the source drawing, scale, boundaries, subjects, or accepted Symbol Search matches were correct.'
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
        'No. It is the floor-finish annotation shown on an owned fictional teaching fixture. Your result depends on your drawing, calibration, and chosen boundary definition.'
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
