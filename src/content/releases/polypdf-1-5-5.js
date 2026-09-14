import release154 from './polypdf-1-5-4';
import { release155Highlights, releaseAnswer } from '../../lib/releaseHighlights';

const release155 = {
  slug: 'polypdf-1-5-5',
  title: 'PolyPDF 1.5.5: Zoom Controls and Snapshot Fixes',
  date: '2026-09-13', dateLabel: 'September 13, 2026', dateModified: '2026-09-13',
  author: 'The PolyPDF team', readingTime: '2 min read', tag: 'Release',
  excerpt: 'Set zoom controls for each page layout, pan with Shift, and paste snapshots with the right proportions and saved orientation.',
  metaTitle: 'PolyPDF 1.5.5: Zoom Controls and Snapshot Fixes',
  metaDescription: 'PolyPDF 1.5.5 for Mac and Windows adds customizable wheel and drag zoom, Shift panning, and fixes for snapshot sizing and saved orientation.',
  keywords: ['PolyPDF 1.5.5', 'PDF wheel zoom', 'PDF snapshot fixes'],
  quickAnswer: releaseAnswer,
  lede: 'Set zoom controls for each page layout, pan with Shift, and paste snapshots with the right proportions and saved orientation.',
  imageCacheToken: '1.4.0-17',
  heroImage: { ...release154.heroImage, caption: 'Historical PolyPDF 1.4.0 interface showing a drawing-review workspace. The screenshot does not show the new 1.5.5 controls.' },
  sections: [
    { icon: 'document', title: 'Zoom controls for each page layout', body: release155Highlights.slice(0, 2).map(text => ({ kind: 'p', text })) },
    { icon: 'document', title: 'Pan with Shift', body: [{ kind: 'p', text: release155Highlights[2] }] },
    { icon: 'document', title: 'Snapshot proportions and saved orientation', body: [{ kind: 'p', text: release155Highlights[3] }] },
    { icon: 'steps', title: 'Get 1.5.5 on Mac or Windows', body: [
      { kind: 'ol', items: ['Save your work and choose Help > Check for Updates.', 'Follow the update prompt. On Windows, downloaded updates install when you quit the app.', 'Reopen PolyPDF and check About for version 1.5.5, build 27.'] },
      ...release154.sections[5].body.slice(1)
    ] }
  ],
  faqs: [release154.faqs[2]],
  relatedSlugs: ['polypdf-1-5-4', 'pdf-markup-table-rfi-punch-list', 'pdf-takeoff-worked-example'],
  sources: [
    { label: 'Mac 1.5.5 release notes', url: 'https://www.polypdf.com/downloads/PolyPDFMac-v1.5.5-27.html' },
    { label: 'Windows 1.5.5 release notes', url: 'https://www.polypdf.com/downloads/windows/PolyPDFWin-v1.5.5-27.html' },
    release154.sources[2]
  ]
};

export default release155;
