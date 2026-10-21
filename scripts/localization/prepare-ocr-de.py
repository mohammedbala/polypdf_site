"""Language metadata derivative; preserve both regional scan images and page operators."""
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'public/localized-media/de/samples/construction/12-Gescannte-Bestandsplaene.pdf'
out = ROOT / 'public/localized-media/de/samples/ocr'
out.mkdir(parents=True, exist_ok=True)
target = out / 'bestandsplaene-a101-c101.pdf'
reader = PdfReader(source)
assert len(reader.pages) == 2
assert all(not page.extract_text().strip() for page in reader.pages)
writer = PdfWriter(clone_from=reader)
writer.root_object[NameObject('/Lang')] = TextStringObject('de-DE')
writer.write(target)
result = PdfReader(target)
assert result.trailer['/Root']['/Lang'] == 'de-DE'
for before, after in zip(reader.pages, result.pages):
    assert before.get_contents().get_data() == after.get_contents().get_data()
    assert list(before.mediabox) == list(after.mediabox)
    assert len(before.images) == len(after.images) == 1
    assert before.images[0].data == after.images[0].data
    assert not after.extract_text().strip()
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
(out / 'source-verification.json').write_text(json.dumps({
    'status': 'passed', 'locale': 'de-DE', 'region': 'DE', 'pages': 2,
    'source': str(source.relative_to(ROOT)), 'sourceSha256': sha(source),
    'file': target.name, 'sha256': sha(target), 'imageOnly': True,
    'pageOperatorsAndImagesUnchanged': True,
    'searchTargets': [{'page': 1, 'text': 'MEHRZWECKRAUM'}, {'page': 2, 'text': 'ENTWÄSSERUNG'}],
    'provenance': 'Fictional Bürgerhaus am Lindenpark, Germany. A101 floor plan and C101 site plan. No actual construction approval.'
}, indent=2, ensure_ascii=False) + '\n')
print(target)
