import React from 'react';
import { Link } from 'react-router';
import DownloadCTA from './DownloadCTA';
import SampleLink from './SampleLink';
import './EvaluationKit.css';
import { buyPath } from '../lib/attribution';

export default function EvaluationKit() {
  return <section className="product-facts-section evaluation-kit" aria-labelledby="evaluation-kit">
    <h2 id="evaluation-kit">How can you evaluate PolyPDF on construction drawings?</h2>
    <p>Use the Willow Creek evaluation kit to test the app on a consistent set of architectural, electrical, interiors, coordination, and scanned drawings. It includes six PDFs with twelve sheets, fourteen drawing references, and a blank Mac/Windows results checklist.</p>
    <div className="construction-library-downloads">
      <SampleLink href="/samples/evaluation/polypdf-construction-evaluation-kit.zip" source="evaluation_kit" feature="evaluation_bundle">Download the construction evaluation kit · ZIP</SampleLink>
      <a href="/samples/evaluation/START-HERE.html">Read the evaluation guide →</a>
    </div>
    <p><SampleLink href="/samples/evaluation/evaluation-results.csv" source="evaluation_kit" feature="evaluation_results">Download the blank results checklist · CSV</SampleLink> · <SampleLink href="/samples/evaluation/reference-quantities.csv" source="evaluation_kit" feature="reference_quantities">Download the drawing references · CSV</SampleLink></p>
    <h3>Start with three measurements in Free</h3>
    <ol>
      <li>Record your app version, build, operating system, and edition. Open A101, Revision A, and calibrate the printed 20 ft reference.</li>
      <li>Check the independent 96 ft width and 60 ft depth, then measure the outside boundary: 5,760 sq ft gross. These are two length checks and one area.</li>
      <li>Save a working copy, export the quantities, and reopen the saved PDF. Check the source revision, units, and values against your reference before relying on the result.</li>
    </ol>
    <p>The guide also covers flooring zones, symbol candidates, revision comparison, saved review notes, and OCR. Symbol Search and Overlay require Pro. Review the <Link to="/pdf-takeoff-software/#free-vs-pro">Free and Pro limits</Link> before choosing a test.</p>
    <p className="construction-library-note">The kit contains original source drawings and authored references, not completed app tests. The 22 platform checks start as NOT RUN. Record your own results, including misses and unexpected differences. Historical app exports elsewhere on this site use separate drawings and keep their original version labels.</p>
    <h3 id="verified-construction-example">Has this construction drawing been measured in PolyPDF?</h3>
    <p>Yes. The Willow Creek A101 example retained <strong>96 ft width, 60 ft depth, and 5,760 sq ft gross area</strong> after saving, closing, reopening, and switching between Metric and Imperial in <strong>local Mac build 1.6.14, build 76</strong>. The PolyPDF publisher completed this test in Free on macOS 26.4.1 on <time dateTime="2026-10-17">October 17, 2026</time>.</p>
    <div className="construction-library-downloads">
      <SampleLink href="/samples/evaluation/local-build-1.6.14-76/willow-creek-a101-measured.pdf" source="evaluation_verified_mac" feature="saved_construction_measurements">Download the saved measured drawing · PDF</SampleLink>
      <SampleLink href="/samples/evaluation/local-build-1.6.14-76/willow-creek-a101-takeoff.csv" source="evaluation_verified_mac" feature="exported_construction_quantities">Download the app-exported quantities · CSV</SampleLink>
    </div>
    <p>The exported worksheet reports one area of 5,760 sq ft and two lengths totaling 156 ft (96 + 60 ft). That length total is two independent checks, not a perimeter. These files preserve the actual app output.</p>
    <p className="construction-library-note">This is a local development build test, not verification of the public installer or Windows. The measurements were originally created in 1.6.13 build 74, then saved and retested in local build 76. Pro workflows and other PDF viewers were not tested. <a href="/samples/evaluation/local-build-1.6.14-76/verification.html">Read the test method, results, and file hashes</a>.</p>
    <DownloadCTA source="evaluation_kit" />
    <p><Link to={buyPath('evaluation_kit')}>Review current Pro pricing and license rights</Link> after checking the workflow you need.</p>
  </section>;
}
