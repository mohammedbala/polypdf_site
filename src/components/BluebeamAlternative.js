import React from 'react';
import { Link } from 'react-router';
import WorkflowLanding from './WorkflowLanding';
import { BLUEBEAM_MAC_SOURCE, COMPARISON_REVIEWED, bluebeamMacPage } from '../lib/bluebeamMacComparison';
import { trackEvent } from '../lib/analytics';
import './BluebeamAlternative.css';

const BluebeamAlternative = () => (
  <WorkflowLanding page={bluebeamMacPage}>
    <section className="mac-comparison" aria-labelledby="mac-options-heading">
      <div className="container">
        <div className="workflow-section-heading">
          <p className="workflow-section-index">MAC OPTIONS</p>
          <h2 id="mac-options-heading">What changes when you choose PolyPDF?</h2>
          <p>Bluebeam is available on Mac through several documented routes. Choose the one that fits your project’s required tools.</p>
        </div>
        <div className="mac-comparison-table" role="region" aria-label="PolyPDF and Bluebeam workflow comparison" tabIndex="0">
          <table>
            <caption>Drawing workflows on Mac</caption>
            <thead><tr><th scope="col">Your workflow</th><th scope="col">PolyPDF</th><th scope="col">Bluebeam’s documented Mac options</th></tr></thead>
            <tbody>
              <tr><th scope="row">Desktop measurement and takeoff</th><td>Runs directly on macOS. Calibrate the drawing, measure quantities, and review the takeoff worksheet.</td><td>Bluebeam points to Revu in a Windows virtual machine for the full desktop takeoff toolset.</td></tr>
              <tr><th scope="row">PDF markup and review</th><td>Local callouts, notes, highlights, shapes, stamps, and drawing review on Mac and Windows.</td><td>Web access and the iOS app support review and markups. The iOS app can run on supported Apple Silicon Macs.</td></tr>
              <tr><th scope="row">Worksheet handoff</th><td>Export quantity records to CSV or a PDF summary. Check units, subjects, and totals before sharing.</td><td>For a Revu-standardized estimating process, evaluate its desktop toolset through Windows virtualization.</td></tr>
              <tr><th scope="row">Project collaboration</th><td>PolyPDF has its own company-hosted collaboration. It does not connect to Bluebeam Studio.</td><td>Keep a supported Bluebeam option when your project requires Studio Projects or Sessions.</td></tr>
              <tr><th scope="row">Licensing</th><td>Free evaluation with clear limits. Personal Pro is one payment for PolyPDF 1.x on up to 3 computers.</td><td>Check Bluebeam’s current subscription plans and the features included in your chosen access route.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mac-comparison-source">Reviewed {COMPARISON_REVIEWED}. Sources: <a href={BLUEBEAM_MAC_SOURCE} target="_blank" rel="noopener noreferrer">Bluebeam’s Mac guidance</a>, <a href="https://www.bluebeam.com/download/" target="_blank" rel="noopener noreferrer">Bluebeam Download Center</a>, and <Link to="/buy/">PolyPDF’s current personal license</Link>. This comparison is published by PolyPDF; Bluebeam is a separate product and company.</p>
      </div>
    </section>

    <section className="mac-comparison-handoff" aria-labelledby="handoff-heading">
      <div className="container workflow-context-grid">
        <p className="workflow-section-index">TRY THE HANDOFF</p>
        <div>
          <h2 id="handoff-heading">Start with a sample. Finish with your own file.</h2>
          <p>The demo above uses our fictional Northline Studio drawing. Download the same source PDF, add a note and a measurement, then save a separate copy and check it in the viewer your team uses.</p>
          <a className="workflow-text-link" href="/samples/conversion/northline-studio-rev-a.pdf" download onClick={() => trackEvent('sample_download', { source: 'landing_bluebeam_mac', feature: 'handoff' })}>Download the sample drawing PDF</a>
          <p>We added a review box and a text note in PolyPDF 1.6.6 (build 38), saved the PDF, closed it, and reopened it. The saved annotations also rendered in an independent PDF viewer engine. Checked October 15, 2026.</p>
          <a className="workflow-text-link" href="/samples/conversion/northline-studio-reviewed.pdf" download onClick={() => trackEvent('sample_download', { source: 'landing_bluebeam_mac', feature: 'saved_handoff' })}>Download the saved review PDF</a>
          <p className="mac-comparison-note">The sample is a demonstration drawing, not for construction. A successful sample check does not establish compatibility for every PDF, markup, signature, form, or Studio workflow.</p>
          <p>Use the <a href="/bluebeam-alternative/#handoff-checklist">Bluebeam migration checklist and blank CSV worksheet</a> to record your own scale, quantity, markup and recipient checks before switching.</p>
          <p>For a complete quantity example, <Link to="/blog/pdf-takeoff-worked-example/">follow the worked takeoff guide</Link>. It shows the source scale, a 540 sq ft area, a 30 ft run, and 12 reviewed counts. Those quantities belong to that guide’s sample, not the Northline drawing above.</p>
        </div>
      </div>
    </section>
  </WorkflowLanding>
);

export default BluebeamAlternative;
