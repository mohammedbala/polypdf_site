import './ConstructionLibrary.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import PlanComparison from './PlanComparison';
import ArchitecturalTakeoffEvaluation from './ArchitecturalTakeoffEvaluation';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';

export default function TakeoffEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#free-vs-pro', '#try-a-takeoff'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);
  return <>
    <section className="takeoff-decision" aria-labelledby="free-vs-pro">
      <div className="container">
        <p className="growth-kicker">Choose the edition for your work</p>
        <div className="takeoff-decision-grid">
          <div>
            <h2 id="free-vs-pro">Free takeoff or Pro: what do you need?</h2>
            <p>Start with Free to check a drawing, review markups, and create up to 3 hand-created measurements per document. There is no trial timer. Choose Pro when your takeoff needs more measurements, Symbol Search, or another Pro workflow.</p>
            <dl className="takeoff-license-facts">
              <div><dt>Personal Pro license</dt><dd><strong>{commercialOffer.price} USD, one payment.</strong> No subscription. Applicable taxes are shown at checkout.</dd></div>
              <div><dt>Computers and updates</dt><dd>{licenseRightsText}</dd></div>
              <div><dt>Direct website purchases</dt><dd>{commercialOffer.moneyBackGuaranteeDays}-day money-back guarantee. <Link to="/refund/">Refund policy</Link>.</dd></div>
            </dl>
            <p><Link to="/buy/?source=takeoff_plan_comparison">Review Pro pricing and purchase →</Link></p>
            <p className="takeoff-small">A personal license's computer allowance is not a team seat allocation. <Link to="/teams/">Review licensing for organization-managed seats</Link>.</p>
          </div>
          <PlanComparison />
        </div>
        <p className="takeoff-fit"><strong>Check the workflow as well as the price.</strong> PolyPDF records drawing quantities for review and export. Material prices, labor, allowances, and project scope still need your estimating judgment. If a project requires Bluebeam Studio, PolyPDF cannot join it. <Link to="/bluebeam-alternative/#handoff-checklist">Check your required handoff before switching</Link>.</p>
      </div>
    </section>

    <ArchitecturalTakeoffEvaluation anchor="try-a-takeoff" filesId="takeoff-files-title" source="takeoff_evaluation" />
  </>;
}
