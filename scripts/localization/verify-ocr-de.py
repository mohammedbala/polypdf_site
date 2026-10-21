"""Independently inspect the native OCR output without rewriting it."""
import hashlib
import json
import shutil
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageChops
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
native = root / '.tmp/localization/ocr-de'
public = root / 'public/localized-media/de/samples/ocr'
render = native / 'render'
render.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
receipt = json.loads((native / 'validation.json').read_text())
assert receipt['status'] == 'passed'
source = public / 'bestandsplaene-a101-c101.pdf'
saved = native / 'bestandsplaene-durchsuchbar.pdf'
assert sha(source) == receipt['sourceHash']
for entry in receipt['outputs']:
    assert sha(native / entry['file']) == entry['sha256']
before, after = PdfReader(source), PdfReader(saved)
assert len(before.pages) == len(after.pages) == 2
assert after.trailer['/Root']['/Lang'] == 'de-DE'
metadata = json.loads(after.trailer['/Root']['/PolyPDFOCR'])
assert metadata['recognizedPageCount'] == metadata['textLayerCount'] == 2
texts = [p.extract_text() for p in after.pages]
for i, term in enumerate(['MEHRZWECKRAUM', 'ENTWÄSSERUNG']):
    assert not before.pages[i].extract_text().strip()
    assert texts[i].count(term) == 1
    assert before.pages[i].mediabox == after.pages[i].mediabox
    assert before.pages[i].images[0].data == after.pages[i].images[0].data
    (native / f'recognized-page-{i + 1}.txt').write_text(texts[i])
for name, path in [('source', source), ('saved', saved)]:
    subprocess.run(['pdftoppm', '-scale-to', '1500', '-png', str(path), str(render / name)], check=True, capture_output=True)
render_differences = []
for page in [1, 2]:
    a, b = (Image.open(render / f'{name}-{page}.png').convert('RGB') for name in ['source', 'saved'])
    assert a.size == b.size
    difference = ImageChops.difference(a, b)
    maximum = max(extreme[1] for extreme in difference.getextrema())
    changed = sum(any(pixel) for pixel in difference.get_flattened_data())
    # The current writer paints white OCR glyphs at 1% opacity. This is not
    # pixel-identical: retain the measured effect instead of claiming invisibility.
    state = after.pages[page - 1]['/Resources']['/ExtGState']['/GS0'].get_object()
    assert state['/ca'] == state['/CA'] == 0.01
    assert maximum <= 3 and changed / (a.width * a.height) < 0.003
    render_differences.append({'page': page, 'changedPixels': changed, 'totalPixels': a.width * a.height, 'maxChannelDelta': maximum, 'ocrOpacity': 0.01})
# Read the application's native OOXML as a fixture; do not re-author the workbook.
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(native / 'bestandsplaene-ocr.xlsx') as archive:
    assert archive.testzip() is None
    sheets = [n.attrib['name'] for n in ET.fromstring(archive.read('xl/workbook.xml')).findall('s:sheets/s:sheet', ns)]
    text_parts = []
    for name in archive.namelist():
        if name.startswith('xl/worksheets/') and name.endswith('.xml') or name == 'xl/sharedStrings.xml':
            text_parts += [n.text or '' for n in ET.fromstring(archive.read(name)).findall('.//s:t', ns)]
    content = '\n'.join(text_parts)
    assert 'MEHRZWECKRAUM' in content and 'ENTWÄSSERUNG' in content
shutil.copy2(saved, public / saved.name)
proof = {
    'status': 'passed', 'nativeCaptureSha256': sha(native / 'validation.json'),
    'files': {p.name: sha(p) for p in [source, public / saved.name]},
    'pages': 2, 'language': 'de-DE', 'ocrMetadata': metadata,
    'testTerms': [{'page': i+1, 'term': term, 'matches': texts[i].count(term)} for i, term in enumerate(['MEHRZWECKRAUM', 'ENTWÄSSERUNG'])],
    'scanImageBytesUnchanged': True, 'renderedPixelsUnchanged': False, 'renderDifferences': render_differences,
    'workbook': {'sha256': sha(native / 'bestandsplaene-ocr.xlsx'), 'sheets': sheets, 'bothTermsPresent': True},
    'limitations': ['Some symbols and area units were misrecognized; these outputs are not a certified transcription.', 'The writer uses 1% white OCR text: unchanged scan image bytes, but small measured pixel differences.', 'Workbook package and term presence checked; spreadsheet application layout not qualified.', 'An English office-export success notice remains in the German app.']
}
(public / 'export-verification.json').write_text(json.dumps(proof, indent=2, ensure_ascii=False)+'\n')
print(json.dumps(proof, ensure_ascii=False, indent=2))
