import {
  SAMPLE_CALIBRATION,
  annotationLabel,
  appendHistory,
  calibrationFromReference,
  exportAnnotatedPdf,
  formatCalibration,
  pdfPoint,
  polygonArea,
  redoHistory,
  undoHistory,
  viewportPoint
} from './tryPolyPdf';
import { PDFDocument } from 'pdf-lib';

test('keeps PDF.js compatible with the production Node 18 build', () => {
  const pdfJsPackage = require('pdfjs-dist/package.json');
  expect(pdfJsPackage.engines.node).toContain('18');
});

test('maps points through a rotated PDF viewport without losing coordinates', () => {
  const transform = [0, 0.5, 0.5, 0, 10, 20];
  const source = { x: 144, y: 72 };
  const displayed = viewportPoint(source, transform);

  expect(displayed).toEqual({ x: 46, y: 92 });
  expect(pdfPoint(displayed, transform)).toEqual(source);
});

test('calibrates the owned sample baseline to its documented 12 points per foot', () => {
  const calibration = calibrationFromReference({
    first: { x: 0, y: 0 },
    second: { x: 240, y: 0 },
    distance: '20',
    unit: 'ft'
  });

  expect(calibration).toEqual({ unit: 'ft', unitsPerPoint: 1 / 12 });
  expect(formatCalibration(calibration)).toBe('12 PDF pt = 1 ft');
  expect(formatCalibration(SAMPLE_CALIBRATION)).toBe('Sample scale: 12 PDF points = 1 ft');
});

test('formats calibrated distance and area records', () => {
  const distance = {
    type: 'distance',
    points: [{ x: 0, y: 0 }, { x: 120, y: 0 }]
  };
  const area = {
    type: 'area',
    points: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 120 }, { x: 0, y: 120 }]
  };

  expect(annotationLabel(distance, SAMPLE_CALIBRATION)).toBe('10 ft');
  expect(polygonArea(area.points)).toBe(14400);
  expect(annotationLabel(area, SAMPLE_CALIBRATION)).toBe('100 sq ft');
});

test('undo and redo preserve complete annotation snapshots', () => {
  const first = [{ id: 'one' }];
  const second = [...first, { id: 'two' }];
  const history = appendHistory(appendHistory({ past: [], present: [], future: [] }, first), second);
  const undone = undoHistory(history);

  expect(undone.present).toEqual(first);
  expect(undone.future).toEqual([second]);
  expect(redoHistory(undone).present).toEqual(second);
});

test('writes browser markups into a valid downloadable PDF copy', async () => {
  const source = await PDFDocument.create();
  source.addPage([300, 200]);
  const sourceBytes = await source.save();
  const output = await exportAnnotatedPdf({
    bytes: sourceBytes,
    filename: 'plan.pdf',
    calibration: SAMPLE_CALIBRATION,
    annotations: [
      {
        id: 'distance-1',
        type: 'distance',
        page: 1,
        color: '#176b71',
        points: [{ x: 30, y: 40 }, { x: 150, y: 40 }]
      },
      {
        id: 'rectangle-1',
        type: 'rectangle',
        page: 1,
        color: '#cc2418',
        points: [{ x: 40, y: 70 }, { x: 130, y: 140 }]
      }
    ]
  });

  expect(output.filename).toBe('plan-marked-up.pdf');
  expect(output.bytes.byteLength).toBeGreaterThan(sourceBytes.byteLength);
  const reopened = await PDFDocument.load(output.bytes);
  expect(reopened.getPageCount()).toBe(1);
});
