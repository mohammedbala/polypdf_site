import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { SampleLink } from './GrowthEvidence';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';
import './ComparisonEvaluation.css';

export default function ComparisonEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#comparison-options', '#try-drawing-comparison'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  return <>
    <section className="takeoff-decision comparison-options" aria-labelledby="comparison-options">
      <div className="container">
        <p className="growth-kicker">Choose the revision workflow</p>
        <h2 id="comparison-options">Compare, overlay, or manage a revised drawing issue?</h2>
        <p>Use Compare Documents to find rendered differences between two PDFs. Use a colored overlay to inspect two pages together. Use a Revision Package when an issued drawing set needs sheet matching, carried review work, and a publication record.</p>
        <div className="comparison-table-wrap" role="region" aria-label="Drawing comparison workflows" tabIndex="0">
          <table className="comparison-options-table">
            <caption>Choose the result you need before choosing an edition.</caption>
            <thead><tr><th scope="col">Workflow</th><th scope="col">What you get</th><th scope="col">Edition</th></tr></thead>
            <tbody>
              <tr><th scope="row">Compare Documents</th><td>A separate comparison PDF based on the baseline. Detected regions normally become editable revision clouds; check the completion message for a fallback warning.</td><td>Free and Pro</td></tr>
              <tr><th scope="row">Overlay Pages</th><td>A visual reference using superimposed page snapshots, with color and opacity controls. Inspect the geometry yourself; this is not an automatic list of detected changes.</td><td>Pro</td></tr>
              <tr><th scope="row">Revision Package</th><td>A workflow for reconciling a drawing issue, carrying review work forward, reviewing changes, and publishing a controlled package.</td><td>Free to view and navigate. Pro to create, update, or publish.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="comparison-license">
          <p>Start with Free for a focused comparison and markup review. Choose Pro when you need colored overlays, Revision Package changes, or unlimited hand-created measurements.</p>
          <p><strong>Personal Pro: {commercialOffer.price} USD, one payment.</strong> {licenseRightsText}</p>
          <p><Link to="/buy/?source=comparison_workflow_choice">Review Pro pricing and license terms →</Link> <Link to="/revision-packages/">Explore Revision Packages →</Link></p>
        </div>
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="try-drawing-comparison">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Practice with known source changes</p>
          <h2 id="try-drawing-comparison">Find three drawing changes in the Northline pair.</h2>
          <p>Download both synthetic A101 sheets. Open Revision A, choose Document → Compare Documents, select Revision B, and run Compare. Both files have matching 18 × 12 inch page boxes and the same drawing scale.</p>
          <ol className="takeoff-evaluation-steps">
            <li><strong>Meeting Room 102.</strong> The partition moves 2 ft toward the Focus Room. The meeting-room width changes from 14 ft to 16 ft, and seating changes from six to eight.</li>
            <li><strong>Meeting-room doorway.</strong> The entrance moves along the corridor wall. Inspect the old and new door locations as well as the nearby wall line.</li>
            <li><strong>Room 106.</strong> The Break Room becomes a Material Library, with different furniture and shelving. Check the room name and the layout together.</li>
          </ol>
          <p>These are three authored source changes, not a promise of three detected clouds. Labels, revision markers, and title-block updates also differ. One design change can produce several detected regions.</p>
          <p><strong>If most of the page appears changed, check the inputs.</strong> Compare page order, crop, rotation, plot scale, and alignment before interpreting the result. A shifted or stretched scan can make unchanged geometry look revised.</p>
          <p><Link to="/blog/compare-pdf-drawing-revisions/">Follow the full comparison and troubleshooting guide →</Link></p>
        </div>
        <div className="takeoff-practice-files">
          <h3>Download the original A/B practice pair.</h3>
          <ul>
            <li><SampleLink href="/samples/conversion/northline-studio-rev-a.pdf" source="comparison_evaluation" feature="baseline_drawing">Revision A · baseline PDF</SampleLink></li>
            <li><SampleLink href="/samples/conversion/northline-studio-rev-b.pdf" source="comparison_evaluation" feature="revised_drawing">Revision B · revised PDF</SampleLink></li>
          </ul>
          <p>No account or email required. These fictional drawings are for practice, not construction. They are comparison inputs, not app-generated comparison results.</p>
          <h3>Check the saved result.</h3>
          <p>Read the completion status and inspect each region. If the run used a fallback, its marks may be baked into the page rather than editable. Save under a new name, reopen the file, and check the result in the recipient's PDF viewer.</p>
          <p className="takeoff-small">The downloadable pair was checked for matching page boxes and the source changes described here. This exercise does not certify a detection rate or current-release results on Mac or Windows. The guide's separate four-cloud example records its own version and verification scope.</p>
          <Link to="/construction-pdf-markup/#review-handoff">Prepare a review handoff →</Link>
        </div>
      </div>
    </section>
  </>;
}
