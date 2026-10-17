import React from 'react';
import { Link } from 'react-router';
import ConstructionExample from './ConstructionExample';
import './Growth.css';
export { default as SampleLink } from './SampleLink';
export default function GrowthEvidence({ kind = 'takeoff' }) {
  return <ConstructionExample kind={kind === 'measurement' ? 'takeoff' : kind} context="landing" />;
}
export function WorkflowEntrances() { return <section className="growth-entrances"><div className="container"><p className="growth-kicker">Start with your drawing task</p><div className="growth-task-list">{[['01','/pdf-takeoff-software/','Take off quantities','Calibrate a plan, measure scope, and export a worksheet.'],['02','/pdf-measuring-tool/','Measure a PDF','Verify scale before tracing distances, areas, and counts.'],['03','/construction-pdf-markup/','Review a drawing','Mark an issue, save a copy, and check the handoff.']].map(([n,url,title,text])=><Link key={url} to={url}><span>{n}</span><div><h2>{title}</h2><p>{text}</p></div><span aria-hidden="true">↗</span></Link>)}</div><div className="growth-trades"><p>Find your workflow</p><Link to="/electrical-takeoff-software/">Electrical quantities →</Link><Link to="/flooring-takeoff-software/">Flooring areas →</Link><Link to="/bluebeam-alternative/">Compare with Bluebeam →</Link></div></div></section>; }
