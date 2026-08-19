import ocrScreenshot from '../../assets/screenshots/shot-ocr-complete-1.3.4-web.png';

const ocrCapture =
  'Live PolyPDF 1.3.4 (build 16) capture using an owned scan fixture. The dialog shows a completed best-effort OCR run at 100%; the window title still reads “OCR in Progress” in this build.';

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
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: ocrScreenshot,
    alt: 'PolyPDF OCR dialog at 100 percent with a best-effort searchable text layer notice',
    caption: ocrCapture,
    width: 800,
    height: 501
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
          src: ocrScreenshot,
          alt: 'Completed PolyPDF OCR progress dialog showing 100 percent',
          caption: ocrCapture,
          width: 800,
          height: 501
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
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked use case: find room notes in a scanned renovation set',
      body: [
        {
          kind: 'p',
          text:
            'Imagine a scanned renovation set where the phrase “existing to remain” appears throughout demolition notes. The source has no selectable text. Save a copy, run whole-document OCR, and reopen the recognized output. Search the full phrase, then the distinctive fragment “remain.” Review every hit on the page and manually visit two known notes that search did not return to estimate the miss pattern.'
        },
        {
          kind: 'p',
          text:
            'Use the results to navigate and place review markups, but do not turn the hit count into a demolition quantity. A missed phrase, broken word, or note embedded in poor linework can change the count. If a room number or dimension drives a scope decision, verify the characters against the scanned pixels and record the page reference with the markup.'
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
      label: 'Apple Vision: Recognizing text in images',
      url: 'https://developer.apple.com/documentation/vision/recognizing-text-in-images'
    },
    {
      label: 'Microsoft Learn: Optical character recognition',
      url: 'https://learn.microsoft.com/en-us/windows/ai/apis/text-recognition'
    },
    {
      label: 'PolyPDF 1.3.4 build 16 OCR verification',
      note: 'Verified with an owned scan fixture on August 18, 2026.'
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
