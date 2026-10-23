import React from 'react';
import { Link, useLocation } from 'react-router';
import parrotIcon from '../assets/polypdf_icon-96.png';
import './Growth.css';
const groups = [
  ['Product', [['/pdf-takeoff-software/', 'Takeoff'], ['/pdf-measuring-tool/', 'Measurement'], ['/construction-pdf-markup/', 'Markup'], ['/compare-pdf-drawings/', 'Drawing comparison'], ['/bluebeam-alternative/', 'Compare with Bluebeam']]],
  ['Solutions', [['/electrical-takeoff-software/', 'Electrical'], ['/flooring-takeoff-software/', 'Flooring'], ['/measure-pdf-on-mac/', 'For Mac'], ['/windows/', 'For Windows']]],
  ['Resources', [['/blog/', 'Guides'], ['/samples/', 'Sample files'], ['/tools/', 'PDF tools'], ['/product-facts/', 'Product facts'], ['/teams/', 'Teams']]]
];
export default function GrowthNav() {
  const { pathname } = useLocation();
  const close = e => { if (e.target.closest('a')) e.currentTarget.querySelectorAll('details[open]').forEach(d => { d.open = false; }); };
  return <header className="growth-header"><nav className="container growth-nav" aria-label="Main navigation" onClick={close} onKeyDown={e => { if(e.key === 'Escape') { const d = e.target.closest('details'); if(d) { d.open = false; d.querySelector('summary').focus(); } } }}>
    <Link to="/" className="growth-logo" aria-label="PolyPDF home"><img src={parrotIcon} width="32" height="32" alt=""/>PolyPDF</Link>
    <div className="growth-nav-groups">{groups.map(([label, links]) => <details key={label} name="main-navigation" onToggle={e => { if (e.currentTarget.open) { e.currentTarget.parentElement.querySelectorAll('details[open]').forEach(d => { if (d !== e.currentTarget) d.open = false; }); } }}><summary>{label}</summary><div className="growth-menu">{links.map(([href, text]) => <Link key={href} to={href} aria-current={pathname.replace(/\/$/,'') === href.replace(/\/$/,'') ? 'page' : undefined}>{text}</Link>)}</div></details>)}</div>
    <Link to="/buy/" className="growth-nav-price">Pricing</Link><Link to="/support/" className="growth-nav-support">Support</Link><a href="/#download" className="growth-nav-download">Download</a>
  </nav></header>;
}
