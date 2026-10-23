import SampleDrawingNote from './SampleDrawingNote';
import './ConstructionLibrary.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import { SampleLink } from './GrowthEvidence';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';

export default function MacMeasurementEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#preview-and-scale', '#try-mac-measurement'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  return <>
    <section className="takeoff-decision" aria-labelledby="preview-and-scale">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Page size and drawing scale</p>
          <h2 id="preview-and-scale">Can Preview measure a scaled PDF plan?</h2>
          <p>Preview can show the dimensions of a PDF selection in its Crop inspector. Those page dimensions need a drawing scale to become real-world lengths. For example, a 3-inch line represents 12 ft only when the PDF is correctly scaled at 1/4 inch = 1 ft.</p>
          <p>For room areas and a quantity worksheet, calibrate the drawing in PolyPDF, check an independent known span, and trace the required boundaries. Do not infer a drawing scale from screen zoom, paper size, or a title-block label alone.</p>
          <p><a href="https://support.apple.com/guide/preview/view-information-about-pdfs-and-images-prvw9c94f0a4/mac" target="_blank" rel="noopener noreferrer">Apple’s guide to Preview’s Inspector</a> · <Link to="/blog/calibrate-pdf-drawing-scale/">Calibrate a PDF drawing</Link></p>
        </div>
        <div>
          <h3>Check a second reference before measuring.</h3>
          <p>A resized PDF can disagree with its printed scale. A stretched scan can disagree in one direction even after calibration. Check a separate known horizontal span and a known vertical span when distortion is possible; check each page or differently scaled detail separately.</p>
          <p><Link to="/tools/pdf-scale-checker/">Check horizontal and vertical reference measurements →</Link></p>
          <p className="takeoff-small">The website checker compares values you enter. It does not measure a PDF or certify the accuracy of an entire drawing.</p>
        </div>
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="try-mac-measurement">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Evaluate before buying</p>
          <h2 id="try-mac-measurement">Measure a room on your Mac before buying.</h2>
          <p>Use the synthetic flooring drawing to test a small workflow within the Free limit. Its two net room areas total 408 sq ft. This is a practice drawing, not a construction document.</p>
          <ol className="takeoff-evaluation-steps">
            <li><strong>Calibrate and check.</strong> Open the practice PDF and calibrate using a printed dimension. Use your first measurement to check a different known span. Stop and resolve any mismatch before taking off quantities.</li>
            <li><strong>Measure the two net areas.</strong> Trace Room 1 around its edge-connected exclusion: 240 − 12 = 228 sq ft. Trace Room 2: 180 sq ft. With the check measurement, that uses three hand-created measurements.</li>
            <li><strong>Review, export, and reopen.</strong> Check the two area rows total 408 sq ft. Keep the length check separate from the area total. Export the worksheet, save a separate PDF copy, and reopen it to inspect your measurements.</li>
          </ol>
          <p>Free has no trial timer and allows up to 3 hand-created measurements per document. Choose Pro when a drawing needs more measurements or you need another Pro workflow.</p>
          <DownloadCTA source="mac_measurement_practice" />
          <p><Link to="/buy/?source=mac_measurement_practice">Review Pro pricing and license terms →</Link></p>
          <p className="takeoff-small"><strong>Personal Pro: {commercialOffer.price} USD, one payment.</strong> {licenseRightsText}</p>
        </div>
        <div className="takeoff-practice-files">
          <h3 id="mac-measurement-files">Start with the drawing. Check the outputs.</h3>
          <ul>
            <li><SampleLink href="/samples/takeoff/flooring-practice.pdf" source="mac_measurement_practice" feature="practice_drawing">Download the flooring practice drawing · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-reference.pdf" source="mac_measurement_practice" feature="reference_calculations">Reference calculations · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-measured.pdf" source="mac_measurement_practice" feature="saved_measurements">Saved Mac measurements · PDF</SampleLink></li>
            <li><SampleLink href="/samples/takeoff/flooring-mac-worksheet.csv" source="mac_measurement_practice" feature="worksheet_export">Mac worksheet export · CSV</SampleLink></li>
          </ul>
          <p>No account or email is required for these files.</p>
          <SampleDrawingNote />
          <p className="takeoff-small">The 408 sq ft area result was exported and reopened in PolyPDF 1.6.6 build 38 on Mac. These files verify those two area measurements; they do not establish current-release or Windows parity. The three-measurement sequence above is an evaluation guide, not a separately verified app test.</p>
          <p><Link to="/samples/">See all samples and verification details →</Link></p>
          <p><Link to="/blog/why-pdf-measurements-are-wrong/">Troubleshoot a measurement that does not match →</Link></p>
        </div>
      </div>
    </section>
  </>;
}
