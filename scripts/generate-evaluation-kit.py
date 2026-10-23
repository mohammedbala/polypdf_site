#!/usr/bin/env python3
"""Build a deterministic evaluation package from the published drawing library."""
import csv
import hashlib
import html
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/samples/construction'
OUT = ROOT / 'public/samples/evaluation'
DATE = '2026-10-17'
FILES = ['02-Architectural-Revision-A.pdf', '03-Architectural-Revision-B.pdf',
         '06-Electrical-Lighting-and-Power.pdf', '10-Interiors-Finishes-and-Millwork.pdf',
         '11-Coordination-and-Review.pdf', '12-Scanned-Legacy-Drawings.pdf']
manifest = json.loads((SOURCE / 'DEMO-MANIFEST.json').read_text())
docs = {d['file']: d for d in manifest['documents']}
a, b, electrical, finishes, review, scan = [docs[f]['facts'] for f in FILES]
reference_rows = [
    ['A01', FILES[0], 'A101', 'Printed calibration reference', 20, 'ft', '360 PDF points; verify against the source drawing.'],
    ['A02', FILES[0], 'A101', 'Independent outside width', a['footprint_ft'][0], 'ft', 'Measure independently after calibration.'],
    ['A03', FILES[0], 'A101', 'Independent outside depth', a['footprint_ft'][1], 'ft', 'Measure independently after calibration.'],
    ['A04', FILES[0], 'A101', 'Gross building footprint', a['gross_area_sf'], 'sq ft', '96 x 60; not net floor area. Two length checks plus one area = 3 manual measurements.'],
    ['F01', FILES[3], 'I101', 'F2 tile zones total', finishes['tile_floor_sf'], 'sq ft', 'Rooms 107 and 108: 288 each; dimension boundaries, no wall-thickness deductions.'],
    ['F02', FILES[3], 'I101', 'F1 resilient zones total', finishes['resilient_floor_sf'], 'sq ft', 'Schedule reference; use a separate copy or Pro if manual measurements exceed 3. Waste is separate.'],
    ['E01', FILES[2], 'E101', 'Plan luminaires', electrical['plan_luminaires'], 'count', 'Includes emergency subset; exclude legend and detail symbols. Pro required for Symbol Search.'],
    ['E02', FILES[2], 'E101', 'Emergency subset', electrical['emergency_luminaires'], 'count', 'Included in 24; do not add again.'],
    ['E03', FILES[2], 'E101', 'LP-1 CKTS 1,3,5,7 drawn route', electrical['home_run_centerline_ft'], 'ft', '8 + 38; circuit-diagram geometry, NOT a conduit quantity.'],
    ['R01', FILES[1], 'A101', 'Revision B room 103', b['meeting_room_103_sf'], 'sq ft', 'Revision A 576; partition shifts 6 ft.'],
    ['R02', FILES[1], 'A101', 'Revision B room 104', b['maker_room_104_sf'], 'sq ft', 'Revision A 576; door shifts 3 ft; added glazing is 6 ft. Authored changes are not a detection-count promise.'],
    ['C01', FILES[4], 'X101', 'Authored coordination notes', review['native_review_notes'], 'count', 'Fictional issues; add your own note on a working copy.'],
    ['C02', FILES[4], 'X101', 'PDF layers', len(review['layers']), 'count', 'Architecture; Mechanical; Electrical; Review issues.'],
    ['O01', FILES[5], 'A101 / C101', 'Original native text', scan['native_text_characters'], 'characters', 'Image-only input. After OCR, check COMMUNITY ROOM and SITE PLAN, then save and reopen.']
]
assert a['calibration_20ft_points'] == 360
assert a['gross_area_sf'] == a['footprint_ft'][0] * a['footprint_ft'][1]
assert finishes['tile_floor_sf'] + finishes['resilient_floor_sf'] == a['gross_area_sf']
assert len(electrical['luminaire_positions_ft']) == electrical['plan_luminaires']
def csv_bytes(rows):
    s=io.StringIO(newline=''); w=csv.writer(s,lineterminator='\n'); w.writerows(rows)
    return ('\ufeff'+s.getvalue()).encode('utf-8')
references=csv_bytes([['Check ID','Source PDF','Sheet','Reference','Expected value','Unit','Scope']] + reference_rows)
checks = [
 ['Open and record environment', 'All', 'Record app version/build, OS version, edition and source filenames.'],
 ['Calibrate and check dimensions', 'A101 Revision A', '20 ft calibration; independent 96 ft and 60 ft dimensions.'],
 ['Measure gross area', 'A101 Revision A', '5760 sq ft; two lengths plus one area fits Free measurement cap.'],
 ['Export and reopen takeoff', 'A101 Revision A', 'Save a copy and CSV/PDF output; reopen and verify values, units, revision and source.'],
 ['Review flooring zones', 'I101', 'Tile rooms 107/108: 288 sq ft each; 576 total. Dimension boundaries, not net installed quantities.'],
 ['Review symbol candidates', 'E101', 'Pro Symbol Search: review 24 luminaires including 4 emergency; exclude legend. Record missed/extra candidates before correcting.'],
 ['Measure diagram route', 'E101', '46 ft schematic route; do not label as conduit quantity.'],
 ['Compare revisions', 'A101 / A201', 'Review partition, door, glazing and issue text changes. Record missed/extra differences. Free Compare; Pro Overlay.'],
 ['Save and reopen review', 'X101 / X102', 'Add a page-anchored note, save a copy, reopen and inspect its text and location.'],
 ['OCR and reopen', 'Scanned A101 / C101', 'Search COMMUNITY ROOM / SITE PLAN after OCR, save, reopen and repeat.'],
 ['Recipient handoff', 'Your saved copies', 'Open actual saved files in your recipient viewer; record its version and any differences.']
]
headers=['Platform','Check','Sheet','Expected / scope','App version','Build','OS version','Edition','Actual result','Status','Saved output / evidence','Notes']
results=csv_bytes([headers]+[[platform,name,sheet,expected,'','','','','','NOT RUN','',''] for platform in ['Mac','Windows'] for name,sheet,expected in checks])
def link(url,label):return '<a href="'+html.escape(url,quote=True)+'">'+html.escape(label)+'</a>'
rows=''.join('<tr><th scope="row">'+html.escape(r[3])+'</th><td>'+html.escape(str(r[4])+' '+r[5])+'</td><td>'+html.escape(r[2])+'</td><td>'+html.escape(r[6])+'</td></tr>' for r in reference_rows)
filelinks=''.join('<li>'+link('drawings/'+f,f)+'</li>' for f in FILES)
guide='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>PolyPDF construction evaluation kit</title><style>
*{box-sizing:border-box}body{margin:0 auto;max-width:1000px;padding:40px 24px 80px;color:#182431;background:#fff;font:17px/1.6 system-ui,sans-serif}h1{font-size:clamp(32px,5vw,48px);line-height:1.1}h2{margin-top:40px;font-size:25px}h3{font-size:20px}a{color:#184b75;text-underline-offset:3px}p,li{max-width:78ch}.note{padding:16px 20px;border-left:3px solid #527d89;background:#f3f7f8}.table{overflow:auto}table{border-collapse:collapse;width:100%;min-width:640px;font-size:15px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #d5dce0}th{font-weight:600}code{font-family:monospace}img{width:100%;height:auto;border:1px solid #d5dce0}@media print{body{padding:0;font-size:10pt}h1{font-size:26pt}table{min-width:0;font-size:9pt}tr{break-inside:avoid}.table{overflow:visible}}
</style></head><body><main><p>PolyPDF · Evaluation resources · October 17, 2026</p><h1>Test the drawing, the quantities and the handoff.</h1>
<p>Use six original Willow Creek PDFs (12 construction sheets), 14 drawing references and a blank 22-check Mac/Windows results sheet to evaluate PolyPDF or compare it with your current PDF workflow. No account or email is needed for these resources.</p>
<p class="note">These are fictional source drawings and authored reference quantities, not app exports or completed test results. The results sheet starts with NOT RUN. This package does not establish current Mac or Windows compatibility. Demonstration only—not for construction.</p>
<h2>Start with the Free measurement exercise</h2><ol><li>Download the app from <a href="https://www.polypdf.com/product-facts/#download">PolyPDF’s product-facts page</a>. Record its version/build, your OS and Free/Pro edition in <a href="evaluation-results.csv">evaluation-results.csv</a>.</li>
<li>Open drawings/02-Architectural-Revision-A.pdf, page A101. Keep the original unchanged and save a working copy. Calibrate the printed 20 ft reference (360 PDF points).</li>
<li>Check the independent outside width of 96 ft and depth of 60 ft. Trace the outside boundary: 5760 sq ft gross. These two length checks and one area use three hand-created measurements.</li>
<li>Save a separate PDF and export the worksheet to CSV or PDF. Reopen the saved file and compare sheet, revision, subject, units and values. Record actual results and evidence filenames; do not mark a check passed without inspecting its output.</li></ol>
<p>Free includes calibration, markup, review and up to three hand-created measurements per document. Pro removes that cap and is required for Symbol Search and Overlay. Compare Documents and Revision Package viewing are available in Free; creating or changing Revision Packages requires Pro. Check <a href="https://www.polypdf.com/product-facts/#free-and-pro">current Free/Pro limits</a> and <a href="https://www.polypdf.com/buy/?source=evaluation_kit">current Pro pricing and terms</a>.</p>
<h2>Choose the next workflow</h2><ul><li><strong>Flooring:</strong> I101 rooms 107/108 use dimension-boundary tile zones, 288 sq ft each. The authored F1/F2 schedule does not deduct wall thickness. Keep waste separate. I501 details have different scales.</li>
<li><strong>Electrical:</strong> E101 contains 24 plan luminaires including four emergency luminaires. Exclude legend symbols. Review every Symbol Search candidate. The 46 ft dashed route is a circuit diagram, not a conduit takeoff.</li>
<li><strong>Revisions:</strong> pair A101 with A101 and A201 with A201 in revisions A/B. Review the 6 ft partition shift, 3 ft door movement, added 6 ft south glazing and issue notes. Record detections and misses; three authored geometric changes do not imply exactly three detected differences.</li>
<li><strong>Coordination:</strong> X101/X102 contain three authored issues and four layers. Add your own note, save and reopen, then test the recipient’s actual viewer. Clearing Markup Table filters helps reconcile the full export.</li>
<li><strong>OCR:</strong> the scanned A101/C101 pages have no native text. Run OCR on a copy; search COMMUNITY ROOM and SITE PLAN, then save, reopen and repeat. Recognition does not correct drawing scale or scan distortion.</li></ul>
<h2>Drawings</h2><ul>'''+filelinks+'''</ul><h2>Reference quantities</h2><p>Download <a href="reference-quantities.csv">reference-quantities.csv</a>. Counts and geometry describe the authored drawings. Record your measured value, chosen tolerance and any difference separately.</p><div class="table" role="region" aria-label="Drawing references" tabindex="0"><table><thead><tr><th scope="col">Check</th><th scope="col">Reference</th><th scope="col">Sheet</th><th scope="col">Scope</th></tr></thead><tbody>'''+rows+'''</tbody></table></div>
<h2>Make a review reproducible</h2><p>Keep source hashes, app/OS versions, edition, settings and actual saved outputs with your review. Use the same source files, calibration and scope when comparing products. Choose your own acceptance criteria and disclose any material relationship or review access.</p><p>Separate measured output from reference geometry and screenshots. A saved file reopening in one viewer does not establish compatibility with every viewer. PolyPDF cannot join Bluebeam Studio Projects or Sessions.</p>
<p>The historical 408 sq ft flooring and 42 ft route outputs on the website come from different exercises in PolyPDF 1.6.6 build 38 on Mac. They do not verify these Willow Creek workflows. <a href="https://www.polypdf.com/samples/takeoff/README.md">Read the historical evidence provenance</a>.</p>
<p><a href="https://www.polypdf.com/product-facts/">Current product facts</a> · <a href="https://www.polypdf.com/versions/">Current releases</a> · <a href="https://www.polypdf.com/samples/">Full drawing library</a> · <a href="mailto:support@polypdf.com">support@polypdf.com</a></p></main></body></html>'''
payloads={'START-HERE.html':guide.encode(),'reference-quantities.csv':references,'evaluation-results.csv':results}
for f in FILES:payloads['drawings/'+f]=(SOURCE/f).read_bytes()
hashes={name:hashlib.sha256(data).hexdigest() for name,data in payloads.items()}
kit={'hashScope':'Paths and file hashes describe entries inside polypdf-construction-evaluation-kit.zip; the online guide uses web-relative drawing links.', 'preparedAt':DATE,'referenceOnly':True,'runtimeVerification':'not_performed','sourceProject':manifest['project'],
     'documents':[docs[f] for f in FILES],'sourceReleaseReference':json.loads((ROOT/'src/lib/siteRelease.json').read_text()),
     'files':[{'path':name,'bytes':len(data),'sha256':hashes[name]} for name,data in payloads.items()]}
payloads['manifest.json']=(json.dumps(kit,indent=2)+'\n').encode()
payloads['SHA256SUMS.txt']=(''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payloads.items()))).encode()
OUT.mkdir(parents=True,exist_ok=True)
# Publish small support files directly; originals remain at their existing canonical file paths.
webguide=guide.replace('href="drawings/','href="../construction/')
for name in ['reference-quantities.csv','evaluation-results.csv','manifest.json','SHA256SUMS.txt']:(OUT/name).write_bytes(payloads[name])
(OUT/'START-HERE.html').write_text(webguide)
with zipfile.ZipFile(OUT/'polypdf-construction-evaluation-kit.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name,data in sorted(payloads.items()):
        info=zipfile.ZipInfo(name,date_time=(2026,10,17,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,data)
print('Evaluation kit: 6 PDFs / 12 sheets, 14 references, 22 blank platform checks; no runtime result claimed.')
