"""Regenerate all twelve owned sample PDFs and the accompanying demo guide."""
from pathlib import Path
import sys, json, subprocess, hashlib, html, zipfile, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageEnhance, ImageFilter
from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Text
from pypdf.generic import DictionaryObject, NameObject, ArrayObject, TextStringObject
from common import W,H,OX,OY,S
import architecture, civil_structure, mep

ROOT=Path(__file__).resolve().parents[1]
TEMP=Path.cwd()/'tmp'/'pdfs'/'construction-demo'

def add_coordination_objects(path):
    writer=PdfWriter();writer.clone_document_from_reader(PdfReader(path))
    layers=[]
    for key,title in [('LARCH','Architecture'),('LMECH','Mechanical'),('LELEC','Electrical'),('LISSUES','Review issues')]:
        obj=DictionaryObject({NameObject('/Type'):NameObject('/OCG'),NameObject('/Name'):TextStringObject(title)})
        ref=writer._add_object(obj);layers.append(ref)
        for page in writer.pages:
            res=page['/Resources'].get_object()
            if '/Properties' not in res:res[NameObject('/Properties')]=DictionaryObject()
            res['/Properties'][NameObject('/'+key)]=ref
    writer.root_object[NameObject('/OCProperties')]=DictionaryObject({
      NameObject('/OCGs'):ArrayObject(layers),NameObject('/D'):DictionaryObject({
        NameObject('/Name'):TextStringObject('Coordination drawing layers'),
        NameObject('/BaseState'):NameObject('/ON'),NameObject('/Order'):ArrayObject(layers),
        NameObject('/ON'):ArrayObject(layers),NameObject('/OFF'):ArrayObject()})})
    issues=[('01',78,36,'Mechanical / Architecture','Duct through partition: add an opening and sleeve detail.'),
            ('02',60,54,'Mechanical / Electrical','Coordinate diffuser and lighting service-zone clearances.'),
            ('03',42,24,'Electrical / Architecture','Coordinate cable tray penetration through partition.')]
    for number,x,y,trade,message in issues:
        xx=OX+x*S;yy=OY+y*S
        note=Text(rect=(xx+25,yy+25,xx+49,yy+49),text=f'ISSUE {number} | OPEN | {trade}\n{message}',open=False)
        note[NameObject('/T')]=TextStringObject('PolyPDF Demo Review')
        note[NameObject('/Subj')]=TextStringObject('Coordination issue '+number)
        writer.add_annotation(page_number=0,annotation=note)
    tmp=path.with_suffix('.working.pdf')
    with tmp.open('wb')as f:writer.write(f)
    tmp.replace(path)

def scanned_sample(out):
    name='12-Scanned-Legacy-Drawings.pdf'
    path=out/name
    c=canvas.Canvas(str(path),pagesize=(W,H),pageCompression=1,invariant=1)
    c.setTitle('Willow Creek Community Center | Image-only scanned drawings')
    c.setAuthor('PolyPDF - Original synthetic demonstration drawings')
    c.setSubject('True image-only OCR fixture. Fictional project. Not for construction.')
    pages=[]
    for index,(src,code,title) in enumerate([
      ('02-Architectural-Revision-A.pdf','A101','SCANNED FLOOR PLAN'),
      ('01-Civil-Site-and-Grading.pdf','C101','SCANNED SITE PLAN')]):
        prefix=TEMP/f'scan-source-{index+1}'
        subprocess.run(['pdftoppm','-f','1','-singlefile','-r','100','-png',str(out/src),str(prefix)],check=True,capture_output=True)
        im=Image.open(prefix.with_suffix('.png')).convert('L')
        im=ImageEnhance.Contrast(im).enhance(.90)
        # A repeatable warm-paper transfer; source geometry is kept at full scale.
        im=im.point(lambda x:28+x*.86).filter(ImageFilter.GaussianBlur(.12))
        jpeg=TEMP/f'scan-{index+1}.jpg';im.save(jpeg,quality=87,optimize=True)
        if index:c.showPage()
        c.drawImage(ImageReader(str(jpeg)),0,0,width=W,height=H)
        key=f'scan{index+1}';c.bookmarkPage(key);c.addOutlineEntry(f'{code} | {title}',key,level=0)
        pages.append(dict(sheet=code,title=title,scale='SAME AS SOURCE IMAGE',revision='A'))
    c.save()
    return dict(file=name,pages=pages,facts={'native_text_characters':0,'scan_resolution_dpi':100,'scan_source_files':['02-Architectural-Revision-A.pdf / A101','01-Civil-Site-and-Grading.pdf / C101'],'ocr_search_targets':['COMMUNITY ROOM','GROUND FLOOR PLAN','SITE PLAN','WILLOW CREEK']})

DESCRIPTIONS={
 '01':('Civil site and grading','Calibrate a site reference, measure boundary and paved areas, trace utilities, and review grading.','Start on C101. Use the dimensioned site boundary for calibration; count parking stalls separately from striping.'),
 '02':('Architectural baseline - Revision A','Snap to vector walls, measure lengths and room areas, and follow linked section references.','Calibrate the20ft graphic bar. Trace the96x60ft footprint:5,760SF and312LF. Click either1/A201 section reference.'),
 '03':('Architectural change - Revision B','Compare or overlay two matching sheet sets and mark changed regions.','Compare this file with02. On A101, the room103/104 partition moves6ft east, door104 moves3ft east and a6ft south window is added. A201 also shows the added window.'),
 '04':('Structure, foundations and framing','Measure slab area, apply depth for volume, count columns and measure framing.','For the gross slab,5,760SF at6in depth gives106.67CY before deductions. Treat these as demonstration inputs.'),
 '05':('Mechanical / HVAC','Find and count diffuser symbols, trace duct routes and review schedules.','On M101, search one clean diffuser symbol, restrict to the plan, and review matches. Plan and legend counts are recorded separately below.'),
 '06':('Electrical lighting and power','Count distinct fixture types, rotate symbol templates and trace circuits.','On E101, demonstrate separate searches for light fixtures and receptacles. Exclude the legend from plan counts.'),
 '07':('Plumbing water and drainage','Count fixtures, measure routed pipe lengths and review a riser.','On P101, keep WC, lavatory and drain counts separate. Use P501 for riser and detail review.'),
 '08':('Fire protection and life safety','Count sprinklers, smoke detectors and exit signs; mark review observations.','Use separate templates for each symbol family. Counts illustrate the authored sample and are not a code compliance assessment.'),
 '09':('Landscape and external works','Count plants, trace beds and paths, and calibrate enlarged site details.','Use L101 for plant counts and L501 for construction details. Legend symbols are excluded from the plan count.'),
 '10':('Interiors, finishes and millwork','Take off floor finishes and cabinetry; demonstrate different scale regions.','On I101,F1=5,184SF andF2=576SF. I501 contains1:24,1:8 and1:4 views; calibrate a separate Scale Region for each view.'),
 '11':('Coordination, layers and review','Toggle four PDF layers, edit three native review notes and export review results.','Open X101, toggle Architecture/Mechanical/Electrical/Review issues where supported, then edit the sticky notes. Add clouds, status or responsibility and export the Markup Table.'),
 '12':('Image-only scanned drawings','Run OCR, search recognized room names and compare raster clarity with vector sheets.','Before OCR, native text search should find no drawing text. Run OCR on both pages, then search COMMUNITY ROOM or SITE PLAN. No hidden text layer is preinstalled.')}

def write_guide(records):
    blocks=[]
    for rec in records:
        key=rec['file'][:2];name,purpose,steps=DESCRIPTIONS[key]
        facts=''.join(f'<tr><th>{html.escape(k.replace("_"," "))}</th><td>{html.escape(json.dumps(v,ensure_ascii=True) if isinstance(v,(list,dict))else str(v))}</td></tr>'for k,v in rec['facts'].items())
        sheets=' / '.join(p['sheet']for p in rec['pages'])
        preview=rec['file'].removesuffix('.pdf')+'--page-01.png'
        blocks.append(f'<article><div class="number">{key}</div><div><h2><a href="{rec["file"]}">{name}</a></h2><p class="sheets">{html.escape(sheets)} · 2 sheets · 36 x 24 in</p><a href="{rec["file"]}"><img loading="lazy" src="previews/{preview}" alt="Preview of {html.escape(name)}"></a><p>{html.escape(purpose)}</p><p class="steps">{html.escape(steps)}</p><details><summary>Known quantities and sample facts</summary><table>{facts}</table></details></div></article>')
    guide='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PolyPDF Construction Demo Library</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f1f0ec;color:#17252c;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:64px 32px}header{border-bottom:2px solid #17252c;padding-bottom:36px;margin-bottom:34px}.eyebrow{font-size:12px;letter-spacing:.16em;font-weight:750}h1{font-size:clamp(32px,5vw,58px);line-height:1.1;max-width:850px;margin:18px 0}header p{max-width:850px}a{color:#284b60;text-decoration-thickness:1px;text-underline-offset:4px}.intro{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:45px}.intro div{background:#fff;padding:24px;border-top:3px solid #284b60}h2{font-size:24px;line-height:1.3;margin:0}h3{margin:0 0 10px}article{display:grid;grid-template-columns:70px 1fr;gap:20px;padding:35px 0;border-top:1px solid #c4c9cb}.number{font:28px ui-monospace,monospace;color:#647079}.sheets{font:12px ui-monospace,monospace;color:#647079;margin:12px 0 20px}article img{display:block;max-width:100%;width:100%;border:1px solid #d0d5d7;background:white}article p{max-width:850px}.steps{border-left:3px solid #284b60;padding-left:17px}details{background:#fff;padding:15px 20px;max-width:100%}summary{cursor:pointer;font-weight:650}table{border-collapse:collapse;width:100%;margin-top:15px;font-size:13px;overflow-wrap:anywhere}th,td{padding:10px;text-align:left;border-top:1px solid #e0e3e4;vertical-align:top}th{width:35%;font-weight:550;color:#647079}footer{margin-top:60px;color:#647079;font-size:13px}@media(max-width:650px){main{padding:32px 18px}.intro{grid-template-columns:1fr}article{grid-template-columns:36px 1fr;gap:12px}.number{font-size:20px}}</style><main>
    <header><div class="eyebrow">POLYPDF / OWNED DEMONSTRATION ASSETS / OCTOBER2026</div><h1>Twelve drawing sets.<br>Repeatable construction demos.</h1><p>24original sheets for a fictional5,760SF community center. Each PDF has two ARCH D sheets, a consistent title block and page bookmarks. Eleven sets retain native vector linework and searchable text; the twelfth is an image-only scan.</p></header>
    <section class="intro"><div><h3>Start with a fresh copy</h3><p>Keep these originals as your reusable master library. Duplicate the relevant PDF before adding markups, measurements, OCR or review responses.</p><p><a href="CONTACT-SHEET.png">View all24sheets</a> · <a href="DEMO-MANIFEST.json">Open the sample facts</a></p></div><div><h3>Calibrate before measuring</h3><p>The principal building plans use1/4in=1ft(1:48): a20ft reference is360PDF points. Site and detail views use other scales printed beside each view. Define Scale Regions for sheets with multiple scales.</p><p>Symbol Search returns candidates: review them and keep plan counts separate from legend examples.</p></div></section>
    '''+''.join(blocks)+'''<footer>Original synthetic drawings created for PolyPDF demonstrations. Fictional project, address, schedules and coordination issues. Demonstration only - not for construction. No outside project drawings or customer information are included. The supplied source can regenerate this library; SHA256SUMS.txt records the final PDF bytes.</footer></main></html>'''
    # Improve dense unit strings for human-readable demonstration instructions.
    replacements={'20ft':'20 ft','96x60ft':'96 x60 ft','5,760SF':'5,760 SF','312LF':'312 LF','6ft':'6 ft','3ft':'3 ft','6in':'6 in','106.67CY':'106.67 CY','5,184SF':'5,184 SF','576SF':'576 SF','1/4in':'1/4 in','1ft':'1 ft','360PDF':'360 PDF','24original':'24 original','24sheets':'24 sheets','2sheets':'2 sheets','36x24in':'36 x24 in','fourPDF':'four PDF','threePDF':'three PDF','OCTOBER2026':'OCTOBER 2026'}
    for a,b in replacements.items():guide=guide.replace(a,b)
    for a,b in {'x24':'x 24','x60':'x 60','=1 ':'= 1 ','(1:48)':' (1:48)','On I101,F1':'On I101, F1','=5,184':'= 5,184','=576':'= 576','andF2':'and F2','for a fictional5,760':'for a fictional 5,760','Reference103':'Reference 103','room103':'room 103','door104':'door 104','F1= ':'F1 = ','F2= ':'F2 = ','On A101, the room103/104':'On A101, the room 103/104','x 24in':'x 24 in','Use the layer panel':'Use the layer panel','source can regenerate':'source can regenerate'}.items():guide=guide.replace(a,b)
    (ROOT/'DEMO-GUIDE.html').write_text(guide)

def package():
    (ROOT/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n'for p in sorted(ROOT.glob('*.pdf'))))
    zip_path=ROOT.parent/'PolyPDF-Construction-Demo-Library.zip'
    with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED)as z:
        for p in sorted(ROOT.rglob('*')):
            if p.is_file() and not any(part in ('__pycache__','tmp') for part in p.relative_to(ROOT).parts):
                z.write(p,arcname='PolyPDF-Construction-Demo-Library/'+str(p.relative_to(ROOT)))
    return zip_path

def main():
    ROOT.mkdir(parents=True,exist_ok=True);TEMP.mkdir(parents=True,exist_ok=True)
    records=civil_structure.build(ROOT)+architecture.build(ROOT)+mep.build(ROOT)
    add_coordination_objects(ROOT/'11-Coordination-and-Review.pdf')
    records.append(scanned_sample(ROOT));records.sort(key=lambda r:r['file'])
    manifest=dict(project=dict(name='Willow Creek Community Center',fictional=True,project_number='WC-26-014',building_ft=[96,60],date_created='2026-10-02'),documents=records,
      demo_truth={'building_area_sf':5760,'building_perimeter_lf':312,'plan_points_per_ft':18,'plan_scale_ratio':48,'plan_bbox_pdf_bottom_left_points':[180,330,1908,1410], 'plan_bbox_polypdf_top_left_points':[180,318,1908,1398],'graphic_scale_20ft_polypdf_top_left_points':[[1480,1533],[1840,1533]],'room_areas_rev_a_sf':{'101':576,'102':576,'103':576,'104':576,'105':576,'106':576,'107':288,'108':288,'109':288,'110':288,'111':1152},'comparison_files':['02-Architectural-Revision-A.pdf','03-Architectural-Revision-B.pdf']},
      usage='Original synthetic demonstration assets. Fictional project. Not for construction. Symbol matches require review. Quantities are authored exercise values, not engineering or code compliance evidence.')
    (ROOT/'DEMO-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
    write_guide(records)
    print(json.dumps({'pdfs':len(records),'pages':sum(len(r['pages'])for r in records),'directory':str(ROOT)},indent=2))

if __name__=='__main__':main()
