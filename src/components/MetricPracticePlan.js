import React from 'react';
import SampleLink from './SampleLink';
import './TakeoffEvaluation.css';

const sheet = '/samples/metric/polypdf-metric-practice-plan-en.pdf';
const preview = '/samples/metric/previews/polypdf-metric-practice-plan-en';
const record = '/samples/evaluation/public-mac-1.6.29-101/metric-verification.html';

// A plan drawn in metres. Each translated page replaces "-en" in these paths with its own market's sheet;
// see localizeMetricPlan in scripts/international/content.cjs.
export default function MetricPracticePlan({ source }) {
  return <section id="metric-plan" className="takeoff-decision metric-plan" aria-labelledby="metric-plan-title">
    <div className="container takeoff-decision-grid">
      <div>
        <p className="growth-kicker">Plans drawn in metres</p>
        <h2 id="metric-plan-title">Measure a metric plan at 1:100</h2>
        <p>Use this fictional A1 sheet if your drawings are in metres. It has a floor plan, a floor finish plan, a room schedule, and a 10 m scale bar.</p>
        <ol className="takeoff-evaluation-steps">
          <li>In Settings, under Measurements, set Unit system to Metric. PolyPDF starts on Imperial, and this choice applies to every PDF you open.</li>
          <li>Open the sheet and turn on View &gt; Snap to Content. In the Measurements panel, under Formatting, set Length to Meters, so a plain 10 means 10 m.</li>
          <li>Click Calibrate by Drawing Line and drag along the printed 10 m scale bar. If the box says “between snapped endpoints”, enter 10. If it does not, cancel and drag again.</li>
          <li>With Linear Dimension, check the 40.00 m width from wall corner to wall corner. Stop if the reading disagrees with the drawing.</li>
          <li>Zoom in and trace the outside boundary with Area: 800.00 sq m gross area, including walls. On the finish plan, trace the two shaded F2 rooms the same way, taking the bottom edge to the outer face of the wall: 85.00 sq m.</li>
        </ol>
        <p>Calibrating does not use up a measurement, so these three fit the Free allowance. The worksheet adds the two areas into one total, so read each on its own label. Neither area deducts walls or adds waste.</p>
        <p>On November 6, 2026, the PolyPDF publisher followed these steps in public Mac 1.6.29 build 101 on this sheet. The readings were 40.00 m, 800.00 sq m, and 85.00 sq m. A saved copy of the German sheet kept its values after restarting the app with Unit system on Metric.</p>
      </div>
      <div className="takeoff-practice-files">
        <h3>Download the metric sheet</h3>
        <SampleLink href={sheet} source={source} feature="metric_practice_drawing" data-metric-sheet="">
          <img className="takeoff-practice-preview" data-metric-sheet="" src={`${preview}-1600.webp`} srcSet={`${preview}-800.webp 800w, ${preview}-1600.webp 1600w`} sizes="(max-width: 900px) 100vw, 560px" alt="Fictional metric floor plan and floor finish plan on an A1 sheet at 1:100" width="1600" height="1130" loading="lazy" />
          <span>Download the metric practice plan · PDF</span>
        </SampleLink>
        <p className="takeoff-small">Each language version of this page offers its own plan, drawn for one market. The test record lists them all.</p>
        <p><a href={record} hrefLang="en">Read the test method and download the saved PDFs and CSVs (English)</a></p>
        <ul>
          <li className="takeoff-small">If Unit system stays on Imperial, PolyPDF reopens a saved metric PDF in feet and inches. The measurement is the same; only the display changes.</li>
          <li className="takeoff-small">In Apple Preview, the saved German PDF showed the area labels but not the dimension label. Windows and Adobe Acrobat were not checked.</li>
          <li className="takeoff-small">This plan is fictional and not for construction. It was not reviewed by a local construction professional or checked against any national drawing standard.</li>
        </ul>
      </div>
    </div>
  </section>;
}
