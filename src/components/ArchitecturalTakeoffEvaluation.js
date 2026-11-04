import React from 'react';
import { Link } from 'react-router';
import SampleLink from './SampleLink';
import SampleDrawingNote from './SampleDrawingNote';
import './TakeoffEvaluation.css';

const savedExample = '/samples/evaluation/local-build-1.6.14-76';

// One primary source drawing; older measurements retain their own geometry and provenance.
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
        <p className="takeoff-small">These are drawing reference values. A saved example was verified in local Mac build 1.6.14 build 76; check your own result on the installed version.</p>
        <ul>
          <li><SampleLink href={savedExample + '/willow-creek-a101-measured.pdf'} source={source} feature="saved_measurements">Download the saved measured drawing · PDF</SampleLink></li>
          <li><SampleLink href={savedExample + '/willow-creek-a101-takeoff.csv'} source={source} feature="worksheet_export">Download the app-exported quantities · CSV</SampleLink></li>
          <li><a href={savedExample + '/verification.html'}>Read the test method, results, and file hashes</a></li>
        </ul>
        <p><Link to="/product-facts/#verified-construction-example">Inspect the saved Mac example and its tested local build →</Link></p>
        <p>No account or email is required for these files.</p>
        <p><Link to="/samples/#construction-library">Browse the complete drawing library →</Link></p>
        <p className="takeoff-small">Synthetic practice drawing; not for construction. Desktop installers do not run on phones or tablets.</p>
        <details className="takeoff-historical">
          <summary>Earlier flooring example · 408 sq ft</summary>
          <ul>
            <li><SampleLink href="/samples/takeoff/flooring-practice.pdf" source={source} feature="historical_practice">Download the flooring practice drawing · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-reference.pdf" source={source} feature="historical_reference">Reference calculations · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-measured.pdf" source={source} feature="historical_saved">Saved Mac measurements · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-worksheet.csv" source={source} feature="historical_worksheet">Mac worksheet export · CSV</SampleLink></li>
          </ul>
          <SampleDrawingNote />
          <p className="takeoff-small">The 408 sq ft area result was exported and reopened in PolyPDF 1.6.6 build 38 on Mac. These files verify those two area measurements; they do not establish current-release or Windows parity. The three-measurement sequence above is an evaluation guide, not a separately verified app test.</p>
          <p><Link to="/flooring-takeoff-software/">Flooring workflow</Link> · <Link to="/tools/flooring-waste-calculator/">Add your waste allowance</Link></p>
        </details>
      </div>
    </div>
  </section>;
}
