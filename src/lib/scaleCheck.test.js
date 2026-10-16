import { checkScale, convertLength, scaleCheckCSV } from './scaleCheck';
const values = { horizontalKnown: '20', horizontalMeasured: '20.2', verticalKnown: '12', verticalMeasured: '12', tolerance: '0.5', unit: 'ft' };
test('independent directions catch an error that averaging would hide', () => {
  const result = checkScale(values);
  expect(result.withinTolerance).toBe(false);
  expect(result.checks[0].errorPercent).toBeCloseTo(1);
  expect(result.checks[0].withinTolerance).toBe(false);
  expect(result.checks[1].errorPercent).toBe(0);
  expect(result.checks[1].withinTolerance).toBe(true);
});
test('compares absolute signed error and accepts only arithmetic noise at the boundary', () => {
  expect(checkScale({ ...values, horizontalMeasured: '19.9' }).checks[0].withinTolerance).toBe(true);
  expect(checkScale({ ...values, horizontalMeasured: '20.1' }).checks[0].withinTolerance).toBe(true);
  expect(checkScale({ ...values, horizontalMeasured: '20.10001' }).checks[0].withinTolerance).toBe(false);
  expect(checkScale({ ...values, horizontalMeasured: '19.8' }).checks[0].errorPercent).toBeCloseTo(-1);
  expect(checkScale({ ...values, horizontalMeasured: '20', tolerance: '0' }).withinTolerance).toBe(true);
});
test.each([{ horizontalKnown: '' }, { horizontalMeasured: '0' }, { verticalKnown: '-12' }, { verticalMeasured: 'Infinity' }, { tolerance: '' }, { tolerance: '101' }, { unit: '=CMD()' }, { horizontalKnown: '1e-300', horizontalMeasured: '1e300' }])('rejects invalid or unrepresentable values %j', change => {
  expect(Object.keys(checkScale({ ...values, ...change }).errors).length).toBeGreaterThan(0);
});
test('unit changes preserve the error and tolerance decision', () => {
  const converted = { ...values, unit: 'mm' };
  for (const key of ['horizontalKnown', 'horizontalMeasured', 'verticalKnown', 'verticalMeasured']) converted[key] = convertLength(values[key], 'ft', 'mm');
  const result = checkScale(converted);
  expect(result.checks[0].known).toBeCloseTo(6096);
  expect(result.checks[0].errorPercent).toBeCloseTo(1);
  expect(result.withinTolerance).toBe(false);
  expect(convertLength('', 'ft', 'mm')).toBe('');
});
test('CSV records input, signed error, tolerance and limited scope', () => {
  const csv = scaleCheckCSV(checkScale(values));
  expect(csv).toContain('"horizontal","20","20.2","ft","0.2","1","0.5","Outside entered tolerance"');
  expect(csv).toContain('not whole-sheet accuracy');
  expect(csv).not.toMatch(/NaN|undefined|Infinity/);
});
