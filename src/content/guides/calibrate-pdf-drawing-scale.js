import screenshot from '../../assets/screenshots/shot-real-scale-web.png';

const screenshotCaption =
  'Live-app capture from the PolyPDF 1.3.1 dev build on macOS, using the bundled Q-101 sample. This guide was re-verified against PolyPDF 1.3.4 (build 16); the screenshot itself records the earlier build.';

const post = {
  slug: 'calibrate-pdf-drawing-scale',
  title: 'How to Calibrate a PDF Drawing Scale',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '8 min read',
  tag: 'Measure & Takeoff',
  excerpt:
    'Set an accurate PDF drawing scale from a printed ratio or a known dimension, then prove it with a second reference before starting takeoff.',
  metaTitle: 'How to Calibrate a PDF Drawing Scale | PolyPDF',
  metaDescription:
    'Calibrate a PDF drawing from a known dimension, verify the scale on a second span, and avoid common takeoff errors in PolyPDF on Mac or Windows.',
  lede:
    'A trustworthy takeoff starts with one page-specific scale and an independent check. PolyPDF lets you apply the scale printed in a title block or draw over a known dimension when the sheet does not state one.',
  quickAnswer:
    'To calibrate a PDF drawing, open the page in PolyPDF, choose Measurements › Scale, and either apply the scale notation printed on the sheet or choose Calibrate by Drawing Line. For line calibration, snap the two endpoints to a known span, enter its real-world length, and then measure a different labeled span. Do not begin takeoff until that second value agrees within the tolerance your work requires.',
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: screenshot,
    alt: 'PolyPDF displaying the Q-101 plan with the Page Scale controls and calibrated measurements',
    caption: screenshotCaption,
    width: 1800,
    height: 1125
  },
  keywords: [
    'calibrate PDF drawing scale',
    'set scale in PDF',
    'measure scaled PDF',
    'PDF plan calibration',
    'construction drawing scale'
  ],
  sections: [
    {
      icon: 'ruler',
      title: 'Pick the right calibration path',
      body: [
        {
          kind: 'p',
          text:
            'If the title block clearly states a scale and the PDF has not been resized, use the matching architectural, engineering, or metric preset. If the scale is missing, the sheet may have been scanned, or you cannot establish that the file still matches the plotted size, calibrate from a dimension you can verify instead. A drawn calibration uses the geometry actually present in this PDF, which is why it is the safer path for an uncertain file.'
        },
        {
          kind: 'ul',
          items: [
            'Prefer a long, straight reference dimension. The same endpoint error is a smaller percentage of a long span than of a short one.',
            'Use a dimension whose value is explicitly printed on the drawing. Do not infer it from a door, grid, or object that only appears standard.',
            'Zoom in and enable Snap to Content when the reference endpoints coincide with vector linework. PolyPDF reports when one or both calibration endpoints were not snapped.',
            'Calibrate the page you are actually measuring. PolyPDF stores page calibration per page rather than assuming every sheet in a set shares one scale.'
          ]
        },
        {
          kind: 'figure',
          src: screenshot,
          alt: 'The calibrated Page Scale card beside measurements on the bundled Q-101 drawing',
          caption: screenshotCaption,
          width: 1800,
          height: 1125
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Calibrate from a known line, step by step',
      body: [
        {
          kind: 'ol',
          items: [
            'Open the PDF and navigate to the page you intend to measure.',
            'Open the Measurements panel, choose the Scale view, and confirm the page number shown in the Page Scale card.',
            'Under “The sheet does not,” choose Calibrate by Drawing Line.',
            'Click or drag from the first known endpoint to the second. Use a horizontal or vertical span when possible because its endpoints are usually easier to identify.',
            'In Calibrate Page Scale, enter the real-world Known Distance. PolyPDF accepts the current measurement format, including feet and inches or metric input.',
            'Confirm the card says Calibrated and shows the captured ratio in PDF points per base unit.',
            'Switch to a length measurement tool and measure a second labeled dimension that was not used for calibration.'
          ]
        },
        {
          kind: 'note',
          text:
            'A green “Calibrated” state confirms that a scale was saved; it does not independently prove that the line or typed distance was correct. The second known dimension is the practical proof.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked calibration: the bundled Q-101 sample',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF’s bundled Quick Start drawing includes a green reference line that is exactly 240 PDF points long and represents 20 feet. Dividing the captured page distance by the known real-world distance produces the page scale used by the sample.'
        },
        {
          kind: 'formula',
          label: 'Q-101 calibration',
          formula: '240 PDF pt ÷ 20 ft = 12 PDF pt per ft',
          explanation:
            'At this scale, a measured run of 360 PDF points represents 30 feet. The app performs this conversion after the page calibration is saved.'
        },
        {
          kind: 'p',
          text:
            'The Q-101 fixture is useful because the correct result is known, but production drawings deserve the same verification routine. After calibrating from one dimension, measure another. If a 30-foot labeled wall reads 29 feet 11 7/8 inches, decide whether that difference is inside the tolerance for your purpose; if it reads 27 feet, stop and investigate rather than correcting quantities later.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Verify before you take off quantities',
      body: [
        {
          kind: 'table',
          headers: ['Check', 'What you want to see', 'If it fails'],
          rows: [
            ['Second known span', 'A value within your project tolerance', 'Recheck endpoints, units, and the typed distance'],
            ['Current page', 'The intended sheet number in the Scale view', 'Calibrate this page or copy a proven scale only to identical-scale pages'],
            ['Units', 'Feet/inches or metric matching the source drawing', 'Switch format and confirm the stored scale still represents the intended base unit'],
            ['Detail or blowup', 'A reading that follows the detail’s own printed scale', 'Create a Scale Region for the differently scaled detail'],
            ['Scan geometry', 'Agreement in more than one direction and area of the sheet', 'Treat the scan as distorted if one calibration cannot satisfy those checks']
          ]
        },
        {
          kind: 'p',
          text:
            'For a multi-page set, “Add Scale to More Pages” copies the current calibration to the page range you choose. Use that convenience only when those pages genuinely share the same scale. A cover sheet, enlarged plan, or detail page can differ even when it is bundled into the same PDF.'
        },
        {
          kind: 'p',
          text:
            'When one page contains a detail or blowup at a different scale, PolyPDF’s Scale Regions panel can define a separate scale inside that outline. A measurement created there keeps a snapshot of the region scale it used, so later edits do not silently restate a recorded quantity.'
        }
      ]
    },
    {
      icon: 'warning',
      title: 'What calibration can and cannot correct',
      body: [
        {
          kind: 'p',
          text:
            'One calibration produces one proportional conversion for the page or region. It can correct a uniformly resized PDF because every length changed by the same factor. It cannot repair nonuniform scan distortion, a photographed page with perspective, a warped original, or different portions of a sheet stretched by different amounts.'
        },
        {
          kind: 'ul',
          items: [
            'Check a second span far from the calibration line, and check both horizontal and vertical references when the file is a scan.',
            'If one direction agrees and the other does not, do not average the error into a single scale. Obtain a better source or limit the work to a documented local region and state the limitation.',
            'Do not use the displayed zoom percentage as drawing scale. Zoom changes the on-screen size, not the PDF-space geometry used by measurement.',
            'Do not mix values from calibrated and uncalibrated pages. In PolyPDF 1.3.4, an uncalibrated page reports physical PDF points or square points rather than inventing a real-world scale.'
          ]
        }
      ]
    },
    {
      icon: 'check',
      title: 'A repeatable pre-takeoff checklist',
      body: [
        {
          kind: 'ol',
          items: [
            'Confirm the page and revision.',
            'Choose the stated-scale preset or draw a known calibration line.',
            'Verify the saved units and page-scale status.',
            'Measure a different known span.',
            'Check a second direction if the source is scanned.',
            'Create scale regions for differently scaled details.',
            'Only then trace lengths, areas, perimeters, or counts and export the worksheet.'
          ]
        },
        {
          kind: 'note',
          text:
            'The Free edition includes calibration and up to three hand-created measurements per document. Symbol Search auto-count is uncapped, so you can test a real counting workflow without consuming that manual-measurement allowance.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Can I set one PDF scale for every page?',
      answer:
        'You can copy a proven calibration to selected pages with Add Scale to More Pages, but PolyPDF stores scale per page. Copy it only when those sheets genuinely use the same scale.'
    },
    {
      question: 'Why should I measure a second known dimension?',
      answer:
        'The second span catches a misplaced endpoint, an incorrect typed value, the wrong units, or distortion that a single calibration line cannot reveal.'
    },
    {
      question: 'Can calibration fix a stretched or skewed scan?',
      answer:
        'Only uniform resizing can be corrected with one proportional scale. Nonuniform stretch, perspective, or local warping needs a better source file or a clearly limited local workflow.'
    },
    {
      question: 'Does zoom affect the measurement result?',
      answer:
        'No. Zoom changes how large the page looks on screen; PolyPDF calculates from PDF-space geometry and the saved page or scale-region calibration.'
    }
  ],
  relatedSlugs: [
    'why-pdf-measurements-are-wrong',
    'pdf-takeoff-worked-example',
    'measure-pdf-area-cutouts-depth'
  ],
  sources: [
    {
      label: 'PolyPDF: Measure PDF on Mac',
      url: 'https://www.polypdf.com/measure-pdf-on-mac'
    },
    {
      label: 'PolyPDF: PDF takeoff software',
      url: 'https://www.polypdf.com/pdf-takeoff-software'
    }
  ],
  cta: {
    eyebrow: 'Verify the scale on your own drawing',
    title: 'Try a real calibration before you commit to a takeoff',
    text:
      'PolyPDF runs on macOS and Windows. Calibration is included in Free, so you can check a real page and its second reference dimension first.',
    primaryLabel: 'Download PolyPDF Free',
    primaryHref: '/#download',
    secondaryLabel: 'See the measurement workflow',
    secondaryHref: '/measure-pdf-on-mac'
  }
};

export default post;
