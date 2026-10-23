export const LENGTH_UNITS = { ft: 'Feet', in: 'Inches', m: 'Metres', mm: 'Millimetres' };
const metres = { ft: 0.3048, in: 0.0254, m: 1, mm: 0.001 };
const number = value => value === '' || value == null || (typeof value === 'string' && !value.trim()) ? NaN : Number(value);
export const scaleFields = ['horizontalKnown', 'horizontalMeasured', 'verticalKnown', 'verticalMeasured'];

export function checkScale(input) {
  const errors = {};
  const values = Object.fromEntries(scaleFields.map(key => [key, number(input[key])]));
  for (const key of scaleFields) {
    if (!Number.isFinite(values[key]) || values[key] <= 0) errors[key] = 'Enter a length greater than zero.';
  }
  const tolerance = number(input.tolerance);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 100) errors.tolerance = 'Enter your project tolerance from 0 to 100%.';
  if (!Object.hasOwn(LENGTH_UNITS, input.unit)) errors.unit = 'Choose a length unit.';
  if (Object.keys(errors).length) return { errors };
  const checks = ['horizontal', 'vertical'].map(direction => {
    const known = values[`${direction}Known`];
    const measured = values[`${direction}Measured`];
    const difference = measured - known;
    const errorPercent = difference / known * 100;
    // Permit only floating-point noise at the entered tolerance boundary.
    const withinTolerance = Math.abs(difference) <= known * tolerance / 100 + Number.EPSILON * Math.max(known, measured) * 8;
    return { direction, known, measured, difference, errorPercent, withinTolerance };
  });
  const directionalDifference = Math.abs(checks[0].errorPercent - checks[1].errorPercent);
  if (!checks.every(check => Number.isFinite(check.errorPercent)) || !Number.isFinite(directionalDifference)) {
    return { errors: { general: 'These lengths are too far apart to calculate. Check the values and units.' } };
  }
  return { errors: {}, checks, unit: input.unit, tolerance, directionalDifference, withinTolerance: checks.every(check => check.withinTolerance) };
}

export function convertLength(value, from, to) {
  if (value === '' || from === to || !Number.isFinite(number(value))) return value;
  const converted = number(value) * metres[from] / metres[to];
  return String(Number(converted.toPrecision(15)));
}

export function scaleCheckCSV(result) {
  const rows = [
    ['Direction', 'Known length', 'Measured length', 'Unit', 'Difference', 'Signed error (%)', 'Entered tolerance (%)', 'Result'],
    ...result.checks.map(check => [check.direction, check.known, check.measured, result.unit, check.difference, check.errorPercent, result.tolerance, check.withinTolerance ? 'Within entered tolerance' : 'Outside entered tolerance']),
    ['Scope', 'Only these two reference spans were compared. This is not whole-sheet accuracy or construction approval.'],
    ['Method', '(measured - known) / known * 100; compare absolute error with the entered tolerance.'],
    ['Next step', 'Check additional locations and units. Recalibrate or obtain a better source when required checks fail.'],
    ['Source', 'https://www.polypdf.com/tools/pdf-scale-checker/']
  ];
  return '\uFEFF' + rows.map(row => row.map(value => `"${String(typeof value === 'number' ? Number(value.toPrecision(12)) : value).replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
}
