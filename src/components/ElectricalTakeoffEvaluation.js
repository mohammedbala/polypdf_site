import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import DownloadCTA from './DownloadCTA';
import SampleLink from './SampleLink';
import { buyPath } from '../lib/attribution';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import './TakeoffEvaluation.css';

export default function ElectricalTakeoffEvaluation() {
  const { hash } = useLocation();
  useEffect(() => {
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && ['#electrical-options', '#electrical-count-check', '#electrical-route-check', '#electrical-estimate-handoff'].includes(hash)) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, [hash]);

  return <>
    <section className="takeoff-decision" aria-labelledby="electrical-options">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Choose around your electrical scope</p>
          <h2 id="electrical-options">Check the drawing in Free. Review symbol matches with Pro.</h2>
          <p>PolyPDF is for measuring and reviewing electrical PDF drawings on Mac and Windows. Use it to prepare quantities for your estimating process. Material prices, labor units, assemblies, circuit design, and code checks remain separate.</p>
          <dl className="takeoff-license-facts">
            <div><dt>Free drawing evaluation</dt><dd>Open the plan, inspect symbols and schedules, calibrate its scale, add review markups, and try up to 3 hand-created measurements per document. You can compare a visual tally with the blank review sheet below; Free does not run Symbol Search.</dd></div>
            <div><dt>Pro counting and larger takeoffs</dt><dd>Pro removes the hand-created measurement limit and unlocks Symbol Search. Capture a symbol, inspect the candidates, and commit accepted matches as a linked Count series. Review the tags and scope before assigning a fixture or device category.</dd></div>
            <div><dt>Full electrical estimating</dt><dd>If you need built-in labor units, material pricing, assemblies, or a complete bid, check those requirements separately. This workflow hands off reviewed quantities; it does not supply that database or a finished estimate.</dd></div>
          </dl>
          <p><strong>Personal Pro: {commercialOffer.price} USD, one payment.</strong> {licenseRightsText}</p>
          <p><Link to={buyPath('electrical_evaluation')}>Review Pro pricing and license terms →</Link></p>
        </div>
        <div className="takeoff-practice-files">
          <h3>Start with the electrical drawing.</h3>
          <p>Use the original Willow Creek E101 plan and E601 device schedule. Start in Free to check the file and route measurements; the automatic symbol-search exercise requires Pro.</p>
          <DownloadCTA source="electrical_evaluation" />
          <p><Link to="/pdf-takeoff-software/#free-vs-pro">Compare all Free and Pro workflows</Link> · <Link to="/refund/">Read the direct-purchase refund policy</Link></p>
        </div>
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="electrical-count-check">
      <div className="container">
        <p className="growth-kicker">One plan, four distinct categories</p>
        <h2 id="electrical-count-check">Reconcile fixture and receptacle counts before pricing.</h2>
        <p>Count only the E101 plan boundary, then compare with the E601 fixture and device schedule. The plan contains 24 luminaires, including 4 emergency units, and 18 receptacles, including 2 GFCI devices. The categories below separate those subsets so each item appears once.</p>
        <div className="growth-table-wrap" role="region" aria-label="Willow Creek electrical reference categories" tabIndex="0">
          <table><caption>Authored E101/E601 drawing references, not automatic-count results</caption><thead><tr><th scope="col">Schedule category</th><th scope="col">What to inspect on E101</th><th scope="col">Reference count</th></tr></thead><tbody>
            <tr><th scope="row">LT-A · Standard luminaires</th><td>L-01 through L-24, excluding the four / E units.</td><td>20 ea</td></tr>
            <tr><th scope="row">LT-E · Emergency luminaires</th><td>L-01 / E, L-13 / E, L-17 / E, and L-24 / E.</td><td>4 ea</td></tr>
            <tr><th scope="row">REC-A · General receptacles</th><td>R-01 through R-16.</td><td>16 ea</td></tr>
            <tr><th scope="row">REC-G · GFCI receptacles</th><td>R-17 G and R-18 G.</td><td>2 ea</td></tr>
          </tbody></table>
        </div>
        <div className="takeoff-decision-grid">
          <div>
            <h3>How do you avoid duplicate electrical counts?</h3>
            <ol className="takeoff-evaluation-steps">
              <li><strong>Exclude reference graphics.</strong> E101 has one extra luminaire and one extra receptacle in its legend. E601 contains details and schedules, not another floor of installed devices.</li>
              <li><strong>Classify after reviewing.</strong> Similar base symbols can have different tags or battery markers. Inspect those marks yourself; do not assume one Symbol Search capture understands the E or G classification.</li>
              <li><strong>Use separate subjects.</strong> Keep LT-A, LT-E, REC-A, and REC-G distinct. Check that 20 + 4 reconciles to 24 luminaires and 16 + 2 to 18 receptacles. Do not add the subset to the all-device total again.</li>
              <li><strong>Check differences, then export.</strong> Review missed symbols, false positives, and overlapping selections. Compare the plan markers with each worksheet subject and preserve the sheet/revision with the handoff.</li>
            </ol>
            <p><Link to="/blog/count-pdf-symbols/">Follow the Symbol Search setup and review steps →</Link></p>
          </div>
          <div className="takeoff-practice-files">
            <h3>Keep your own review record.</h3>
            <ul>
              <li><SampleLink href="/samples/construction/06-Electrical-Lighting-and-Power.pdf" source="electrical_evaluation" feature="electrical_source">E101 plan and E601 schedule · PDF</SampleLink></li>
              <li><SampleLink href="/samples/electrical/electrical-count-review.csv" source="electrical_evaluation" feature="count_review">Blank count review sheet · CSV</SampleLink></li>
            </ul>
            <p>The CSV contains four reference categories, blank observed counts, and NOT RUN statuses. Record your app version, platform, edition, and differences. It is a website-authored review sheet, not an app export.</p>
            <p className="takeoff-small">This is a partial practice scope: switches, the panel, wiring, and other electrical work are excluded from the four count rows. These fictional drawings are not for construction. Their reference counts have not been verified by a current Mac or Windows Symbol Search run.</p>
            <p><a href="/samples/electrical/README.html">Read the worksheet scope and source record →</a></p>
          </div>
        </div>
      </div>
    </section>

    <section className="takeoff-decision" aria-labelledby="electrical-route-check">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">A plan length is only the drawn path</p>
          <h2 id="electrical-route-check">Does a circuit line give the conduit or wire quantity?</h2>
          <p>Not by itself. E101 explicitly labels its dashed wiring as a circuit diagram. The selected LP-1 / CKTS 1, 3, 5, 7 path runs 8 ft north and 38 ft east, totaling 46 ft of drawn centerline. That is a scale-and-route exercise, not 46 ft of conduit or a conductor order.</p>
          <p>For a Free measurement check, calibrate the printed 20 ft reference, verify the independent 96 ft building width, and measure the two route segments separately. These three hand-created length measurements fit within the Free limit; calibration sets the scale.</p>
        </div>
        <div>
          <h3>Define the installation scope separately.</h3>
          <ul className="takeoff-evaluation-steps">
            <li>Confirm actual routing, elevations, rises, drops, and terminations from the project documents.</li>
            <li>Keep conductor quantities separate from raceway length; use the specified conductor count and routing.</li>
            <li>Record fittings, supports, waste, and allowances only where the scope supports them.</li>
            <li>Keep E601 diagrams and schedules out of scaled measurements: they are not to scale.</li>
          </ul>
          <p><Link to="/tools/pdf-scale-checker/">Check your independent scale references →</Link></p>
        </div>
      </div>
    </section>

    <section className="takeoff-evaluation" aria-labelledby="electrical-estimate-handoff">
      <div className="container takeoff-decision-grid">
        <div>
          <p className="growth-kicker">Move reviewed quantities into an estimate</p>
          <h2 id="electrical-estimate-handoff">Keep counts, lengths, and rates on separate lines.</h2>
          <p>Clear worksheet filters when you need the full export, then reconcile each subject, unit, and measured total. Keep your original CSV as the source. Transfer only reviewed scope into the estimating sheet, with a matching unit rate and the drawing revision.</p>
          <p>In the separate saved A101 CSV example, Quantity counts measurement records while Total and Unit hold the measured amount. The guide explains this mapping and the repeated summary block. Check your own export headers rather than assuming every column called quantity is the amount to price.</p>
          <p><Link to="/tools/construction-takeoff-spreadsheet/">Use the free takeoff spreadsheet and CSV field guide →</Link></p>
        </div>
        <div>
          <h3>Choose Pro when the reviewed workflow fits.</h3>
          <p>Use Free to inspect the drawing and test the three-length exercise. Choose Pro when you need Symbol Search or more hand-created measurements, after checking that the exports and review workflow fit your estimating process.</p>
          <p><Link to={buyPath('electrical_handoff')}>Review current Pro pricing and license rights →</Link></p>
          <p><Link to="/product-facts/#evaluation-kit">Get the complete construction evaluation kit →</Link></p>
        </div>
      </div>
    </section>
  </>;
}
