import sanitizeScreenshot from '../../assets/screenshots/shot-sanitize-1.3.4-web.png';

const sanitizeCapture =
  'Live PolyPDF 1.3.4 (build 16) capture using an owned test fixture. The dialog shows the sanitation choices before processing; it does not prove which objects were removed from a saved file.';

const post = {
  slug: 'redact-and-sanitize-pdf',
  title: 'How to Redact and Sanitize a PDF: Limits to Know',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Document Security',
  excerpt:
    'Use PolyPDF redaction for supported searchable text, understand what sanitation can miss, and independently inspect the saved copy before release.',
  metaTitle: 'Redact and Sanitize a PDF: PolyPDF Limits',
  metaDescription:
    'Learn what PolyPDF 1.3.4 redaction and sanitation can remove, what can survive, and how to verify a saved PDF before deciding whether it is safe to share.',
  lede:
    'A black rectangle is not proof of redaction, and a completed sanitation command is not proof that every hidden object was found. PolyPDF 1.3.4 provides useful partial tools, but confidential release requires checks that match the content actually inside the PDF.',
  quickAnswer:
    'PolyPDF 1.3.4 can remove text it maps to supported PDF text-show operators and can clean selected document-level structures, but it does not establish complete redaction or sanitation for every PDF. Vector or outlined content can remain under a black fill, images nested in Form XObjects can evade image-overlap detection, and some direct file-attachment or JavaScript action structures can survive Sanitize Document. Work on a copy, treat a “no text removed” result as a failed redaction, independently inspect the saved bytes, and use an approved specialist workflow when confidentiality depends on complete removal.',
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: sanitizeScreenshot,
    alt: 'PolyPDF Sanitize Document dialog showing selectable cleanup categories before processing',
    caption: sanitizeCapture,
    width: 800,
    height: 501
  },
  keywords: [
    'redact PDF safely',
    'sanitize PDF metadata',
    'remove hidden data from PDF',
    'PDF redaction limitations',
    'PDF redaction verification'
  ],
  sections: [
    {
      icon: 'shield',
      title: 'Know exactly what the current tools establish',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF redaction and Sanitize Document address different structures, and neither is a universal scrubber. Redaction can rewrite supported searchable text operators that intersect a marked region. When no supported text is removed, the engine can still place a black fill over the region and complete the operation. Vector outlines, text converted to paths, and other graphics may therefore remain in the file beneath the appearance.'
        },
        {
          kind: 'note',
          text:
            'A result that reports no text removed does not establish redaction, even when the page looks black. Stop and use an approved content-removing workflow for that material.'
        },
        {
          kind: 'table',
          caption: 'What PolyPDF 1.3.4 can establish by content type',
          headers: ['Content or structure', 'Current behavior', 'Required decision'],
          rows: [
            ['Supported searchable text operators', 'Can be removed when the marked region maps to the text-show operation', 'Confirm text was actually removed, then extract and search the saved copy'],
            ['Outlined or vector content', 'May remain under a black fill while the command completes', 'Do not treat the appearance as secure removal'],
            ['Raster or nested Form-XObject images', 'Some top-level image placements are detected; nested placements can evade that check', 'Use an image-aware, independently verified workflow'],
            ['Metadata and selected catalog structures', 'Sanitize targets specific structures exposed by its choices', 'Inspect the saved file; do not infer exhaustive cleanup'],
            ['Direct attachment or arbitrary action structures', 'Some FileAttachment and JavaScript/action locations can survive', 'Use structural inspection or a specialist sanitation process']
          ]
        }
      ]
    },
    {
      icon: 'steps',
      title: 'A conservative workflow for supported searchable text',
      body: [
        {
          kind: 'ol',
          items: [
            'Duplicate the source PDF and keep the original where the working process cannot overwrite it.',
            'Confirm the target is ordinary searchable text by finding and selecting it. If it is a scan, image, outline, or vector path, do not use this workflow as proof of removal.',
            'Choose the Redact tool and draw a tight region around each supported text item. Review repeated names, headers, footers, and similar pages before applying anything.',
            'Apply the redactions and read the result. A refusal, error, or “no text removed” outcome means removal was not established; do not rely on the black appearance.',
            'Save under a new candidate filename, close it, and reopen that exact saved file.',
            'Search and extract text from the whole saved file. Try selecting and copying across the former region and inspect it in a second recipient-style viewer.',
            'For confidential, regulated, privileged, or legally sensitive content, follow the organization’s approved redaction and inspection process even when these checks pass.'
          ]
        },
        {
          kind: 'p',
          text:
            'Search failure alone is not proof that visible content was removed. A page can mix normal text operators, raster pixels, vector lettering, clipping paths, and reusable Form XObjects. The searchable layer might disappear while an image or outline remains, or the page may look covered while recoverable vector commands remain in the file.'
        }
      ]
    },
    {
      icon: 'warning',
      title: 'Treat images, outlines, and nested graphics as a separate problem',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF checks detected top-level image placements before applying a redaction, but that detection does not recurse through every nested Form XObject. An image embedded inside reusable form content can therefore evade the overlap check. Text converted to outlines is vector artwork, not a supported text-show operation, and may also remain beneath the fill.'
        },
        {
          kind: 'ul',
          items: [
            'Do not infer content type from appearance. Searchability is useful evidence, but it does not reveal every nested object.',
            'Do not flatten, rasterize, print, or cover a page and assume that step alone meets a security or records requirement.',
            'For a scanned page or image-based identifier, use an approved image-aware redaction tool and verify the resulting pixels and PDF structure.',
            'For outlined or vector lettering, require a process that removes or replaces the underlying drawing commands rather than adding an opaque shape.',
            'If you cannot independently inspect the final file, do not release sensitive material based on the PolyPDF result alone.'
          ]
        },
        {
          kind: 'note',
          text:
            'A second viewer is useful for visual interoperability, but it is not a forensic inspection tool. Confidential release may require text extraction, object inspection, and an approved review record.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Use Sanitize Document as a scoped cleanup pass',
      body: [
        {
          kind: 'p',
          text:
            'The build 16 dialog offers separate choices for document metadata and XMP packets, page thumbnails, attachments, JavaScript/actions, and optional form or signature-field removal. Those labels describe the requested categories, not a guarantee that every possible location in the PDF object graph is traversed.'
        },
        {
          kind: 'ul',
          items: [
            'Metadata cleanup targets the document information dictionary and XMP structures handled by the command. Reopen the output and inspect properties again.',
            'Attachment cleanup can remove name-tree and selected associated-file references, but a direct FileAttachment annotation with its own embedded-file reference can survive.',
            'JavaScript cleanup targets known name-tree, catalog, and page locations, but arbitrary annotation, form, outline, or nested additional-action entries can survive.',
            'Form and signature-field removal is destructive and optional. Use it only when interactivity and those fields are intentionally being discarded.',
            'Keep the untouched source and save each candidate output under a distinct name so a partial cleanup does not replace the record copy.'
          ]
        },
        {
          kind: 'note',
          text:
            'The screenshot above proves which choices the dialog presents. It does not prove what any particular saved file contains after processing.'
        }
      ]
    },
    {
      icon: 'search',
      title: 'Verify the saved bytes, not the completion message',
      body: [
        {
          kind: 'p',
          text:
            'Close and reopen the exact candidate file so every check is based on saved bytes rather than the in-memory view. A complete review follows the information through more than one surface: rendered pages, searchable text, document properties, embedded-file structures, annotations, form fields, bookmarks, links, and actions.'
        },
        {
          kind: 'ul',
          items: [
            'Search for the full sensitive values and useful fragments, then run independent text extraction against every page.',
            'Inspect at high zoom and in a second PDF viewer, including print or export output when recipients use those paths.',
            'Use an approved structural inspection tool to inventory embedded files and inspect annotation, form, outline, and additional-action entries.',
            'Confirm page count, bookmarks, links, forms, signatures, layers, and print appearance still match the release requirements.',
            'Record the input filename or hash, output filename, reviewer, date, tool versions, and checks performed when the process requires an audit trail.'
          ]
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked use case: validate the workflow on a non-sensitive fixture',
      body: [
        {
          kind: 'p',
          text:
            'Create or use an owned disposable PDF containing a fake name and phone number as ordinary searchable text, a second copy of the same words converted to vector outlines, a small image containing the number, normal author metadata, a name-tree attachment, and a direct FileAttachment annotation. Keep a written inventory of every test object.'
        },
        {
          kind: 'p',
          text:
            'Mark the searchable instance, apply redaction, and confirm the result reports actual text removal. Save, reopen, search, extract, and inspect. Treat the outlined and image instances as failures for this workflow even if they look covered. Then run Sanitize Document with the relevant choices, save again, and inspect both attachment forms plus the action inventory. This controlled test makes the limits visible without putting real confidential material at risk.'
        },
        {
          kind: 'note',
          text:
            'This exercise is a product-capability test, not authorization to use PolyPDF as the sole redaction or sanitation control for sensitive documents.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Does drawing a black box permanently redact a PDF?',
      answer:
        'No. An opaque appearance can leave searchable text, vector paths, outlined lettering, or image pixels in the file. Confirm that supported text was actually removed and use a content-appropriate inspection process.'
    },
    {
      question: 'Can PolyPDF redact text inside a scanned page image?',
      answer:
        'Do not rely on it for that purpose. PolyPDF detects some top-level image overlaps, but nested Form-XObject images can evade the check, and the tool does not establish pixel removal. Use an approved image-aware workflow.'
    },
    {
      question: 'Does Sanitize Document remove every attachment and script?',
      answer:
        'No. It cleans selected known structures, but direct FileAttachment annotations and JavaScript or actions in arbitrary annotation, form, outline, or nested additional-action locations can survive. Inspect the saved PDF structurally.'
    },
    {
      question: 'Should I redact a digitally signed PDF?',
      answer:
        'Changing page content can invalidate a signature or be blocked by the file. Obtain an authorized unsigned source, complete the approved removal workflow, verify the new issue, and sign only after content changes are finished.'
    }
  ],
  relatedSlugs: [
    'ocr-scanned-pdf-drawings',
    'prepare-issued-pdf-set',
    'digital-signature-vs-visual-signature-vs-seal'
  ],
  sources: [
    {
      label: 'NIST SP 800-122: Guide to Protecting the Confidentiality of Personally Identifiable Information',
      url: 'https://csrc.nist.gov/pubs/sp/800/122/final'
    },
    {
      label: 'PolyPDF 1.3.4 build 16 implementation and behavior audit',
      note: 'Limits verified against the shipped implementation and owned behavior fixtures on August 18, 2026.'
    }
  ],
  cta: {
    title: 'Practice only on a non-sensitive fixture first',
    text:
      'Download PolyPDF for macOS or Windows to test supported-text redaction and scoped sanitation on a disposable file. Do not use the app as the sole release control when confidentiality depends on complete removal.',
    downloadSource: 'blog_redact_sanitize',
    buySource: 'website_blog_redact_sanitize'
  }
};

export default post;
