import React from 'react';
import { trackEvent } from '../lib/analytics';
import { DOWNLOADS } from '../lib/platform';
import SampleLink from './SampleLink';
import './DownloadEvaluation.css';

// Native details keeps the practice path usable before hydration and on static translations.
// An installer click opens it in place; it is a request, not proof of download or activation.
export default function DownloadEvaluation({ detailsRef, requestedPlatform, source, tone = '', guideHref }) {
  const guideClick = (target) => trackEvent('download_evaluation_click', { source, target });
  return <div className={`dl-evaluation ${tone}`.trim()}>
    {requestedPlatform && <p className="dl-evaluation-status" role="status">
      Download requested for {DOWNLOADS[requestedPlatform].name}. Check your browser’s downloads, then install the file on that desktop.
    </p>}
    {guideHref ? <p className="dl-evaluation-link"><a href={guideHref} data-evaluation-target="guide" onClick={() => guideClick('guide')}>Try a checked construction takeoff</a></p> : <details ref={detailsRef} onToggle={(event) => {
      if (event.currentTarget.open) trackEvent('download_evaluation_open', { source });
    }}>
      <summary>Try a checked construction takeoff</summary>
      <div className="dl-evaluation-body">
        <p>Use the Willow Creek A101 practice drawing on a Mac or Windows PC. The three measurements fit Free; no account is needed.</p>
        <ul className="dl-evaluation-install">
          <li>macOS 14+: open the DMG and drag PolyPDF to Applications, then launch it.</li>
          <li>Windows 10/11, 64-bit: run PolyPDFSetup.exe, finish installation, then launch PolyPDF.</li>
        </ul>
        <div className="dl-evaluation-links">
          <SampleLink href="/samples/construction/02-Architectural-Revision-A.pdf" source={source} feature="download_evaluation">Download the architectural practice PDF</SampleLink>
          <a href="/blog/pdf-takeoff-worked-example/#construction-example-takeoff" data-evaluation-target="guide" onClick={() => guideClick('guide')}>Open the illustrated takeoff guide</a>
        </div>
        <ol>
          <li>Calibrate A101, Revision A, along the printed 20 ft reference.</li>
          <li>Check the independent 96 ft width and 60 ft depth. Stop if either reading disagrees with the drawing.</li>
          <li>Trace the outside boundary: 5,760 sq ft gross area. Review the worksheet, export it, save a copy, and reopen the PDF to check all three measurements.</li>
        </ol>
        <p>Two length checks and one area use the three-measurement Free allowance. Gross area includes walls; it is not net flooring or a complete estimate.</p>
        <p className="dl-evaluation-scope">These are drawing reference values. A saved example was verified in local Mac build 1.6.14 build 76; check your own result on the installed version.</p>
        <div className="dl-evaluation-links">
          <a href="/product-facts/#verified-construction-example" data-evaluation-target="evidence" onClick={() => guideClick('evidence')}>Inspect the saved example and test scope</a>
          <a href="/pdf-takeoff-software/#free-vs-pro" data-evaluation-target="plans" onClick={() => guideClick('plans')}>Compare Free and Pro</a>
        </div>
        <p className="dl-evaluation-scope">Synthetic practice drawing; not for construction. Desktop installers do not run on phones or tablets.</p>
      </div>
    </details>}
  </div>;
}
