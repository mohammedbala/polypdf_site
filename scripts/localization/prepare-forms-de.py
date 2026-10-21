"""Preserve the German A4 practice form and label one blank area for actual app authoring."""
from pathlib import Path
from io import BytesIO
import hashlib, json
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject
from reportlab.pdfgen import canvas

root=Path(__file__).resolve().parents[2]
source=root/'public/localized-media/de/samples/forms/construction-review-form-de.pdf'
folder=root/'public/localized-media/de/samples/forms-guide'
folder.mkdir(parents=True,exist_ok=True)
reader=PdfReader(source)
assert len(reader.pages)==1 and len(reader.get_fields())==10
original={k:str(v.get('/V','')) for k,v in reader.get_fields().items()}
label=BytesIO(); c=canvas.Canvas(label,pagesize=(595.2756,841.8898),invariant=1)
c.setFont('Helvetica',10); c.setFillColorRGB(.08,.13,.12)
c.drawString(310,475,'Prüfbereich (zusätzliches Listenfeld)')
c.save(); label.seek(0)
writer=PdfWriter();writer.clone_document_from_reader(reader)
writer.pages[0].merge_page(PdfReader(label).pages[0])
writer.root_object[NameObject('/Lang')]=TextStringObject('de-DE')
out=folder/'planpruefung-vorlage.pdf';writer.write(out)
reopened=PdfReader(out)
assert original=={k:str(v.get('/V','')) for k,v in reopened.get_fields().items()}
assert sum(a.get_object().get('/Subtype')=='/Widget' for a in reopened.pages[0]['/Annots'])==12
assert 'Prüfbereich' in reopened.pages[0].extract_text()
proof={'status':'passed','locale':'de-DE','region':'DE','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'fields':10,'widgets':12,'paper':'A4','addedLabel':'Prüfbereich (zusätzliches Listenfeld)','authoredFieldPlan':{'name':'pruefbereich','type':'listBox','tooltip':'Prüfbereich auswählen','options':['Nordflügel','Südflügel','Außenanlage'],'tabOrder':13,'bounds':{'x':310,'y':378,'width':245,'height':52}},'scope':'Existing authored values and AcroForm tree preserved. Added printed label only; the app must create the eleventh field.'}
(folder/'source-verification.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(proof,ensure_ascii=False))
