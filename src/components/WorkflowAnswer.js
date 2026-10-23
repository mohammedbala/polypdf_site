import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { workflowAnswers } from '../lib/workflowAnswers';

export default function WorkflowAnswer({ path }) {
  const entry = workflowAnswers[path];
  useEffect(() => {
    if (!entry || window.location.hash !== '#quick-answer') return undefined;
    let active = true;
    // Font replacement can move the hero after the browser's initial fragment jump.
    Promise.resolve(document.fonts?.ready).then(() => {
      if (active && window.location.hash === '#quick-answer') {
        document.getElementById('quick-answer')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
    return () => { active = false; };
  }, [entry]);
  if (!entry) return null;
  return <section className="workflow-answer" aria-labelledby="quick-answer">
    <div className="container workflow-answer-grid">
      <p className="growth-kicker">Quick answer</p>
      <div><h2 id="quick-answer">{entry.question}</h2><p>{entry.answer}</p>
        <Link to={entry.href}>{entry.label} →</Link>
      </div>
    </div>
  </section>;
}
