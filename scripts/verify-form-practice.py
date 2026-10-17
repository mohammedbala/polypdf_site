from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject
import json
import argparse
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=Path('public/samples/forms'));p.add_argument('--output',type=Path,required=True);args=p.parse_args();out=args.output;out.mkdir(parents=True,exist_ok=True)
results=[]
for lang in ['en','fr']:
 p=args.source/f'construction-review-form-{lang}.pdf';r=PdfReader(p)
 fields=r.get_fields();assert set(fields)=={'project','visit_date','reviewer','drawing_revision','trade','review_status','drawing_checked','photos_referenced','action_assigned','observation'} and len(r.pages)==1
 widgets=[a.get_object() for a in r.pages[0]['/Annots'] if a.get_object()['/Subtype']=='/Widget'];assert len(widgets)==12
 for w in widgets:
  f=w.get('/Parent',w).get_object();assert f['/T'] in fields;assert w.get('/AP',{}).get('/N')
  assert list(w['/Rect'])[0]>=40 and list(w['/Rect'])[2]<=555
 values={'project':'Northline / Zone A' if lang=='en' else 'Northline / Zone A','visit_date':'2026-10-17','reviewer':'Sample Reviewer' if lang=='en' else 'Équipe de revue','drawing_revision':'A101 / B','trade':'Electrical' if lang=='en' else 'Électricité','review_status':'/FollowUp','drawing_checked':'/Yes','photos_referenced':'/Yes','action_assigned':'/Yes','observation':'Practice only. Review the doorway against A101 revision B.\nOwner: Sample Reviewer. Next step: confirm the drawing reference.' if lang=='en' else 'Exemple uniquement. Vérifier la porte sur le plan A101, révision B.\nResponsable : équipe de revue. Prochaine action : confirmer la référence.'}
 writer=PdfWriter();writer.clone_document_from_reader(r)
 writer.update_page_form_field_values(None,values,auto_regenerate=False)
 saved=out/f'filled-{lang}.pdf';writer.write(saved)
 reopened=PdfReader(saved);actual=reopened.get_fields()
 for name,value in values.items():
  assert str(actual[name]['/V'])==value,(name,actual[name])
 for a in reopened.pages[0]['/Annots']:
  w=a.get_object()
  if w['/Subtype']!='/Widget':continue
  f=w.get('/Parent',w).get_object();name=f['/T'];assert str(f.get('/V',''))==str(actual[name].get('/V',''))
  assert w.get('/AP',{}).get('/N')
  if f['/FT']=='/Btn':
   assert w.get('/AS') in w['/AP']['/N']
   expected=actual[name]['/V'] if actual[name]['/V'] in w['/AP']['/N'] else '/Off'
   assert str(w['/AS'])==str(expected)
 assert not reopened.is_encrypted
 assert '/JavaScript' not in str(reopened.trailer['/Root']) and '/XFA' not in reopened.trailer['/Root']['/AcroForm']
 results.append({'language':lang,'fields':len(actual),'widgets':len(widgets),'canonicalValues':'pass','widgetValuesAndAppearances':'pass','pypdfSaveReopen':'pass','appRuntime':'not tested'})
(out/'validation.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results))
