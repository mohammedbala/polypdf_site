#!/usr/bin/env python3
"""Generate original, reproducible AcroForm practice files; not PolyPDF exports."""
from pathlib import Path
import argparse,csv,hashlib,json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
P=argparse.ArgumentParser();P.add_argument('--output',type=Path,required=True);args=P.parse_args();args.output.mkdir(parents=True,exist_ok=True)
INK=HexColor('#182622');MUTED=HexColor('#52615b');GREEN=HexColor('#375447');LINE=HexColor('#aab8b0');FILL=HexColor('#f5f8f6')
copy={
'en':{'title':'Construction review form','intro':'A fillable PDF for practicing field entry, saving, and handoff.','details':'01 / Visit details','project':'Project / location','date':'Visit date (YYYY-MM-DD)','reviewer':'Reviewed by','drawing':'Drawing / revision reference','record':'02 / Review record','trade':'Scope','select':'Select scope','trades':['General','Electrical','Finishes'],'status':'Review status','statuses':['Open','Follow-up','Closed'],'checks':['Drawing revision recorded','Photo references listed','Action owner assigned'],'notes':'Observation, action owner, and next step','try':'03 / Check your saved copy','steps':['Enter test values, select a status, and check the relevant boxes.','Save under a new name, close, and reopen. Confirm every value.'],'scope':'Practice form for PDF workflows. Adapt the fields to your project.','link':'www.polypdf.com/blog/create-fillable-pdf-form/'},
'fr':{'title':'Fiche de revue de chantier','intro':'Un PDF à remplir pour tester la saisie, l’enregistrement et le partage.','details':'01 / Informations de visite','project':'Projet / lieu','date':'Date de visite (AAAA-MM-JJ)','reviewer':'Revu par','drawing':'Plan / référence de révision','record':'02 / Compte rendu','trade':'Lot','select':'Choisir un lot','trades':['Général','Électricité','Finitions'],'status':'État du suivi','statuses':['Ouvert','À suivre','Clos'],'checks':['Révision du plan notée','Références des photos listées','Responsable de l’action désigné'],'notes':'Observation, responsable et prochaine action','try':'03 / Vérifiez la copie enregistrée','steps':['Saisissez des valeurs de test, choisissez un état et cochez les cases utiles.','Enregistrez une copie, fermez-la, puis rouvrez-la. Vérifiez chaque valeur.'],'scope':'Exemple pour tester un PDF. Adaptez les champs à votre projet.','link':'www.polypdf.com/fr/blog/create-fillable-pdf-form/'}
}
field_rows=[]
for lang,t in copy.items():
 out=args.output/f'construction-review-form-{lang}.pdf'
 c=canvas.Canvas(str(out),pagesize=A4,invariant=1,pageCompression=1)
 c.setTitle(t['title']+' | PolyPDF practice');c.setAuthor('PolyPDF');c.setSubject('Original AcroForm practice template. Ten fields; no project data.');c.setCreator('PolyPDF website practice-resource generator (ReportLab)')
 c.setFillColor(GREEN);c.setFont('Helvetica-Bold',10);c.drawString(40,805,'PolyPDF / '+('Practice resources' if lang=='en' else 'Exemples pratiques'))
 c.setFillColor(INK);c.setFont('Helvetica-Bold',25);c.drawString(40,770,t['title'])
 c.setFillColor(MUTED);c.setFont('Helvetica',10);c.drawString(40,748,t['intro'])
 def section(label,y):
  c.setStrokeColor(LINE);c.line(40,y+14,555,y+14);c.setFillColor(GREEN);c.setFont('Helvetica-Bold',10);c.drawString(40,y,label)
 def label(text,x,y):
  c.setFillColor(INK);c.setFont('Helvetica',10);c.drawString(x,y,text)
 def field(name,title,x,y,w,maxlen=90,h=26,multi=False):
  label(title,x,y+h+7)
  c.acroForm.textfield(name=name,tooltip=title,x=x,y=y,width=w,height=h,borderWidth=.7,borderColor=LINE,fillColor=FILL,textColor=INK,forceBorder=True,fontName='Helvetica',fontSize=10,maxlen=maxlen,fieldFlags='multiline' if multi else '')
  field_rows.append([lang,name,'multiline text' if multi else 'text',title])
 section(t['details'],713)
 field('project',t['project'],40,660,315);field('visit_date',t['date'],375,660,180,10)
 field('reviewer',t['reviewer'],40,602,247);field('drawing_revision',t['drawing'],307,602,248)
 section(t['record'],564)
 label(t['trade'],40,537)
 c.acroForm.choice(name='trade',tooltip=t['trade'],x=40,y=502,width=247,height=27,borderColor=LINE,fillColor=FILL,textColor=INK,borderWidth=.7,forceBorder=True,fontName='Helvetica',fontSize=10,options=[t['select']]+t['trades'],value=t['select'],fieldFlags='combo')
 field_rows.append([lang,'trade','combo box',t['trade']])
 label(t['status'],307,537)
 for i,(export,display) in enumerate(zip(['Open','FollowUp','Closed'],t['statuses'])):
  x=307+i*82
  c.acroForm.radio(name='review_status',tooltip=t['status'],value=export,selected=False,x=x,y=509,size=11,borderColor=LINE,fillColor=Color(1,1,1),textColor=GREEN,buttonStyle='circle',borderWidth=1)
  c.setFillColor(INK);c.setFont('Helvetica',9);c.drawString(x+15,511,display)
 field_rows.append([lang,'review_status','radio group',t['status']])
 for i,(name,title) in enumerate(zip(['drawing_checked','photos_referenced','action_assigned'],t['checks'])):
  y=466-i*27
  c.acroForm.checkbox(name=name,tooltip=title,x=40,y=y,size=12,borderColor=LINE,fillColor=Color(1,1,1),textColor=GREEN,buttonStyle='check',checked=False,borderWidth=1)
  label(title,61,y+2);field_rows.append([lang,name,'checkbox',title])
 field('observation',t['notes'],40,206,515,500,166,True)
 section(t['try'],165)
 c.setFillColor(INK);c.setFont('Helvetica',10)
 for i,step in enumerate(t['steps']):
  assert stringWidth(step,'Helvetica',10)<=515
  c.drawString(40,142-i*18,step)
 c.setFillColor(MUTED);c.setFont('Helvetica',9);c.drawString(40,91,t['scope'])
 c.setStrokeColor(LINE);c.line(40,72,555,72)
 c.setFillColor(GREEN);c.setFont('Helvetica',8.5);c.drawString(40,54,t['link']);c.drawRightString(555,54,'1 / 1')
 c.linkURL('https://'+t['link'],(40,50,500,65),relative=0)
 c.showPage();c.save()
with (args.output/'construction-review-field-map.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['Language','Field name','Field type','Visible label']);w.writerows(field_rows)
manifest={'created':'2026-10-17','kind':'original practice templates, not app-generated outputs','fieldsPerPdf':10,'languages':['en','fr'],'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(args.output.glob('*')) if p.suffix in ['.pdf','.csv']}}
(args.output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
