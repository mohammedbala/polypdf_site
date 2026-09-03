import compareEditableCloudsImage from '../../assets/screenshots/compare-editable-clouds-v1-4-dark-web.png';

const comparePdfDrawingRevisionsGuide = {
  slug: 'compare-pdf-drawing-revisions',
  title: 'How to Compare PDF Drawing Revisions',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-09-03',
  author: 'The PolyPDF team',
  readingTime: '9 min read',
  tag: 'Review & Markup',
  excerpt:
    'Compare a baseline PDF with a revised file, review the detected regions, and issue a separate comparison record without overwriting the source.',
  metaTitle: 'How to Compare PDF Drawing Revisions | PolyPDF',
  metaDescription:
    'Compare two PDF drawing revisions in PolyPDF, prepare aligned source files, review detected change clouds, and verify the saved comparison record.',
  lede:
    'A visual diff can make a revision review faster, but only when the two files are actually comparable and every highlighted region is checked in drawing context.',
  quickAnswer:
    'For a focused visual diff, open the baseline PDF, choose Document > Compare Documents, select the revised PDF, and run Compare. PolyPDF opens a new comparison document and normally marks detected regions with editable violet revision clouds. First confirm sheet identity, page order, size, rotation, scale, and alignment. If a fallback warning says the marks are page content, they are not editable. For a complete drawing issue with sheet reconciliation, carried review work, impact review, references, and publication history, use a Revision Package instead.',
  lastVerified: '2026-09-03',
  productVersion: 'PolyPDF 1.5.0 (build 22); screenshot from 1.4.0 (build 17)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: compareEditableCloudsImage,
    alt: 'Dark-mode PolyPDF comparison result with four violet revision clouds, one selected cloud, full cloud style controls, and four visible Markup Table rows',
    caption:
      'PolyPDF 1.4.0 after comparing two revisions of a sample drawing: four violet revision clouds mark the regions that differ. One cloud is selected with its Line, Cloud, and Fill controls open, and every cloud has a matching row in the Markup Table.',
    width: 1710,
    height: 1073
  },
  keywords: [
    'compare PDF drawing revisions',
    'PDF drawing comparison',
    'revision cloud PDF',
    'construction drawing changes',
    'PDF visual diff',
    'compare two PDF files'
  ],
  sections: [
    {
      icon: 'shield',
      title: 'Confirm that the two PDFs are comparable',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF compares corresponding pages visually. It does not interpret sheet numbers or realign a reordered set. A page shift, different crop, rotation, plot scale, or scan skew can produce broad pixel differences that say nothing about the design.'
        },
        {
          kind: 'ul',
          items: [
            'Confirm that Document A is the intended baseline and Document B is the intended revision.',
            'Match sheet identity and page order. If a cover sheet was inserted, reorganize copies before comparison so like pages occupy the same positions.',
            'Check page dimensions, CropBox, and displayed rotation for each relevant sheet.',
            'Confirm that both files were plotted at the same drawing scale and from the same registration point.',
            'For scans, check skew, stretching, shadows, and capture resolution; those differences can dominate the visual result.',
            'Preserve the originals and work from named copies under your document-control procedure.'
          ]
        },
        {
          kind: 'note',
          text:
            'A comparison tool answers “which rendered regions differ?” It does not answer “which differences are approved, intentional, or contractually significant?”'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Run Compare Documents',
      body: [
        {
          kind: 'ol',
          items: [
            'Open the baseline PDF in PolyPDF. The current document becomes Document A.',
            'Choose Document > Compare Documents… and verify that the Current File card names the correct baseline.',
            'In Revised File, choose Browse and select Document B. The current workflow compares the full page sets.',
            'Choose Compare. PolyPDF renders and compares changed pages while reporting progress.',
            'Wait for the new comparison document to open. It receives its own tab and is not written back over the baseline.',
            'Read the completion status. It reports compared pages and marked changes, and warns if this run could not produce editable markups.',
            'Inspect every marked region in context, then save the comparison document under a new controlled name.'
          ]
        },
        {
          kind: 'p',
          text:
            'The default output is a copy of Document A with detected regions added. Unchanged pages are left as they were. Because the output opens as a new unsaved document, Save prompts for a location; closing it does not silently replace either source file.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Choose Compare Documents or a Revision Package',
      body: [
        {
          kind: 'table',
          caption: 'The two revision workflows solve different jobs',
          headers: ['Workflow', 'Use it when', 'What you receive'],
          rows: [
            [
              'Compare Documents',
              'You need a focused visual difference check between one baseline PDF and one revised PDF.',
              'A separate comparison PDF with editable revision clouds when the normal comparison path succeeds.'
            ],
            [
              'Revision Package',
              'A new drawing issue must be matched to an existing reviewed set and moved through a controlled package workflow.',
              'Reconciled sheet identity, carried review work, change and available quantity or cost impact review, references, publication records, and a revision report.'
            ]
          ]
        },
        {
          kind: 'p',
          text:
            'Compare Documents is the smaller tool: it answers where two rendered PDFs differ. A Revision Package coordinates an issue across its sheet set and keeps a portable history without changing the original source PDFs.'
        },
        {
          kind: 'link',
          href: '/revision-packages/',
          label: 'See the Revision Package workflow',
          text: 'Use the five-step 1.5 process for import, reconciliation, carried review work, impact review, references, and publication.'
        }
      ]
    },
    {
      icon: 'compare',
      title: 'Worked use case: four changes between two revisions',
      body: [
        {
          kind: 'p',
          text:
            'The example above compares a sample drawing against a revision containing four changes. Compare returned a one-page result carrying four editable revision clouds, and reopening that saved file in PolyPDF showed the same four clouds as selectable markups with four matching rows in the Markup Table.'
        },
        {
          kind: 'note',
          text:
            'A comparison result opens its tab before its markups finish loading, and the status line says so while annotations are still importing. On a large sheet set, wait for the Markup Table to fill before judging whether a run produced editable clouds.'
        },
        {
          kind: 'p',
          text:
            'In a project review, use the same method with a baseline and revised issue set. Open each cloud, look at the underlying geometry or text, and write a concise comment or status only after deciding what changed. A detected hatch, line, or label movement may be important; it may also be a plotting or alignment artifact.'
        },
        {
          kind: 'note',
          text:
            'Do not use the number of detected regions as a count of design decisions. One decision can create several separated pixel regions, and one broad alignment change can create a large region.'
        }
      ]
    },
    {
      icon: 'table',
      title: 'Understand editable clouds and the fallback',
      body: [
        {
          kind: 'table',
          caption: 'How to interpret the two comparison output paths',
          headers: ['Output path', 'What you can do', 'How to verify it'],
          rows: [
            [
              'Normal raster comparison',
              'Detected regions are ordinary editable revision-cloud markups that can be selected, commented on, recolored, filtered, or deleted.',
              'Select a cloud and confirm that it appears as a row in the Markup Table.'
            ],
            [
              'Coarse fallback',
              'Detected marks are baked into page content and are not editable markup objects.',
              'Read the warning in the completion status and confirm that the marks cannot be selected as Markup Table rows.'
            ]
          ]
        },
        {
          kind: 'p',
          text:
            'The fallback exists so a rasterization or diff failure can still return a derived comparison artifact instead of silently ending with nothing. Its result is useful as a visual aid, but it cannot support a markup-status workflow. If editability matters, rerun after checking the inputs and environment or create review markups manually.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Page-count and alignment edge cases',
      body: [
        {
          kind: 'p',
          text:
            'A baseline page missing from a shorter revision can be marked as a whole-page change. Pages found only in the revision contribute to the difference count, but Document A has no page on which to draw their cloud. Reconcile page counts separately.'
        },
        {
          kind: 'p',
          text:
            'When all or most of a sheet is highlighted, stop and diagnose alignment before reviewing details. Compare the sheet border, title block, known grid intersections, and a few stable dimensions. A small translation, changed crop, or different plot scale can make unchanged work appear revised throughout the page.'
        },
        {
          kind: 'ul',
          items: [
            'If page order differs, create aligned working copies and compare again.',
            'If size or scale differs, return to the source export when possible instead of interpreting a stretched raster.',
            'If a scanned page is skewed, correct the scan or treat the result as a manual visual review aid.',
            'If annotations differ but base content does not, decide whether annotation changes belong in the review scope.'
          ]
        }
      ]
    },
    {
      icon: 'export',
      title: 'Inspect and issue the comparison record',
      body: [
        {
          kind: 'ol',
          items: [
            'Review every region at a useful zoom and classify it as substantive change, expected annotation difference, or comparison artifact.',
            'For editable output, use clear comments and statuses in the Markup Table rather than relying on color alone.',
            'Check added and removed sheets outside the cloud count and reconcile the page lists.',
            'Save the comparison under a name that identifies both source revisions and the review date.',
            'Reopen the saved file in PolyPDF and, when it will be issued externally, in another expected PDF viewer.',
            'Verify that cloud appearances, editability expectations, comments, and source revision references survived the save.',
            'Distribute the comparison as a review record, not as a replacement for the approved revised drawing.'
          ]
        },
        {
          kind: 'p',
          text:
            'The defensible deliverable is not merely a PDF with colored clouds. It is a named comparison record whose source files are known, whose inputs were aligned, and whose detected regions were inspected by a responsible reviewer.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Does PDF comparison prove that a design change is valid?',
      answer:
        'No. It detects rendered differences. A qualified reviewer must decide whether each region is intentional, approved, relevant, or just a plotting or alignment artifact.'
    },
    {
      question: 'Does Compare Documents overwrite the original PDF?',
      answer:
        'No. PolyPDF opens the marked result as a separate new comparison document based on Document A. Save it under a new controlled name.'
    },
    {
      question: 'Are comparison revision clouds editable?',
      answer:
        'Normally yes: the raster comparison writes editable revision-cloud markups. If a coarse fallback is used, the completion status warns that the marks are part of the page and not editable.'
    },
    {
      question: 'When should I use a Revision Package instead?',
      answer:
        'Use a Revision Package when you are replacing a reviewed drawing issue and need to reconcile sheet identity, carry review work forward, inspect changes and available impacts, review references, and publish a controlled current package. Use Compare Documents for a focused visual diff between two PDFs.'
    },
    {
      question: 'Why is nearly the whole page marked as changed?',
      answer:
        'First check page identity, order, size, crop, rotation, scale, alignment, and scan skew. A geometric or plotting mismatch can create widespread pixel differences even when the design is largely unchanged.'
    }
  ],
  relatedSlugs: [
    'pdf-markup-table-rfi-punch-list',
    'count-pdf-symbols'
  ],
  sources: [
    {
      label: 'PolyPDF 1.5.0: Compare Documents, Revision Packages, and in-app guidance',
      note: 'The current distinction between a focused two-document comparison and the issue-wide Revision Package workflow, plus the comparison output paths and completion status described in this guide.'
    },
    {
      label: 'Sample revision pair used for the walkthrough',
      note: 'Compare detected four regions and wrote four editable revision clouds, each with its own Markup Table row when the saved result was reopened.'
    }
  ],
  cta: {
    title: 'Compare two revisions of your own drawing set',
    body:
      'Download PolyPDF for macOS or Windows, preserve both source PDFs, and run Compare Documents on aligned copies. Inspect every region before treating the result as a project record.',
    downloadSource: 'blog_compare_pdf_revisions',
    buySource: 'website_blog_compare_pdf_revisions',
    buyLabel: 'See license options'
  }
};

export default comparePdfDrawingRevisionsGuide;
