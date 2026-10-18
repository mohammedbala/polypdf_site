import React from 'react';
import { Link } from 'react-router';
import { ResourceLayout } from './GrowthPages';
import SampleLink from './SampleLink';
import DownloadCTA from './DownloadCTA';
import { buyPath } from '../lib/attribution';

const exampleRoot = '/samples/evaluation/local-build-1.6.14-76';

export default function TakeoffSpreadsheetPage() {
  return <ResourceLayout eyebrow="Free Excel resource · Construction quantities" title="Construction takeoff spreadsheet" intro="Carry checked PDF quantities into a simple estimate. Download an editable Excel workbook, inspect a real PolyPDF CSV, and keep scope, units, allowances, and rates together.">
    <section className="growth-prose" aria-labelledby="spreadsheet-download">
      <h2 id="spreadsheet-download">Download the free takeoff template</h2>
      <p>The workbook has 20 prepared estimate lines and a separate CSV example tab. Enter your checked quantities and USD unit rates. It calculates allowance-adjusted quantities, rounded line costs, and a subtotal of priced rows. Missing inputs remain visible.</p>
      <div className="construction-library-downloads">
        <SampleLink href="/samples/spreadsheets/polypdf-construction-takeoff-template.xlsx" source="takeoff_spreadsheet" feature="estimate_template">Download the takeoff spreadsheet · XLSX</SampleLink>
        <SampleLink href={`${exampleRoot}/willow-creek-a101-takeoff.csv`} source="takeoff_spreadsheet" feature="actual_app_csv">Download the actual app export · CSV</SampleLink>
      </div>
      <p>No signup or PolyPDF license is needed for the workbook. It is a website-authored estimating template with formulas, not an export from the app. It does not measure PDFs or stay synchronized with a drawing.</p>
    </section>
    <section className="growth-prose" aria-labelledby="pdf-takeoff-to-excel">
      <h2 id="pdf-takeoff-to-excel">How do you move a PDF takeoff into Excel?</h2>
      <p>Measure a calibrated drawing, review the worksheet, and export its quantities. In Excel, preserve the original export, identify the measured amount and unit, then copy only the scope you intend to price into the estimating sheet. Keep the drawing revision and your rate assumptions beside each line.</p>
      <ol>
        <li><strong>Check the drawing.</strong> Confirm the sheet and revision, calibrate a known dimension, and verify a second independent span.</li>
        <li><strong>Review the takeoff.</strong> Separate area, length, and count units. Identify calibration checks and other quantities that should stay outside the estimate.</li>
        <li><strong>Open the export.</strong> Keep the CSV unchanged as a source record. Check the headers and units before transferring values; the mapping below describes the downloadable example.</li>
        <li><strong>Price selected scope.</strong> Enter an item ID, sheet/revision, scope description, unit, checked quantity, optional allowance, and a matching USD rate in the amber cells.</li>
        <li><strong>Review the subtotal.</strong> Resolve every row marked “Needs inputs.” Confirm the scope and rates even when a row says “Priced.”</li>
      </ol>
      <p>Excel can open CSV files and import delimited text. Check its import preview so numbers and columns are interpreted correctly. See <a href="https://support.microsoft.com/en-us/excel/get-started/import-or-export-text-txt-or-csv-files" target="_blank" rel="noopener noreferrer">Microsoft’s CSV import guidance</a>.</p>
    </section>
    <section className="growth-prose" aria-labelledby="csv-field-mapping">
      <h2 id="csv-field-mapping">Which CSV column contains the measured quantity?</h2>
      <p>In the downloadable PolyPDF example, use <strong>Total together with Unit</strong> for the measured amount. <strong>Quantity counts measurement records</strong>: one area record and two length records. Do not substitute that record count for square feet or feet.</p>
      <div className="growth-table-wrap" role="region" aria-label="Actual CSV field mapping" tabIndex="0">
        <table><caption>Willow Creek A101 CSV: read each column in context</caption><thead><tr><th scope="col">Field</th><th scope="col">Area row</th><th scope="col">Length row</th><th scope="col">How to use it</th></tr></thead><tbody>
          <tr><th scope="row">Quantity</th><td>1</td><td>2</td><td>Number of measurement records in the row.</td></tr>
          <tr><th scope="row">Formula</th><td>SUM(5760)</td><td>SUM(96 + 60)</td><td>Source calculation text. Preserve it with the original export.</td></tr>
          <tr><th scope="row">Total</th><td>5,760</td><td>156</td><td>Measured amount, interpreted with its Unit and scope.</td></tr>
          <tr><th scope="row">Unit</th><td>sq ft</td><td>ft</td><td>Keep this beside the amount. Rates must use the same unit.</td></tr>
          <tr><th scope="row">Pages</th><td>1</td><td>1</td><td>PDF page reference. Add the actual sheet and revision separately.</td></tr>
        </tbody></table>
      </div>
      <h3>Why does the export contain another set of totals?</h3>
      <p>After a blank line, this CSV contains a second table headed Group, Value, Count, Total, Unit. It summarizes the same measurements by subject. Adding that block to the first table would count the same amounts twice. Keep it as a cross-check, or use one table consistently.</p>
      <h3>Are these example amounts ready to price?</h3>
      <p>The 5,760 sq ft area is the building’s gross footprint, including walls. The 156 ft length total is 96 + 60 ft from independent width and depth checks; it is not a perimeter. Neither row is automatically a net flooring, conduit, or other material quantity. The workbook leaves the estimate blank so you can select the correct scope.</p>
      <p>The source file was exported in <strong>local Mac build 1.6.14 build 76</strong>. Its saved-drawing checks retained 96 ft, 60 ft, and 5,760 sq ft. <Link to="/product-facts/#verified-construction-example">Inspect the measured PDF and exact test scope</Link>. This example does not establish current public-installer or Windows results.</p>
    </section>
    <section className="growth-prose" aria-labelledby="estimate-formulas">
      <h2 id="estimate-formulas">How the spreadsheet calculates costs</h2>
      <p><strong>Priced quantity = checked quantity × (1 + allowance).</strong> A blank allowance means zero. <strong>Line cost = priced quantity × matching unit rate</strong>, rounded to two decimal places. The subtotal adds line costs, never mixed measurement units.</p>
      <p>For an illustrative line only, 100 sq ft with 10% allowance gives 110 sq ft. At an assumed $2.50 per sq ft, the line costs $275.00. The template supplies no market prices; choose rates and allowances for your actual scope.</p>
      <p>The template accepts nonnegative quantities and rates, and allowances from 0% to 100%. It does not convert units, round to packs, or automatically add labor, tax, delivery, overhead, or profit. Define what each rate includes. For whole-pack purchasing, use the <Link to="/tools/flooring-waste-calculator/">flooring waste and pack calculator</Link>.</p>
    </section>
    <section className="growth-prose" aria-labelledby="measure-before-estimating">
      <h2 id="measure-before-estimating">Get the quantities from your PDF drawing</h2>
      <p>PolyPDF runs on Mac and Windows. Free includes calibration, markup, review, and up to 3 hand-created measurements per document. Use the <Link to="/product-facts/#evaluation-kit">construction evaluation kit</Link> to test a representative drawing before buying.</p>
      <p>Pro removes the hand-created measurement limit and adds workflows including Symbol Search, colored overlays, and PDF content editing. <Link to="/pdf-takeoff-software/#free-vs-pro">Compare Free and Pro</Link>, then <Link to={buyPath('takeoff_spreadsheet')}>review current Pro pricing and license rights</Link>.</p>
      <DownloadCTA source="takeoff_spreadsheet" />
      <p><Link to="/blog/pdf-takeoff-worked-example/">Follow the PDF takeoff walkthrough</Link> · <Link to="/samples/#construction-library">Browse the construction drawings</Link></p>
    </section>
  </ResourceLayout>;
}
