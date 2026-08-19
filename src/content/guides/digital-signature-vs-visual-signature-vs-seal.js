import certificatePanelScreenshot from '../../assets/screenshots/signature-valid-certificate-currentdev-dark-web.png';
import certificateTechnicalScreenshot from '../../assets/screenshots/signature-certificate-technical-currentdev-dark-web.png';
import visualSignatureChooserScreenshot from '../../assets/screenshots/signature-visual-chooser-currentdev-dark-web.png';
import visualSignatureStylesScreenshot from '../../assets/screenshots/signature-visual-styles-currentdev-dark-web.png';
import sealBuilderWarningScreenshot from '../../assets/screenshots/signature-seal-builder-warning-currentdev-dark-web.png';
import sealInsertedScreenshot from '../../assets/screenshots/signature-seal-inserted-currentdev-dark-web.png';

const captureProvenance =
  'Captured August 19, 2026 in dark mode from an isolated native-maximized snapshot of the current PolyPDF development working tree: base commit a0a709c39e35343d3c71f7d615fedffb007db619 plus tracked product diff SHA-256 8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250. Each 1710 × 1073 image is an uncropped 50% derivative of its validated 3420 × 2146 Retina capture. All documents, identities, numbers, seals, and reviewer labels are controlled generator/test-fixture values; no customer or live workspace data is shown.';

const post = {
  slug: 'digital-signature-vs-visual-signature-vs-seal',
  title: 'Digital vs Visual PDF Signatures vs Professional Seals',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '11 min read',
  tag: 'Signatures & Seals',
  excerpt:
    'Understand what certificate-backed PDF signatures verify, what visual signature marks cannot prove, and why a professional seal graphic is drafting artwork until separately signed.',
  metaTitle: 'Digital vs Visual PDF Signatures and Seals | PolyPDF',
  metaDescription:
    'Compare certificate-backed PDF signatures, visual marks, and professional seal artwork, including integrity, trust, limits, and a safe issue order.',
  lede:
    'A signature appearance, a cryptographic signature, and a professional seal can look related on a drawing, but they answer different questions. Confusing them can leave a polished page with no verifiable integrity—or a valid signature attached to an untrusted identity.',
  quickAnswer:
    'A certificate-backed PDF signature uses a Digital ID and CMS data to test signed byte ranges; a visual signature is only a page appearance; and a Professional Seal Maker graphic is drafting artwork. In the controlled current-development example below, a reopened self-signed certificate reports Valid With Changes because its byte ranges and CMS signature are valid and the later update is permitted by DocMDP level 3. Trust exists only because that test identity was configured in the isolated profile, while timestamp, long-term validation, and revocation evidence are missing.',
  lastVerified: '2026-08-19',
  productVersion: 'PolyPDF current-development snapshot (1.3.4 build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: certificatePanelScreenshot,
    alt: 'Maximized dark-mode PolyPDF Signatures panel showing the reopened synthetic certificate signature as Valid With Changes with level 3 permissions',
    caption:
      'After save and reopen, the Signatures panel reports Valid With Changes for the synthetic PolyPDF Automation Signer. The signed byte ranges remain intact, while the file contains later incremental changes permitted by its certified level 3 policy. The visible “Mohammed,” “QA,” and “Legal” labels are literal values generated in the owned form fixture—not customer names or a live reviewer roster.',
    width: 1710,
    height: 1073,
    provenance: captureProvenance
  },
  keywords: [
    'digital signature vs visual signature PDF',
    'PDF certificate signature',
    'professional seal PDF',
    'verify PDF signature integrity',
    'electronic seal drawing workflow'
  ],
  sections: [
    {
      icon: 'table',
      title: 'Three marks, three different claims',
      body: [
        {
          kind: 'table',
          caption: 'What each PolyPDF option does and does not establish',
          headers: ['Option', 'What it provides', 'What it does not prove'],
          rows: [
            ['Certificate-backed signature', 'Cryptographic integrity check over signed PDF byte ranges', 'Automatic trust in the signer, authority, or legal effect'],
            ['Visual signature', 'A visible name or drawn/saved signature appearance', 'Cryptographic integrity or certificate identity'],
            ['Professional seal graphic', 'Jurisdiction-specific drafting artwork generated from entered details', 'A cryptographic signature, board approval, or permission to seal the document']
          ]
        },
        {
          kind: 'p',
          text:
            'Choose based on what the recipient must verify. A visual appearance may satisfy a presentation requirement. To detect whether protected bytes changed, use a certificate-backed signature. When a professional seal is required, review its artwork under the applicable board’s rules, then sign separately if cryptographic integrity is also required.'
        },
        {
          kind: 'note',
          text:
            'This guide explains product behavior, not whether a mark satisfies a contract, statute, licensing board, or court. Confirm those requirements with the responsible authority.'
        }
      ]
    },
    {
      icon: 'signature',
      title: 'Certificate signatures: integrity first, trust second',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF uses a Digital ID to create a CMS signature over defined PDF byte ranges. A verifier recalculates the digest and compares it with the signed data. If the bytes no longer match, integrity fails. This differs from inspecting a checkmark or signer name drawn on the page.'
        },
        {
          kind: 'figure',
          src: certificateTechnicalScreenshot,
          alt: 'Maximized dark-mode PolyPDF Signatures panel with the synthetic certificate technical details expanded',
          caption:
            'The expanded result shows a valid byte range, CMS digest, CMS signature, and certificate for this file. It also says the timestamp, timestamp trust, LTV, and revocation evidence are missing, and that the signature covers an earlier revision rather than every saved byte.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'p',
          text:
            'Integrity and trust are separate. In this controlled example, Trust Status is Trusted only because the self-signed PolyPDF Automation Signer identity was explicitly configured in the isolated test profile. That is not public certificate-authority trust or a universal identity endorsement. A recipient’s decision can depend on its own trust anchors, certificate chain, policy, signing authority, signing time, and revocation evidence.'
        }
      ]
    },
    {
      icon: 'signature',
      title: 'Visual signatures: useful appearance, no cryptographic proof',
      body: [
        {
          kind: 'figure',
          src: visualSignatureChooserScreenshot,
          alt: 'Maximized dark-mode PolyPDF Apply Signature dialog showing a saved visual signature appearance',
          caption:
            'The current Apply Signature dialog is in Visual Signature mode with a saved appearance selected. This chooser controls what is drawn on the page; it does not create a certificate-backed CMS signature.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'p',
          text:
            'Visual mode can place a saved signature, a standard style, or a drawn mark. That may suit an internal approval or a process where another system records identity and consent. It does not create a CMS signature and cannot tell a later viewer whether page bytes changed.'
        },
        {
          kind: 'figure',
          src: visualSignatureStylesScreenshot,
          alt: 'Maximized dark-mode PolyPDF Apply Signature dialog showing Standard, Classic, Flourish, Handwritten, and Formal visual styles',
          caption:
            'Standard, Classic, Flourish, Handwritten, and Formal are visual style choices. Their appearance does not identify a certificate holder or prove that the PDF bytes remained unchanged.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'ul',
          items: [
            'Do not describe a visual mark as digitally signed merely because it looks like handwriting or includes a date.',
            'A screenshot of a visual signature is not stronger evidence than the mark itself.',
            'If integrity matters, pair the final visual layout with a certificate-backed signing step or the organization’s approved signing platform.',
            'Legal effect depends on context and governing rules; cryptographic capability alone does not decide enforceability.'
          ]
        }
      ]
    },
    {
      icon: 'seal',
      title: 'Professional seals: controlled artwork with professional responsibility',
      body: [
        {
          kind: 'p',
          text:
            'The current-development Professional Seal Maker validation package asks for a profession, jurisdiction, and template fields, then inserts an image-stamp annotation. It is a drafting aid, not a public-build availability promise: its template set remains gated pending human jurisdiction-by-jurisdiction compliance review. The seal has no certificate signature and does not prove who placed it, current licensure, or whether that jurisdiction permits the specific use.'
        },
        {
          kind: 'figure',
          src: sealBuilderWarningScreenshot,
          alt: 'Maximized dark-mode PolyPDF Professional Seal Maker showing a fictional TEST NOT VALID California civil seal and its artwork-only warning',
          caption:
            'Development-only evidence from the pending-review Professional Seal Maker package. The builder uses deliberately fictional TEST NOT VALID data and license number 00000000. Its own warning says the output is graphic artwork—not a cryptographic signature—and that license status and board compliance are not verified.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'figure',
          src: sealInsertedScreenshot,
          alt: 'Maximized dark-mode PolyPDF showing the fictional TEST NOT VALID seal selected on a synthetic seal test sheet',
          caption:
            'Development-only evidence from the pending-review package: the exact fictional TEST NOT VALID graphic is inserted and selected on a purpose-built synthetic sheet. This frame proves editable visual placement only; it does not prove public availability, a license, authority to seal, board compliance, or a digital signature.',
          width: 1710,
          height: 1073,
          provenance: captureProvenance
        },
        {
          kind: 'ul',
          items: [
            'Compare spelling, license number, profession, jurisdiction, and any dates against the professional’s authoritative records.',
            'Check current licensing-board rules for appearance, size, wording, electronic sealing, responsible control, and permitted documents.',
            'Keep the seal editable while drafting, then finish all page-content changes before certificate signing.',
            'Treat any handoff from the plugin to the Digital ID workflow as a separate operation: the signature may protect the finished bytes, but it does not retroactively certify the template’s legal compliance.'
          ]
        },
        {
          kind: 'note',
          text:
            'A seal graphic can be visually accurate and still be used improperly. The licensed professional whose identity appears on it is responsible for the decision to apply and issue it.'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Worked use case: seal and sign a final drawing issue',
      body: [
        {
          kind: 'ol',
          items: [
            'Start with an authorized unsigned working copy and complete revisions, markups, page operations, headers, watermarks, and sanitation first.',
            'If an approved seal workflow is available to your organization, generate or obtain the artwork, compare every field and its appearance with the applicable board requirements, and place it on the page. Do not infer public availability from the development screenshots in this guide.',
            'Have the responsible professional review the entire final document, not only the seal area.',
            'Open the Signatures panel, import or select the professional’s approved Digital ID, then use Apply Signature in certificate mode and place the signature appearance.',
            'Save the signed output under the issue filename, close it, reopen it, and inspect the Signatures panel for the integrity result and certificate details.',
            'Send the exact saved file without further page-content edits. Ask the recipient to validate it in their own PDF viewer and under their trust policy.'
          ]
        },
        {
          kind: 'p',
          text:
            'This sequence keeps the roles clear: the seal communicates a professional designation, the professional supports the issue decision, and the certificate signature protects signed byte ranges. None substitutes for another.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Read every validation field literally',
      body: [
        {
          kind: 'p',
          text:
            'Valid With Changes is not the same claim as Valid and unchanged. In the captured file, the signed revision’s Byte Range, CMS Digest, and CMS Signature are valid. The document later received an incremental update allowed by its DocMDP level 3 policy, so the panel says Modified After Signing: Yes and Covers Document: No. Those exact fields—not a green icon by itself—define what was checked.'
        },
        {
          kind: 'p',
          text:
            'If a future result instead reports an invalid byte range, CMS digest, or CMS signature, the cryptographically checked content did not pass that test. Do not cover the warning or replace the appearance. Return to the authorized source, determine whether the change was expected, complete the new issue, and sign again with the proper identity.'
        },
        {
          kind: 'ul',
          items: [
            'Finish content editing before signing. Some certified signatures allow limited later actions, but page-content changes may be blocked or invalidate the signature.',
            'Verify the reopened saved file, not only the document still open after signing.',
            'Review integrity, certificate trust, revision coverage, permissions, timestamp, LTV, and revocation fields separately; one passing field does not fill in the missing evidence.',
            'Treat the captured self-signed trust result as test-profile evidence only. Recipients must evaluate the identity under their own trust policy.',
            'Preserve the signed original. Do not use a print-to-PDF or image export as a replacement when verifiable signature data must survive.'
          ]
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Is a visual signature in PolyPDF a digital signature?',
      answer:
        'No. Visual mode places an appearance on the page but does not create a certificate-backed CMS signature or a cryptographic integrity check.'
    },
    {
      question: 'Does a valid PDF signature prove the signer is trusted?',
      answer:
        'Not by itself. Validity can show that signed byte ranges match. In this guide’s controlled example, the self-signed identity is trusted only because it was explicitly configured in the isolated test profile. A recipient must apply its own trust anchors, certificate policy, authority checks, and verification context.'
    },
    {
      question: 'Is a PolyPDF professional seal a cryptographic signature?',
      answer:
        'No. The plugin generates seal artwork as an image stamp. Use a separate Digital ID signing workflow when cryptographic integrity is required.'
    },
    {
      question: 'Can I edit a PDF after applying a certificate signature?',
      answer:
        'Some certification policies permit limited append-only actions. The controlled example uses DocMDP level 3 and therefore reports Valid With Changes after an allowed update, but page-content edits can be blocked or invalidate a signature. Finish and verify content before signing whenever possible.'
    }
  ],
  relatedSlugs: [
    'prepare-issued-pdf-set',
    'redact-and-sanitize-pdf',
    'introducing-polypdf-plugins'
  ],
  sources: [
    {
      label: 'NIST Computer Security Resource Center: Digital Signature glossary',
      url: 'https://csrc.nist.gov/glossary/term/digital_signature'
    },
    {
      label: 'RFC 5652: Cryptographic Message Syntax',
      url: 'https://www.rfc-editor.org/rfc/rfc5652'
    },
    {
      label: 'PolyPDF: Introducing PolyPDF Plugins',
      url: 'https://www.polypdf.com/blog/introducing-polypdf-plugins/'
    },
    {
      label: 'PolyPDF current-development signature and seal verification',
      note: 'Verified August 19, 2026 with controlled identities and synthetic fixtures. The captured certificate is self-signed and trusted only inside its isolated test profile; timestamp, LTV, and revocation evidence are missing.'
    }
  ],
  cta: {
    title: 'Practice the distinction on a controlled file',
    text:
      'Download PolyPDF for macOS or Windows, compare visual and certificate modes on a disposable fixture, and inspect the reopened certificate details before adopting an issue workflow.',
    downloadSource: 'blog_signature_types_seals',
    buySource: 'website_blog_signature_types_seals'
  }
};

export default post;
