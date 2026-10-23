import React, { useEffect } from 'react';
import checklist from '../lib/handoffChecklist.json';
import { SampleLink } from './GrowthEvidence';

export default function HandoffChecklist() {
  useEffect(() => {
    if (window.location.hash !== '#handoff-checklist') return undefined;
    let active = true;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && window.location.hash === '#handoff-checklist') {
        document.getElementById('handoff-checklist')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, []);

  return <section className="handoff-checklist" aria-labelledby="handoff-checklist">
    <div className="container">
      <p className="growth-kicker">Bluebeam migration checklist</p>
      <h2 id="handoff-checklist">{checklist.question}</h2>
      <p className="handoff-checklist-answer">{checklist.answer}</p>
      <SampleLink href="/samples/conversion/bluebeam-migration-checklist.csv" source="landing_bluebeam" feature="migration_checklist">Download the blank handoff checklist · CSV</SampleLink>
      <p className="handoff-checklist-note">Open in Excel, Numbers or another spreadsheet. No account needed. This is a test worksheet for your project, not a completed compatibility test.</p>
      <ol className="handoff-checklist-steps">
        {checklist.checks.map((check) => <li key={check.title}>
          <h3>{check.title}</h3>
          <p>{check.test}</p>
          <p><strong>Record:</strong> {check.record}</p>
        </li>)}
      </ol>
      <p>Free includes up to 3 hand-created measurements per document. Start with a length, an area and a count; a fuller pilot or Pro-only features require the appropriate license. <a href="/product-facts/#free-and-pro">Check the Free and Pro limits</a>.</p>
    </div>
  </section>;
}
