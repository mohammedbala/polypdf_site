import React, { useEffect, useRef, useState } from 'react';
import { checkScale, convertLength, LENGTH_UNITS, scaleFields, scaleCheckCSV } from '../lib/scaleCheck';
import { trackEvent } from '../lib/analytics';
const empty = { horizontalKnown: '', horizontalMeasured: '', verticalKnown: '', verticalMeasured: '', tolerance: '', unit: 'ft' };
const example = { horizontalKnown: '20', horizontalMeasured: '20.2', verticalKnown: '12', verticalMeasured: '12', tolerance: '0.5', unit: 'ft' };
const format = value => new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);

export default function ScaleChecker() {
  const [input, setInput] = useState(empty);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const resultHeading = useRef(null);
  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);
  const clearResult = () => { setResult(null); setErrors({}); };
  const update = (key, value) => { setInput(current => ({ ...current, [key]: value })); clearResult(); };
  const changeUnit = unit => {
    const converted = Object.fromEntries(scaleFields.map(key => [key, convertLength(input[key], input.unit, unit)]));
    if (scaleFields.some(key => input[key] !== '' && (!Number.isFinite(Number(converted[key])) || (Number(input[key]) > 0 && Number(converted[key]) === 0)))) {
      setResult(null);
      setErrors({ general: 'These values cannot be converted to that unit. Check the lengths first.' });
      return;
    }
    setInput(current => ({ ...current, ...converted, unit }));
    clearResult();
  };
  const submit = event => {
    event.preventDefault();
    const next = checkScale(input);
    setErrors(next.errors);
    if (Object.keys(next.errors).length) {
      setResult(null);
      document.getElementById(`scale-${Object.keys(next.errors)[0]}`)?.focus();
      return;
    }
    setResult(next);
    trackEvent('calculator_complete', { source: 'scale_checker', feature: 'scale_verification' });
  };
  const exportCSV = () => {
    const url = URL.createObjectURL(new Blob([scaleCheckCSV(result)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'pdf-scale-check.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    trackEvent('calculator_export', { source: 'scale_checker', feature: 'scale_verification' });
  };
  const field = (key, label) => <div className="growth-field">
    <label htmlFor={`scale-${key}`}>{label}</label>
    <input id={`scale-${key}`} type="number" inputMode="decimal" step="any" value={input[key]} onChange={event => update(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `scale-${key}-error` : undefined} />
    {errors[key] && <span className="growth-error" id={`scale-${key}-error`}>{errors[key]}</span>}
  </div>;
  return <div className="growth-calculator scale-checker" id="scale-check">
    <form onSubmit={submit} noValidate aria-label="PDF scale accuracy check">
      <div className="growth-field"><label htmlFor="scale-unit">Length unit</label><select id="scale-unit" value={input.unit} onChange={event => changeUnit(event.target.value)}>{Object.entries(LENGTH_UNITS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select><small>All lengths use this unit. Changing it converts your entered values. Enter decimal feet: 12 feet 6 inches is 12.5 ft.</small></div>
      {['horizontal', 'vertical'].map(direction => <fieldset key={direction}><legend>{direction === 'horizontal' ? 'Horizontal' : 'Vertical'} reference ({input.unit})</legend><div className="scale-reference-fields">{field(`${direction}Known`, 'Known dimension')}{field(`${direction}Measured`, 'PDF measurement')}</div></fieldset>)}
      <div>{field('tolerance', 'Allowed error (%)')}<p className="scale-hint">Use the tolerance agreed for your project. No tolerance is selected by default. The worked example uses 0.5% only to demonstrate the calculation.</p></div>
      {errors.general && <p className="growth-error">{errors.general}</p>}
      {Object.keys(errors).length > 0 && <p role="alert">Check the highlighted fields before comparing.</p>}
      <div className="growth-result-actions"><button className="primary-btn" type="submit">Check reference spans</button><button type="button" onClick={() => { setInput(example); clearResult(); }}>Load worked example</button><button type="button" onClick={() => { setInput(empty); clearResult(); }}>Clear</button></div>
      <p className="scale-hint">Your entries stay in this browser. No PDF upload or account is needed.</p>
      <noscript><p>Enable JavaScript to calculate here, or use the worked formula below.</p></noscript>
    </form>
    <section className="growth-results" aria-labelledby="scale-results-heading">
      <p className="growth-kicker">Reference check</p><h2 id="scale-results-heading" tabIndex="-1" ref={resultHeading}>Your scale check</h2>
      {result ? <><p className="scale-result-verdict"><strong>{result.withinTolerance ? 'Both reference spans are within your entered tolerance.' : 'Recheck the drawing before relying on these quantities.'}</strong></p>
        <p>Entered tolerance: {format(result.tolerance)}%. Positive error means the PDF reading is longer than the known dimension; negative means shorter.</p>
        {result.checks.map(check => <div className="scale-result-row" key={check.direction}><h3>{check.direction === 'horizontal' ? 'Horizontal' : 'Vertical'} reference</h3><p>{format(check.measured)} {result.unit} measured / {format(check.known)} {result.unit} known</p><p><strong>{format(check.errorPercent)}% error</strong> · {check.withinTolerance ? 'Within entered tolerance' : 'Outside entered tolerance'}</p></div>)}
        <p>Difference between the two signed errors (percentage points): {format(result.directionalDifference)}. A difference can come from endpoint placement, units or distortion. It does not identify the cause.</p>
        <p>Only these spans were checked. Agreement does not certify the entire sheet; check other locations and separately scaled details. Recalibrate and repeat when required checks fail.</p>
        <div className="growth-result-actions"><button type="button" onClick={exportCSV}>Download check CSV</button><button type="button" onClick={() => window.print()}>Print check</button></div>
      </> : <p>Enter known dimensions and the readings from your calibrated PDF, then choose the allowed error. Use independent spans in both directions, away from the original calibration line.</p>}
    </section>
  </div>;
}
