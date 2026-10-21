"""Check native German review exports; prepare a public-link-only summary derivative."""
import base64
import csv
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[2]
RUN = ROOT / '.tmp/localization/markup-de'
OUT = ROOT / 'public/localized-media/de/samples/markup'
AUDIT = ROOT / 'docs/localization/markup-de/native'
AUDIT.mkdir(parents=True, exist_ok=True)
report = json.loads((RUN / 'validation.json').read_text())
assert report['status'] == 'passed'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for item in report['outputs']:
    assert sha(RUN / item['file']) == item['sha256']
    shutil.copy2(RUN / item['file'], AUDIT / item['file'])
shutil.copy2(RUN / 'validation.json', AUDIT / 'validation.json')
shutil.copy2(RUN / 'electron.log', AUDIT / 'electron.log')

drawing = PdfReader(RUN / 'x101-pruefregister.pdf')
source = PdfReader(OUT / 'x101-koordinationspruefung.pdf')
assert len(drawing.pages) == 1
assert drawing.trailer['/Root']['/Lang'] == 'de-DE'
assert drawing.pages[0].get_contents().get_data() == source.pages[0].get_contents().get_data()
assert len(drawing.trailer['/Root']['/OCProperties']['/OCGs']) == 4
notes = [a.get_object() for a in drawing.pages[0]['/Annots'] if '/IRT' not in a.get_object()]
assert len(notes) == 3
for note, expected in zip(notes, report['reviewedNotes']):
    assert note['/NM'] == expected['id']
    assert note['/Subj'] == expected['nativeSubject']
    assert note['/Contents'] == expected['contents']
    assert note['/T'] == expected['author']
chunks = drawing.pages[0]['/PieceInfo']['/PolyPDFWorkspace']['/Private']['/Chunks']
payload = json.loads(base64.b64decode(''.join(c.get_object()['/PolyPDFMacWorkspaceData'] for c in chunks)))
assert [a['status'] for a in payload['workspaceSnapshot']['annotations']] == ['open', 'inProgress', 'completed']
assert '/Users/' not in json.dumps(payload), 'Public drawing must not disclose a machine-local path'
with (RUN / 'pruefregister.csv').open(newline='') as stream:
    reader = csv.DictReader(stream)
    assert reader.fieldnames == ['Betreff', 'Status', 'Seite', 'Kommentare', 'Autor']
    rows = list(reader)
assert len(rows) == 3
for row, expected, ui in zip(rows, report['reviewedNotes'], report['rows']):
    assert row == dict(zip(reader.fieldnames, [expected['nativeSubject'], ui['status'], '1', expected['contents'], expected['author']]))

raw = RUN / 'pruefregister-zusammenfassung.pdf'
summary = PdfReader(raw)
assert len(summary.pages) == 1
text = summary.pages[0].extract_text()
for phrase in ['PolyPDF Anmerkungsübersicht', '3 von 3', 'Alle Anmerkungen', 'Anmerkungsdetails',
               'Status\nAbgeschlossen\n1', 'Status\nIn Bearbeitung\n1', 'Status\nOffen\n1']:
    assert phrase in text, phrase
writer = PdfWriter()
writer.clone_document_from_reader(summary)
writer.root_object[NameObject('/Lang')] = TextStringObject('de-DE')
links = []
for annotation in writer.pages[0]['/Annots']:
    action = annotation.get_object()['/A']
    uri = str(action['/URI'])
    parsed = urlparse(uri)
    query = parse_qs(parsed.query)
    assert parsed.scheme == 'polypdf' and parsed.netloc == 'report' and parsed.path == '/source'
    assert query['path'] == [str(RUN / 'x101-pruefregister.pdf')]
    assert query['page'] == ['1']
    target = 'https://www.polypdf.com/localized-media/de/samples/markup/x101-pruefregister.pdf#page=1'
    action[NameObject('/URI')] = TextStringObject(target)
    links.append({'annotation': query['annotation'][0], 'target': target})
assert sorted(x['annotation'] for x in links) == sorted(n['id'] for n in report['reviewedNotes'])
public_summary = OUT / raw.name
with public_summary.open('wb') as stream:
    writer.write(stream)
reopened = PdfReader(public_summary)
assert reopened.pages[0].get_contents().get_data() == summary.pages[0].get_contents().get_data()
assert reopened.pages[0].extract_text() == text
assert reopened.trailer['/Root']['/Lang'] == 'de-DE'
assert b'/Users/' not in public_summary.read_bytes() and b'%2FUsers%2F' not in public_summary.read_bytes()
render = RUN / 'render'
render.mkdir(exist_ok=True)
for label, file in [('summary-raw', raw), ('summary-public', public_summary), ('drawing', RUN / 'x101-pruefregister.pdf')]:
    subprocess.run(['pdftoppm', '-scale-to', '1600', '-png', '-singlefile', str(file), str(render / label)], check=True)
assert ImageChops.difference(Image.open(render / 'summary-raw.png'), Image.open(render / 'summary-public.png')).getbbox() is None
for name in ['x101-pruefregister.pdf', 'pruefregister.csv']:
    shutil.copy2(RUN / name, OUT / name)
for name in ['summary-public.png', 'drawing.png']:
    shutil.copy2(render / name, AUDIT / name)
receipt = {
    'status': 'passed', 'locale': 'de-DE', 'region': 'DE', 'nativeCaptureSha256': sha(RUN / 'validation.json'),
    'sourceSha256': sha(OUT / 'x101-koordinationspruefung.pdf'), 'notes': report['reviewedNotes'],
    'csvRows': rows, 'summaryPages': 1, 'summaryGroups': {'Offen': 1, 'In Bearbeitung': 1, 'Abgeschlossen': 1},
    'rawSummarySha256': sha(raw), 'publicLinks': links, 'summaryPixelsUnchanged': True,
    'derivativeChanges': ['Three local report URIs replaced by public source-PDF page links', 'Catalog Lang set to de-DE'],
    'files': {name: sha(OUT / name) for name in ['x101-pruefregister.pdf', 'pruefregister.csv', raw.name]},
    'limitations': ['Summary cells intentionally shorten long subjects/comments; CSV and editable PDF retain complete values',
                    'Public summary links open page 1; local PolyPDF annotation-focus links remain in the retained raw export',
                    'Verification covers a local Mac development build, not Windows or native iPad']
}
(OUT / 'export-verification.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print('German native notes, workspace statuses, CSV and summary verified; public derivative has identical page pixels.')
