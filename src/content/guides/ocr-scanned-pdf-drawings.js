import ocrCompleteScreenshot from '../../assets/screenshots/ocr-uss-akron-complete-currentdev-dark-web.png';
import ocrNoTextBeforeScreenshot from '../../assets/screenshots/ocr-uss-akron-no-text-before-currentdev-dark-web.png';
import ocrSearchHitScreenshot from '../../assets/screenshots/ocr-uss-akron-search-hit-currentdev-dark-web.png';

const captureProvenance =
  'Captured in dark mode on August 19, 2026 from the exact current-development snapshot: base commit a0a709c39e35343d3c71f7d615fedffb007db619 with product diff SHA-256 8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250. The app identifies itself as PolyPDF 1.3.4 (build 16).';
const sourceProvenance =
  'The scan comes from a NACA U.S.S. Akron report in NASA NTRS (https://ntrs.nasa.gov/citations/19930091505); that record marks it Public and “Work of the US Gov. Public Use Permitted.”';
const accuracyCaveat =
  'OCR is best-effort: this run recognized useful text, but some small italic labels and dimension notation contain errors and still require comparison with the scanned pixels.';
const screenshotProvenance = `${sourceProvenance} ${captureProvenance} ${accuracyCaveat}`;

const noTextBeforeCaption =
  'Before OCR, the same SURFACE query returns “No matches” because this page is image-only.';
const ocrCompleteCaption =
  'The genuine whole-document OCR run has reached “OCR complete” at 100%; the dialog title still reads “OCR in Progress” in this snapshot. Completion proves the run finished, not that every character is correct.';
const searchHitCaption =
  'After saving, fully closing the app process, reopening the recognized PDF in a fresh process, and searching SURFACE, PolyPDF returns three result rows and highlights the selected occurrence in yellow on the page.';

const post = {
  slug: 'ocr-scanned-pdf-drawings',
  title: 'How to OCR Scanned PDF Drawings',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '8 min read',
  tag: 'Search & OCR',
  excerpt:
    'Add a best-effort searchable text layer to scanned PDF drawings, then test search results and verify every value that could affect field or estimating work.',
  metaTitle: 'OCR Scanned PDF Drawings: Practical Guide | PolyPDF',
  metaDescription:
    'Run local, best-effort OCR on scanned PDF drawings in PolyPDF, understand script limits, and verify searchable text before relying on the result.',
  lede:
    'OCR can turn a flat scan into a document you can search, but it does not turn uncertain pixels into authoritative text. The useful workflow is recognition, targeted testing, and manual verification of anything consequential.',
  quickAnswer:
    'To OCR a scanned PDF drawing in PolyPDF, save a working copy, choose Document › OCR, and let the whole-document recognition run finish. PolyPDF uses local operating-system OCR and adds a best-effort searchable layer where supported. In version 1.3.4, embedded searchable text is limited to Latin, Greek, and Cyrillic scripts, language availability depends on the computer’s OS and language packs, and there is no accuracy guarantee. Reopen the saved PDF, search representative terms, and visually verify critical dimensions, notes, and identifiers.',
  lastVerified: '2026-08-19',
  productVersion: 'PolyPDF current-development snapshot (1.3.4 build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: ocrSearchHitScreenshot,
    alt: 'Dark-mode PolyPDF search panel showing three SURFACE results and a selected highlight on the U.S.S. Akron engineering scan after OCR',
    caption: searchHitCaption,
    provenance: screenshotProvenance,
    width: 1710,
    height: 1073
  },
  keywords: [
    'OCR scanned PDF drawings',
    'make scanned PDF searchable',
    'construction drawing OCR',
    'search text in scanned PDF',
    'local PDF OCR Mac Windows'
  ],
  sections: [
    {
      icon: 'search',
      title: 'First confirm that the PDF actually needs OCR',
      body: [
        {
          kind: 'p',
          text:
            'Open the PDF and try to select a word with the text-selection tool. Then search for an obvious sheet title or note. If you can select individual characters and search already finds them, the page has a text layer; OCR may add duplicate or noisy text rather than help. If selection treats the page as one image and search returns nothing, it is a good OCR candidate.'
        },
        {
          kind: 'figure',
          src: ocrNoTextBeforeScreenshot,
          alt: 'Dark-mode PolyPDF search panel showing No matches for SURFACE before OCR on an image-only U.S.S. Akron engineering scan',
          caption: noTextBeforeCaption,
          provenance: screenshotProvenance,
          width: 1710,
          height: 1073
        },
        {
          kind: 'table',
          caption: 'What the first test tells you',
          headers: ['Observed page behavior', 'Likely source', 'Next step'],
          rows: [
            ['Words select and search correctly', 'Born-digital PDF with text', 'Use the existing layer; OCR is usually unnecessary'],
            ['The entire page behaves like an image', 'Scan or raster export', 'Run OCR on a copy'],
            ['Some notes select but others do not', 'Mixed vector text and images', 'Test carefully; OCR value may vary by page'],
            ['Text is selectable but incorrect', 'Existing low-quality OCR layer', 'Keep the source and compare results before replacing any workflow']
          ]
        },
        {
          kind: 'note',
          text:
            'OCR changes text discoverability, not the drawing geometry. It does not calibrate the sheet, validate dimensions, or prove that a note was recognized correctly.'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Run OCR in PolyPDF',
      body: [
        {
          kind: 'ol',
          items: [
            'Duplicate the source PDF or use Save As so the original scan remains untouched.',
            'Close unrelated large documents if the scan is long or image-heavy, then open the working copy.',
            'Choose Document › OCR. In PolyPDF 1.3.4, OCR starts for the current document; there is no page-range or language picker in this dialog.',
            'Keep the dialog open to watch progress, or close it if you want the run to continue in the background. Choose Cancel OCR when you need to stop; a cancelled run discards its result.',
            'Wait for the completion message before judging search. Large scans and construction sets can take time.',
            'Save the recognized document under a distinct filename, close it, and reopen that saved file.',
            'Search several terms from different pages and copy short passages into plain text to inspect recognition quality.'
          ]
        },
        {
          kind: 'figure',
          src: ocrCompleteScreenshot,
          alt: 'Dark-mode PolyPDF OCR dialog showing OCR complete at 100 percent over the U.S.S. Akron engineering scan',
          caption: ocrCompleteCaption,
          provenance: screenshotProvenance,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'document',
      title: 'Understand the language and script boundary',
      body: [
        {
          kind: 'p',
          text:
            'Recognition availability comes from the operating system and its installed language support, so the languages offered by one Mac or Windows computer may differ from another. PolyPDF’s embedded searchable layer in version 1.3.4 is limited to Latin, Greek, and Cyrillic scripts. The operating system may recognize text in additional scripts, but PolyPDF does not promise to embed those characters as a searchable layer in the PDF.'
        },
        {
          kind: 'ul',
          items: [
            'Treat mixed-script title blocks as a special review case.',
            'Install and enable the needed OS language support before the project starts, then test with a representative page.',
            'Do not infer that a displayed language name guarantees equal accuracy across fonts, scan quality, rotations, or handwritten notes.',
            'When PolyPDF reports that recognized text cannot be embedded, use any offered text export as a review aid, not as proof that the PDF itself is searchable in that script.'
          ]
        }
      ]
    },
    {
      icon: 'search',
      title: 'Verify the terms that matter to the job',
      body: [
        {
          kind: 'p',
          text:
            'A general search test can pass while the identifiers you need still fail. Build a small verification set from the document: a sheet number, a room name, a material abbreviation, a dimension, and a note containing punctuation. Search each value exactly, then try a distinctive fragment. Inspect both true hits and obvious locations the search missed.'
        },
        {
          kind: 'ul',
          items: [
            'Expect confusion between similar shapes such as O and 0, I and 1, S and 5, or decimal points and scan noise.',
            'Rotated notes, condensed fonts, faded diazo prints, skewed scans, and text crossing linework are harder inputs.',
            'Never copy an OCR-derived dimension, quantity, equipment tag, or specification value into downstream work without comparing it to the page image.',
            'Search results are a navigation aid. The visible drawing remains the source that must be reviewed.'
          ]
        },
        {
          kind: 'figure',
          src: ocrSearchHitScreenshot,
          alt: 'Reopened searchable U.S.S. Akron scan in dark-mode PolyPDF with three SURFACE results and a selected on-page highlight',
          caption: searchHitCaption,
          provenance: screenshotProvenance,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked use case: find “Surface of ship” on a scanned engineering drawing',
      body: [
        {
          kind: 'p',
          text:
            'The public NACA page shown here is a raster scan with no extractable text before OCR: searching SURFACE returns “No matches.” After the genuine whole-document OCR run, we saved the result, closed the exact app process, opened the saved PDF in a fresh process, and repeated the same search. PolyPDF returned three results and selected one “Surface of ship” occurrence on the drawing.'
        },
        {
          kind: 'p',
          text:
            'Independent text extraction from the saved PDF also found “REPORT NATIONAL ADVISORY COMMITTEE FOR AERONAUTICS,” “Surface of ship,” and “U.S. S. Akron.” That proves useful searchable text was embedded; it does not prove a perfect transcription. The same extraction includes errors in small italic labels and dimension notation, so use OCR hits for navigation and compare every consequential identifier, note, or measurement with the visible scan.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'What OCR does not establish',
      body: [
        {
          kind: 'ul',
          items: [
            'OCR is best-effort recognition, not a transcription warranty or drawing-validation service.',
            'A searchable text layer does not make the PDF accessible. Reading order, headings, alternative text, form labels, and other accessibility structure require separate review.',
            'OCR does not remove confidential pixels. If a scan must be redacted, use an image-aware redaction workflow and verify the output.',
            'Recognition runs locally through platform capabilities, but OS language availability and results can differ between computers.',
            'A completed progress bar proves the run finished; it does not prove that every word was found or embedded correctly.'
          ]
        },
        {
          kind: 'note',
          text:
            'For consequential work, define the acceptable use before running OCR: navigation and discovery are reasonable; unreviewed extraction of dimensions, quantities, or compliance language is not.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Does PolyPDF OCR run in the cloud?',
      answer:
        'PolyPDF uses local operating-system OCR rather than a PolyPDF cloud recognition service. Available languages can still depend on the OS and installed language packs.'
    },
    {
      question: 'Which scripts can PolyPDF embed as searchable PDF text?',
      answer:
        'In PolyPDF 1.3.4, the embedded searchable layer is limited to Latin, Greek, and Cyrillic scripts. Platform recognition may cover more scripts, but that does not mean PolyPDF can embed all of them in the PDF.'
    },
    {
      question: 'Can I choose a page range or OCR language?',
      answer:
        'Not in the version 1.3.4 OCR dialog. It starts a whole-document run and relies on platform recognition capabilities rather than exposing page-range and language controls.'
    },
    {
      question: 'Does OCR make a scanned PDF accessible?',
      answer:
        'No. Searchable text is one ingredient, but accessibility also depends on reading order, document structure, alternative text, form labeling, and human review.'
    }
  ],
  relatedSlugs: [
    'redact-and-sanitize-pdf',
    'pdf-markup-table-rfi-punch-list',
    'calibrate-pdf-drawing-scale'
  ],
  sources: [
    {
      label: 'NASA NTRS: NACA U.S.S. Akron engineering scan',
      url: 'https://ntrs.nasa.gov/citations/19930091505',
      note: 'The NASA record marks the report Public and states that it is a work of the U.S. government with public use permitted.'
    },
    {
      label: 'Apple Vision: Recognizing text in images',
      url: 'https://developer.apple.com/documentation/vision/recognizing-text-in-images'
    },
    {
      label: 'Microsoft Learn: Windows.Media.Ocr namespace',
      url: 'https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr'
    },
    {
      label: 'PolyPDF current-development OCR verification',
      note:
        'Verified August 19, 2026 with the public NACA scan in the exact snapshot at base commit a0a709c39e35343d3c71f7d615fedffb007db619 plus product diff SHA-256 8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250.'
    }
  ],
  cta: {
    title: 'Test OCR on a representative scan',
    text:
      'Download PolyPDF for macOS or Windows, run OCR on a non-sensitive copy, and test the exact sheet labels and notes your workflow needs to find.',
    downloadSource: 'blog_ocr_scanned_drawings',
    buySource: 'website_blog_ocr_scanned_drawings'
  }
};

export default post;
