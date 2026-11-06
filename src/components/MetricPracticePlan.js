import React from 'react';
import SampleLink from './SampleLink';
import './TakeoffEvaluation.css';

const sheet = '/samples/metric/polypdf-metric-practice-plan-en.pdf';
const preview = '/samples/metric/previews/polypdf-metric-practice-plan-en';
const record = '/samples/evaluation/public-mac-1.6.29-101/metric-verification.html';

// A plan drawn in metres. Translated pages replace "-en" in these paths with the reader's language where
// a translated sheet exists; see localizeMetricPlan in scripts/international/content.cjs.
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
          <li>Click Calibrate by Drawing Line, drag along the printed 10 m scale bar, and enter 10.</li>
          <li>Check the 40.00 m width and the 20.00 m depth. Stop if either reading disagrees with the drawing.</li>
          <li>Trace the outside boundary: 800.00 sq m gross area, including walls. Review the worksheet, export it, save a copy, and reopen the PDF to check all three measurements.</li>
        </ol>
        <p>The width, depth, and gross area use the three-measurement Free allowance. For flooring, open a second copy of the sheet, set Length to Meters, calibrate it, and trace one outline around the two shaded F2 rooms. Take the bottom edge to the outer face of the wall, where the dimension lines end: 85.00 sq m, with no wall deductions or waste.</p>
        <p>On November 6, 2026, the PolyPDF publisher followed these steps in public Mac 1.6.29 build 101 on the French sheet, and measured the German sheet using the Metric button on the Scale tab. Both gave 40.00 m, 20.00 m, and 800.00 sq m, and those values were unchanged after saving the PDF and restarting the app with Unit system on Metric. The French sheet gave 85.00 sq m for F2.</p>
      </div>
      <div className="takeoff-practice-files">
        <h3>Download the metric sheet</h3>
        <SampleLink href={sheet} source={source} feature="metric_practice_drawing" data-metric-sheet="">
          <img className="takeoff-practice-preview" data-metric-sheet="" src={`${preview}-1600.webp`} srcSet={`${preview}-800.webp 800w, ${preview}-1600.webp 1600w`} sizes="(max-width: 900px) 100vw, 560px" alt="Fictional metric floor plan and floor finish plan on an A1 sheet at 1:100" width="1600" height="1130" loading="lazy" />
          <span>Download the metric practice plan · PDF</span>
        </SampleLink>
        <p className="takeoff-small">The German, French, Spanish, and Brazilian Portuguese versions of this page link to a sheet with labels in that language.</p>
        <p><a href={record} hrefLang="en">Read the test method and download the saved PDFs and CSVs (English)</a></p>
        <ul>
          <li className="takeoff-small">If Unit system stays on Imperial, PolyPDF reopens a saved metric PDF in feet and inches. The 40 m width then shows as 131'-2 3/4". The measurement is the same; only the display changes.</li>
          <li className="takeoff-small">In Apple Preview, the saved German PDF showed the area label but not the two dimension labels. Windows and Adobe Acrobat were not checked.</li>
          <li className="takeoff-small">This plan is fictional and not for construction. It was not reviewed by a local construction professional or checked against any national drawing standard.</li>
        </ul>
      </div>
    </div>
  </section>;
}
