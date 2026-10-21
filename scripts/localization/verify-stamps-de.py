"""Inspect the actual native stamp output independently of the renderer observer."""
from pathlib import Path
import base64, hashlib, json, shutil
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
raw = root / '.tmp/localization/stamps-de'
out = root / 'public/localized-media/de/samples/stamps'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
capture = json.loads((raw / 'validation.json').read_text())
assert capture['status'] == 'passed'
source, saved = out / 'pruefplan-vorlage.pdf', raw / 'pruefplan-mit-stempel.pdf'
assert digest(source) == capture['sourceHash']
assert digest(saved) == capture['savedSha256']
a, b = PdfReader(source), PdfReader(saved)
assert len(a.pages) == len(b.pages) == 1
assert a.trailer['/Root']['/Lang'] == b.trailer['/Root']['/Lang'] == 'de-DE'
assert list(a.pages[0].mediabox) == list(b.pages[0].mediabox)
assert a.pages[0].get_contents().get_data() == b.pages[0].get_contents().get_data()
assert not a.pages[0].get('/Annots')
annotations = [ref.get_object() for ref in b.pages[0]['/Annots']]
assert len(annotations) == 1
stamp = annotations[0]
assert stamp['/Subtype'] == '/Stamp'
assert stamp['/Contents'] == stamp['/Subj'] == 'Planprüfung - Übung'
metadata = json.loads(base64.b64decode(stamp['/PolyPDFMacMetadata']))['annotation']
expected = capture['placed'][0]
assert metadata['interactiveStamp'] == expected['interactiveStamp']
definition = metadata['interactiveStamp']['definition']
assert (definition['width'], definition['height']) == (300, 140)
assert [f['label'] for f in definition['fields']] == ['Prüfvermerk', 'Prüfende Person', 'Prüfdatum']
values = metadata['interactiveStamp']['values']
assert [values[f['id']] for f in definition['fields']] == ['GEPRÜFT - ÜBUNG', 'Musterprüfung', '21.10.2026']
assert definition['fields'][1]['required'] and definition['fields'][1]['prompt']
assert definition['fields'][1]['defaultValue'] == ''
assert definition['fields'][2]['source'] == 'currentDate'
rect = [float(n) for n in stamp['/Rect']]
assert abs(rect[2] - rect[0] - 300) < .001 and abs(rect[3] - rect[1] - 140) < .001
assert 600 < rect[0] < rect[2] < 1200 and 60 < rect[1] < rect[3] < 230
appearance = stamp['/AP']['/N'].get_object()
assert len(appearance.get_data()) > 10
images = [r.get_object() for r in appearance['/Resources']['/XObject'].values()]
assert len(images) == 1 and images[0]['/Subtype'] == '/Image'
assert (images[0]['/Width'], images[0]['/Height']) == (1200, 560)
assert len(images[0].get_data()) > 1000
assert not b.get_fields(), 'A visual review stamp must not become an AcroForm or certificate field'
shutil.copyfile(saved, out / saved.name)
shutil.copyfile(raw / 'planpruefung.polypdftools', out / 'planpruefung.polypdftools')
assert digest(out / 'planpruefung.polypdftools') == capture['template']['sha256']
report = {'status': 'passed', 'nativeCaptureSha256': digest(raw / 'validation.json'),
          'files': {name: digest(out / name) for name in ['pruefplan-vorlage.pdf', 'pruefplan-mit-stempel.pdf', 'planpruefung.polypdftools']},
          'pagePoints': [float(n) for n in b.pages[0].mediabox], 'language': 'de-DE',
          'sourceContentUnchanged': True, 'stampAnnotations': 1, 'appearancePixels': [1200, 560],
          'stampRect': rect, 'fieldLabels': [f['label'] for f in definition['fields']],
          'values': [values[f['id']] for f in definition['fields']],
          'limitations': ['Visual appearance is a raster image; stamp values are preserved in PolyPDF metadata, not selectable page text.',
                          'Reopened native artwork retains metadata but the current app does not offer value editing on that imported artwork; reuse the saved template for a fresh placement.']}
(out / 'export-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('Verified unchanged German A2 drawing, one public stamp appearance and exact private field values.')
