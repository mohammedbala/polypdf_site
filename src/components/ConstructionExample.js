import React from 'react';
import { Link } from 'react-router';
import SampleLink from './SampleLink';
import { constructionExamples } from '../lib/constructionExamples';
import './ConstructionExample.css';

// On the flooring and electrical landing pages a publisher check of the same sheet sits directly above this
// example, so the example names that check instead of calling the values untested. Other pages keep the
// shared sentences, each as one unbroken string (localized pages look them up whole).
const landingNotes = {
  flooring: {
    note: 'These are the values printed on the sheet. The public Mac 1.6.27 build 99 flooring check measured the F1 and F2 areas in the app. Work on a copy and check your own saved output.'
  },
  electrical: {
    scope: 'The dashed wiring is a circuit diagram, not a conduit takeoff. Pro is required for Symbol Search; review every candidate. The 24 fixtures are a drawing reference, not an app result.',
    note: 'These are the values printed on the sheet. The public Mac 1.6.27 build 99 electrical check measured the 46 ft route in the app; the fixture count was not run. Work on a copy and check your own saved output.'
  }
};

const measurementNote = { note: 'These are the values printed on the sheet. The public Mac 1.6.27 build 99 check above measured them in the app. Work on a copy and check your own saved output.' };

export default function ConstructionExample({ kind = 'takeoff', context = 'samples', publicCheckAbove = false }) {
  const example = constructionExamples[kind];
  if (!example) return null;
  const landing = publicCheckAbove ? measurementNote : context === 'landing' ? landingNotes[kind] : undefined;
  const id = `construction-example-${kind}`;
  return <section id={id} className="construction-example" aria-labelledby={`${id}-title`}>
    <div className="container construction-example-grid">
      <div>
        <p className="growth-kicker">Work with the construction drawing set</p>
        <h2 id={`${id}-title`}>{example.title}</h2>
        <p className="construction-example-sheets"><bdi dir="ltr">{example.sheets}</bdi></p>
        <ol>{example.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="construction-example-scope">{(landing && landing.scope) || example.scope}</p>
        <p className="construction-example-provenance">{landing ? landing.note : 'Drawing reference values, not new app test results. Work on a copy and check your own saved output.'}</p>
        {kind === 'takeoff' && <p><Link to="/product-facts/#verified-construction-example">Inspect the saved Mac example and its test record →</Link></p>}
        {kind === 'takeoff' && <p><Link to="/tools/construction-takeoff-spreadsheet/">Move checked quantities into the free Excel takeoff template →</Link></p>}
        {kind === 'electrical' && <p><Link to="/electrical-takeoff-software/#electrical-count-check">Reconcile fixtures and receptacles with the electrical review sheet →</Link></p>}
        <p><Link to={example.guide}>Open the related workflow guide →</Link></p>
      </div>
      <div className="construction-example-files">
        {example.files.map(file => <figure key={file}>
          <SampleLink href={`/samples/construction/${file}.pdf`} source={`${context}_construction_${kind}`} feature={file}>
            <img src={`/samples/construction/previews/${file}--page-01.png`} alt={example.title} width="1440" height="960" loading="lazy" />
            <span>{file.startsWith('03-') ? 'Download Revision B · PDF' : file.startsWith('02-') ? 'Download Revision A · PDF' : 'Download the example drawing · PDF'}</span>
          </SampleLink>
          <figcaption><bdi dir="ltr" translate="no">{file}.pdf</bdi></figcaption>
        </figure>)}
        <p><Link to="/samples/#construction-library">Browse the complete drawing library →</Link></p>
      </div>
    </div>
  </section>;
}
