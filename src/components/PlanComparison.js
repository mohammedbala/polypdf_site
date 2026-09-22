import React from 'react';
import './Conversion.css';

export const planComparisonRows = [
  ['Markup, review & scale calibration', 'Included', 'Included'],
  ['Hand-created measurements', '3 per document', 'Unlimited'],
  ['PDF content editing & colored overlays', 'Pro required', 'Included'],
  ['Preset & custom toolsets', 'Browse presets', 'Place and use tools'],
  ['Symbol Search & installed plugins', 'Pro required', 'Included'],
  ['Revision Packages', 'View and navigate', 'Create, update and publish']
];

export default function PlanComparison() {
  return (
    <div className="plan-comparison">
      <div className="plan-comparison-table-wrap" role="region" aria-label="Free and Pro features" tabIndex="0">
        <table className="plan-comparison-table">
          <caption>What changes when you upgrade?</caption>
          <thead><tr><th scope="col">Your workflow</th><th scope="col">Free</th><th scope="col">Pro</th></tr></thead>
          <tbody>{planComparisonRows.map(([feature, free, pro]) => (
            <tr key={feature}><th scope="row">{feature}</th><td>{free}</td><td>{pro}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <p>Your existing drawings and markups stay in place when you activate Pro.</p>
    </div>
  );
}
