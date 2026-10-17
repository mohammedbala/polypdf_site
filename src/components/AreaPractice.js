import React from 'react';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import { SampleLink } from './GrowthEvidence';
import './CalibrationPractice.css';

export default function AreaPractice() {
  return <section id="practice-net-area" className="calibration-practice" aria-labelledby="practice-net-area-title">
    <h2 id="practice-net-area-title">Check a net area against the drawing and its export</h2>
    <p>Use the separate F-101 flooring practice sheet: Room 1 is 20 ft × 12 ft with a 4 ft × 3 ft corner exclusion. Room 2 is 15 ft × 12 ft. The source uses 9 PDF points per foot; the historical screenshots in this guide use a different drawing.</p>
    <h3>Interior opening or edge-connected notch?</h3>
    <p>For an opening wholly inside an area, trace the outer boundary and add an interior cutout. If an exclusion touches the outer edge, trace the net outline around it. F-101 uses this second method: the corner exclusion is part of the outline, so do not also subtract it as a cutout.</p>
    <figure className="calibration-practice-figure">
      <img src="/samples/takeoff/flooring-practice-preview.png" width="1100" height="850" loading="lazy" alt="F-101 source plan with a 4 by 3 foot exclusion touching the upper-right corner of Room 1, plus a separate rectangular Room 2." />
      <figcaption>Source PDF preview. Follow the corner exclusion when tracing Room 1; this is not an interior-hole example.</figcaption>
    </figure>
    <ul className="calibration-practice-files">
      <li><SampleLink href="/samples/takeoff/flooring-practice.pdf" source="guide_net_area_practice" feature="practice_drawing">Download F-101 practice drawing · PDF</SampleLink></li>
      <li><SampleLink href="/samples/takeoff/flooring-reference.csv" source="guide_net_area_practice" feature="reference_calculations">Reference quantities and calculations · CSV</SampleLink></li>
    </ul>
    <h3>Three measurements to review in Free</h3>
    <p>Calibrate along the printed 20 ft span, then use one manual length measurement to check the independent 12 ft height. If the check agrees with your required tolerance, trace Room 1 around the corner exclusion and trace Room 2 separately. That is one length check and two area measurements.</p>
    <p><Link to="/blog/calibrate-pdf-drawing-scale/#practice-calibration">Need help setting and checking the scale?</Link> Use the separate calibration exercise first; do not assume two different exercises fit one three-measurement allowance.</p>
    <div className="calibration-practice-table" role="region" aria-label="F-101 net area reference calculations" tabIndex="0"><table><caption>Compare the reviewed areas, not every subtotal</caption><thead><tr><th scope="col">Area</th><th scope="col">Reference calculation</th><th scope="col">Net quantity</th></tr></thead><tbody>
      <tr><th scope="row">Room 1</th><td><bdi dir="ltr">(20 × 12) − (4 × 3)</bdi></td><td>228 sq ft</td></tr>
      <tr><th scope="row">Room 2</th><td><bdi dir="ltr">15 × 12</bdi></td><td>180 sq ft</td></tr>
      <tr><th scope="row">Combined net area</th><td><bdi dir="ltr">228 + 180</bdi></td><td>408 sq ft</td></tr>
    </tbody></table></div>
    <p>The 228 sq ft result already excludes the 12 sq ft corner. Do not subtract it again. The reference CSV includes gross, deduction, subtotal, waste, and total rows for explanation; summing its entire quantity column is incorrect.</p>
    <h3>Inspect the saved Mac result</h3>
    <ul className="calibration-practice-files">
      <li><SampleLink href="/samples/takeoff/flooring-mac-measured.pdf" source="guide_net_area_practice" feature="historical_mac_output">Saved Mac measurements · PDF</SampleLink></li>
      <li><SampleLink href="/samples/takeoff/flooring-mac-worksheet.csv" source="guide_net_area_practice" feature="historical_mac_export">Mac worksheet export · CSV</SampleLink></li>
      <li><SampleLink href="/samples/takeoff/flooring-mac-summary.pdf" source="guide_net_area_practice" feature="historical_mac_summary">Mac summary export · PDF</SampleLink></li>
    </ul>
    <p>In this Mac worksheet CSV, Quantity 2 means two area records; Total 408 with Unit sq ft is the measured area. The formula is SUM(228 + 180). Compare the saved page, formula, unit, and total before using an export for pricing.</p>
    <p className="calibration-practice-evidence">These existing outputs were saved, reopened, and checked in PolyPDF 1.6.6 build 38 on Mac. They verify the two net areas, not interior-cutout or volume behavior. The length-check-plus-two-areas sequence is guidance; the historical export contains only the two areas. No current-release or Windows test of this sequence has been completed. The synthetic drawing is for practice, not construction.</p>
    <p>Keep net area, volume, and purchasing quantities separate. A real-world depth converts area to volume; a waste allowance changes the purchasing quantity. <Link to="/tools/flooring-waste-calculator/">Apply a chosen flooring allowance after reviewing the net area →</Link></p>
    <h3>Start with the drawing. Upgrade when the job needs more.</h3>
    <DownloadCTA source="guide_net_area_practice" />
    <p>Free allows three hand-created measurements per document. Pro removes that cap for larger takeoffs. <Link to="/buy/?source=guide_net_area_practice">Review Pro pricing and license terms →</Link></p>
  </section>;
}
