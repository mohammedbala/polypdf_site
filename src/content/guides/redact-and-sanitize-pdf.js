import redactionSearchResultScreenshot from '../../assets/screenshots/redaction-reopened-search-no-matches-currentdev-dark-web.png';
import redactionBeforeScreenshot from '../../assets/screenshots/redaction-lab-before-currentdev-dark-web.png';
import redactionMarkedScreenshot from '../../assets/screenshots/redaction-marked-text-currentdev-dark-web.png';
import redactionConfirmationScreenshot from '../../assets/screenshots/redaction-apply-confirmation-currentdev-dark-web.png';
import redactionAppliedScreenshot from '../../assets/screenshots/redaction-applied-result-currentdev-dark-web.png';
import sanitizeOptionsScreenshot from '../../assets/screenshots/sanitize-options-currentdev-dark-web.png';
import sanitizeResultScreenshot from '../../assets/screenshots/sanitize-result-currentdev-dark-web.png';

const captureProvenance =
  'Captured August 19, 2026 in dark mode from an isolated native-maximized snapshot of the current PolyPDF development working tree: base commit a0a709c39e35343d3c71f7d615fedffb007db619 plus tracked product diff SHA-256 8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250. Each 1710 × 1073 image is an uncropped 50% derivative of its validated 3420 × 2146 Retina capture. The fixtures are synthetic and contain no personal or customer data.';

const post = {
  slug: 'redact-and-sanitize-pdf',
  title: 'How to Redact and Sanitize a PDF: Limits to Know',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '12 min read',
  tag: 'Document Security',
  excerpt:
    'Use PolyPDF redaction for supported searchable text, understand what sanitation can miss, and independently inspect the saved copy before release.',
  metaTitle: 'Redact and Sanitize a PDF: PolyPDF Limits',
  metaDescription:
    'Learn what PolyPDF 1.3.4 redaction and sanitation can remove, what can survive, and how to verify a saved PDF before deciding whether it is safe to share.',
  lede:
    'A black rectangle is not proof of redaction, and a completed sanitation command is not proof that every hidden object was found. PolyPDF 1.3.4 provides useful partial tools, but confidential release requires checks that match the content actually inside the PDF.',
  quickAnswer:
    'PolyPDF can remove a selected token when it is represented by a currently supported native text operator, but that result does not generalize to every PDF structure. In the controlled current-development example, CASE-ORCHID-742 disappeared from the saved file’s search and from independent text, QDF, and PyPDF extraction while a separate image remained. The current redactor refused the filtered and reusable Form-XObject variants. Sanitize removed this fixture’s JavaScript name tree and original metadata, then saving wrote new Producer and ModDate metadata; its direct FileAttachment and visible images survived. Use an approved specialist workflow whenever confidentiality depends on exhaustive removal.',
  lastVerified: '2026-08-19',
  productVersion: 'PolyPDF current-development snapshot (1.3.4 build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: redactionSearchResultScreenshot,
    alt: 'Maximized dark-mode PolyPDF reopened redaction result with a black box and Search showing no matches for CASE-ORCHID-742',
    caption:
      'After saving and reopening the controlled PDF, PolyPDF Search reports No matches for CASE-ORCHID-742 while the applied black region remains visible. Independent extraction also found zero copies of that one selected supported native-text token; the separate image on the page was retained.',
    width: 1710,
    height: 1073,
    provenance: captureProvenance
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
          kind: 'figure',
          src: redactionBeforeScreenshot,
          alt: 'Maximized dark-mode PolyPDF showing the synthetic native-text token CASE-ORCHID-742 before redaction and a separate raster sample below it',
          caption:
            'Before redaction, the supported fixture contains one direct, unfiltered native-text occurrence of CASE-ORCHID-742 and a separate raster image. This frame identifies the controlled target; it does not establish that anything has been removed yet.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'note',
          text:
            'A result that reports no text removed does not establish redaction, even when the page looks black. Stop and use an approved content-removing workflow for that material.'
        },
        {
          kind: 'table',
          caption: 'What the current verified workflow can establish by content type',
          headers: ['Content or structure', 'Current behavior', 'Required decision'],
          rows: [
            ['Supported searchable text operators', 'Can be removed when the marked region maps to the text-show operation', 'Confirm text was actually removed, then extract and search the saved copy'],
            ['Outlined or vector content', 'May remain under a black fill while the command completes', 'Do not treat the appearance as secure removal'],
            ['Raster or nested Form-XObject images', 'Some top-level image placements are detected; nested placements can evade that check', 'Use an image-aware, independently verified workflow'],
            ['Metadata and selected catalog structures', 'Sanitize targets specific structures exposed by its choices', 'Inspect the saved file; do not infer exhaustive cleanup'],
            ['Direct attachment or arbitrary action structures', 'The test FileAttachment survived; recursive JavaScript/action paths were not proven clean', 'Use structural inspection or a specialist sanitation process']
          ]
        },
        {
          kind: 'note',
          text:
            'The current redactor refused the original filtered content stream, then refused an uncompressed derivative because that page also drew text through a reusable Form XObject. The successful screenshots use a separate purpose-built fixture with one direct, unfiltered native-text target and no Form XObject. Do not generalize that success to the refused structures.'
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
          kind: 'figure',
          src: redactionMarkedScreenshot,
          alt: 'Maximized dark-mode PolyPDF with a redaction preview tightly marked over CASE-ORCHID-742',
          caption:
            'The Redact tool preview is tightly placed over the one supported native-text token. A marked region is only the requested operation; the underlying content has not yet been proven absent.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'figure',
          src: redactionConfirmationScreenshot,
          alt: 'Maximized dark-mode PolyPDF confirmation dialog for applying one marked redaction region',
          caption:
            'The confirmation dialog’s wording describes what PolyPDF is about to attempt for the marked region. It is UI wording, not proof of universal or saved-file removal.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'figure',
          src: redactionAppliedScreenshot,
          alt: 'Maximized dark-mode PolyPDF showing the applied black redaction region while the separate raster image remains visible',
          caption:
            'After Apply, the black region is visible and the separate raster sample remains on the page. This appearance alone is not saved-byte proof; the reopened search shown in the hero and the independent extraction checks provide the narrower evidence for the selected token.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'p',
          text:
            'For this one supported token, the exact saved file passed qpdf syntax checking and contained zero CASE-ORCHID-742 occurrences in pdftotext output, an uncompressed QDF byte search, and PyPDF extraction. Search failure alone still is not proof that every visible object was removed: a page can mix normal text operators, raster pixels, vector lettering, clipping paths, and reusable Form XObjects. The separate image remained in this fixture.'
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
          kind: 'figure',
          src: sanitizeOptionsScreenshot,
          alt: 'Maximized dark-mode PolyPDF Sanitize Document dialog with metadata, thumbnails, attachments, and JavaScript selected and form removal off',
          caption:
            'The current dialog defaults select metadata, thumbnails, attachments, and JavaScript/actions while leaving destructive form and signature-field removal off. These controls show the requested categories, not the saved PDF’s final object inventory.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'ul',
          items: [
            'In the controlled fixture, the nine original metadata entries were removed, but saving wrote new PolyPDF /Producer and /ModDate entries. Do not call the result metadata-free.',
            'The fixture’s catalog JavaScript name tree was removed. This run did not prove recursive removal from arbitrary annotation, form, outline, or nested action chains.',
            'The direct FileAttachment annotation and its embedded payload survived byte-for-byte even though attachment cleanup was selected.',
            'The top-level image, the image nested in a Form XObject, the Form XObject itself, and the page text remained. Sanitize Document is not a page-content redaction step.',
            'This fixture began with no EmbeddedFiles name tree, associated-file reference, page thumbnail, or AcroForm, so this run cannot validate removal of those structures. Form and signature-field removal also remained off.',
            'Keep the untouched source and save each candidate output under a distinct name so a partial cleanup does not replace the record copy.'
          ]
        },
        {
          kind: 'figure',
          src: sanitizeResultScreenshot,
          alt: 'Maximized dark-mode PolyPDF after Sanitize Document with a footer reporting metadata and one JavaScript action entry removed',
          caption:
            'The current UI reports “removed metadata and 1 JavaScript/action entry” for this run. Independent saved-file inspection narrows that result: the original metadata and JavaScript name tree were removed, new Producer and ModDate metadata were written on save, and the direct attachment plus both image paths remained.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'note',
          text:
            'The result message reports the command’s own count; it does not prove exhaustive object traversal. Base release decisions on the independently inspected saved file, not the dialog labels or completion status.'
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
            'The redaction screenshots use an owned disposable PDF with the single token CASE-ORCHID-742 as direct, unfiltered native text plus a separate raster sample. The first, more complex lab PDF was not silently simplified: PolyPDF refused its filtered content stream, and after decompression refused it again because the page drew text through a reusable Form XObject. A purpose-built supported fixture was used only to demonstrate the narrower native-text path.'
        },
        {
          kind: 'p',
          text:
            'After applying one region, the supported file was saved and reopened. PolyPDF Search reported No matches for the exact token, and independent pdftotext, QDF-byte, and PyPDF checks also returned zero while qpdf accepted the saved file. The separate image remained. This proves removal only for that selected native-text token on that fixture—not for filtered streams, Form XObjects, outlines, vectors, or image pixels.'
        },
        {
          kind: 'p',
          text:
            'The separate sanitation run used the complex synthetic lab PDF with nine original metadata entries, a JavaScript name tree, a direct FileAttachment annotation, one top-level image, and an image nested through a Form XObject. After save, the JavaScript name tree and original metadata were gone; PolyPDF had written new Producer and ModDate metadata, while the attachment payload and both image paths remained. This controlled comparison exposes the partial traversal without putting real confidential material at risk.'
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
        'No. In the controlled fixture, the JavaScript name tree was removed but the direct FileAttachment annotation and its payload survived unchanged. Recursive JavaScript/action paths in arbitrary annotation, form, outline, or nested structures were not proven clean. Inspect the saved PDF structurally.'
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
      label: 'PolyPDF current-development redaction and sanitation verification',
      note: 'Verified August 19, 2026 with synthetic fixtures, saved-file extraction, QDF inspection, PyPDF object inspection, and qpdf syntax checks. The successful redaction covers one selected supported native-text token only; the filtered and Form-XObject variants were refused.'
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
