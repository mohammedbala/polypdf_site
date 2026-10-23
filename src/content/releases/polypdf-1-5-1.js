import stampImage from '../../assets/screenshots/stamp-builder-v1-5-1.png';
import libraryImage from '../../assets/screenshots/architectural-tools-v1-5-1.png';
import { releaseHighlights } from '../../lib/releaseHighlights';

const release151 = {
  slug: 'polypdf-1-5-1',
  title: 'PolyPDF 1.5.1: Interactive Stamps and Clearer Drawing Review',
  date: '2026-09-07', dateLabel: 'September 7, 2026', dateModified: '2026-09-07',
  author: 'The PolyPDF team', readingTime: '4 min read', tag: 'Release',
  excerpt: 'Build interactive stamps, explore expanded symbol libraries, and present PDFs. Version 1.5.1 also improves navigation, saved appearances, and responsiveness.',
  metaTitle: 'PolyPDF 1.5.1: Stamps, Symbols & Presentation Mode',
  metaDescription: 'PolyPDF 1.5.1 is out for Mac and Windows: interactive stamps, expanded symbols, Presentation Mode, clearer metric defaults, and more reliable PDF review.',
  keywords: ['PolyPDF 1.5.1', 'PDF interactive stamp builder', 'PDF presentation mode', 'architectural PDF symbols'],
  quickAnswer: 'PolyPDF 1.5.1 (build 23) is available for Mac and Windows. It adds a blank-canvas interactive stamp builder, expanded symbol libraries, and Presentation Mode, plus improvements to layers, bookmarks, thumbnails, saved signature and stamp appearances, startup, memory use, and zoom. New metric dimensions default to millimetres.',
  lede: 'This update focuses on the details of daily drawing review: prepare a repeatable stamp, find the right symbol, present a sheet, and keep the saved result looking as intended.',
  lastVerified: '2026-09-07', productVersion: 'PolyPDF 1.5.1 (build 23); screenshots from the signed macOS release',
  platforms: 'macOS 14 or later, Apple silicon and Intel; Windows 10 or 11, x64',
  imageCacheToken: '1.5.1-23',
  heroImage: { src: stampImage, alt: 'PolyPDF 1.5.1 stamp canvas with REVIEWED heading, reviewer, date, and optional toolset saving', caption: 'Build a stamp from an empty canvas, arrange its fields, and choose which values to ask for at placement. This capture is from the signed 1.5.1 Mac app using fictional sample details.', width: 1233, height: 768 },
  sections: [
    { icon: 'seal', title: 'A stamp you can reuse, with details you can change', body: [
      { kind: 'p', text: 'Open the arrow beside Stamp and choose Create Interactive Stamp… Start with an empty canvas, add and style fields, then choose a fixed value, an automatic value, or a prompt for each placement. A new stamp starts independently of the PDF page.' },
      { kind: 'p', text: 'Add to toolset starts unchecked for a one-off stamp. Check it and choose a destination when the layout should become a reusable tool. Insert on Page starts placement; click the drawing, enter the requested details, and choose Place Stamp.' },
      { kind: 'link', label: 'Follow the interactive stamp guide', href: '/blog/create-interactive-pdf-stamps/' }
    ] },
    { icon: 'document', title: 'More symbols in the Tools sidebar', body: [
      { kind: 'p', text: 'The Architectural, Landscape, Windows, and Fire Protection libraries have expanded. Open Tools, expand a library, or use Search tools to find the item you need. Place it on the drawing and check its size, orientation, and meaning against the project legend.' },
      { kind: 'figure', src: libraryImage, alt: 'PolyPDF 1.5.1 Tools sidebar with Architectural symbols and Doors, Windows, Landscape, and Fire Protection libraries', caption: 'The Architectural toolset includes detail, elevation, and section indicators alongside other drawing symbols. The actual 1.5.1 interface is shown beside the bundled sample plan.', width: 1233, height: 768 },
      { kind: 'p', text: 'Built-in symbol libraries are available through Tools. They are separate from Symbol Search, which finds matching instances already on a drawing, and from plugins that generate content.' }
    ] },
    { icon: 'steps', title: 'Present the current PDF', body: [
      { kind: 'ol', items: ['Open the PDF and select the page you want to start from.', 'Choose View > Presentation Mode.', 'Use the arrow keys or Page Up and Page Down to move between pages. Space advances; Shift-Space goes back.', 'Press Escape or choose Exit Presentation to return to the regular workspace.'] },
      { kind: 'p', text: 'Presentation Mode gives the focused PDF a clean viewing area and page navigation. It does not create a PowerPoint deck or start a shared collaboration session.' }
    ] },
    { icon: 'check', title: 'More reliable everyday review', body: [
      { kind: 'ul', items: releaseHighlights.slice(3) },
      { kind: 'p', text: 'For metric drawings, new linear dimensions start in millimetres. Existing documents keep their explicit formats; metric area and volume still use square and cubic metres. Check Measurements > Formatting when a project calls for another display unit, and verify the page scale against a known distance.' },
      { kind: 'p', text: 'Save-and-reopen improvements preserve signature and stamp appearances more reliably, including PDFs edited in other applications. A visible signature mark remains distinct from a certificate-backed signature. Check both the appearance and the signature status in the saved file.' },
      { kind: 'link', label: 'Read the signature and seal guide', href: '/blog/digital-signature-vs-visual-signature-vs-seal/' }
    ] },
    { icon: 'steps', title: 'Get the update on Mac or Windows', body: [
      { kind: 'p', text: 'On Mac, choose Help > Check for Updates and follow the update prompt. On Windows, updates download in the background and install when you quit. You can also download the current installer from this site. Save your work before installing an update.' },
      { kind: 'p', text: 'Both platforms ship version 1.5.1, build 23. The Mac app is signed and notarized for Apple silicon and Intel; the Windows x64 installer is Authenticode-signed. Updates from 1.5.0 were verified on both platforms, and existing Pro licenses continue to apply.' },
      { kind: 'p', text: 'Revision Packages introduced in 1.5 remain available. Viewing and navigation are included in Free; creating, updating, and publishing packages require Pro. Collaboration remains a separate beta with its own customer-owned host.' },
      { kind: 'link', label: 'Browse the complete version history', href: '/versions/' }
    ] }
  ],
  faqs: [
    { question: 'Is PolyPDF 1.5.1 available on both platforms?', answer: 'Yes. Version 1.5.1, build 23, is published for macOS 14 or later on Apple silicon and Intel, and for Windows 10 or 11 on x64 computers.' },
    { question: 'Will an update remove my Pro license?', answer: 'Your existing PolyPDF 1.x Pro license continues to apply. The release was checked through real 1.5.0 to 1.5.1 update flows on Mac and Windows.' },
    { question: 'Does the metric default change older drawings?', answer: 'The new default affects new metric dimensions. Explicit formats already saved in documents are preserved, and page calibration still needs to match the drawing.' }
  ],
  relatedSlugs: ['create-interactive-pdf-stamps', 'calibrate-pdf-drawing-scale', 'pdf-markup-table-rfi-punch-list'],
  sources: [
    { label: 'Mac 1.5.1 release notes', url: 'https://www.polypdf.com/downloads/PolyPDFMac-v1.5.1-23.html' },
    { label: 'Windows 1.5.1 release notes', url: 'https://www.polypdf.com/downloads/windows/PolyPDFWin-v1.5.1-23.html' }
  ]
};

export default release151;
