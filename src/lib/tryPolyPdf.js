const UNIT_DEFINITIONS = Object.freeze({
  ft: { label: 'Feet', short: 'ft', area: 'sq ft' },
  in: { label: 'Inches', short: 'in', area: 'sq in' },
  m: { label: 'Metres', short: 'm', area: 'sq m' },
  cm: { label: 'Centimetres', short: 'cm', area: 'sq cm' }
});

export const TRY_PDF_UNITS = Object.freeze(Object.keys(UNIT_DEFINITIONS));

export const SAMPLE_CALIBRATION = Object.freeze({
  unit: 'ft',
  unitsPerPoint: 1 / 12,
  description: 'Sample scale: 12 PDF points = 1 ft'
});

export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const distanceBetween = (first, second) => Math.hypot(
  second.x - first.x,
  second.y - first.y
);

export const polygonArea = (points) => {
  if (points.length < 3) return 0;
  let doubledArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    doubledArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(doubledArea) / 2;
};

const formatNumber = (value, maximumFractionDigits = 2) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits,
  minimumFractionDigits: value > 0 && value < 10 ? Math.min(1, maximumFractionDigits) : 0
}).format(value);

export const formatDistance = (pdfPoints, calibration) => {
  if (!calibration) return `${formatNumber(pdfPoints, 1)} pt`;
  const unit = UNIT_DEFINITIONS[calibration.unit] || UNIT_DEFINITIONS.ft;
  return `${formatNumber(pdfPoints * calibration.unitsPerPoint)} ${unit.short}`;
};

export const formatArea = (pdfSquarePoints, calibration) => {
  if (!calibration) return `${formatNumber(pdfSquarePoints)} sq pt`;
  const unit = UNIT_DEFINITIONS[calibration.unit] || UNIT_DEFINITIONS.ft;
  return `${formatNumber(pdfSquarePoints * calibration.unitsPerPoint ** 2)} ${unit.area}`;
};

export const formatCalibration = (calibration) => {
  if (!calibration) return 'Scale not set';
  if (calibration.description) return calibration.description;
  const unit = UNIT_DEFINITIONS[calibration.unit] || UNIT_DEFINITIONS.ft;
  const pointsPerUnit = 1 / calibration.unitsPerPoint;
  return `${formatNumber(pointsPerUnit, 2)} PDF pt = 1 ${unit.short}`;
};

export const annotationLabel = (annotation, calibration, countIndex) => {
  if (annotation.type === 'distance') {
    return formatDistance(distanceBetween(annotation.points[0], annotation.points[1]), calibration);
  }
  if (annotation.type === 'area') {
    return formatArea(polygonArea(annotation.points), calibration);
  }
  if (annotation.type === 'count') return String(countIndex ?? 1);
  return '';
};

export const viewportPoint = (point, transform) => ({
  x: transform[0] * point.x + transform[2] * point.y + transform[4],
  y: transform[1] * point.x + transform[3] * point.y + transform[5]
});

export const pdfPoint = (point, transform) => {
  const [a, b, c, d, e, f] = transform;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < Number.EPSILON) return { x: 0, y: 0 };
  const translatedX = point.x - e;
  const translatedY = point.y - f;
  return {
    x: (d * translatedX - c * translatedY) / determinant,
    y: (-b * translatedX + a * translatedY) / determinant
  };
};

export const moveAnnotation = (annotation, delta) => ({
  ...annotation,
  points: annotation.points.map((point) => ({
    x: point.x + delta.x,
    y: point.y + delta.y
  }))
});

export const annotationBounds = (annotation) => {
  const xs = annotation.points.map((point) => point.x);
  const ys = annotation.points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(1, Math.max(...ys) - Math.min(...ys))
  };
};

export const calibrationFromReference = ({ first, second, distance, unit }) => {
  const referenceLength = distanceBetween(first, second);
  const parsedDistance = Number(distance);
  if (!Number.isFinite(parsedDistance) || parsedDistance <= 0 || referenceLength < 0.01) return null;
  return {
    unit: TRY_PDF_UNITS.includes(unit) ? unit : 'ft',
    unitsPerPoint: parsedDistance / referenceLength
  };
};

export const appendHistory = (history, nextAnnotations) => ({
  past: [...history.past, history.present].slice(-60),
  present: nextAnnotations,
  future: []
});

export const undoHistory = (history) => {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past.at(-1),
    future: [history.present, ...history.future]
  };
};

export const redoHistory = (history) => {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1)
  };
};

const hexToRgb = (hex, rgb) => {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((character) => `${character}${character}`).join('')
    : normalized, 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  );
};

const drawArrowHead = (page, start, end, options) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = 10;
  for (const offset of [Math.PI * 0.82, -Math.PI * 0.82]) {
    page.drawLine({
      start: end,
      end: {
        x: end.x + Math.cos(angle + offset) * length,
        y: end.y + Math.sin(angle + offset) * length
      },
      ...options
    });
  }
};

const drawLabel = ({ page, font, text, point, color, rgb }) => {
  if (!text) return;
  const fontSize = 9;
  const width = font.widthOfTextAtSize(text, fontSize) + 8;
  page.drawRectangle({
    x: point.x - width / 2,
    y: point.y - 5,
    width,
    height: 14,
    color: rgb(1, 1, 1),
    opacity: 0.9
  });
  page.drawText(text, {
    x: point.x - width / 2 + 4,
    y: point.y - 1,
    size: fontSize,
    font,
    color
  });
};

const annotationMidpoint = (annotation) => {
  if (annotation.type === 'area') {
    return annotation.points.reduce((sum, point) => ({
      x: sum.x + point.x / annotation.points.length,
      y: sum.y + point.y / annotation.points.length
    }), { x: 0, y: 0 });
  }
  return {
    x: (annotation.points[0].x + annotation.points.at(-1).x) / 2,
    y: (annotation.points[0].y + annotation.points.at(-1).y) / 2
  };
};

const drawAnnotation = ({ page, annotation, color, font, label, rgb }) => {
  const points = annotation.points;
  const commonLine = { color, thickness: annotation.type === 'highlight' ? 12 : 2, opacity: annotation.type === 'highlight' ? 0.28 : 1 };

  if (annotation.type === 'distance' || annotation.type === 'arrow' || annotation.type === 'highlight') {
    page.drawLine({ start: points[0], end: points[1], ...commonLine });
    if (annotation.type === 'arrow') drawArrowHead(page, points[0], points[1], commonLine);
  } else if (annotation.type === 'area') {
    points.forEach((point, index) => {
      page.drawLine({ start: point, end: points[(index + 1) % points.length], ...commonLine });
    });
  } else if (annotation.type === 'rectangle') {
    const bounds = annotationBounds(annotation);
    page.drawRectangle({ ...bounds, borderColor: color, borderWidth: 2 });
  } else if (annotation.type === 'ellipse') {
    const bounds = annotationBounds(annotation);
    page.drawEllipse({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      xScale: bounds.width / 2,
      yScale: bounds.height / 2,
      borderColor: color,
      borderWidth: 2
    });
  } else if (annotation.type === 'count') {
    page.drawCircle({ x: points[0].x, y: points[0].y, size: 9, color: rgb(1, 1, 1), borderColor: color, borderWidth: 2 });
    const countText = label || '1';
    const textWidth = font.widthOfTextAtSize(countText, 8);
    page.drawText(countText, {
      x: points[0].x - textWidth / 2,
      y: points[0].y - 3,
      size: 8,
      font,
      color
    });
  }

  if (annotation.type === 'distance' || annotation.type === 'area') {
    drawLabel({ page, font, text: label, point: annotationMidpoint(annotation), color, rgb });
  }
};

export const exportAnnotatedPdf = async ({ bytes, annotations, calibration, filename }) => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.load(bytes.slice(), { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const countsByPage = new Map();

  for (const annotation of annotations) {
    const page = pdf.getPages()[annotation.page - 1];
    if (!page) continue;
    const countIndex = annotation.type === 'count'
      ? (countsByPage.get(annotation.page) || 0) + 1
      : undefined;
    if (countIndex) countsByPage.set(annotation.page, countIndex);
    const color = hexToRgb(annotation.color || '#cc2418', rgb);
    drawAnnotation({
      page,
      annotation,
      color,
      font,
      label: annotationLabel(annotation, calibration, countIndex),
      rgb
    });
  }

  const output = await pdf.save();
  return {
    bytes: output,
    filename: filename.replace(/\.pdf$/i, '') + '-marked-up.pdf'
  };
};

export const downloadBytes = (bytes, filename) => {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
