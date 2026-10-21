"""Tag the verified German revision pair without changing its painted content."""
from pathlib import Path
import hashlib
import json
import subprocess
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/localized-media/de/samples/construction'
OUTPUT = ROOT / 'public/localized-media/de/samples/compare'
TEMP = ROOT / '.tmp/localization/compare-de-source-check'
OUTPUT.mkdir(parents=True, exist_ok=True)
TEMP.mkdir(parents=True, exist_ok=True)
manifest = json.loads((SOURCE / 'DEMO-MANIFEST.json').read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
records = []
for identifier, suffix in [('02', 'a'), ('03', 'b')]:
    entry = next(d for d in manifest['documents'] if d['id'] == identifier)
    source = SOURCE / entry['file']
    assert sha(source.read_bytes()) == entry['sha256']
    original = PdfReader(source)
    assert len(original.pages) == 2
    writer = PdfWriter(clone_from=original)
    writer.root_object[NameObject('/Lang')] = TextStringObject('de-DE')
    target = OUTPUT / f'architektur-revision-{suffix}.pdf'
    with target.open('wb') as stream:
        writer.write(stream)
    tagged = PdfReader(target)
    assert tagged.trailer['/Root']['/Lang'] == 'de-DE'
    pages = []
    for i, (before, after) in enumerate(zip(original.pages, tagged.pages)):
        assert list(before.mediabox) == list(after.mediabox)
        assert list(before.cropbox) == list(after.cropbox)
        assert before.get('/Rotate', 0) == after.get('/Rotate', 0) == 0
        assert before.get_contents().get_data() == after.get_contents().get_data()
        assert before.extract_text() == after.extract_text()
        assert len(before.get('/Annots', [])) == len(after.get('/Annots', []))
        assert entry['pages'][i]['sheet'] in after.extract_text()
        prefix = f'revision-{suffix}-{i+1}'
        original_prefix = TEMP / (prefix+'-original')
        tagged_prefix = OUTPUT / prefix
        for pdf, output in [(source, original_prefix), (target, tagged_prefix)]:
            subprocess.run(['pdftoppm','-f',str(i+1),'-l',str(i+1),'-scale-to','1600','-singlefile','-png',str(pdf),str(output)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        with Image.open(str(original_prefix)+'.png') as a, Image.open(str(tagged_prefix)+'.png') as b:
            assert a.size == b.size and a.convert('RGB').tobytes() == b.convert('RGB').tobytes()
            pixels = sha(b.convert('RGB').tobytes())
        pages.append({'sheet':entry['pages'][i]['sheet'],'mediaBox':list(after.mediabox),'cropBox':list(after.cropbox),'rotation':0,'contentStreamSha256':sha(after.get_contents().get_data()),'renderedPixelsSha256':pixels,'preview':prefix+'.png','previewSha256':sha((OUTPUT/(prefix+'.png')).read_bytes()),'originalAndTaggedPixelsIdentical':True})
    records.append({'revision':suffix.upper(),'sourceFile':entry['file'],'sourceSha256':entry['sha256'],'file':target.name,'sha256':sha(target.read_bytes()),'language':'de-DE','pages':pages,'referenceFacts':entry['facts']})
report={'status':'passed','locale':'de-DE','region':'DE','operation':'Add PDF /Lang only to copies of the existing verified German construction revision pair','scriptSha256':sha(Path(__file__).read_bytes()),'documents':records,'limitations':['Fictional demonstration drawings; no standards certification','Three design changes plus revision/date/schedule text changes; no promised detected-cloud count','These tagged copies do not update the remaining construction-library metadata']}
(OUTPUT/'source-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Verified two German-tagged PDFs: four pages retain exact text, page geometry, decoded content streams and rendered pixels.')
