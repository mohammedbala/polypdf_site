import calibratePdfDrawingScale from './calibrate-pdf-drawing-scale';
import comparePdfDrawingRevisions from './compare-pdf-drawing-revisions';
import countPdfSymbols from './count-pdf-symbols';
import createFillablePdfForm from './create-fillable-pdf-form';
import digitalSignatureVsVisualSignatureVsSeal from './digital-signature-vs-visual-signature-vs-seal';
import measurePdfAreaCutoutsDepth from './measure-pdf-area-cutouts-depth';
import ocrScannedPdfDrawings from './ocr-scanned-pdf-drawings';
import pdfMarkupTableRfiPunchList from './pdf-markup-table-rfi-punch-list';
import pdfTakeoffWorkedExample from './pdf-takeoff-worked-example';
import prepareIssuedPdfSet from './prepare-issued-pdf-set';
import redactAndSanitizePdf from './redact-and-sanitize-pdf';
import whyPdfMeasurementsAreWrong from './why-pdf-measurements-are-wrong';

// Keep the editorial set explicit. The build and tests treat this registry as the one source of
// truth for guide routes, discovery files, structured data, related-guide links, and the blog list.
export const guidePosts = Object.freeze([
  calibratePdfDrawingScale,
  whyPdfMeasurementsAreWrong,
  measurePdfAreaCutoutsDepth,
  pdfTakeoffWorkedExample,
  countPdfSymbols,
  pdfMarkupTableRfiPunchList,
  comparePdfDrawingRevisions,
  createFillablePdfForm,
  ocrScannedPdfDrawings,
  digitalSignatureVsVisualSignatureVsSeal,
  redactAndSanitizePdf,
  prepareIssuedPdfSet
]);

export default guidePosts;
