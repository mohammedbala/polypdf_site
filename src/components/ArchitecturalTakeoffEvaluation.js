import React from 'react';
import PublicMacTakeoffCheck from './PublicMacTakeoffCheck';
import { Link } from 'react-router';
import SampleLink from './SampleLink';
import './TakeoffEvaluation.css';

const savedExample = '/samples/evaluation/public-mac-1.6.27-99';

// One practice drawing, and the record from the current public Mac build.
export default function ArchitecturalTakeoffEvaluation({ anchor, filesId, source, children }) {
  return <section id="construction-example-takeoff" className="takeoff-evaluation" aria-labelledby="construction-example-takeoff-title">
    <div id={anchor} className="container takeoff-decision-grid">
      <div>
        <p className="growth-kicker">Evaluate before buying</p>
        <h2 id="construction-example-takeoff-title">Measure the Willow Creek architectural plan</h2>
        <p>Use the Willow Creek A101 practice drawing on a Mac or Windows PC. The three measurements fit Free; no account is needed.</p>
        <ol className="takeoff-evaluation-steps">
          <li>Calibrate A101, Revision A, along the printed 20 ft reference.</li>
          <li>Check the independent 96 ft width and 60 ft depth. Stop if either reading disagrees with the drawing.</li>
          <li>Trace the outside boundary: 5,760 sq ft gross area. Review the worksheet, export it, save a copy, and reopen the PDF to check all three measurements.</li>
        </ol>
        <p>Two length checks and one area use the three-measurement Free allowance. Gross area includes walls; it is not net flooring or a complete estimate.</p>
        <p><Link to="/blog/calibrate-pdf-drawing-scale/">Calibration guide</Link> · <Link to="/tools/pdf-scale-checker/">Check horizontal and vertical reference measurements →</Link></p>
        <p><Link to="/tools/construction-takeoff-spreadsheet/">Move checked quantities into the free Excel takeoff template →</Link></p>
        {children}
      </div>
      <div className="takeoff-practice-files">
        <h3 id={filesId}>Start with the drawing. Check the outputs.</h3>
        <SampleLink href="/samples/construction/02-Architectural-Revision-A.pdf" source={source} feature="practice_drawing">
          <img className="takeoff-practice-preview" src="/samples/construction/previews/02-Architectural-Revision-A--page-01.png" alt="Measure the Willow Creek architectural plan" width="1440" height="960" loading="lazy" />
          <span>Download the architectural practice PDF</span>
        </SampleLink>
        <p className="takeoff-small">These are drawing reference values. The saved example below comes from public Mac 1.6.27 build 99; check your own result on the version you install.</p>
        <PublicMacTakeoffCheck />
        <ul>
          <li><SampleLink href={savedExample + '/willow-creek-a101-measured.pdf'} source={source} feature="saved_measurements">Download the saved measured drawing · PDF</SampleLink></li>
          <li><SampleLink href={savedExample + '/willow-creek-a101-takeoff.csv'} source={source} feature="worksheet_export">Download the app-exported quantities · CSV</SampleLink></li>
        </ul>
        <p>No account or email is required for these files.</p>
        <p><Link to="/samples/#construction-library">Browse the complete drawing library →</Link></p>
        <p className="takeoff-small">Synthetic practice drawing; not for construction. Desktop installers do not run on phones or tablets.</p>
      </div>
    </div>
  </section>;
}
