"""Prepare one German review sheet without changing its painted drawing."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/localized-media/de/samples/construction/11-Koordination-und-Pruefung.pdf'
OUT = ROOT / 'public/localized-media/de/samples/markup'
OUT.mkdir(parents=True, exist_ok=True)
source_bytes = SOURCE.read_bytes()
reader, writer = PdfReader(SOURCE), PdfWriter()
writer.add_page(reader.pages[0])
writer.root_object[NameObject('/OCProperties')] = reader.trailer['/Root']['/OCProperties'].clone(writer)
writer.root_object[NameObject('/Lang')] = TextStringObject('de-DE')
writer.add_metadata({'/Title': 'X101 - Koordinationsprüfung', '/Author': 'PolyPDF', '/Subject': 'Fiktiver deutscher Übungsplan mit drei Prüfnotizen'})
writer.add_outline_item('X101 - Fachübergreifende Koordination', 0)
notes = [
    ('PR-001 - Lüftungsdurchführung', 'Wie werden Öffnung und Durchführung des Lüftungskanals durch die Trennwand ausgebildet? Bitte Detail ergänzen.'),
    ('PR-002 - Deckenkoordination', 'Zuluftauslass und Leuchte überlagern sich. Lage und erforderliche Abstände im Deckenplan abstimmen.'),
    ('PR-003 - Kabeldurchführung', 'Für die Kabeltrasse fehlt das Durchführungsdetail an der Trennwand. Detail und Zuständigkeit ergänzen.')
]
assert len(writer.pages[0]['/Annots']) == len(notes)
for index, (ref, (subject, comment)) in enumerate(zip(writer.pages[0]['/Annots'], notes), 1):
    a = ref.get_object()
    assert a['/Subtype'] == '/Text'
    a[NameObject('/NM')] = TextStringObject(f'pruefpunkt-{index:03}')
    a[NameObject('/Subj')] = TextStringObject(subject)
    a[NameObject('/Contents')] = TextStringObject(comment)
    a[NameObject('/T')] = TextStringObject('PolyPDF Musterprüfung')
filename = 'x101-koordinationspruefung.pdf'
with (OUT / filename).open('wb') as stream:
    writer.write(stream)
result = PdfReader(OUT / filename)
assert len(result.pages) == 1
assert result.trailer['/Root']['/Lang'] == 'de-DE'
assert [(str(a.get_object()['/Subj']), str(a.get_object()['/Contents']))
        for a in result.pages[0]['/Annots']] == notes
assert result.pages[0].get_contents().get_data() == reader.pages[0].get_contents().get_data()
assert result.pages[0].extract_text() == reader.pages[0].extract_text()
assert list(result.pages[0].mediabox) == list(reader.pages[0].mediabox)
assert list(result.pages[0].cropbox) == list(reader.pages[0].cropbox)
assert len(result.trailer['/Root']['/OCProperties']['/OCGs']) == 4
ocgs = result.trailer['/Root']['/OCProperties']['/OCGs']
assert all(a.get_object().raw_get('/OC') in ocgs for a in result.pages[0]['/Annots'])
assert SOURCE.read_bytes() == source_bytes
hash_bytes = lambda b: hashlib.sha256(b).hexdigest()
with tempfile.TemporaryDirectory(prefix='polypdf-markup-de-') as temporary:
    temp = Path(temporary)
    for name, pdf in [('original', SOURCE), ('prepared', OUT / filename)]:
        subprocess.run(['pdftoppm', '-f', '1', '-singlefile', '-scale-to', '1440', '-png', str(pdf), str(temp / name)], check=True, capture_output=True)
    original = Image.open(temp / 'original.png').convert('RGB')
    prepared = Image.open(temp / 'prepared.png').convert('RGB')
    assert original.size == prepared.size and ImageChops.difference(original, prepared).getbbox() is None
    preview = (temp / 'prepared.png').read_bytes()
    (OUT / 'x101-vorschau.png').write_bytes(preview)
    pixel_check = {'passed': True, 'width': prepared.width, 'height': prepared.height, 'render': 'Poppler; RGB pixel comparison; 1440-pixel longest edge'}
(OUT / 'source-verification.json').write_text(json.dumps({'status': 'passed', 'locale': 'de-DE', 'region': 'DE', 'source': SOURCE.name, 'sourceSha256': hash_bytes(source_bytes), 'file': filename, 'sha256': hash_bytes((OUT / filename).read_bytes()), 'pages': 1, 'sheet': 'X101', 'format': 'A1', 'scale': '1:50', 'sourcePageContentUnchanged': True, 'sourcePageTextUnchanged': True, 'optionalContentLayers': 4, 'notes': [{'id': f'pruefpunkt-{i:03}', 'subject': s, 'comment': c} for i, (s,c) in enumerate(notes,1)], 'pixelEquivalentToOriginalSheet': pixel_check, 'preview': {'file': 'x101-vorschau.png', 'sha256': hash_bytes(preview)}, 'adaptation': 'First sheet extracted from the German coordination library. Three existing editable PDF note subjects/comments are clarified, without status words embedded in their text. Printed X102 checklist is intentionally excluded; app statuses are demonstrated on X101.'}, ensure_ascii=False, indent=2) + '\n')
print('Prepared German X101: unchanged painted drawing, four layers, three editable review notes.')
