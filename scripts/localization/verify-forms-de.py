"""Independently verify native saved canonical fields, widgets and appearance streams."""
from pathlib import Path
from collections import Counter
import hashlib,json,shutil
from pypdf import PdfReader
root=Path(__file__).resolve().parents[2]
tmp=root/'.tmp/localization/forms-de';out=root/'public/localized-media/de/samples/forms-guide'
hash=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt=json.loads((tmp/'validation.json').read_text())
assert receipt['status']=='passed' and receipt['filled']==receipt['reopened']
assert receipt['sourceHash']==hash(out/'planpruefung-vorlage.pdf')
assert receipt['savedSha256']==hash(tmp/'planpruefung-ausgefuellt.pdf')
assert receipt['captureScriptSha256']==hash(root/'scripts/localization/capture-forms-de.mjs')
r=PdfReader(tmp/'planpruefung-ausgefuellt.pdf');fields=r.get_fields()
assert len(r.pages)==1 and len(fields)==11
assert r.trailer['/Root']['/Lang']=='de-DE'
assert abs(float(r.pages[0].mediabox.width)-595.2756)<.01
assert abs(float(r.pages[0].mediabox.height)-841.8898)<.01
expected={k:('/Yes' if v else '/Off') if isinstance(v,bool) else '/'+v if k=='review_status' else v for k,v in receipt['values'].items()}
assert set(fields)==set(expected)
for name,value in expected.items():assert str(fields[name]['/V'])==value,(name,fields[name])
assert list(fields['pruefbereich']['/Opt'])==['Nordflügel','Südflügel','Außenanlage']
assert fields['pruefbereich']['/TU']=='Prüfbereich auswählen'
widgets=[];counts=Counter();types=Counter()
for ref in r.pages[0]['/Annots']:
 a=ref.get_object()
 if a.get('/Subtype')!='/Widget':continue
 parent=a.get('/Parent',a).get_object();name=a.get('/T',parent.get('/T'))
 assert name in fields
 # Canonical object identity prevents two unrelated trees with matching visible values.
 canonical=next(x for x in r.trailer['/Root']['/AcroForm']['/Fields'] if x.get_object().get('/T')==name)
 assert parent.indirect_reference==canonical
 value=a.get('/V',parent.get('/V'));assert str(value)==expected[name]
 normal=a['/AP']['/N'].get_object();state=a.get('/AS')
 if fields[name]['/FT']=='/Btn':
  assert state in normal and normal[state].get_object().get_data()
  expected_state=value if value in normal else '/Off'
  assert state==expected_state
 else:assert normal.get_data()
 counts[name]+=1
 widgets.append({'name':name,'value':str(value),'appearanceState':str(state) if state else None,'appearanceNonempty':True,'rect':[float(x) for x in a['/Rect']]})
assert len(widgets)==13 and counts['review_status']==3 and all(v==1 for k,v in counts.items() if k!='review_status')
for name,f in fields.items():
 flags=int(f.get('/Ff',0));ft=f['/FT']
 types['multilineText' if ft=='/Tx' and flags&4096 else 'text' if ft=='/Tx' else 'radio' if ft=='/Btn' and flags&32768 else 'checkbox' if ft=='/Btn' else 'comboBox' if flags&131072 else 'listBox']+=1
assert dict(types)=={'text':4,'comboBox':1,'radio':1,'checkbox':3,'multilineText':1,'listBox':1}
assert fields['photos_referenced']['/Ff']&2 and fields['photos_referenced']['/V']=='/Off'
assert next(x for x in receipt['fieldSettings'] if x['name']=='data-form-author-tab-order')['value']=='13'
shutil.copyfile(tmp/'planpruefung-ausgefuellt.pdf',out/'planpruefung-ausgefuellt.pdf')
csv=(root/'public/localized-media/de/samples/forms/construction-review-field-map.csv').read_text().replace('trade;Auswahlliste;','trade;Kombinationsfeld;')+'de;pruefbereich;Listenfeld;Prüfbereich auswählen\n'
(out/'feldkennungen.csv').write_text(csv)
proof={'status':'passed','locale':'de-DE','region':'DE','nativeCaptureSha256':hash(tmp/'validation.json'),'fields':11,'widgets':13,'types':dict(types),'canonicalValues':expected,'widgetEvidence':widgets,'paper':'A4','files':{f:hash(out/f) for f in ['planpruefung-vorlage.pdf','planpruefung-ausgefuellt.pdf','feldkennungen.csv']},'checks':['Canonical field tree and page widgets point to the same objects','All eleven values match the actual app capture after restart','All thirteen widget appearances are nonempty; radio and checkbox appearance states agree with canonical values','German locale, A4 geometry and German list choices preserved','Final result remains interactive'], 'limitations':['photos_referenced remains unchecked despite its required flag; this is an intentionally incomplete practice example.','Configured tab order is recorded, but hardware keyboard traversal is not qualified.','No Windows, native iPad or third-party interactive filling qualification.']}
(out/'export-verification.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('German native form: 11 fields, 13 widgets, canonical values and appearances passed.')
