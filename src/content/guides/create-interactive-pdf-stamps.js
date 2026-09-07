import builderImage from '../../assets/screenshots/stamp-builder-v1-5-1.png';
import blankImage from '../../assets/screenshots/stamp-blank-v1-5-1.png';
import promptImage from '../../assets/screenshots/stamp-prompt-v1-5-1.png';
import placedImage from '../../assets/screenshots/stamp-placed-v1-5-1.png';

const figure = (src, alt, caption) => ({ kind: 'figure', src, alt, caption, width: 1233, height: 768 });

const interactiveStampGuide = {
  slug: 'create-interactive-pdf-stamps',
  title: 'Create Interactive PDF Review Stamps',
  date: '2026-09-07',
  dateLabel: 'September 7, 2026',
  dateModified: '2026-09-07',
  author: 'The PolyPDF team',
  readingTime: '6 min read',
  tag: 'Markup & Review',
  excerpt: 'Build a review stamp from a blank canvas, arrange its fields, ask for details when placing it, and choose whether to save it for reuse.',
  metaTitle: 'Create Interactive PDF Review Stamps | PolyPDF',
  metaDescription: 'Build interactive PDF stamps in PolyPDF 1.5.1. Arrange fields, prompt for a reviewer, add an automatic date, and save reusable stamps on Mac or Windows.',
  keywords: ['create interactive PDF stamps', 'reusable PDF review stamp', 'PDF stamp with date and reviewer', 'PDF stamps Mac Windows'],
  quickAnswer: 'Open a PDF, open the arrow beside Stamp, and choose Create Interactive Stamp… Start with the empty canvas, add fields, set their values and appearance, and arrange them in the preview. Leave Add to toolset unchecked for a one-off stamp, or check it to save a reusable template. Choose Insert on Page, click the drawing, complete the placement prompt, and choose Place Stamp.',
  lede: 'A review stamp can keep a fixed heading while asking for a different reviewer on every placement. This example builds a simple REVIEWED stamp with a reviewer and an automatic date on the sample drawing included with PolyPDF.',
  lastVerified: '2026-09-07',
  productVersion: 'PolyPDF 1.5.1 (build 23); screenshots from the signed macOS release',
  platforms: 'macOS and Windows',
  imageCacheToken: '1.5.1-23',
  heroImage: { src: builderImage, alt: 'PolyPDF 1.5.1 interactive stamp builder showing a REVIEWED heading, Morgan Lee reviewer, automatic date, and checked Add to toolset option', caption: 'The actual 1.5.1 builder with a 300 × 180 pt canvas and three fields. REVIEWED is fixed, Reviewer is prompted, and Review date uses Current date. Morgan Lee is fictional sample data.', width: 1233, height: 768 },
  sections: [
    {
      icon: 'seal', title: 'Start with a blank canvas',
      body: [
        { kind: 'ol', items: ['Open the PDF that will receive the stamp.', 'Open the arrow beside the Stamp toolbar button and choose Create Interactive Stamp…', 'Give the stamp a useful name. Set Width (pt), Height (pt), fill, border color, and border width for the canvas you need.', 'Choose Add Field to start the layout. A new stamp needs at least one field before it can be inserted.'] },
        figure(blankImage, 'PolyPDF 1.5.1 new interactive stamp with a blank square canvas, no fields, and Add to toolset unchecked', 'Every new stamp starts with an empty 240 × 240 pt square. The open PDF and any selected annotation are not copied into the new stamp. Add to toolset starts unchecked.'),
        { kind: 'p', text: 'The canvas dimensions are PDF points, not the calibrated real-world units of the drawing. A rectangular review stamp is simply a canvas with different width and height values.' }
      ]
    },
    {
      icon: 'table', title: 'Give each field a clear job',
      body: [
        { kind: 'p', text: 'Select a field to edit its Label, Type, default value, placement behavior, position, size, font, ink color, alignment, bold, and italic settings. Labels identify the field in the editor and placement prompt; the field value is what appears in the stamp.' },
        { kind: 'table', caption: 'The three fields in this example', headers: ['Field', 'Value', 'Ask when placing'], rows: [['Review status', 'Custom value: REVIEWED', 'Off; this heading stays fixed'], ['Reviewer', 'Custom value: Morgan Lee for this sample', 'On, with Required checked'], ['Review date', 'Current date', 'Off; refreshed automatically']] },
        { kind: 'p', text: 'For your own template, leave the reviewer default empty when every placement should require a fresh answer. Use Required for a prompted value that must be filled before placement.' },
        { kind: 'p', text: 'Default value can use a custom value, current user, current date, current time, document name, or page number. Automatic values are resolved for each new placement; they are not a promise that an already placed stamp will change later.' }
      ]
    },
    {
      icon: 'steps', title: 'Arrange and inspect the artwork',
      body: [
        { kind: 'ul', items: ['Drag a field in the preview to move it; drag its corner handle to resize it.', 'Use Left, Top, Width, and Height for precise positions in PDF points.', 'Use Select all fields and Align fields… to align or distribute a group. Check whether alignment is relative to the stamp or the selection.', 'Use Focus field for close inspection and Fit stamp to check the complete layout.', 'Allow room for longer names and multiline answers. A preview with a short sample value does not establish that every future answer will fit.'] },
        { kind: 'p', text: 'Selection outlines, field labels, and resize handles belong to the editor. They are not part of the stamp that is placed or saved into the PDF.' }
      ]
    },
    {
      icon: 'seal', title: 'Choose one-off placement or a reusable tool',
      body: [
        { kind: 'p', text: 'Leave Add to toolset unchecked when you only need this stamp once. Check it when you want a reusable definition; Save in toolset then appears so you can choose its destination.' },
        { kind: 'ol', items: ['Choose Insert on Page.', 'Click the intended location on the PDF.', 'Review the values shown in the placement dialog. Fill every required prompted field.', 'Choose Place Stamp. Inspect the result and move or resize it as needed.', 'For another placement of a saved template, select it from the Stamp menu or its toolset and enter the new placement details.'] },
        figure(promptImage, 'PolyPDF Drawing Review placement dialog with required Reviewer entry, fixed REVIEWED heading, and automatic review date', 'The placement prompt asks for Reviewer. The fixed heading and automatic date are shown but disabled because Ask when placing is off for those fields.')
      ]
    },
    {
      icon: 'check', title: 'Save, reopen, and check the delivered PDF',
      body: [
        figure(placedImage, 'PolyPDF 1.5.1 showing the completed review stamp selected below the sample floor plan with stamp style controls visible', 'The placed stamp is an ordinary PDF stamp annotation with a saved appearance. The editor’s field outlines are gone; the selection handles here are the normal controls for moving or resizing the placed annotation.'),
        { kind: 'p', text: 'Save your working copy, close it, and reopen the saved file. Check the text, size, orientation, and position. Open the same saved PDF in the viewer your recipient uses before relying on a project-specific exchange workflow.' },
        { kind: 'p', text: 'Use Properties to edit the values of a placed interactive stamp in PolyPDF. Editing a saved template changes future placements; it does not rewrite every stamp you have already placed. A recipient can view the saved appearance in a PDF viewer, but the PolyPDF template editor is not a cross-application feature.' },
        { kind: 'note', text: 'An interactive review stamp is visual annotation artwork. It does not create a certificate signature, execute imported PDF JavaScript, or calculate arbitrary stamp formulas. Certificate-backed signing remains a separate workflow.' }
      ]
    }
  ],
  faqs: [
    { question: 'Does a new stamp copy the open PDF page?', answer: 'No. Create Interactive Stamp starts with an empty canvas and no fields. It does not copy the page, selected artwork, or form fields from the PDF.' },
    { question: 'Do I have to save every stamp to a toolset?', answer: 'No. Add to toolset is unchecked by default. Leave it off for a one-off placement, or turn it on and choose a destination for a reusable template.' },
    { question: 'Can I use a different reviewer and date for each placement?', answer: 'Yes. Turn on Ask when placing for the reviewer, and choose Current date for the date field. Automatic values refresh for each placement; existing stamps retain their saved values.' },
    { question: 'Is a review stamp a digital signature?', answer: 'A review stamp supplies visible artwork and field values. It does not create a certificate-backed signature or prove who approved the drawing. Use the separate digital signature workflow when cryptographic verification is required.' }
  ],
  relatedSlugs: ['pdf-markup-table-rfi-punch-list', 'digital-signature-vs-visual-signature-vs-seal', 'create-fillable-pdf-form'],
  sources: [{ label: 'PolyPDF 1.5.1 release notes', url: 'https://www.polypdf.com/downloads/PolyPDFMac-v1.5.1-23.html', note: 'Interactive stamps shipped for Mac and Windows in version 1.5.1, build 23.' }]
};

export default interactiveStampGuide;
