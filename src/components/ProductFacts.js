import React from 'react';
import { Link } from 'react-router';
import { ResourceLayout } from './GrowthPages';
import { DOWNLOADS } from '../lib/platform';
import { commercialOffer, licenseRightsText } from '../lib/commercialOffer';
import siteRelease from '../lib/siteRelease.json';

export default function ProductFacts() {
  return <ResourceLayout eyebrow="Product reference · Reviewed October 16, 2026" title="PolyPDF: product facts and limits" intro="PolyPDF is desktop PDF measurement, takeoff, markup, and drawing-review software for construction professionals on Mac and Windows. Published by Euclidean Software LLC.">
    <nav className="product-facts-contents" aria-label="On this page">
      <a href="#platforms">Platforms</a><a href="#free-and-pro">Free and Pro</a><a href="#workflows">Workflows</a><a href="#local-processing">Local processing</a><a href="#compatibility">Compatibility</a><a href="#evidence">Examples and verification</a>
    </nav>
    <section className="product-facts-section" aria-labelledby="platforms">
      <h2 id="platforms">Which platforms does PolyPDF support?</h2>
      <dl className="product-facts-list">
        <div><dt>Mac</dt><dd>{DOWNLOADS.mac.requirements}. <a href={DOWNLOADS.mac.url} download>Download the Mac app</a>.</dd></div>
        <div><dt>Windows</dt><dd>{DOWNLOADS.windows.requirements}. <Link to="/windows/">Windows installation and download</Link>.</dd></div>
        <div><dt>Release reference</dt><dd>PolyPDF {siteRelease.version}, build {siteRelease.build}, released {siteRelease.releaseDate}. <Link to="/versions/">Check the live release feeds and version history</Link>.</dd></div>
        <div><dt>Browser tools</dt><dd>The <Link to="/tools/flooring-waste-calculator/">flooring waste calculator</Link> runs in a browser using quantities you enter. PDF measurement takes place in the desktop app. The desktop installers do not run on iPhone, iPad, Android, or Linux.</dd></div>
      </dl>
    </section>
    <section className="product-facts-section" aria-labelledby="free-and-pro">
      <h2 id="free-and-pro">Is PolyPDF free, and what does Pro include?</h2>
      <p>PolyPDF Free includes PDF markup, review, calibration, up to <strong>3 hand-created measurements per document</strong>, and Revision Package viewing and navigation. It is a useful way to evaluate a representative drawing before buying.</p>
      <p>Pro removes the hand-created measurement cap and unlocks Pro workflows including Symbol Search, PDF content editing, toolsets, overlay, installed plugins, and Revision Package creation, changes, and publication. Free is not an unrestricted takeoff or Symbol Search edition.</p>
      <p><Link to="/pdf-takeoff-software/#free-vs-pro">Compare Free and Pro workflows</Link>, then <Link to="/pdf-takeoff-software/#try-a-takeoff">try the three-measurement practice takeoff</Link> before choosing a license.</p>
      <dl className="product-facts-list">
        <div><dt>Personal Pro price</dt><dd>{commercialOffer.price} USD, one payment. <Link to="/buy/">Review current pricing, taxes, and checkout terms</Link>.</dd></div>
        <div><dt>License rights</dt><dd>{licenseRightsText}</dd></div>
        <div><dt>Direct-purchase refund</dt><dd>{commercialOffer.moneyBackGuaranteeDays}-day money-back guarantee. <Link to="/refund/">Read the refund policy</Link>.</dd></div>
        <div><dt>Teams</dt><dd>Personal activation rights and organization-managed seats are different arrangements. <Link to="/teams/">See team licensing</Link> for organizational deployment.</dd></div>
      </dl>
    </section>
    <section className="product-facts-section" aria-labelledby="workflows">
      <h2 id="workflows">What can you do with construction drawings?</h2>
      <dl className="product-facts-list">
        <div><dt>Measure and take off</dt><dd>Calibrate a page or drawing region, measure distances and areas, count items, and review worksheet quantities. Check an independent dimension before relying on results. <Link to="/pdf-measuring-tool/">PDF measurement workflow</Link>.</dd></div>
        <div><dt>Electrical quantities</dt><dd>Review fixture counts and drawn route lengths. Add scope-specific allowances and approved pricing separately. PolyPDF is not an electrical design or labor database. <Link to="/electrical-takeoff-software/">Electrical takeoff workflow</Link>.</dd></div>
        <div><dt>Flooring quantities</dt><dd>Measure room boundaries and exclusions, then calculate waste and whole-pack purchasing quantities. The documented workflow does not optimize roll layouts or seams. <Link to="/flooring-takeoff-software/">Flooring takeoff workflow</Link>.</dd></div>
        <div><dt>Markup and comparison</dt><dd>Add review notes, callouts, shapes, highlights, and revision clouds; compare drawing revisions and review detected differences. <Link to="/construction-pdf-markup/">Markup</Link> and <Link to="/compare-pdf-drawings/">drawing comparison</Link>.</dd></div>
        <div><dt>Export</dt><dd>Takeoff worksheets support Excel, CSV, and PDF output. The downloadable verified Mac examples include CSV worksheets and PDF summaries. Review quantities, units, and assumptions before pricing or ordering.</dd></div>
      </dl>
    </section>
    <section className="product-facts-section" aria-labelledby="local-processing">
      <h2 id="local-processing">Does PolyPDF upload drawings to process them?</h2>
      <p>Core PDF viewing, measurement, markup, and editing run locally on the computer. Documents can leave the device when you choose to share, export, or invoke a connected workflow. Local processing does not mean that every feature works without a network connection.</p>
      <p>License activation and validation, updates, purchases, account access, customer-managed collaboration, PDF Maps, optional signature timestamping, and optional diagnostics or usage sharing involve connections. See the <Link to="/privacy/">privacy policy</Link> for the data and choices associated with those services.</p>
    </section>
    <section className="product-facts-section" aria-labelledby="compatibility">
      <h2 id="compatibility">Does PolyPDF replace Bluebeam Studio?</h2>
      <p>No. PolyPDF cannot join Bluebeam Studio Projects or Sessions. PolyPDF’s own collaboration workflow uses a customer-managed host and file share; it is a separate system.</p>
      <p>Evaluate required custom annotations, reports, toolsets, and recipient workflows before switching PDF applications. Reopening a file in PolyPDF does not establish compatibility with every other viewer. <Link to="/bluebeam-alternative/">Review the comparison and official Bluebeam sources</Link>.</p>
    </section>
    <section className="product-facts-section" aria-labelledby="evidence">
      <h2 id="evidence">Which examples have been verified?</h2>
      <p>The <Link to="/samples/">sample library</Link> contains synthetic drawings and independently calculated reference quantities. Separate Mac app exports demonstrate <strong>408 sq ft of flooring</strong> and a <strong>42 ft electrical route</strong>, exported and reopened in PolyPDF 1.6.6 build 38. Electrical fixture counts remain reference quantities.</p>
      <p>These samples identify the app version and platform used. They do not establish Windows verification, current-release parity, or complete cross-viewer compatibility. Product demonstrations retain their own version labels. <a href="/samples/takeoff/README.md">Read the takeoff sample provenance</a>.</p>
      <p>This reference was reviewed by the PolyPDF publisher on <time dateTime="2026-10-16">October 16, 2026</time> against the published product, licensing, privacy, release, and sample records linked above. For a correction or a question about your workflow, <a href="mailto:support@polypdf.com">contact support@polypdf.com</a>.</p>
    </section>
  </ResourceLayout>;
}
