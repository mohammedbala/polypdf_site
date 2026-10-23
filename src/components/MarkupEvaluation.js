import React, { useEffect } from 'react';
import { Link } from 'react-router';
import PlanComparison from './PlanComparison';
import { SampleLink } from './GrowthEvidence';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';

export default function MarkupEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#markup-free-vs-pro', '#review-handoff'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  return <>
    <section className="takeoff-decision" aria-labelledby="markup-free-vs-pro">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Choose the edition for your review</p>
          <h2 id="markup-free-vs-pro">Free markup or Pro: which fits your review?</h2>
          <p>PolyPDF Free includes markup, review, scale calibration, and up to 3 hand-created measurements per document, with no trial timer. Add notes and review a drawing before deciding whether you need Pro.</p>
          <p>Choose Pro for unlimited measurements, PDF content editing, reusable toolset placement, Symbol Search, or creating and publishing Revision Packages. Adding a review note and editing the underlying PDF content are different tasks.</p>
          <dl className="takeoff-license-facts">
            <div><dt>Personal Pro license</dt><dd><strong>{commercialOffer.price} USD, one payment.</strong> No subscription. Applicable taxes are shown at checkout.</dd></div>
            <div><dt>Computers and updates</dt><dd>{licenseRightsText}</dd></div>
            <div><dt>Direct website purchases</dt><dd>{commercialOffer.moneyBackGuaranteeDays}-day money-back guarantee. <Link to="/refund/">Refund policy</Link>.</dd></div>
          </dl>
          <p><Link to="/buy/?source=markup_plan_comparison">Review Pro pricing and purchase →</Link></p>
          <p className="takeoff-small">A personal license's computer allowance is not a team seat allocation. <Link to="/teams/">Review licensing for organization-managed seats</Link>.</p>
        </div>
        <PlanComparison />
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="review-handoff">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Test the review handoff</p>
          <h2 id="review-handoff">Send a drawing the next reviewer can act on.</h2>
          <ol className="takeoff-evaluation-steps">
            <li><strong>Identify the source.</strong> Confirm the sheet number and revision. Save a separate review copy so the issued drawing remains identifiable.</li>
            <li><strong>Make each issue actionable.</strong> Place a note or callout at the relevant location. Give its Markup Table row a specific Subject, record the question in Comments, and choose the agreed review Status.</li>
            <li><strong>Choose the register scope.</strong> Clear filters when you need a full register. For a focused review, record the active filters. Check the exported CSV rows or PDF summary counts against the intended scope before sending.</li>
            <li><strong>Reopen and check.</strong> Inspect the saved PDF and exported register together. Check page locations, readable notes, and issue counts in the recipient's workflow before issuing the files.</li>
          </ol>
          <p>Use the marked PDF and register as attachments to your existing project process. Formal RFI numbering, routing, responses, and contractual due dates stay in that process. A markup status does not by itself establish design approval.</p>
          <p><Link to="/blog/pdf-markup-table-rfi-punch-list/">Follow the Markup Table and export guide →</Link></p>
          <p><Link to="/bluebeam-alternative/#handoff-checklist">Check a Bluebeam migration handoff →</Link></p>
        </div>
        <div className="takeoff-practice-files">
          <h3>Inspect a saved review before downloading the app.</h3>
          <ul>
            <li><SampleLink href="/samples/conversion/northline-studio-rev-a.pdf" source="markup_evaluation">Northline source drawing · PDF</SampleLink></li>
            <li><SampleLink href="/samples/conversion/northline-studio-reviewed.pdf" source="markup_evaluation">Saved review sample · PDF</SampleLink></li>
          </ul>
          <p>Open both files. Find the rectangle and text note in the saved review, then inspect them in the PDF viewer your recipient uses. No account or email is required.</p>
          <p className="takeoff-small">This synthetic practice drawing was saved and reopened in PolyPDF 1.6.6 build 38 on Mac. It verifies one rectangle and one text note. It does not verify the register-export steps above, current-release or Windows behavior, or every recipient viewer.</p>
          <Link to="/samples/">See all samples and verification details →</Link>
        </div>
      </div>
    </section>
  </>;
}
