import SampleDrawingNote from './SampleDrawingNote';
import './ConstructionLibrary.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import { SampleLink } from './GrowthEvidence';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';
import './SymbolCountEvaluation.css';

export default function SymbolCountEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#counting-options', '#check-symbol-count'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  return <>
    <section className="takeoff-decision" aria-labelledby="counting-options">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Choose the counting workflow</p>
          <h2 id="counting-options">Inspect the drawing in Free. Run Symbol Search with Pro.</h2>
          <p>Free opens the practice PDF for review, markup, and calibration, with up to 3 hand-created measurements per document. It does not run Symbol Search. Activate Pro to capture a symbol, review matching candidates, and commit the accepted count series.</p>
          <p>Use Symbol Search for repeated construction graphics such as fixtures, outlets, or diffusers. Use text search or OCR when you need words and labels. A symbol count is not a word count, a circuit design, or a priced estimate.</p>
          <p><strong>Personal Pro: {commercialOffer.price} USD, one payment.</strong> {licenseRightsText}</p>
          <p><Link to="/buy/?source=symbol_count_evaluation">Review Pro pricing and license terms →</Link></p>
          <p><Link to="/pdf-takeoff-software/#free-vs-pro">Compare all Free and Pro takeoff features →</Link></p>
        </div>
        <div className="takeoff-practice-files">
          <h3>Start with a file you can inspect.</h3>
          <p>Download the free app to check whether your drawings open and review correctly. The automatic counting exercise below requires Pro; downloading the app does not unlock Symbol Search.</p>
          <DownloadCTA source="symbol_count_evaluation" />
          <p><Link to="/refund/">Read the direct-purchase refund policy →</Link></p>
        </div>
      </div>
    </section>

    <section className="takeoff-evaluation symbol-count-evaluation" aria-labelledby="check-symbol-count">
      <div className="container">
        <p className="growth-kicker">Review the scope before accepting a total</p>
        <h2 id="check-symbol-count">Check two fixture types on E-101.</h2>
        <p>The separate E-101, Revision A practice sheet contains 8 Type A fixtures and 4 Type B fixtures. These are reference quantities from the source drawing, not verified Symbol Search results. The historical screenshots use different demo sheets.</p>
        <div className="takeoff-decision-grid">
          <div>
            <ol className="takeoff-evaluation-steps">
              <li><strong>Define the scope.</strong> Count only fixtures inside the plan boundary. Type A is a circle with a cross; Type B is a square. Keep the two types in separate worksheet subjects.</li>
              <li><strong>Search and review with Pro.</strong> Select the current page and capture one complete Type A symbol. Inspect every candidate before choosing Count. Repeat separately for Type B; compare the reviewed totals with the reference table.</li>
              <li><strong>Investigate differences.</strong> Check missed symbols, false positives, overlapping counts, and the capture box. Do not lower the confidence threshold just to force the expected total. On your own drawings, also exclude legends, schedules, and items outside your scope.</li>
              <li><strong>Reconcile the handoff.</strong> Check the page markers against each worksheet subject. Clear filters when you need the full export, keep counts separate from route lengths, then save a copy and reopen it. Review the exported quantities before applying prices or labor.</li>
            </ol>
            <div className="symbol-count-table-wrap" role="region" aria-label="Electrical symbol reference counts" tabIndex="0">
              <table><caption>Source counts to compare with your reviewed result</caption><thead><tr><th scope="col">Fixture type</th><th scope="col">Visual reference</th><th scope="col">Expected count</th></tr></thead><tbody>
                <tr><th scope="row">Type A</th><td>Circle with cross</td><td>8</td></tr>
                <tr><th scope="row">Type B</th><td>Square</td><td>4</td></tr>
              </tbody></table>
            </div>
            <p>The 42 ft route in the reference CSV is a length, not another fixture quantity. Do not add it to the two count rows.</p>
            <p><Link to="/blog/count-pdf-symbols/">Follow the detailed Symbol Search guide →</Link> <Link to="/electrical-takeoff-software/">Review electrical takeoff scope →</Link></p>
          </div>
          <div className="takeoff-practice-files">
            <figure className="symbol-count-preview"><img src="/samples/takeoff/electrical-practice-preview.png" width="1100" height="850" loading="lazy" alt="E-101 source drawing with eight circle-with-cross Type A fixtures, four square Type B fixtures, and a separate route." /><figcaption>Source PDF preview, not a screenshot of automatic counting.</figcaption></figure>
            <SampleDrawingNote electrical />
            <h3>Download the reference files.</h3>
            <ul>
              <li><SampleLink href="/samples/takeoff/electrical-practice.pdf" source="symbol_count_evaluation" feature="practice_drawing">E-101 electrical practice drawing · PDF</SampleLink></li>
              <li><SampleLink href="/samples/takeoff/electrical-reference.csv" source="symbol_count_evaluation" feature="reference_quantities">Reference quantities · CSV</SampleLink></li>
            </ul>
            <p>No account or email is required for these files. This synthetic drawing is for practice, not construction.</p>
            <p className="takeoff-small">The fixture counts have not been verified by a current-release Mac or Windows Symbol Search run. The existing Mac 1.6.6 build 38 electrical output verifies only the 42 ft route. It does not prove automatic count accuracy.</p>
            <p><Link to="/samples/">See sample evidence and verification limits →</Link></p>
          </div>
        </div>
      </div>
    </section>
  </>;
}
