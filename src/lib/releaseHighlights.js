export const releaseHighlights = Object.freeze([
  'Create interactive stamps on a blank canvas. Arrange and style fields, enter values when placing a stamp, and optionally save it to a toolset for reuse.',
  'Use expanded Architectural, Landscape, Windows, and Fire Protection symbol libraries from the Tools sidebar.',
  'Open View > Presentation Mode to present the current PDF with focused page navigation.',
  'PDF layers, bookmarks, thumbnail navigation, rotated dimension labels, and saved signature and stamp appearances are more reliable.',
  'Startup, zoom, annotation interactions, and memory use across open documents are improved. Dialogs and footer controls are clearer, and new metric dimensions default to millimetres.'
]);

export const release152Highlights = Object.freeze([
  'Interactive stamps gain compact field controls, alignment guides, improved field rendering, portrait layouts, and clearer toolset thumbnails.',
  'Double-click a placed interactive stamp to update its answers. Configure a custom stamp folder for reusable PDF, image, and portable PolyPDF stamps.',
  'Settings scrolling is smoother, and a PDF engine crash when closing one document and opening another has been fixed.'
]);

export const release153Highlights = Object.freeze([
  'Marquee Zoom, perimeter segment label controls, and 49 editable Interior Design symbols improve drawing review.',
  'PDF content editing, toolsets, and overlay now require Pro. Free users can browse every preset and upgrade when choosing a tool.',
  'PolyPDF Pro is $74.95 USD once. Existing paid licenses retain their purchased rights.'
]);

export const release154Highlights = Object.freeze([
  'Highlights blend with the drawing so text and linework remain visible. Use Highlight beside Fill to turn a filled annotation into a highlight shape.',
  'Arc handles drag continuously: the middle handle controls radius and the end handles control sweep. Helpers show radius during radius or corner adjustments and arc length during sweep adjustments.',
  'Area cutout resize handles align with their selection frame. Drag inside a cutout to reposition it.',
  'The estimate workspace scrolls vertically and horizontally, retaining its scroll position when editing.',
  'Supported Doom and OfficeKart PDFs play directly in the document view, with improved controls and playback.'
]);

export const release154WindowsFix = 'Windows file-opening checks no longer perform an unnecessary rename before reading a PDF, including files on shared network drives.';

export const release155Highlights = Object.freeze([
  "Zoom with the mouse wheel in Single page view without holding Command. Multipage views scroll by default. Customize wheel and double-click-drag zoom separately for each layout in Settings > View, or right-click the page-layout buttons in the bottom bar.",
  "Double-click and drag to zoom around the point you choose. When the wheel is set to scroll in Single page view, scrolling past a page edge advances to the next or previous page, with protection against accidental trackpad momentum.",
  "Hold Shift and drag with the left mouse button to pan. Hold Shift while scrolling the wheel to pan horizontally.",
  "Snapshots retain their size and proportions when pasted between differently rotated pages. Saved snapshot artwork also preserves its orientation when opened in other PDF viewers."
]);

export const release156Highlights = Object.freeze([
  'PDF overlays redraw from their source PDF as you zoom, keeping vector text and linework sharp.',
  'Overlay crops stay aligned on rotated pages, including after saving and reopening the PDF.'
]);

export const release157Highlights = Object.freeze([
  'Rotate a complete grouped symbol from its rotation handle while keeping every part editable.',
  'Mirror supported images and annotations horizontally or vertically from the context menu or keyboard shortcuts.',
  'Mirrored artwork and grouped symbols retain their appearance after saving and reopening a PDF.'
]);

export const release158Highlights = Object.freeze([
  'Markups on rotated drawing sheets now appear upright and in the right place.',
  'Autosize Text Box fits a text box or callout to its contents. Use the context menu, Alt+Z, or the style-toolbar button; typing more text also grows the box.',
  'Improved exchange with other PDF review apps for callouts, clouds, arrows, measurements, statuses, layers, locks, and custom columns.',
  'Fixed underline and strikeout edits that could fail to save after reopening, and statuses that could be lost on save.'
]);

export const release160Highlights = Object.freeze([
  'Connect to a company-hosted PolyPDF License Manager with a connection file or HTTPS address. Sign in with Microsoft Entra or use a locally administered invitation when your firm enables it.',
  'See your assigned employee, computer, connection status, and offline access deadline. Personal licenses remain separate and continue to work.',
  'Hatch patterns, aligned text annotations, and zooming on large architectural drawings are more reliable.'
]);

export const releaseAnswer = "PolyPDF 1.6.0 (build 31) adds company-hosted licensing for firms using Microsoft Entra or local invitations, while keeping personal licenses separate. It also improves PDF editing and large-drawing zoom. Available for Mac and Windows; existing PolyPDF 1.x licenses still apply.";
