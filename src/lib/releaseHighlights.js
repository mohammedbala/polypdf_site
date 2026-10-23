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

export const release161Highlights = Object.freeze([
  'Draw with a CAD-style command line: type exact points and distances, use Ortho or Polar tracking, and snap to drawing geometry.',
  'A PolyPDF Teams seat now also grants access to a paired company Collaboration Host after company sign-in. Approved computers can share live markups and presence on PDFs stored on the company share.',
  'The License Manager and Collaboration Host pair with a one-time code. Company collaboration access is checked continuously; standalone hosts retain their invitation permissions.',
  'Steel sections, seal making, and map insertion have short command words with useful typed options. Saving and PDF compatibility fixes continue across Mac and Windows.'
]);

export const release162Highlights = Object.freeze([
  'Personal Pro license activation is easier to find: the license-key field is visible at the top of the Upgrade dialog, even when a company connection has been configured.',
  'Existing personal licenses and company sign-in remain separate. Entering a personal key does not replace company settings or reduce existing personal-license rights.'
]);

export const release164Highlights = Object.freeze([
  "Choose whether PDFs reopen at startup, and open a PDF's containing folder from File or its tab menu.",
  "Markup tools return to Select after use by default. Turn on Keep markup and drawing tools active after use in Settings to repeat markups. Small rectangles keep their starting corner.",
  "Manage Digital IDs, public certificate trust, certification and timestamps with clearer signing and document-security guidance."
]);

const release165Answer = "PolyPDF 1.6.5 (build 37) adds optional usage statistics, off by default and separate from error diagnostics. You can choose or clear your main-use answer. Shared statistics exclude document contents, names, paths, license keys and account identifiers. Existing PolyPDF 1.x licenses still work on Mac and Windows.";

export const release165Highlights = Object.freeze([release165Answer]);

const release166Answer = "PolyPDF 1.6.6 (build 38) preserves imported circles and captioned lines, saves opaque measurement masks, and improves snapping and rotated Note editing. Save captures the latest annotation text. Address lookup shows the matched address, and missing PDFs no longer interrupt startup with a recovery dialog.";

export const release166Highlights = Object.freeze([release166Answer]);

const release167Answer = "PolyPDF 1.6.7 (build 39) fixes repeated Save errors after moving or grouping imported markups. Imported arcs stay editable after saving and reopening. Dialog fields and buttons fit within their panels, with improved spacing on smaller windows and enlarged interface scales.";

export const release167Highlights = Object.freeze([release167Answer]);

export const releaseAnswer = "PolyPDF 1.6.20 (build 87) keeps each open document’s Markups Table sort order and column filters when switching tabs or reopening the table. Custom Scale and line calibration support drawing-specific scales, alongside Explorer Combine, navigation and review improvements from build 86.";

export const release1613Highlights = Object.freeze(["PolyPDF 1.6.15 (build 82) lets a company administrator allow up to three computers per named Teams employee on one seat. Upgrade License Manager to 1.0.2 and paired Collaboration Hosts to 1.6.15 before changing the company-wide limit; existing installations stay at one computer until an administrator opts in."]);

export const release1615Highlights = Object.freeze([
  'Each named Teams employee can use up to three computers on one paid seat. Administrators choose the company-wide limit; existing installations stay at one until changed.',
  'Add a computer without replacing another, explicitly replace a selected computer, or remove one computer while keeping the employee’s other computers connected.',
  'Upgrade License Manager to 1.0.2 and paired Collaboration Hosts to 1.6.15 before enabling the higher limit. Existing Entra setup and employee assignments stay in place.'
]);

export const release1616Highlights = Object.freeze([
  'Grouped symbols retain their text when saved to Tools and placed again. Existing saved toolsets are preserved when adding tools from older documents.',
  'Count stays active across consecutive clicks regardless of the general repeat-drawing setting. Press Enter or Escape to finish the series.',
  'Stamp Builder adds Bring to Front, Bring Forward, Send Backward and Send to Back controls without changing the prompt order of existing stamps.',
  'Tab reordering, PDF combine order, stamp folder access, 1000% zoom, Cloud+, hollow-selection behavior and No Border have been improved. Closing tabs cancels stale PDF text work.',
  'License Manager 1.0.3 adds optional per-computer seat allocation. Existing rights and company settings stay unchanged until an administrator chooses the option; Collaboration Host 1.6.15 remains compatible.'
]);

export const release1619Highlights = Object.freeze([
  'Custom Scale accepts drawing-scale notation in Measurements and the footer scale menu. Calibrate by Drawing Line sets the same page scale from a known dimension; saved page scales remain available after reopening the PDF.',
  'Combine in PolyPDF is enabled by default in Windows Explorer, with a file-order review before combining.',
  'Page-key handling, thumbnail tracking and search or markup navigation keep the active document and visible drawing target aligned.',
  'Review status commands and shortcuts work with imported markups. Column filtering fades excluded markups as context without changing their saved colors.'
]);

export const release1620Highlights = Object.freeze([
  'Each open document keeps its own Markups Table sort order, column filters and saved-filter selection when switching tabs or hiding and reopening the table.',
  'Restored filters also restore the faded markup preview. Table choices last while the document remains open and do not change saved markup data.'
]);
