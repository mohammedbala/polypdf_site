#!/usr/bin/env python3
"""Generate a blank, four-category review sheet from the published drawing manifest."""
import csv
import hashlib
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/samples/construction'
OUT = ROOT / 'public/samples/electrical'
PDF = '06-Electrical-Lighting-and-Power.pdf'
manifest = json.loads((SOURCE / 'DEMO-MANIFEST.json').read_text())
document = next(d for d in manifest['documents'] if d['file'] == PDF)
facts = document['facts']
categories = [
    ('LT-A', 'Standard luminaires', facts['plan_luminaires'] - facts['emergency_luminaires'], 'L-01 through L-24 excluding / E units'),
    ('LT-E', 'Emergency luminaires', facts['emergency_luminaires'], 'L-01 / E; L-13 / E; L-17 / E; L-24 / E'),
    ('REC-A', 'General receptacles', facts['plan_receptacles'] - facts['gfci_receptacles'], 'R-01 through R-16'),
    ('REC-G', 'GFCI receptacles', facts['gfci_receptacles'], 'R-17 G; R-18 G'),
]
assert [c[2] for c in categories] == [20, 4, 16, 2], 'Review tags and website copy when drawing references change.'
source_url = 'https://www.polypdf.com/samples/construction/' + PDF
stream = io.StringIO(newline='')
writer = csv.writer(stream, lineterminator='\n')
writer.writerow(['Category', 'Description', 'ReferenceCount', 'Unit', 'Sheet', 'Revision', 'TagScope', 'ObservedCount', 'Status', 'AppVersionBuild', 'Platform', 'Edition', 'ReviewNotes', 'SourceURL'])
for category, description, count, tags in categories:
    writer.writerow([category, description, count, 'ea', 'E101 / E601', 'A', tags, '', 'NOT RUN', '', '', '', '', source_url])
csv_bytes = stream.getvalue().encode('utf-8')
record = {
    'preparedAt': '2026-10-17', 'referenceOnly': True, 'runtimeVerification': 'not_performed',
    'project': manifest['project']['name'], 'sheets': ['E101', 'E601'], 'revision': 'A',
    'sourcePdf': {'url': source_url, 'sha256': hashlib.sha256((SOURCE / PDF).read_bytes()).hexdigest()},
    'reviewCsv': {'file': 'electrical-count-review.csv', 'sha256': hashlib.sha256(csv_bytes).hexdigest()},
    'scope': 'Four mutually exclusive luminaire and receptacle categories on the E101 plan. Excludes legend symbols, E601 details, switches, panel and wiring.',
    'categories': [{'id': c[0], 'description': c[1], 'referenceCount': c[2], 'unit': 'ea', 'tags': c[3]} for c in categories],
    'routeReference': {'drawnCenterlineFt': facts['home_run_centerline_ft'], 'verticesFt': facts['home_run_vertices_ft'], 'notAConduitOrWireQuantity': True},
}
guide = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, follow"><title>Electrical count review sheet | PolyPDF</title>
<style>body{font-family:system-ui,sans-serif;line-height:1.65;max-width:760px;margin:40px auto;padding:0 24px;color:#162936}h1{line-height:1.15}a{color:#006d83}li{margin:.8em 0}code{overflow-wrap:anywhere}.note{border-left:3px solid #006d83;padding:1em;background:#f0f7f8}</style></head><body>
<h1>Electrical count review sheet</h1>
<p>Use the fictional Willow Creek Community Center E101 plan and E601 schedule, Revision A, to practice reviewing electrical quantities. These drawings are not for construction.</p>
<p><a href="electrical-count-review.csv" download>Download the blank count review CSV</a> · <a href="../construction/06-Electrical-Lighting-and-Power.pdf">Open the two-sheet source PDF</a></p>
<p class="note">The four reference counts describe the authored drawing, not an automatic count or an app export. Observed counts and app details start blank; every status is NOT RUN. No current Mac or Windows Symbol Search verification is claimed.</p>
<h2>Review four separate categories</h2><ol>
<li><strong>LT-A: 20 standard luminaires.</strong> Review L-01 through L-24, excluding the four / E units.</li>
<li><strong>LT-E: 4 emergency luminaires.</strong> L-01 / E, L-13 / E, L-17 / E and L-24 / E. These are part of the 24 total luminaires.</li>
<li><strong>REC-A: 16 general receptacles.</strong> R-01 through R-16.</li>
<li><strong>REC-G: 2 GFCI receptacles.</strong> R-17 G and R-18 G. These are part of the 18 total receptacles.</li></ol>
<p>Count only installed symbols inside the E101 plan boundary. Exclude the legend and E601 details. The four CSV rows exclude the ten switches, one panel, wiring and other electrical scope; they are not a complete estimate.</p>
<h2>Record your own results</h2><ol>
<li>Save a copy of the PDF. Record the app version/build, operating system and Free/Pro edition.</li>
<li>Inspect symbols and tags. Free supports visual review, calibration and up to three hand-created measurements per document. Symbol Search requires Pro.</li>
<li>For a Pro search, review candidates, missed symbols, duplicates and differing tags before accepting counts. Keep each category in a separate subject.</li>
<li>Enter an observed count for each category. Record differences and evidence filenames in ReviewNotes. Replace NOT RUN with your actual review status only after checking the output.</li>
<li>Reconcile 20 + 4 with 24 luminaires and 16 + 2 with 18 receptacles. Keep totals and their subsets from being priced twice.</li></ol>
<h2>Use the route as a scale exercise</h2><p>Calibrate the printed 20 ft reference, check the independent 96 ft building width, then measure the two selected route segments: 8 ft north and 38 ft east. The three lengths fit the Free hand-created measurement limit. The 46 ft dashed circuit diagram does not establish conduit or conductor quantities. E601 diagrams and schedules are not to scale.</p>
<h2>Keep the source with the estimate</h2><p>Keep app CSV output separate from this website-authored review sheet. Clear worksheet filters when a full export is needed, check subjects and units, and transfer reviewed quantities into your own estimating process with matching rates and scope. No material pricing, labor units or assemblies are supplied.</p>
<p><a href="https://www.polypdf.com/tools/construction-takeoff-spreadsheet/">Use the Excel takeoff template and CSV mapping guide</a> · <a href="https://www.polypdf.com/electrical-takeoff-software/#electrical-options">Compare Free and Pro for this exercise</a></p>
<p><a href="manifest.json">Source hashes and reference record</a> · <a href="../construction/DEMO-MANIFEST.json">Original construction drawing manifest</a> · <a href="https://www.polypdf.com/electrical-takeoff-software/">Electrical takeoff workflow</a></p>
</body></html>'''
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'electrical-count-review.csv').write_bytes(csv_bytes)
(OUT / 'manifest.json').write_text(json.dumps(record, indent=2) + '\n')
(OUT / 'README.html').write_text(guide + '\n')
print('Electrical review generated: 4 reference categories, blank results, source hashes.')
