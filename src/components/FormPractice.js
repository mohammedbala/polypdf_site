import React from 'react';
import { Link } from 'react-router';
import { SampleLink } from './GrowthEvidence';
import DownloadCTA from './DownloadCTA';

export default function FormPractice() {
  return <section id="practice-form" className="growth-file-panel form-practice" aria-labelledby="practice-form-title">
    <h2 id="practice-form-title">Download a fillable PDF form to practice with</h2>
    <p>This construction review example has ten fields: text, multiline notes, checkboxes, a radio group, and a drop-down. Download the English or French version, enter test values, then save and reopen a copy to check that the values persist.</p>
    <ul>
      <li><SampleLink href="/samples/forms/construction-review-form-en.pdf" source="form_practice" feature="form_english">English practice form · PDF</SampleLink></li>
      <li><SampleLink href="/samples/forms/construction-review-form-fr.pdf" source="form_practice" feature="form_french">French practice form · PDF</SampleLink></li>
      <li><SampleLink href="/samples/forms/construction-review-field-map.csv" source="form_practice" feature="form_field_map">Field names and types · CSV</SampleLink></li>
    </ul>
    <p>Free files. No account or email required. These original practice templates are separate from the older checklist shown above. Adapt the fields to your project.</p>
    <h3>Check a saved form in four steps</h3>
    <ol>
      <li>Open a downloaded form. Enter a project name, date, reviewer, and drawing revision.</li>
      <li>Select a scope and review status, check the relevant boxes, and enter a note with an accented character and a line break.</li>
      <li>Use Save As to create a separate copy. Close it, reopen it, and compare all ten fields with your entries.</li>
      <li>Open that saved copy in the viewer your recipient uses. Check the text, selected options, and checkboxes before sending it.</li>
    </ol>
    <p className="form-practice-evidence">These original AcroForm templates were generated and checked with independent PDF tools on October 17, 2026; they are not PolyPDF exports. The checks cover field values and appearances after saving. Current PolyPDF Mac and Windows compatibility is not verified for these files, so test a saved copy in your own viewer.</p>
    <h3>Try the form in PolyPDF</h3>
    <DownloadCTA source="form_practice" tone="dark" />
    <p>Also taking off drawing quantities? Free includes three hand-created measurements per document; Pro removes that limit. <Link to="/pdf-takeoff-software/#free-vs-pro">Compare Free and Pro for takeoff</Link>.</p>
  </section>;
}
