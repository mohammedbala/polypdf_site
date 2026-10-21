"""Inspect regional source geometry and the exact native saved PDFs independently."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

import pdfplumber
from pypdf import PdfReader
from pypdf.generic import IndirectObject, StreamObject

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/localized-media/de/samples/redaction'
RAW = ROOT / '.tmp/localization/redaction-de'
manifest = json.loads((OUT/'source-manifest.json').read_text())
token = manifest['token']
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def images(resources):
    found = []
    for ref in resources.get('/XObject', {}).get_object().values():
        obj = ref.get_object()
        if obj['/Subtype'] == '/Image':
            found.append({'width': int(obj['/Width']), 'height': int(obj['/Height']),
                          'pixelsSha256': hashlib.sha256(obj.get_data()).hexdigest()})
        elif obj['/Subtype'] == '/Form':
            found += images(obj['/Resources'])
    return sorted(found, key=lambda v: json.dumps(v))


def attachments(page):
    found = []
    for ref in page.get('/Annots', []):
        obj = ref.get_object()
        if obj.get('/Subtype') == '/FileAttachment':
            spec = obj['/FS']
            found.append({'name': str(spec.get('/UF', spec.get('/F'))),
                          'payloadSha256': hashlib.sha256(spec['/EF']['/F'].get_data()).hexdigest()})
    return found


sources = {}
for name, expected in manifest['files'].items():
    path = OUT/name
    assert digest(path) == expected
    reader = PdfReader(path)
    assert len(reader.pages) == 1 and reader.trailer['/Root']['/Lang'] == 'de-DE'
    page = reader.pages[0]
    assert all(abs(float(actual)-expected) < .001 for actual, expected in
               zip([page.mediabox.width, page.mediabox.height], manifest['pagePoints']))
    text = page.extract_text()
    assert text.count(token) == 1
    for expected_text in ['BÜRGERHAUS LINDENHOF', '24,00 m', '12,00 m', '288,00 m²',
                          '21.10.2026', 'DIN A3 | 1:100 | Maße in Metern', 'NICHT ZUR BAUAUSFÜHRUNG']:
        assert expected_text in text, expected_text
    with pdfplumber.open(path) as pdf:
        parsed = pdf.pages[0]
        # Independent painted rectangle, not only generator constants or printed dimensions.
        plan = [r for r in parsed.rects if abs(r['x0']-65) < .001 and abs(r['y0']-300) < .001]
        assert len(plan) == 1
        assert abs(plan[0]['width']*2.54/72-24) < .00001
        assert abs(plan[0]['height']*2.54/72-12) < .00001
        assert all(29 < char['x0'] < char['x1'] < parsed.width-29
                   and 29 < char['top'] < char['bottom'] < parsed.height-29 for char in parsed.chars)
        word = [w for w in parsed.extract_words() if w['text'] == token]
        assert len(word) == 1
        region = manifest['redactionRegion']
        assert region['x'] < word[0]['x0'] < word[0]['x1'] < region['x']+region['width']
        assert region['y'] < parsed.height-word[0]['bottom'] < parsed.height-word[0]['top'] < region['y']+region['height']
        assert all(im['x1'] < region['x'] or im['y1'] < region['y'] for im in parsed.images)
    sources[name] = {'sha256': expected, 'pagePoints': [float(page.mediabox.width), float(page.mediabox.height)],
                     'planMetresFromPaintedRectangle': [plan[0]['width']*2.54/72, plan[0]['height']*2.54/72],
                     'tokenOccurrences': 1, 'tokenFitsRegion': True, 'textInsidePageBorder': True,
                     'images': images(page['/Resources']), 'pageAttachments': attachments(page)}
assert len(sources['pruefplan-schwaerzen.pdf']['images']) == 1
assert len(sources['pruefplan-bereinigen.pdf']['images']) == 2
assert len(sources['pruefplan-bereinigen.pdf']['pageAttachments']) == 1
(OUT/'source-verification.json').write_text(json.dumps({'status': 'passed', 'sources': sources}, ensure_ascii=False, indent=2)+'\n')
if '--source-only' in sys.argv:
    print('Verified both German A3 sources, physical plan geometry, text bounds, target placement and image/attachment structures.')
    raise SystemExit(0)

engine_only = '--engine-only' in sys.argv
input_root = RAW/'engine' if engine_only else RAW
redacted = input_root/'pruefplan-geschwaerzt.pdf'
sanitized = input_root/'pruefplan-bereinigt.pdf'
if not engine_only:
    lifecycle = json.loads((RAW/'lifecycle.json').read_text())
    assert lifecycle['complete']
red = PdfReader(redacted)
clean = PdfReader(sanitized)
for reader in [red, clean]:
    assert len(reader.pages) == 1
    assert reader.trailer['/Root']['/Lang'] == 'de-DE'
    assert all(abs(float(actual)-expected) < .001 for actual, expected in
               zip([reader.pages[0].mediabox.width, reader.pages[0].mediabox.height], manifest['pagePoints']))
source_red = PdfReader(OUT/'pruefplan-schwaerzen.pdf')
source_clean = PdfReader(OUT/'pruefplan-bereinigen.pdf')
assert token not in red.pages[0].extract_text()
assert source_red.pages[0].extract_text().replace(token, '').split() == red.pages[0].extract_text().split()
assert token in clean.pages[0].extract_text()
assert source_clean.pages[0].extract_text().split() == clean.pages[0].extract_text().split()
assert images(red.pages[0]['/Resources']) == sources['pruefplan-schwaerzen.pdf']['images']
assert images(clean.pages[0]['/Resources']) == sources['pruefplan-bereinigen.pdf']['images']
variants = [token.encode(), token.encode('utf-16-be'), token.encode().hex().encode(), token.encode('utf-16-be').hex().encode()]
assert all(v not in redacted.read_bytes() for v in variants)
streams = 0
for generation, ids in red.xref.items():
    for obj_id in ids:
        if obj_id == 0:
            continue
        obj = red.get_object(IndirectObject(obj_id, generation, red))
        if isinstance(obj, StreamObject):
            streams += 1
            assert all(v not in obj.get_data() for v in variants)
        else:
            assert token not in str(obj)
assert '/Prev' not in red.trailer
assert redacted.read_bytes().count(b'%%EOF') == 1
root = clean.trailer['/Root']
assert '/JavaScript' not in root.get('/Names', {})
assert '/Metadata' not in root
assert '/Author' not in clean.metadata and '/Title' not in clean.metadata and '/Subject' not in clean.metadata
if not engine_only:
    assert '/Producer' in clean.metadata and '/ModDate' in clean.metadata
before = attachments(source_clean.pages[0])
after = attachments(clean.pages[0])
assert after == before or after == []
outputs = {path.name: digest(path) for path in [redacted, sanitized]}
if not engine_only:
    for path in [redacted, sanitized]:
        shutil.copyfile(path, OUT/path.name)
report = {'status': 'passed', 'locale': 'de-DE', 'region': 'DE',
          'scope': 'core operation output only' if engine_only else 'native Save outputs',
          'lifecycleSha256': None if engine_only else digest(RAW/'lifecycle.json'),
          'sourceVerificationSha256': digest(OUT/'source-verification.json'), 'files': {**manifest['files'], **outputs},
          'redaction': {'targetAbsentFromExtractedTextAndDecodedObjects': True, 'decodedStreamsChecked': streams,
                        'otherPageTextPreserved': True, 'imagePixelsPreserved': True, 'previousRevisionLink': False,
                        'endOfFileMarkers': 1},
          'sanitation': {'pageTextPreserved': True, 'bothImagePlacementsPreserved': True,
                         'originalInfoAndJavaScriptRemoved': True, 'outputInfoDictionary': dict(clean.metadata),
                         'directPageAttachmentsBefore': before, 'directPageAttachmentsAfter': after},
          'limitations': ['These checks qualify only the fictional examples and observed content types.',
                          'The source text and separate image pixels are distinct; no general confidential-release certification is claimed.']}
destination = input_root/'verification.json' if engine_only else OUT/'export-verification.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print('Verified redaction and sanitation output structure; scope: '+report['scope'])
