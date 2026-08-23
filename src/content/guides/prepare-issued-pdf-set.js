import issuedFinalScreenshot from '../../assets/screenshots/shot-issued-final-v1-4-light-web.png';
import headersFootersScreenshot from '../../assets/screenshots/shot-issued-headers-v1-4-light-web.png';
import batesScreenshot from '../../assets/screenshots/shot-issued-bates-v1-4-light-web.png';
import preflightScreenshot from '../../assets/screenshots/shot-issued-preflight-v1-4-light-web.png';

const captureProvenance = '';

const post = {
  slug: 'prepare-issued-pdf-set',
  title: 'How to Prepare an Issued PDF Set',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-23',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Document Production',
  excerpt:
    'Build a repeatable issue workflow with page labels, visible Bates identifiers, headers and footers, watermarks, preflight, and final-viewer checks.',
  metaTitle: 'How to Prepare an Issued PDF Set | PolyPDF',
  metaDescription:
    'Prepare an issued PDF set with page labels, Bates numbering, headers, footers, watermarks, preflight, and final-viewer verification in PolyPDF.',
  lede:
    'An issued set should tell a recipient what each page is, which issue it belongs to, and whether the file survived production intact. That takes a controlled sequence, not one large button press.',
  quickAnswer:
    'To prepare an issued PDF set, preserve the source files, define a manifest and naming rule, distinguish navigation page labels from visible Bates identifiers, then add headers, footers, watermarks, and Bates numbers to each working document. PolyPDF 1.4.0 does not expose a cross-file Batch Process, so continue any Bates sequence by recording the last number you confirmed and setting the next document’s start value manually. Run Accessibility & Preflight, inspect every output in a recipient-style viewer, and sign only after page-content changes are finished.',
  lastVerified: '2026-08-23',
  productVersion: 'PolyPDF 1.4.0 (build 17)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: issuedFinalScreenshot,
    alt: 'PolyPDF showing a five-sheet issue set with the Bates identifier ISSUED-IFC-0101 printed on sheet G-001',
    caption:
      'Sheet G-001 of a sample issue set, carrying the Bates identifier ISSUED-IFC-0101 in the footer after Apply.',
    provenance: captureProvenance,
    width: 1710,
    height: 1073
  },
  keywords: [
    'prepare issued PDF set',
    'Bates number PDF drawings',
    'add headers footers PDF',
    'issue PDF drawing set',
    'PDF preflight checklist'
  ],
  sections: [
    {
      icon: 'document',
      title: 'Start with an issue manifest and untouched sources',
      body: [
        {
          kind: 'p',
          text:
            'Before changing a PDF, record the expected files, order, issue status, page counts, and output names. Copy the sources into a working location and reserve a separate output folder. This makes a missing volume or unexpected page-count change visible before distribution.'
        },
        {
          kind: 'ul',
          items: [
            'Keep source, working, and issued files in distinct folders.',
            'Decide whether the issue identifier belongs in the filename, a visible header or footer, a Bates sequence, or more than one of those places.',
            'Record whether bookmarks, links, forms, attachments, layers, or signatures must survive.',
            'Do not modify an already signed PDF to make a new issue. Obtain an authorized unsigned source or follow the issuer’s re-signing process.'
          ]
        },
        {
          kind: 'note',
          text:
            'A backup is part of the workflow, not a recovery plan added after something goes wrong. Whole-document operations can affect every selected page.'
        }
      ]
    },
    {
      icon: 'table',
      title: 'Page labels, printed page numbers, and Bates numbers are not interchangeable',
      body: [
        {
          kind: 'table',
          caption: 'Three page-identification systems and their jobs',
          headers: ['Identifier', 'Where it lives', 'Best use'],
          rows: [
            ['PDF page label', 'Viewer navigation metadata', 'Names such as A-101 or iv in the page control'],
            ['Header or footer page number', 'Visible page content', 'Human-readable numbering on printed and viewed pages'],
            ['Bates number', 'Visible sequential identifier', 'A controlled cross-file sequence for issue or discovery tracking']
          ]
        },
        {
          kind: 'p',
          text:
            'A page label can help a viewer navigate to A-101 without changing the printed sheet. PolyPDF’s Headers & Footers fields support {page} for the physical page position and {label} for the existing page label. A Bates identifier is a separate visible sequence with a prefix, start number, digit count, suffix, placement, and styling.'
        },
        {
          kind: 'p',
          text:
            'Choose one authoritative scheme for each purpose. Printing a page label in the footer can be useful, but it does not turn that label into a cross-volume Bates sequence. Conversely, Bates numbering does not repair incorrect drawing-sheet labels or bookmarks.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Set headers and footers before other page-content operations',
      body: [
        {
          kind: 'figure',
          src: headersFootersScreenshot,
          alt: 'PolyPDF Headers and Footers dialog populated with issue text, page-label and page-number tokens, margins, and six position previews',
          caption:
            'Headers & Footers previews all six positions before you apply anything, so issue text can be checked against the title block first.',
          provenance: captureProvenance,
          width: 1710,
          height: 1073
        },
        {
          kind: 'p',
          text:
            'Open Document › Headers & Footers for each file that needs issue text. The dialog provides six positions, a page range, font and margin controls, and a preview. Use {page} or {label} exactly as documented; there is no {total} token, and an unsupported token prints literally.'
        },
        {
          kind: 'ul',
          items: [
            'Use the page stepper in the preview to inspect sheets with different sizes, rotations, or title-block positions.',
            'Keep issue text outside drawing and title-block content, and check the chosen margins on the smallest page.',
            'Apply headers and footers before certificate signing because they change page content.',
            'If the result is wrong, use the dialog’s Remove Headers & Footers action on the working copy rather than covering the text with another object.'
          ]
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Apply Bates numbers and watermarks document by document',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF 1.4.0 does not expose a cross-file Batch Process, so plan the issue one file at a time. Apply Bates numbering and any text watermark to a single working document, save a new output, check it, and only then calculate the starting number for the next file.'
        },
        {
          kind: 'figure',
          src: batesScreenshot,
          alt: 'PolyPDF Bates Numbering dialog set to prefix ISSUED-IFC, start number 101, four digits, and Footer Right placement',
          caption:
            'Prefix ISSUED-IFC, start number 101, four digits, footer right: the dialog previews ISSUED-IFC-0101 before you apply it to the document.',
          provenance: captureProvenance,
          width: 1710,
          height: 1073
        },
        {
          kind: 'ol',
          items: [
            'Open the first working PDF in manifest order and confirm its page count and intended page range.',
            'Open Bates Numbering and set the prefix, starting number, digit count, suffix, placement, page range, and styling required by the issue rule.',
            'Apply the number, save to the clean output folder under the manifest name, close it, and reopen the saved copy.',
            'Check the first and last Bates value. Record the last number you saw rather than relying only on the expected page count.',
            'Open the next working document and use the recorded last value plus one as its start. Repeat until every volume is accounted for.',
            'When a text watermark is required, apply it per document using the placement, opacity, rotation, font-size, color, and layer controls. Watermarks are text only; there is no logo-image watermark.',
            'Compare the completed output folder against the manifest before preflight and signing.'
          ]
        },
        {
          kind: 'formula',
          label: 'Continuous Bates sequence check',
          formula: 'expected next number = starting number + successfully numbered pages',
          explanation:
            'Use the last number observed in the reopened output, not an intended count, when setting the next document’s starting value.'
        },
        {
          kind: 'note',
          text:
            'There is no cross-file Batch Process in PolyPDF 1.4.0. If you need unattended multi-file production, run it through an organization-approved external workflow.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Preflight and verify in the order a recipient will encounter the set',
      body: [
        {
          kind: 'p',
          text:
            'Run Document › Accessibility & Preflight on each final candidate. PolyPDF reports 10 automated checks across five groups. Preflight is a screening tool, not PDF/UA certification and not a substitute for visual and contractual review.'
        },
        {
          kind: 'figure',
          src: preflightScreenshot,
          alt: 'PolyPDF Accessibility and Preflight results showing zero failures, two warnings, seven passes, and one informational result',
          caption:
            'Preflight reports 0 failures, 2 warnings, 7 passes, and 1 informational finding for this issue set. It is a screening check, not PDF/UA certification or approval to issue.',
          provenance: captureProvenance,
          width: 1710,
          height: 1073
        },
        {
          kind: 'ol',
          items: [
            'Open every output from the clean issue folder and confirm filename, page count, first page, and last page.',
            'Spot-check page labels, bookmarks, links, rotation, layers, forms, and attachments that should remain.',
            'Check the first and last Bates number in every file and the transition between files.',
            'Inspect headers, footers, and watermarks on portrait, landscape, and rotated sheets.',
            'Search for the issue identifier and print or export representative pages.',
            'Open the exact release files in a second viewer that resembles the recipient’s environment.',
            'Apply any required certificate signature only after these page-content checks, then verify the signed file without modifying it.'
          ]
        }
      ]
    },
    {
      icon: 'document',
      title: 'Worked use case: three-volume review issue',
      body: [
        {
          kind: 'p',
          text:
            'Consider an illustrative three-volume set containing 28, 31, and 15 pages. The issue manifest calls for “REVIEW” in the header, a centered text watermark, and Bates identifiers beginning at REV-000101. First, add and verify the header on each working file. Number the first volume REV-000101 through REV-000128, set the second to start at REV-000129, and set the third to start at REV-000160. Apply and inspect the watermark on each document separately.'
        },
        {
          kind: 'p',
          text:
            'If all 74 pages are numbered, the next unused value should be REV-000175. Arithmetic is not a substitute for looking: check the first and last value in each volume and the boundary between volumes. Run preflight, confirm the appearance in a recipient-style viewer, then sign if the issue procedure requires it.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'What is the difference between a PDF page label and a Bates number?',
      answer:
        'A page label is navigation metadata a viewer can display, such as A-101. A Bates number is a visible sequential identifier applied for controlled tracking. One does not automatically replace the other.'
    },
    {
      question: 'Can PolyPDF 1.4.0 process the whole issued set as a cross-file batch?',
      answer:
        'No user-facing Batch Process is exposed in build 17. Apply headers, footers, Bates numbers, and watermarks to each document, save separate outputs, and verify the sequence against the manifest.'
    },
    {
      question: 'How do I continue Bates numbering across several PDF files?',
      answer:
        'Verify the last number in the reopened output for one file, add one, and enter that value as the next file’s starting number. Record every boundary in the issue manifest.'
    },
    {
      question: 'Should I add a digital signature before or after numbering and watermarks?',
      answer:
        'After. Headers, footers, Bates numbers, and watermarks change page content and may be blocked by or invalidate a signature. Finish and verify page-content operations before signing.'
    }
  ],
  relatedSlugs: [
    'digital-signature-vs-visual-signature-vs-seal',
    'redact-and-sanitize-pdf',
    'compare-pdf-drawing-revisions'
  ],
  sources: [
    {
      label: 'Library of Congress: PDF 2.0, ISO 32000-2',
      url: 'https://www.loc.gov/preservation/digital/formats/fdd/fdd000474.shtml'
    },
    {
      label: 'PolyPDF 1.4.0 document-production behavior',
      note: 'Headers, footers, Bates numbering, text watermarks, and the 10-check Accessibility & Preflight screen are described as they behave in PolyPDF 1.4.0. A cross-file Batch Process is not exposed.'
    }
  ],
  cta: {
    title: 'Practice the issue sequence before the deadline',
    text:
      'Download PolyPDF for macOS or Windows and run a representative copy through per-document headers, numbering, watermarks, preflight, and recipient-viewer checks before producing the live issue.',
    downloadSource: 'blog_prepare_issued_set',
    buySource: 'website_blog_prepare_issued_set'
  }
};

export default post;
