import './ConstructionLibrary.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import PlanComparison from './PlanComparison';
import ArchitecturalTakeoffEvaluation from './ArchitecturalTakeoffEvaluation';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';
import './Growth.css';

const macRoutes = [
  ['Native Mac app', 'Installed on the Mac and runs without Windows. PolyPDF takes this route.', 'Whether it supports your measurements and exports, and what it costs for the number of computers you use.'],
  ['Browser tool', 'Runs in a web browser, so a Mac with a supported browser can reach it.', 'Where your drawings are stored, the subscription cost, and whether you can work offline.'],
  ['iPad app on an Apple silicon Mac', 'Some iPad apps can run on Macs with Apple silicon. They do not run on Intel Macs.', 'Whether the developer offers it on Mac, and how it works with a mouse and keyboard.'],
  ['Windows program in a virtual machine', 'Windows runs inside a virtual machine on the Mac, with the program installed in Windows.', 'The extra Windows and virtual machine costs, and whether the program\u2019s maker supports this setup.']
];

export default function TakeoffEvaluation() {
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#takeoff-on-mac', '#free-vs-pro', '#try-a-takeoff'].includes(window.location.hash)) {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);
  return <>
    <section className="takeoff-decision takeoff-on-mac" aria-labelledby="takeoff-on-mac">
      <div className="container">
        <p className="growth-kicker">Takeoff on a Mac</p>
        <h2 id="takeoff-on-mac">How do you do a construction takeoff on a Mac?</h2>
        <p>Install a Mac app, open the PDF plan, and calibrate it against a printed dimension. Check a second known dimension, then measure the lengths, areas, and counts you need. Review the worksheet and export it to CSV or PDF.</p>
        <p>PolyPDF runs on macOS 14 or newer, on Apple silicon and Intel Macs. <a href="/samples/evaluation/public-mac-1.6.27-99/verification.html" hrefLang="en">Read the publisher’s test of calibration, lengths, area, and export in public Mac 1.6.27 build 99 (English)</a>. Counts were not part of that test.</p>
        <div className="growth-table-wrap" role="region" aria-label="Four ways to run takeoff software on a Mac" tabIndex="0">
          <table>
            <caption>Four ways to run takeoff software on a Mac</caption>
            <thead><tr><th scope="col">Route</th><th scope="col">How it runs</th><th scope="col">What to check</th></tr></thead>
            <tbody>{macRoutes.map(([route, how, check]) => <tr key={route}><th scope="row">{route}</th><td>{how}</td><td>{check}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="takeoff-small">Updated November 2026</p>
      </div>
    </section>
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
