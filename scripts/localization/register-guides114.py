from pathlib import Path
import json,hashlib,argparse
from PIL import Image
p=argparse.ArgumentParser(description="Register unaltered native guide captures with crop/resize provenance.")
p.add_argument("--locale",required=True,choices=["fr","es","pt-br"])
p.add_argument("--source-dir",required=True,type=Path)
a=p.parse_args()
root=Path(__file__).resolve().parents[2]
base=root/"public"/"localized-media"/a.locale
dest=base/"guides114"; dest.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
captures={}
for key in ["calibration","area","count","compare","markup","ocr","forms","stamps","redaction"]:
    src=a.source_dir/(a.locale+"-"+key+".png")
    im=Image.open(src).convert("RGB")
    size=im.size
    # Remove Screen Sharing and the macOS menu bar, retaining only the native application.
    top={(3420,2028):158,(3350,1988):156,(2590,1536):0}.get(size)
    # The Spanish sanitize source was already cropped to the application viewport.
    assert top is not None,size
    crop=[0,top,size[0],size[1]]
    im=im.crop(crop); im.thumbnail((2200,1400),Image.Resampling.LANCZOS)
    out=dest/(key+".webp"); im.save(out,quality=88,method=6)
    captures[key]=dict(path="/"+str(out.relative_to(root/"public")),sha256=sha(out.read_bytes()),width=im.width,height=im.height,kind="native-interface",sourceSha256=sha(src.read_bytes()),sourceSize=list(size),crop=crop,capturedAt="2026-11-12",scope="Interface state shown; not a complete saved-output qualification")
resources=[]
for src in sorted((base/"samples"/"construction").glob("*.pdf"))+sorted((base/"samples"/"forms114").glob("*")):
    if src.is_file():
        resources.append(dict(path="/"+str(src.relative_to(root/"public")),sha256=sha(src.read_bytes())))
manifest=dict(schemaVersion=1,locale={"fr":"fr-FR","es":"es-ES","pt-br":"pt-BR"}[a.locale],appBuild=114,version="1.6.32",platform="macOS",asarSha256="aefb8f96296779d4f222408d18a675626224739a6a397ae40cf665942e86621f",captures=captures,resources=resources)
(dest/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print(a.locale,len(captures),"native captures;",len(resources),"pinned resources")
