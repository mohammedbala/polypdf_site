import React from 'react';
import { Link } from 'react-router';
export default function SampleDrawingNote({ electrical = false }) {
  return <div className="sample-drawing-note">
    <p>The practice drawings were redrawn on October 17, 2026 with walls, doors, dimensions, legends, and title blocks. The measured examples retain the original scale, geometry, and Mac-created annotations on the updated backgrounds. They are republished derivatives, not new desktop exports. The worksheet CSV and PDF totals come from the original October 16 test.</p>
    {electrical && <p>Count fixtures in the plan only. Exclude the legend symbols and the small JB route-endpoint boxes.</p>}
    <p><Link to="/samples/#construction-library">Explore the full construction drawing library →</Link></p>
  </div>;
}
