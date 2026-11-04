import './ConstructionLibrary.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import ArchitecturalTakeoffEvaluation from './ArchitecturalTakeoffEvaluation';
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

    <ArchitecturalTakeoffEvaluation anchor="try-mac-measurement" filesId="mac-measurement-files" source="mac_measurement_practice">
      <p>Free has no trial timer and allows up to 3 hand-created measurements per document. Choose Pro when a drawing needs more measurements or you need another Pro workflow.</p>
      <DownloadCTA source="mac_measurement_practice" evaluationHref="#try-mac-measurement" />
      <p><Link to="/buy/?source=mac_measurement_practice">Review Pro pricing and license terms →</Link></p>
      <p className="takeoff-small"><strong>Personal Pro: {commercialOffer.price} USD, one payment.</strong> {licenseRightsText}</p>
      <p><Link to="/blog/why-pdf-measurements-are-wrong/">Troubleshoot a measurement that does not match →</Link></p>
    </ArchitecturalTakeoffEvaluation>
  </>;
}
