import symbolSearchReviewImage from '../../assets/screenshots/symbol-search-review-v1-4-dark-web.png';
import committedCountImage from '../../assets/screenshots/count-committed-v1-4-dark-web.png';

const committedCountCaption =
  'A second sample sheet, after its count was committed: twelve Supply diffuser markers on the plan and a worksheet total of 12, with the legend copy of the symbol left out. The markers are one linked Count series, so the page and the worksheet report the same number.';

const countPdfSymbolsGuide = {
  slug: 'count-pdf-symbols',
  title: 'How to Count Symbols in a PDF Drawing',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-24',
  author: 'The PolyPDF team',
  readingTime: '9 min read',
  tag: 'Review & Markup',
  excerpt:
    'Use PolyPDF Pro Symbol Search to find repeated plan symbols, review every candidate, and commit the accepted matches as one linked Count series.',
  metaTitle: 'How to Count Symbols in a PDF Drawing | PolyPDF',
  metaDescription:
    'Count repeated symbols with PolyPDF Pro Symbol Search, including setup, candidate review, false-positive checks, and takeoff QA.',
  lede:
    'Symbol Search can turn one boxed example into a reviewable set of count candidates. The useful result comes from pairing that automation with a deliberate human check before anything is added to the PDF.',
  quickAnswer:
    'Choose Symbol Search, set the pages and matching options, then drag a close box around one clean example. PolyPDF highlights candidate matches without changing the document. Include or exclude each candidate, then choose Count to create one linked Count series. Treat the result as assisted counting: legends, schedules, similar symbols, and low-quality scans can all need manual correction.',
  lastVerified: '2026-08-24',
  productVersion: 'PolyPDF 1.4.1 (build 18); screenshots from 1.4.0 (build 17)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: symbolSearchReviewImage,
    alt: 'PolyPDF dark-mode Symbol Search review showing five matched symbols, five selected candidates, and a Count 5 action',
    caption:
      'Symbol Search in PolyPDF 1.4.0, paused at the review step after the matcher returned “5 matches — 5 selected”. Nothing reaches the document until you press Count, so this is the moment to include or exclude each candidate.',
    width: 1710,
    height: 1073,
    provenance:
      'The drawing is our demo sheet rather than a real project.'
  },
  keywords: [
    'count symbols in PDF',
    'PDF symbol counter',
    'construction drawing symbol count',
    'PDF auto count',
    'plan takeoff count',
    'Symbol Search'
  ],
  sections: [
    {
      icon: 'search',
      title: 'What Symbol Search actually does',
      body: [
        {
          kind: 'p',
          text:
            'Symbol Search compares the visual sample you box with rendered regions of the pages you choose. It is useful for repeated plan marks such as diffusers, receptacles, fixtures, valves, or keyed details. It does not read the designer\'s intent, understand a legend, or decide which candidates belong in an estimate. The output is a set of proposed matches for you to review.'
        },
        {
          kind: 'p',
          text:
            'Matching runs on the device. You can search the current page, all pages, or a page range and adjust confidence, rotation matching, and scale tolerance. Until you press Count, the candidates are only a review overlay: the document and its takeoff records have not changed.'
        },
        {
          kind: 'note',
          text:
            'Use a human check even when every highlight looks plausible at first glance. A title-block symbol can be graphically identical to a plan symbol while representing no installed quantity.'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Step by step: run a symbol count',
      body: [
        {
          kind: 'ol',
          items: [
            'Open the drawing and go to the sheet that contains a clean example of the item you want to count.',
            'Choose Symbol Search from the measurement toolbar or from Tools > Measure. The Search sidebar switches to its Symbol view.',
            'Enter a subject that will make sense in the takeoff later, such as Level 2 Supply Diffuser rather than a generic Auto Count label.',
            'Choose Current Page, All Pages, or a specific page range. Start narrow when title blocks and legends repeat across many sheets.',
            'Set confidence, Match rotations, and scale tolerance. Keep the defaults for a first pass unless the drawing gives you a reason to broaden the search.',
            'Drag a tight box around one complete symbol. Avoid including its identifier, nearby walls, or dimension lines when those elements vary between placements.',
            'Review the highlights. Click a candidate to include or exclude it, or use Previous and Next to inspect them one at a time. Candidates overlapping an existing Count are marked Already counted and excluded by default.',
            'Choose Count only after the selected total matches what you can defend. PolyPDF converts the accepted candidates into one linked Count series under the subject you entered.'
          ]
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked example: five symbols, five reviewed matches',
      body: [
        {
          kind: 'p',
          text:
            'The sheet in the screenshot above carries five identical small symbols, plus one oversized copy of the same graphic further down the page. Boxing one of the small symbols returns exactly those five candidates; the oversized copy stays out of the set.'
        },
        {
          kind: 'p',
          text:
            'All five candidates are the symbol being counted, so all five stay selected and Count 5 commits them. The five markers arrive on the page as one linked series, sharing the subject that was typed into the search and numbered in sequence. On a project drawing, the include-and-exclude pass is where the time goes: match quality depends on the sheet you are working from.'
        },
        {
          kind: 'formula',
          label: 'What the run produced',
          formula: '5 small symbols → 5 reviewed candidates → 5 committed counts',
          explanation:
            'A count is only as good as its scope. Check for legend and detail copies of the symbol before the total goes anywhere.'
        },
        {
          kind: 'figure',
          src: committedCountImage,
          alt: 'PolyPDF dark mode showing 12 committed Supply diffuser count markers and a worksheet total of 12 with the legend excluded',
          caption: committedCountCaption,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'table',
      title: 'Tune the search without hiding uncertainty',
      body: [
        {
          kind: 'table',
          caption: 'Symbol Search controls and their review tradeoffs',
          headers: ['Control', 'When to change it', 'What to re-check'],
          rows: [
            [
              'Confidence',
              'Lower it when real symbols are being missed; raise it when many look-alikes appear.',
              'A lower threshold usually increases both recall and false positives.'
            ],
            [
              'Match rotations',
              'Turn it on when the same mark appears at different orientations.',
              'Rotated linework or directional symbols may still need closer inspection.'
            ],
            [
              'Scale tolerance',
              'Broaden it when the same symbol is plotted at slightly different sizes.',
              'Similar symbols at other sizes can enter the candidate set.'
            ],
            [
              'Page scope',
              'Use a range for the discipline and revision you are actually counting.',
              'Legends, schedules, cover sheets, and duplicated details can inflate totals.'
            ]
          ]
        },
        {
          kind: 'p',
          text:
            'A cleaner sample is usually more valuable than repeatedly moving the confidence slider. If the box contains a room boundary, label, or hatch, the search may favor those pixels instead of the symbol. Capture one complete mark with as little changing context as practical.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Quality checks before and after Count',
      body: [
        {
          kind: 'ul',
          items: [
            'Scan every highlighted location at a readable zoom, especially dense areas where candidates overlap other linework.',
            'Check legends, key plans, schedules, enlarged details, and title blocks for non-installation copies of the symbol.',
            'Compare the accepted total with room-by-room or zone-by-zone expectations instead of trusting one sheet-wide number.',
            'Look for already-counted markers before adding a second series over the same items.',
            'After committing, inspect the linked Count series in the takeoff and Markup Table and give it a specific subject.',
            'Save a review copy and preserve the source drawing so the basis of the count remains auditable.'
          ]
        },
        {
          kind: 'note',
          text:
            'Scanned, faint, skewed, compressed, or heavily marked-up sheets can reduce match quality. When the candidate set cannot be reviewed confidently, use manual Count or split the work into smaller page regions and reconcile the totals.'
        }
      ]
    },
    {
      icon: 'export',
      title: 'Free-tier behavior and downstream use',
      body: [
        {
          kind: 'p',
          text:
            'Symbol Search is a PolyPDF Pro workflow in version 1.4.1. Once Pro access admits a search, the accepted candidates can be committed as one linked Count series without a separate per-search count cap. The Free app separately supports up to three hand-created measurements per document.'
        },
        {
          kind: 'p',
          text:
            'Once committed, the matches behave as one linked Count series. Use a subject that survives export, then review the rows with the rest of the document\'s markups. If the total will support procurement or pricing, export the relevant takeoff or markup data and retain the reviewed PDF with it; the exported number should never be separated from its scope and revision.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Does Symbol Search change the PDF while it is searching?',
      answer:
        'No. Search results are candidates in a review overlay. The document changes only after you choose Count to commit the selected candidates.'
    },
    {
      question: 'Is PDF symbol counting fully automatic?',
      answer:
        'No. PolyPDF proposes visual matches, but a person must decide whether each match belongs in the requested scope. Legends and similar graphics are common reasons to exclude a candidate.'
    },
    {
      question: 'Can the free version run Symbol Search?',
      answer:
        'No. Symbol Search requires PolyPDF Pro in version 1.4.1. Free still includes markup, review, calibration, and up to three hand-created measurements per document.'
    },
    {
      question: 'Why did Symbol Search miss or over-count symbols?',
      answer:
        'The sample box, page scope, confidence, rotation setting, scale tolerance, scan quality, and surrounding linework all affect the candidate set. Capture a cleaner sample and review the matching controls one at a time.'
    }
  ],
  relatedSlugs: [
    'pdf-markup-table-rfi-punch-list',
    'compare-pdf-drawing-revisions'
  ],
  sources: [
    {
      label: 'PolyPDF 1.4.0 (build 17) in-app guide: Symbol Search + Auto-Count',
      note: 'UI steps, on-device matching behavior, and review controls. PolyPDF 1.4.1 changed access to require Pro without changing the captured search interface.'
    },
    {
      label: 'Screenshots in this guide: PolyPDF 1.4.0 on our demo plan',
      note: 'The search returned five matches, and Count committed five sequential markers in one linked series. The second screenshot shows a committed 12-marker series beside its worksheet total.'
    }
  ],
  cta: {
    title: 'Review a symbol count on your own drawing',
    body:
      'Download PolyPDF for macOS or Windows, activate Pro, and run Symbol Search on your own drawing. Verify every candidate against the scope before using the total.',
    downloadSource: 'blog_count_pdf_symbols',
    buySource: 'website_blog_count_pdf_symbols',
    buyLabel: 'Unlock Symbol Search'
  }
};

export default countPdfSymbolsGuide;
