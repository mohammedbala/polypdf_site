import React, { useEffect } from 'react';
import { Link } from 'react-router';
import PlanComparison from './PlanComparison';
import { SampleLink } from './GrowthEvidence';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';

export default function TakeoffEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#free-vs-pro', '#try-a-takeoff'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);
  return <>
    <section className="takeoff-decision" aria-labelledby="free-vs-pro">
      <div className="container">
        <p className="growth-kicker">Choose the edition for your work</p>
        <div className="takeoff-decision-grid">
          <div>
            <h2 id="free-vs-pro">Free takeoff or Pro: what do you need?</h2>
            <p>Start with Free to check a drawing, review markups, and create up to 3 hand-created measurements per document. There is no trial timer. Choose Pro when your takeoff needs more measurements, Symbol Search, or another Pro workflow.</p>
            <dl className="takeoff-license-facts">
              <div><dt>Personal Pro license</dt><dd><strong>{commercialOffer.price} USD, one payment.</strong> No subscription. Applicable taxes are shown at checkout.</dd></div>
              <div><dt>Computers and updates</dt><dd>{licenseRightsText}</dd></div>
              <div><dt>Direct website purchases</dt><dd>{commercialOffer.moneyBackGuaranteeDays}-day money-back guarantee. <Link to="/refund/">Refund policy</Link>.</dd></div>
            </dl>
            <p><Link to="/buy/?source=takeoff_plan_comparison">Review Pro pricing and purchase →</Link></p>
            <p className="takeoff-small">A personal license's computer allowance is not a team seat allocation. <Link to="/teams/">Review licensing for organization-managed seats</Link>.</p>
          </div>
          <PlanComparison />
        </div>
        <p className="takeoff-fit"><strong>Check the workflow as well as the price.</strong> PolyPDF records drawing quantities for review and export. Material prices, labor, allowances, and project scope still need your estimating judgment. If a project requires Bluebeam Studio, PolyPDF cannot join it. <Link to="/bluebeam-alternative/#handoff-checklist">Check your required handoff before switching</Link>.</p>
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="try-a-takeoff">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Evaluate before buying</p>
          <h2 id="try-a-takeoff">Try a three-measurement takeoff.</h2>
          <p>Use the synthetic flooring drawing to test a small workflow within the Free limit. Its two net room areas total 408 sq ft. This is a practice drawing, not a construction document.</p>
          <ol className="takeoff-evaluation-steps">
            <li><strong>Calibrate and check.</strong> Open the practice PDF and calibrate using a printed dimension. Use your first measurement to check a different known span. Stop and resolve any mismatch before taking off quantities.</li>
            <li><strong>Measure the two net areas.</strong> Trace Room 1 around its edge-connected exclusion: 240 − 12 = 228 sq ft. Trace Room 2: 180 sq ft. With the check measurement, that uses three hand-created measurements.</li>
            <li><strong>Review, export, and reopen.</strong> Check the two area rows total 408 sq ft. Keep the length check separate from the area total. Export the worksheet, save a separate PDF copy, and reopen it to inspect your measurements.</li>
          </ol>
          <p><Link to="/blog/calibrate-pdf-drawing-scale/">Calibration guide</Link> · <Link to="/flooring-takeoff-software/">Flooring workflow</Link> · <Link to="/tools/flooring-waste-calculator/">Add your waste allowance</Link></p>
        </div>
        <div className="takeoff-practice-files">
          <h3 id="takeoff-files-title">Start with the drawing. Check the outputs.</h3>
          <ul>
            <li><SampleLink href="/samples/takeoff/flooring-practice.pdf" source="takeoff_evaluation">Download the flooring practice drawing · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-reference.pdf" source="takeoff_evaluation">Reference calculations · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-measured.pdf" source="takeoff_evaluation">Saved Mac measurements · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-worksheet.csv" source="takeoff_evaluation">Mac worksheet export · CSV</SampleLink></li>
          </ul>
          <p>No account or email is required for these files.</p>
          <p className="takeoff-small">The 408 sq ft area result was exported and reopened in PolyPDF 1.6.6 build 38 on Mac. These files verify those two area measurements; they do not establish current-release or Windows parity. The three-measurement sequence above is an evaluation guide, not a separately verified app test.</p>
          <Link to="/samples/">See all samples and verification details →</Link>
        </div>
      </div>
    </section>
  </>;
}
