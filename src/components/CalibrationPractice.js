import React from 'react';
import SampleDrawingNote from './SampleDrawingNote';
import './ConstructionLibrary.css';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import { SampleLink } from './GrowthEvidence';
import './CalibrationPractice.css';

export default function CalibrationPractice() {
  return <section id="practice-calibration" className="calibration-practice" aria-labelledby="practice-calibration-title">
    <h2 id="practice-calibration-title">Practice PDF calibration with a drawing you can check</h2>
    <p>Use F-101, Revision A, a separate synthetic flooring sheet at 1/8 inch = 1 foot. Calibrate from its 20 ft span, check independent 15 ft and 12 ft spans, then trace one net area. This exercise fits the Free allowance of three hand-created measurements.</p>
    <p><strong>This download uses 9 PDF points per foot.</strong> The older screenshots in this guide use a different drawing at 18 PDF points per foot. Use the scale and dimensions of the file you actually open.</p>
    <figure className="calibration-practice-figure">
      <img src="/samples/takeoff/flooring-practice-preview.png" width="1100" height="850" loading="lazy" alt="F-101 practice drawing: Room 1 is 20 by 12 feet with a 4 by 3 foot corner exclusion; Room 2 is 15 by 12 feet." />
      <figcaption>Preview of the source PDF. This synthetic drawing is for practice, not construction.</figcaption>
    </figure>
    <ul className="calibration-practice-files">
      <li><SampleLink href="/samples/takeoff/flooring-practice.pdf" source="guide_calibration_practice" feature="practice_drawing">Download F-101 practice drawing · PDF</SampleLink></li>
      <li><SampleLink href="/samples/takeoff/flooring-reference.csv" source="guide_calibration_practice" feature="reference_calculations">Reference quantities and calculations · CSV</SampleLink></li>
    </ul>
    <p>No account or email is required for these files.</p>
    <h3>Set the scale, then check two independent directions</h3>
    <p>Calibrate along Room 1’s printed 20 ft width: 180 PDF points ÷ 20 ft = 9 PDF points per foot. Calibration sets the scale; the following three rows are the manual measurements.</p>
    <div className="calibration-practice-table"><table><caption>Expected readings on F-101, Revision A</caption><thead><tr><th scope="col">Measurement</th><th scope="col">Reference</th><th scope="col">Expected</th></tr></thead><tbody>
      <tr><th scope="row">1. Horizontal check</th><td>Room 2 width</td><td>15 ft</td></tr>
      <tr><th scope="row">2. Vertical check</th><td>Room 1 height</td><td>12 ft</td></tr>
      <tr><th scope="row">3. Net area</th><td>Room 1, excluding the shaft</td><td>228 sq ft</td></tr>
    </tbody></table></div>
    <p>Compare both span readings with your project’s tolerance before tracing the area. If they disagree, recheck the endpoints, units, and calibration. Do not average the errors into one scale.</p>
    <p><Link to="/tools/pdf-scale-checker/">Check your two reference errors</Link>. Enter your own readings and tolerance; the checker compares numbers and does not measure or certify a PDF.</p>
    <p>For the third measurement, trace Room 1 around its edge-connected 4 ft × 3 ft exclusion: (20 × 12) − (4 × 3) = 228 sq ft. Keep the two length checks separate from the area total, then save a copy and reopen it.</p>
    <SampleDrawingNote />
    <p className="calibration-practice-evidence">Reference dimensions come from the source geometry. Existing Mac outputs verify Room 1 at 228 sq ft and Room 2 at 180 sq ft in PolyPDF 1.6.6 build 38. This three-measurement exercise is guidance, not a new app test; current-release and Windows parity remain unverified.</p>
    <p><Link to="/pdf-takeoff-software/#try-a-takeoff">See the full 408 sq ft takeoff and saved Mac outputs</Link>.</p>
    <h3>Try it on your Mac or Windows PC</h3>
    <DownloadCTA source="guide_calibration_practice" />
    <p>Need more than three hand-created measurements on a document? <Link to="/pdf-takeoff-software/#free-vs-pro">Compare Free and Pro for takeoff</Link>.</p>
  </section>;
}
