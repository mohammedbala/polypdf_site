import areaImage from '../../assets/screenshots/area-cutouts-depth-v1-4-dark-web.png';

const release154 = {
  slug: 'polypdf-1-5-4',
  title: 'PolyPDF 1.5.4: Better Highlights, Arcs, and Area Cutouts',
  date: '2026-09-11', dateLabel: 'September 11, 2026', dateModified: '2026-09-11',
  author: 'The PolyPDF team', readingTime: '3 min read', tag: 'Release',
  excerpt: 'Highlight shapes, separate arc radius and sweep controls, movable area cutouts, estimate scrolling, and a Windows file-opening patch arrive in 1.5.4.',
  metaTitle: 'PolyPDF 1.5.4: Highlights, Arcs & Cutouts',
  metaDescription: 'PolyPDF 1.5.4 for Mac and Windows improves highlights, arc handles, area cutouts, estimate scrolling, shared-drive opening checks, and interactive PDFs.',
  keywords: ['PolyPDF 1.5.4', 'PDF highlight shapes', 'PDF arc radius controls', 'move PDF area cutouts'],
  quickAnswer: 'PolyPDF 1.5.4 (build 26) is available for Mac and Windows. Highlights keep underlying drawing details visible, filled shapes gain a Highlight control, arc handles separate radius from sweep, area cutouts can be moved and resized, and estimates scroll more reliably. Windows also removes an unnecessary file operation before opening a PDF.',
  lede: 'This update improves the controls used to mark up a drawing and refine its measurements, with a Windows file-opening patch and improved playback for supported interactive PDFs.',
  imageCacheToken: '1.4.0-17',
  heroImage: {
    src: areaImage,
    alt: 'PolyPDF 1.4.0 example of a measured area with two cutouts and a depth value on a survey drawing',
    caption: 'Area measurements keep excluded openings and optional depth with the drawing. This historical 1.4.0 screenshot illustrates the existing workflow; version 1.5.4 improves cutout movement and resize handles.',
    width: 1710, height: 1073,
    provenance: 'Base drawing: PGAdesign, Historic American Landscapes Survey, National Park Service; Prints and Photographs Division, Library of Congress; HALS CA-2, sheet 2 of 5.'
  },
  sections: [
    { icon: 'document', title: 'Highlights that keep the drawing readable', body: [
      { kind: 'p', text: 'Highlights blend their color with the PDF so text and linework remain visible beneath them. To highlight an area with an existing filled annotation, select it and use Highlight beside Fill in the style toolbar.' },
      { kind: 'p', text: 'This lets a filled shape mark a room, detail, or review zone while keeping the drawing underneath readable.' }
    ] },
    { icon: 'ruler', title: 'Arc radius and sweep have separate controls', body: [
      { kind: 'p', text: 'Arc handles now follow a continuous drag. The middle handle changes the radius; the end handles change the sweep, which is how far the arc extends around its circle.' },
      { kind: 'table', headers: ['Control being dragged', 'Helper dimension'], rows: [
        ['Middle radius handle', 'Radius'],
        ['Corner resize handle', 'Radius'],
        ['End handle during a sweep adjustment', 'Arc length']
      ] },
      { kind: 'p', text: 'The helper follows the adjustment you are making, so changing the size of the circle shows its radius and extending the arc shows its length.' }
    ] },
    { icon: 'ruler', title: 'Move cutouts and work through estimates', body: [
      { kind: 'p', text: 'Area cutout resize handles now sit on their selection frame. Drag inside a cutout to reposition the opening within the measured area. Review the boundary and resulting net area after editing.' },
      { kind: 'p', text: 'Vertical and horizontal scrolling in the estimate workspace has also been improved. Editing a value retains your scroll position so you can continue where you were working.' },
      { kind: 'link', label: 'Measure net area with cutouts and depth', href: '/blog/measure-pdf-area-cutouts-depth/' }
    ] },
    { icon: 'document', title: 'Updated Windows file-opening checks', body: [
      { kind: 'p', text: 'The Windows access check no longer performs an unnecessary rename before reading a PDF. This change applies when opening local files and files on shared network drives.' },
      { kind: 'p', text: 'If a shared-drive PDF still fails to open after updating, send a fresh report through Help > Report to Support. Include the time and error message, whether the file remains visible and opens in another reader, whether a local copy works, and the server or NAS and VPN details.' },
      { kind: 'link', label: 'Get help with a shared-drive file', href: '/support/' }
    ] },
    { icon: 'document', title: 'Supported interactive PDFs play in the document', body: [
      { kind: 'p', text: 'Supported Doom and OfficeKart PDFs play directly in the document view, with improved controls and playback. This support is specific to compatible documents; it does not imply unrestricted PDF JavaScript support.' }
    ] },
    { icon: 'steps', title: 'Get 1.5.4 on Mac or Windows', body: [
      { kind: 'ol', items: ['Save your work and choose Help > Check for Updates.', 'Follow the update prompt. On Windows, downloaded updates install when you quit the app.', 'Reopen PolyPDF and check About for version 1.5.4, build 26.'] },
      { kind: 'p', text: 'You can also use the current downloads on this site. The Mac app is signed and notarized for macOS 14 or later on Apple silicon and Intel. The Windows installer is Authenticode-signed for Windows 10 or 11, x64.' },
      { kind: 'p', text: 'The update is included with existing PolyPDF 1.x licenses. PolyPDF Pro remains $74.95 USD once for up to three Mac or Windows computers; existing paid licenses retain their purchased rights.' },
      { kind: 'link', label: 'Browse the full version history', href: '/versions/' }
    ] }
  ],
  faqs: [
    { question: 'Is 1.5.4 available for both Mac and Windows?', answer: 'Yes. Both platforms ship PolyPDF 1.5.4, build 26. The shared-drive file-opening check change applies to Windows; the markup and measurement improvements ship on both platforms.' },
    { question: 'How do I turn a filled shape into a highlight?', answer: 'Select the filled annotation and use Highlight beside Fill in the style toolbar. The color blends with the drawing so the underlying text and linework stay visible.' },
    { question: 'Does the update cost extra?', answer: 'No. Every public PolyPDF 1.x update is included with a PolyPDF 1.x license. Your existing paid license keeps its purchased rights.' }
  ],
  relatedSlugs: ['measure-pdf-area-cutouts-depth', 'pdf-markup-table-rfi-punch-list', 'pdf-takeoff-worked-example'],
  sources: [
    { label: 'Mac 1.5.4 release notes', url: 'https://www.polypdf.com/downloads/PolyPDFMac-v1.5.4-26.html' },
    { label: 'Windows 1.5.4 release notes', url: 'https://www.polypdf.com/downloads/windows/PolyPDFWin-v1.5.4-26.html' },
    { label: 'Library of Congress: source survey drawing', url: 'https://www.loc.gov/resource/hhh.ca3441.sheet.00002a/' }
  ]
};

export default release154;
