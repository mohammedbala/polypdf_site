"""Independently verify the regional comparison's public PDF annotations."""
import hashlib
import json
import math
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / 'public/localized-media/de/samples/compare'
readers = [PdfReader(FOLDER / f) for f in ['architektur-revision-a.pdf', 'architektur-revision-b.pdf', 'vergleich-a-b.pdf']]
base, revision, saved = readers
for reader in readers:
    assert len(reader.pages) == 2
    assert reader.trailer['/Root']['/Lang'] == 'de-DE'
    for page in reader.pages:
        assert list(page.mediabox) == [0, 0, 2383.937, 1683.78]
        assert list(page.cropbox) == list(page.mediabox)
        assert page.get('/Rotate', 0) == 0
        assert 'BÜRGERHAUS AM LINDENPARK' in page.extract_text()
        assert 'NUR ZUR DEMONSTRATION' in page.extract_text()
clouds, links = [], []
for index, page in enumerate(saved.pages):
    assert page.extract_text() == base.pages[index].extract_text()
    assert page.get_contents().get_data() == base.pages[index].get_contents().get_data()
    page_clouds = []
    for ref in page.get('/Annots', []):
        a = ref.get_object()
        if a['/Subtype'] == '/Link':
            assert index == 0
            assert a.get('/Dest') or a.get('/A', {}).get('/S') == '/GoTo'
            destination = a.get('/Dest') or a['/A']['/D']
            assert destination[0] == saved.pages[1].indirect_reference
            links.append({'page': index + 1, 'rect': list(a['/Rect'])})
            continue
        assert a['/Subtype'] == '/Polygon'
        assert a['/T'] == 'Vergleich'
        vertices = list(a['/Vertices'])
        assert len(vertices) == 8 and all(math.isfinite(x) for x in vertices)
        assert a['/AP']['/N'].get_object().get_data()
        assert a['/BE']['/S'] == '/C'
        page_clouds.append({'page': index + 1, 'subject': str(a['/Subj']), 'author': str(a['/T']), 'rect': list(a['/Rect']), 'vertices': vertices})
    assert len(page_clouds) == (9 if index == 0 else 3)
    assert {c['subject'] for c in page_clouds} == {f'Vergleichsänderung S. {index + 1} Nr. {n}' for n in range(1, len(page_clouds) + 1)}
    clouds.extend(page_clouds)
assert len(links) == 2
source_links = [list(a.get_object()['/Rect']) for a in base.pages[0]['/Annots'] if a.get_object()['/Subtype'] == '/Link']
# The public writer serializes coordinates to three decimals (less than 0.001 pt).
assert all(abs(actual - expected) <= 0.0005 for link, source in zip(links, source_links)
           for actual, expected in zip(link['rect'], source))
report = {'status': 'passed', 'locale': 'de-DE', 'files': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in FOLDER.glob('*.pdf')}, 'clouds': clouds, 'links': links, 'checks': ['All three PDFs carry de-DE metadata and two aligned A1 pages', 'Saved base drawing text and decoded content streams are unchanged', 'Twelve public Polygon annotations have German subjects/authors, cloud borders and appearance streams', 'Nine clouds on A101, three on A201, two original sheet links retained'], 'limitations': ['Public PDF structure inspection; external PDF viewers and native iPad not qualified']}
(FOLDER / 'pdf-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('Three German PDFs verified: aligned sheets, unchanged source drawing, twelve public editable clouds and two links.')
