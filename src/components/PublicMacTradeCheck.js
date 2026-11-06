import React from 'react';
import SampleLink from './SampleLink';
import './TakeoffEvaluation.css';

const BASE = '/samples/evaluation/public-mac-1.6.27-99';

const checks = {
  flooring: {
    heading: 'Flooring check: F1 and F2 areas on the Willow Creek I101 practice plan',
    summary: <>On November 5, 2026, the PolyPDF publisher measured the Willow Creek I101 finish plan in the public Mac 1.6.27 build 99 app, on Free. The worksheet shows <strong>5,184 sq ft of F1 resilient flooring</strong> and <strong>576 sq ft of F2 porcelain tile</strong> (288 + 288), matching the schedule printed on the sheet. Both values were unchanged after quitting and reopening the app.</>,
    limits: 'I101 is a synthetic practice drawing, not for construction. These are finish-zone quantities to room dimension boundaries, with no wall-thickness deductions and no waste. They are not net installed flooring. Three areas use the whole Free allowance. Windows and Pro workflows were not part of this check.',
    pdf: 'willow-creek-i101-measured.pdf',
    csv: 'willow-creek-i101-takeoff.csv',
    record: 'flooring-verification.html',
    label: 'I101',
    recordLabel: 'Read the flooring test method and limits',
  },
  electrical: {
    heading: 'Electrical check: a 46 ft drawn route on the Willow Creek E101 practice plan',
    summary: <>On November 5, 2026, the PolyPDF publisher measured the LP-1 route on Willow Creek E101 in the public Mac 1.6.27 build 99 app, on Free. The saved worksheet shows <strong>46 ft</strong>, matching the centerline printed on the sheet, and the saved drawing labels its 8 ft and 38 ft segments. The total was unchanged after quitting and reopening the app. Each hand-placed Count mark used one of Free&rsquo;s 3 measurements, so the route plus two marks reached the limit. The marks were removed before saving, so the files hold the route only.</>,
    limits: 'E101 is a synthetic practice drawing, not for construction. The 46 ft is drawn circuit-diagram geometry, not conduit or wire to order. The 24 luminaire and 18 receptacle counts were not run, and Symbol Search, Pro workflows and Windows were not part of this check.',
    pdf: 'willow-creek-e101-measured.pdf',
    csv: 'willow-creek-e101-takeoff.csv',
    record: 'electrical-verification.html',
    label: 'E101',
    recordLabel: 'Read the electrical test method and limits',
  },
};

export default function PublicMacTradeCheck({ kind }) {
  const check = checks[kind];
  if (!check) return null;
  const source = `${kind}_public_mac_check`;
  return <section className="takeoff-evaluation" aria-labelledby={`${kind}-public-mac-check`}>
    <div className="container">
      <p className="growth-kicker">Publisher test · public Mac 1.6.27 build 99</p>
      <h2 id={`${kind}-public-mac-check`}>{check.heading}</h2>
      <div className="public-mac-takeoff-check">
        <p>{check.summary}</p>
        <p><SampleLink href={`${BASE}/${check.pdf}`} source={source} feature="saved_measured_pdf">Download the saved {check.label} drawing (PDF)</SampleLink> · <SampleLink href={`${BASE}/${check.csv}`} source={source} feature="worksheet_csv">Download the worksheet export (CSV)</SampleLink></p>
        <p><a href={`${BASE}/${check.record}`}>{check.recordLabel}</a></p>
        <p className="takeoff-small">{check.limits}</p>
      </div>
    </div>
  </section>;
}
