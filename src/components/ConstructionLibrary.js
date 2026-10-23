import React from 'react';
import SampleLink from './SampleLink';
import './ConstructionLibrary.css';
const drawings = [
  ['01-Civil-Site-and-Grading','Civil site and grading','C101 · C501','Site layout, grading, parking, drainage, pavement and curb details.'],
  ['02-Architectural-Revision-A','Architecture · Revision A','A101 · A201','Dimensioned floor plan, elevations, building section and wall detail.'],
  ['03-Architectural-Revision-B','Architecture · Revision B','A101 · A201','A matching revised set for comparison with Revision A.'],
  ['04-Structural-Foundation-and-Framing','Structural foundation and framing','S101 · S501','Footings, columns, roof framing, connection details and schedules.'],
  ['05-Mechanical-HVAC','Mechanical / HVAC','M101 · M501','Ductwork, terminals, equipment, controls and mechanical details.'],
  ['06-Electrical-Lighting-and-Power','Electrical lighting and power','E101 · E601','Lighting, receptacles, electrical diagrams and fixture schedules.'],
  ['07-Plumbing-Water-and-Drainage','Plumbing water and drainage','P101 · P501','Water and drainage layouts, risers, fixtures and installation details.'],
  ['08-Fire-Protection-and-Life-Safety','Fire protection and life safety','FP101 · FP501','Sprinkler and life-safety symbols, risers, details and schedules.'],
  ['09-Landscape-and-External-Works','Landscape and external works','L101 · L501','Planting, paving, landscape details and an authored planting schedule.'],
  ['10-Interiors-Finishes-and-Millwork','Interiors, finishes and millwork','I101 · I501','Room finishes, floor patterns, casework elevations and interior details.'],
  ['11-Coordination-and-Review','Coordination and review','X101 · X102','Overlaid disciplines, three authored review notes and four PDF layers.'],
  ['12-Scanned-Legacy-Drawings','Scanned legacy drawings','A101 · C101','Image-only architectural and site sheets for OCR practice.']
];
export default function ConstructionLibrary() {
 return <section id="construction-library" className="construction-library" aria-labelledby="construction-library-heading">
  <p className="growth-kicker">The original PolyPDF drawing collection</p>
  <h2 id="construction-library-heading">One project. Twelve PDFs. Twenty-four construction sheets.</h2>
  <p>Explore the fictional Willow Creek Community Center through coordinated architectural, structural, civil, MEP, and finish drawings. Every PDF contains two bookmarked ARCH D sheets (36 × 24 inches), with drawing numbers, schedules, legends, dimensions, and details.</p>
  <div className="construction-library-downloads"><SampleLink href="/samples/construction/polypdf-construction-demo-library.zip" source="construction_library" feature="complete_library">Download all 24 sheets · ZIP</SampleLink><a href="/samples/construction/DEMO-GUIDE.html">View the drawing guide and reference quantities →</a></div>
  <p className="construction-library-note">These are original demonstration drawings, not permit documents or verified PolyPDF outputs. The main building plans use 1/4 inch = 1 foot; site and detail scales vary. Calibrate each view before measuring. Use the sheet-specific examples below. The earlier F-101 and E-101 exercises use different drawings and quantities.</p>
  <p><a href="#construction-example-takeoff">Measurement</a> · <a href="#construction-example-flooring">Flooring</a> · <a href="#construction-example-electrical">Electrical</a> · <a href="#construction-example-compare">Revision comparison</a> · <a href="#construction-example-review">Coordination review</a> · <a href="#construction-example-ocr">OCR</a></p>
  <ul className="construction-library-grid">{drawings.map(([file,title,sheets,description])=><li key={file}>
    <SampleLink href={`/samples/construction/${file}.pdf`} source="construction_library" feature={file}><img src={`/samples/construction/previews/${file}--page-01.png`} alt={`${title}: first sheet preview`} width="1440" height="960" loading="lazy"/><span>{title} · PDF</span></SampleLink>
    <p className="construction-library-sheets">{sheets} · 2 sheets</p><p>{description}</p>
  </li>)}</ul>
  <p>Keep an untouched master and mark up a copy. Check the drawing scope, units, exported quantities, and saved-file handoff in your own workflow. All projects and coordination issues are fictional; no customer drawing or professional seal is included.</p>
 </section>;
}
