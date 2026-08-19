import formsBuilderImage from '../../assets/screenshots/shot-forms-builder-web.png';

const createFillablePdfFormGuide = {
  slug: 'create-fillable-pdf-form',
  title: 'How to Create a Fillable PDF Form',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '10 min read',
  tag: 'Forms',
  excerpt:
    'Add standard AcroForm fields to a compatible PDF, set names and tab order, test the saved copy, and recognize signed, secured, and XFA limits.',
  metaTitle: 'How to Create a Fillable PDF Form | PolyPDF',
  metaDescription:
    'Create a fillable AcroForm PDF in PolyPDF with text, checkbox, radio, combo, and list fields, plus testing and compatibility checks.',
  lede:
    'A reliable fillable PDF is more than boxes over a page. Its fields need stable names, useful tooltips, sensible tab order, compatible behavior, and a saved-file test in the viewers recipients will use.',
  quickAnswer:
    'For an unsigned, unrestricted PDF, open Forms and place Text, Multiline Text, Checkbox, Radio, Combo Box, or List Box fields. Give each a unique name, tooltip, options, flags, and tab order, then test a saved copy in PolyPDF and another target viewer. PolyPDF authors AcroForms; signed or secured PDFs block authoring, and dynamic XFA is preserved but not filled as an ordinary AcroForm.',
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: formsBuilderImage,
    alt: 'PolyPDF Forms panel with six field types beside a fillable invoice containing 42 fields',
    caption:
      'Live-app capture from the PolyPDF 1.3.1 dev build on macOS using an owned, bundled sample invoice. It shows the six authorable field types and a 42-field AcroForm. The workflow was re-verified in PolyPDF 1.3.4 build 16.',
    width: 1800,
    height: 1125,
    provenance:
      'Real product UI, not a mockup. The source capture is unedited except for redrawn macOS window controls.'
  },
  keywords: [
    'create fillable PDF form',
    'PDF form builder',
    'add fields to PDF',
    'AcroForm editor',
    'fillable PDF on Mac',
    'fillable PDF on Windows'
  ],
  sections: [
    {
      icon: 'document',
      title: 'Start with a compatible PDF and a field plan',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF can add AcroForm fields to an ordinary PDF or edit supported fields in an existing AcroForm. Authoring is locked when a document is encrypted, permission-restricted, or digitally signed. XFA forms follow separate rules below.'
        },
        {
          kind: 'p',
          text:
            'Before placing fields, list what the form collects, which values are required, the tab order, and the viewers recipients use. Keep visible labels in the page artwork; a field is not a substitute for instructions, units, or legal wording.'
        },
        {
          kind: 'note',
          text:
            'Work on a copy. Adding or editing fields changes the PDF structure, and it is intentionally blocked on signed documents because rewriting that structure can invalidate the signed revision.'
        }
      ]
    },
    {
      icon: 'table',
      title: 'Choose the right AcroForm field type',
      body: [
        {
          kind: 'table',
          caption: 'Field types PolyPDF can author',
          headers: ['Field type', 'Use it for', 'Setup check'],
          rows: [
            ['Text', 'Names, dates, amounts, or other single-line values', 'Set a stable name and enough width for expected input.'],
            ['Multiline Text', 'Addresses, notes, explanations, or scope descriptions', 'Allow enough height and test long entries.'],
            ['Checkbox', 'Independent yes/no or selected/not-selected choices', 'Use a clear visible label for each box.'],
            ['Radio', 'One choice from a mutually exclusive group', 'Provide at least two option values.'],
            ['Combo Box', 'A drop-down choice, optionally with editable text', 'Provide at least one option and decide whether custom text is allowed.'],
            ['List Box', 'A visible option list, optionally multi-select', 'Provide at least one option and test keyboard selection.']
          ]
        },
        {
          kind: 'p',
          text:
            'Existing signature and push-button fields can be preserved, but the current builder does not author them. Use the separate digital-signature workflow when cryptographic verification is required.'
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Place and configure the fields',
      body: [
        {
          kind: 'ol',
          items: [
            'Open the PDF and show the Forms panel from the sidebar or Window > Panels > Forms.',
            'Drag a field type from the palette onto the page. You can also select a type and click the page, or choose Add Field for numeric placement.',
            'Enter a unique field name. PolyPDF rejects blank names, duplicates, certain bracket characters, and periods because PDF reserves a period for parent-child field-name hierarchy.',
            'Add a visible tooltip that identifies the field to someone navigating without relying only on page position.',
            'For radio, combo, and list fields, enter one option per line. Radio groups require at least two options.',
            'Set the relevant behavior flags, such as Required or Read Only, and add a default value only when the form\'s business rule calls for one.',
            'Set the page and tab order. Arrange the field on the page by dragging its move grip, resize it with the handles, or nudge it with the arrow keys.',
            'Repeat with a consistent naming scheme, then save a working copy before the fill test.'
          ]
        },
        {
          kind: 'p',
          text:
            'Use names that describe data, such as bill_to_company, rather than positions such as top_left_1. Stable names help downstream mappings survive layout changes.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Handle signed, secured, and read-only forms safely',
      body: [
        {
          kind: 'p',
          text:
            'Encrypted or permission-restricted PDFs keep form authoring locked. Digitally signed PDFs also keep authoring locked to protect the signed revision. Obtain an authorized, unsigned source or revise the upstream form rather than trying to defeat those controls.'
        },
        {
          kind: 'p',
          text:
            'An unsigned, unrestricted AcroForm can still have Read Only fields. PolyPDF can offer a session override, and Make Permanently Fillable can clear that flag in a new revision. It is unavailable for signed or secured documents and does not unlock every form technology.'
        },
        {
          kind: 'ul',
          items: [
            'Preserve the original before clearing read-only flags.',
            'Confirm that you are authorized to alter the form, not merely able to open it.',
            'Use Undo or Revert to Saved if the result is not the intended form state.',
            'Apply digital signatures after form design and approved filling are complete, not before authoring changes.'
          ]
        }
      ]
    },
    {
      icon: 'document',
      title: 'Know the XFA boundary',
      body: [
        {
          kind: 'p',
          text:
            'PolyPDF authors AcroForms, not XFA templates. A dynamic XFA form asks a compatible XFA viewer to generate fields at runtime; PolyPDF preserves that data but cannot fill or author those generated fields as ordinary PDF controls. Dynamic XFA therefore remains a specialist compatibility case, not a promise that any government or enterprise form can be converted by opening it.'
        },
        {
          kind: 'p',
          text:
            'Some static or hybrid XFA PDFs also contain usable AcroForm fields. Those can be filled, but PolyPDF warns about the XFA layer. Saving may remove the stale XFA layer so other viewers show the entered values. Test a copy in the recipient viewer.'
        },
        {
          kind: 'note',
          text:
            'If the form must remain an XFA document for an agency workflow, use the workflow and viewer specified by that agency. Do not treat a visually correct AcroForm copy as proof of XFA submission compatibility.'
        }
      ]
    },
    {
      icon: 'export',
      title: 'Test the saved form like a recipient',
      body: [
        {
          kind: 'ol',
          items: [
            'Save a new PDF and reopen it rather than relying only on the unsaved editor view.',
            'Tab from the first field to the last. Confirm order, focus visibility, tooltips, and keyboard operation.',
            'Enter short, long, blank, and non-ASCII sample values where relevant. Check clipping, scrolling, and multiline behavior.',
            'Exercise every checkbox, radio group, combo box, and list box. Confirm defaults, required states, and option labels.',
            'Reset representative fields and verify that their default values return as intended.',
            'Open the saved copy in at least one other PDF viewer your recipients use, then print or export a test copy if that is part of the workflow.',
            'Keep the clean template separate from completed forms and from any later digitally signed record.'
          ]
        },
        {
          kind: 'p',
          text:
            'PolyPDF preserves JavaScript actions it encounters and evaluates a restricted safe subset used by supported form calculations. It is not a full Acrobat JavaScript runtime. Explicitly test calculations, validation, submission actions, and any enterprise dependency in the viewer your recipients are required to use.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Can PolyPDF make any PDF fillable?',
      answer:
        'It can add AcroForm fields to ordinary compatible PDFs, but form authoring is blocked for signed, encrypted, or permission-restricted documents. Dynamic XFA forms are not ordinary AcroForms and cannot be authored or filled the same way.'
    },
    {
      question: 'Which fillable field types can PolyPDF create?',
      answer:
        'Text, Multiline Text, Checkbox, Radio, Combo Box, and List Box. Existing signature or button fields may be preserved, but the current builder does not create those types.'
    },
    {
      question: 'Can I edit a digitally signed PDF form?',
      answer:
        'PolyPDF blocks form authoring on PDFs with a protected digital-signature record. Use an authorized unsigned source, complete the form workflow, and sign the final approved revision.'
    },
    {
      question: 'Will a fillable PDF work in every viewer?',
      answer:
        'No PDF editor can make that assumption for every viewer and advanced feature. Reopen the saved file and test the viewers, operating systems, scripts, printing path, and submission process your recipients actually use.'
    }
  ],
  relatedSlugs: [
    'pdf-markup-table-rfi-punch-list',
    'compare-pdf-drawing-revisions'
  ],
  sources: [
    {
      label: 'PolyPDF 1.3.4 (build 16) Forms panel, form-authoring model, and in-app guidance',
      note: 'Field types, naming rules, authoring gates, read-only behavior, and XFA disclosures re-verified August 18, 2026.'
    },
    {
      label: 'Owned PolyPDF sample invoice and live-app capture evidence',
      note: 'The screenshot shows 42 standard AcroForm fields in the bundled sample.'
    }
  ],
  cta: {
    title: 'Build and test a form on a safe copy',
    body:
      'Download PolyPDF for macOS or Windows, duplicate an unsigned and unrestricted source PDF, and build a small AcroForm first. Reopen the saved file in the viewers your recipients use before rolling it into a live process.',
    downloadSource: 'blog_create_fillable_pdf_form',
    buySource: 'website_blog_create_fillable_pdf_form',
    buyLabel: 'See license options'
  }
};

export default createFillablePdfFormGuide;
