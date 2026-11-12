import titles from '../content/translations/editorial-titles.json';
import { blogPosts, blogPostPath } from './blogPosts';
import locales from '../lib/locales.json';

// The optional drawing handoff links to a task-specific guide. Tool operation and
// document bytes stay in the browser; guides are available in the listed editions.
export function drawingGuideRoute(tool) {
  if (['fill-pdf-form', 'flatten-pdf', 'extract-pdf-form-data'].includes(tool.id)) return '/blog/create-fillable-pdf-form';
  if (tool.id === 'compare-pdf-text') return '/blog/compare-pdf-drawing-revisions';
  if (tool.id === 'pdf-to-text') return '/blog/ocr-scanned-pdf-drawings';
  if (['crop-pdf', 'edit-pdf-metadata'].includes(tool.id)) return '/blog/redact-and-sanitize-pdf';
  if (['resize-pdf', 'add-pdf-margins', 'jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf', 'inspect-pdf'].includes(tool.id)) return '/blog/calibrate-pdf-drawing-scale';
  if (tool.category === 'Mark up' || tool.id === 'remove-pdf-annotations') return '/blog/pdf-markup-table-rfi-punch-list';
  return '/blog/prepare-issued-pdf-set';
}
export function drawingGuideLink(tool, locale) {
  const route = drawingGuideRoute(tool);
  const edition = locales.find(l => l.id === locale?.id);
  const source = blogPosts.find(post => blogPostPath(post.slug) === route);
  return {
    href: (edition ? '/' + edition.id : '') + route + '/',
    title: edition ? titles[edition.id][route].split('|')[0].trim() : source.title,
    language: edition?.language || 'en',
    englishFallback: !!locale && !edition
  };
}
