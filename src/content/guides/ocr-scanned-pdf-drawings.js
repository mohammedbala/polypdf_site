import ocrCompleteScreenshot from '../../assets/screenshots/ocr-uss-akron-complete-v1-4-light-web.png';
import ocrNoTextBeforeScreenshot from '../../assets/screenshots/ocr-uss-akron-no-text-before-v1-4-light-web.png';
import ocrSearchHitScreenshot from '../../assets/screenshots/ocr-uss-akron-search-hit-v1-4-light-web.png';

const sourceProvenance =
  'The scan is a public-domain NACA report on the U.S.S. Akron from NASA’s technical reports server.';
const accuracyCaveat =
  'OCR is best effort, so check anything consequential against the scanned page.';
const screenshotProvenance = `${sourceProvenance} ${accuracyCaveat}`;

const noTextBeforeCaption =
  'Before OCR, the same SURFACE query returns “No matches” because this page is image-only.';
const ocrCompleteCaption =
  'The whole-document run has reached “OCR complete” at 100%, while the dialog title still reads “OCR in Progress.” Completion means the run finished, not that every character came through correctly.';
const searchHitCaption =
  'Searching SURFACE in the saved, reopened PDF returns three results and highlights the selected one in yellow on the drawing. The recognized text is saved into the PDF, so the search still works after closing and reopening the file.';

const post = {
  slug: 'ocr-scanned-pdf-drawings',
  title: 'How to OCR Scanned PDF Drawings',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-09-03',
  author: 'The PolyPDF team',
  readingTime: '8 min read',
  tag: 'Search & OCR',
  excerpt:
    'Add a best-effort searchable text layer to scanned PDF drawings, then test search results and verify every value that could affect field or estimating work.',
  metaTitle: 'OCR Scanned PDF Drawings: Practical Guide | PolyPDF',
  metaDescription:
    'Run local AEC OCR on scanned PDF drawings, verify searchable text, and export best-effort schedules and tables to an Excel workbook.',
  lede:
    'OCR can turn a flat scan into a document you can search, but it does not turn uncertain pixels into authoritative text. The useful workflow is recognition, targeted testing, and manual verification of anything consequential.',
  quickAnswer:
    'To OCR a scanned PDF drawing in PolyPDF 1.5, save a working copy, choose Document › OCR, and let the whole-document recognition run finish. PolyPDF uses local OCR, adds a best-effort searchable layer where supported, and analyzes AEC structure such as schedules, title blocks, drawing labels, and dimensions. Export recognized tables from File › Export › Excel Workbook (Tables + Text)… while that OCR session is still open. Reopen the saved PDF, search representative terms, and visually verify every critical value.',
  lastVerified: '2026-09-03',
  productVersion: 'PolyPDF 1.5.0 (build 22); screenshots from 1.4.0 (build 17)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: ocrSearchHitScreenshot,
    alt: 'PolyPDF search panel showing three SURFACE results and a selected highlight on the U.S.S. Akron engineering scan after OCR',
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
          alt: 'PolyPDF search panel showing No matches for SURFACE before OCR on an image-only U.S.S. Akron engineering scan',
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
            'OCR changes text discoverability, not the drawing geometry. It does not calibrate the sheet, validate dimensions, or confirm that a note was recognized correctly.'
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
            'Choose Document › OCR. OCR starts for the current document; the current dialog does not offer a page-range or language picker.',
            'Keep the dialog open to watch progress, or close it if you want the run to continue in the background. Choose Cancel OCR when you need to stop; a cancelled run discards its result.',
            'Wait for the completion message before judging search. Large scans and construction sets can take time.',
            'Save the recognized document under a distinct filename, close it, and reopen that saved file.',
            'Search several terms from different pages and copy short passages into plain text to inspect recognition quality.'
          ]
        },
        {
          kind: 'figure',
          src: ocrCompleteScreenshot,
          alt: 'PolyPDF OCR dialog showing OCR complete at 100 percent over the U.S.S. Akron engineering scan',
          caption: ocrCompleteCaption,
          provenance: screenshotProvenance,
          width: 1710,
          height: 1073
        }
      ]
    },
    {
      icon: 'table',
      title: 'Review AEC structure and export tables before closing the session',
      body: [
        {
          kind: 'p',
          text:
            'Since PolyPDF 1.4.4, OCR also builds a current-session model of likely schedules, title-block fields, drawing and detail labels, dimensions, regions, rows, and cells. This is useful for review and spreadsheet handoff, but it is still inferred from page pixels and selectable text—not an authoritative schedule database.'
        },
        {
          kind: 'table',
          caption: 'What survives and what needs an explicit export',
          headers: ['Result', 'Where it lives', 'What to do'],
          rows: [
            ['Searchable text layer', 'Saved into the PDF where supported', 'Save, close, reopen, and search representative terms'],
            ['Recognized AEC tables and fields', 'Current open-document OCR session', 'Review the rows and cells, then export before closing or structurally reloading the document'],
            ['Excel workbook', 'A separate .xlsx file you choose', 'Open it in a spreadsheet app and compare consequential cells with the drawing']
          ]
        },
        {
          kind: 'ol',
          items: [
            'Finish the OCR run and inspect the recognized table names, headings, rows, and dimensions.',
            'Choose File › Export › Excel Workbook (Tables + Text)… while the recognized document session remains open.',
            'Save the workbook under a name tied to the source drawing and issue.',
            'Open the workbook and compare critical quantities, dimensions, tags, and schedule cells with the visible PDF.',
            'Treat merged cells, faint rules, handwriting, rotated labels, and dense linework as high-risk review areas.'
          ]
        },
        {
          kind: 'note',
          text:
            'The structured table model is session data. Saving and reopening preserves the searchable PDF layer, but you should not assume the inferred table model will still be available unless you run OCR again. Export the workbook before closing the session.'
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
            'Recognition availability comes from the operating system and its installed language support, so the languages offered by one Mac or Windows computer may differ from another. PolyPDF’s current embedded searchable layer is limited to Latin, Greek, and Cyrillic scripts. The operating system may recognize text in additional scripts, but PolyPDF does not promise to embed those characters as a searchable layer in the PDF.'
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
          alt: 'Reopened searchable U.S.S. Akron scan in PolyPDF with three SURFACE results and a selected on-page highlight',
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
            'The NACA page shown here is a raster scan with no extractable text before OCR: searching SURFACE returns “No matches.” After the whole-document run finished, we saved the result, quit PolyPDF, reopened the saved PDF, and repeated the same search. PolyPDF returned three results and selected one “Surface of ship” occurrence on the drawing.'
        },
        {
          kind: 'p',
          text:
            'Copying text out of the saved PDF returns “REPORT NATIONAL ADVISORY COMMITTEE FOR AERONAUTICS,” “Surface of ship,” and “U.S. S. Akron.” The same text also contains errors in small italic labels and dimension notation, so use OCR hits for navigation and compare every consequential identifier, note, or measurement with the visible scan.'
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
            'A completed progress bar means the run finished. It does not mean that every word was found or embedded correctly.'
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
        'In the current release, the embedded searchable layer is limited to Latin, Greek, and Cyrillic scripts. Platform recognition may cover more scripts, but that does not mean PolyPDF can embed all of them in the PDF.'
    },
    {
      question: 'Can I choose a page range or OCR language?',
      answer:
        'Not in the current OCR dialog. It starts a whole-document run and relies on platform recognition capabilities rather than exposing page-range and language controls.'
    },
    {
      question: 'Can PolyPDF export an OCR schedule to Excel?',
      answer:
        'Yes. After OCR builds its current-session AEC structure, choose File › Export › Excel Workbook (Tables + Text)…. Review the resulting rows and cells against the drawing; OCR and table reconstruction are best effort.'
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
      label: 'PolyPDF 1.5: local AEC OCR and table export',
      note:
        'AEC structure and Excel export were introduced in 1.4.4. The embedded searchable layer covers Latin, Greek, and Cyrillic scripts, and language availability depends on the computer’s operating system and installed support.'
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
