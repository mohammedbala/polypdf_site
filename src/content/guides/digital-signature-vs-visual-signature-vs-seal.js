import professionalSealScreenshot from '../../assets/screenshots/shot-professional-seal-1.3.4-web.png';
import visualSignatureScreenshot from '../../assets/screenshots/shot-visual-signature-style-1.3.4-web.png';
import certificateSignatureScreenshot from '../../assets/screenshots/shot-certificate-signature-1.3.4-web.png';
import invalidSignatureScreenshot from '../../assets/screenshots/shot-invalid-signature-verdict-1.3.4-web.png';

const fixtureProvenance =
  'Live PolyPDF 1.3.4 (build 16) capture using owned or generated test fixtures. Names and certificates shown are test identities, not customer data.';

const post = {
  slug: 'digital-signature-vs-visual-signature-vs-seal',
  title: 'Digital vs Visual PDF Signatures vs Professional Seals',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Signatures & Seals',
  excerpt:
    'Understand what certificate-backed PDF signatures verify, what visual signature marks cannot prove, and why a professional seal graphic is drafting artwork until separately signed.',
  metaTitle: 'Digital vs Visual PDF Signatures and Seals | PolyPDF',
  metaDescription:
    'Compare certificate-backed PDF signatures, visual marks, and professional seal artwork, including integrity, trust, limits, and a safe issue order.',
  lede:
    'A signature appearance, a cryptographic signature, and a professional seal can look related on a drawing, but they answer different questions. Confusing them can leave a polished page with no verifiable integrity—or a valid signature attached to an untrusted identity.',
  quickAnswer:
    'A certificate-backed PDF signature uses a Digital ID and CMS data to let a verifier test whether the signed PDF byte ranges still match; that establishes integrity, while identity trust remains a separate certificate and policy decision. A visual signature in PolyPDF is only a page mark and provides no cryptographic proof. The Professional Seal Maker plugin creates editable drafting artwork, not a cryptographic signature, and the licensed professional remains responsible for checking board rules and permitted use.',
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: professionalSealScreenshot,
    alt: 'PolyPDF drawing with a generated professional seal artwork selected and the Plugins panel open',
    caption:
      'A generated professional-seal graphic placed on the owned PolyPDF Quick Start fixture. The visible artwork is not a certificate signature and the capture does not establish licensing-board compliance. ' + fixtureProvenance,
    width: 800,
    height: 502
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
          src: certificateSignatureScreenshot,
          alt: 'Certificate-backed PolyPDF test signature appearance with signer, date, and green check mark',
          caption:
            'Certificate-signature appearance from a controlled automation identity. The appearance communicates status, but the Signatures panel’s validation result—not the graphic alone—is the integrity evidence. ' + fixtureProvenance,
          width: 800,
          height: 187
        },
        {
          kind: 'p',
          text:
            'Integrity and trust are separate. A mathematically valid signature can use a self-signed, expired, unknown, or untrusted certificate. A recipient’s decision can depend on trust anchors, the certificate chain, policy, signing authority, and available time or revocation evidence. A valid cryptographic result is not a universal identity endorsement.'
        }
      ]
    },
    {
      icon: 'signature',
      title: 'Visual signatures: useful appearance, no cryptographic proof',
      body: [
        {
          kind: 'figure',
          src: visualSignatureScreenshot,
          alt: 'PolyPDF visual signature style chooser with Saved, Standard, and Draw sources',
          caption:
            'The visual-signature chooser offers saved, standard, and drawn appearances. These page marks have no certificate-backed integrity check. ' + fixtureProvenance,
          width: 800,
          height: 427
        },
        {
          kind: 'p',
          text:
            'Visual mode can place a saved signature, a standard style, or a drawn mark. That may suit an internal approval or a process where another system records identity and consent. It does not create a CMS signature and cannot tell a later viewer whether page bytes changed.'
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
            'The Professional Seal Maker asks for a profession, jurisdiction, and template fields, then inserts an image-stamp annotation. It is a drafting aid. The seal has no certificate signature and does not prove who placed it, current licensure, or whether that jurisdiction permits the specific use.'
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
            'Generate the professional seal artwork, compare every field and its appearance with the applicable board requirements, and place it on the page.',
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
      title: 'Read validation failures literally and stop editing after signing',
      body: [
        {
          kind: 'figure',
          src: invalidSignatureScreenshot,
          alt: 'PolyPDF Signatures panel showing an invalid signature because the CMS message digest does not match the signed PDF byte ranges',
          caption:
            'Controlled invalid-signature fixture. PolyPDF reports that the CMS messageDigest does not match the signed PDF byte ranges; the visible red verdict is evidence of a failed integrity check for this fixture. ' + fixtureProvenance,
          width: 800,
          height: 844
        },
        {
          kind: 'p',
          text:
            'A failed digest comparison means the cryptographically checked content does not match what was signed. Do not cover the warning, replace the appearance, or send the document as though it were valid. Return to the authorized unsigned source, determine whether the change was expected, complete the new issue, and sign again with the proper identity.'
        },
        {
          kind: 'ul',
          items: [
            'Finish content editing before signing. Some certified signatures allow limited later actions, but page-content changes may be blocked or invalidate the signature.',
            'Verify the reopened saved file, not only the document still open after signing.',
            'Review both integrity status and certificate trust; “valid bytes” and “trusted signer” are different conclusions.',
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
        'Not by itself. Validity can show that signed byte ranges match. Trust in the certificate and signer depends on the certificate chain, trust anchors, policy, authority, and other verification context.'
    },
    {
      question: 'Is a PolyPDF professional seal a cryptographic signature?',
      answer:
        'No. The plugin generates seal artwork as an image stamp. Use a separate Digital ID signing workflow when cryptographic integrity is required.'
    },
    {
      question: 'Can I edit a PDF after applying a certificate signature?',
      answer:
        'Some signatures permit limited later actions, but page-content edits can be blocked or invalidate the signature. The reliable workflow is to finish and verify the document before signing.'
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
      url: 'https://www.polypdf.com/blog/introducing-polypdf-plugins'
    },
    {
      label: 'PolyPDF 1.3.4 build 16 signature and seal verification',
      note: 'Verified with controlled identities and owned fixtures on August 18, 2026.'
    }
  ],
  cta: {
    title: 'Practice the distinction on a controlled file',
    text:
      'Download PolyPDF for macOS or Windows, compare visual and certificate modes on a disposable fixture, and inspect both valid and invalid results before adopting an issue workflow.',
    downloadSource: 'blog_signature_types_seals',
    buySource: 'website_blog_signature_types_seals'
  }
};

export default post;
