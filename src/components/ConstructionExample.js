import React from 'react';
import { Link } from 'react-router';
import SampleLink from './SampleLink';
import { constructionExamples } from '../lib/constructionExamples';
import './ConstructionExample.css';

export default function ConstructionExample({ kind = 'takeoff', context = 'samples' }) {
  const example = constructionExamples[kind];
  if (!example) return null;
  const id = `construction-example-${kind}`;
  return <section id={id} className="construction-example" aria-labelledby={`${id}-title`}>
    <div className="container construction-example-grid">
      <div>
        <p className="growth-kicker">Work with the construction drawing set</p>
        <h2 id={`${id}-title`}>{example.title}</h2>
        <p className="construction-example-sheets"><bdi dir="ltr">{example.sheets}</bdi></p>
        <ol>{example.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="construction-example-scope">{example.scope}</p>
        <p className="construction-example-provenance">Drawing reference values, not new app test results. Work on a copy and check your own saved output.</p>
        {kind === 'takeoff' && <p><Link to="/product-facts/#verified-construction-example">Inspect the saved Mac example and its tested local build →</Link></p>}
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
