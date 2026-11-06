import React from 'react';

export default function PublicMacTakeoffCheck() {
  return <div className="public-mac-takeoff-check">
    <p><strong>Public Mac check: 1.6.27 build 99</strong></p>
    <p>On November 4, 2026, the PolyPDF publisher verified 96 ft, 60 ft, and 5,760 sq ft using the public Mac build. The values and calibration were preserved after saving the PDF and restarting the app.</p>
    <p>With the app switched to metric, the same measurements displayed as 29,260.80 mm, 18,288.00 mm, and 535.12 sq m. The drawing is drawn in feet; a plan drawn in metric has not been tested.</p>
    <p><a href="/samples/evaluation/public-mac-1.6.27-99/verification.html" hrefLang="en">Read the test method and download the Mac CSV (English)</a></p>
    <p className="takeoff-small">Windows, Pro workflows, and other PDF viewers were not verified in this check.</p>
  </div>;
}
