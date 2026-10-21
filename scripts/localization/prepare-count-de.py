"""Copy the existing German app sample and independently locate its painted symbols."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
app = Path(os.environ["POLYPDF_APP_ROOT"])
source = app / "assets/samples/de-DE/PolyPDF-Quick-Start.pdf"
out = root / "public/localized-media/de/samples/count"
out.mkdir(parents=True, exist_ok=True)
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert PdfReader(source).trailer["/Root"]["/Lang"] == "de-DE"
scale = 72 / 25.4 * 1000 / 50 / 60
anchors = [(255,950),(415,950),(255,760),(415,760),(625,950),(760,950),(625,760),(760,760),
           (930,980),(1135,980),(930,880),(1135,880),(930,690),(1135,690),(930,545),(1135,545),(1307,575)]
with pdfplumber.open(source) as pdf:
    assert len(pdf.pages) == 1
    page = pdf.pages[0]
    assert abs(page.width - 594 * 72 / 25.4) < .001
    assert abs(page.height - 420 * 72 / 25.4) < .001
    rects = [r for r in page.rects if abs(r["width"] - 24*scale) < .001 and abs(r["height"] - 24*scale) < .001]
    assert len(rects) == 17
    symbols = []
    for i, (x,y) in enumerate(anchors):
        expected = (45 + x*scale, page.height - (-28+y*scale))
        found = [r for r in rects if abs(r["x0"]+r["width"]/2-expected[0]) < .001
                 and abs(r["top"]+r["height"]/2-expected[1]) < .001]
        assert len(found) == 1
        r = found[0]
        symbols.append({"id": f"ZL-{i+1:02}" if i<16 else "legend", "inScope": i<16,
                        "x": r["x0"], "y": r["top"], "width": r["width"], "height": r["height"]})
    geometry = {"status":"passed", "locale":"de-DE", "region":"DE", "pdf":"q101-symbolzaehlung.pdf",
                "sourceSha256":digest(source), "verifierSha256":digest(Path(__file__)),
                "pagePoints":[page.width,page.height], "symbols":symbols, "expectedPlanCount":16,
                "expectedIncludingLegend":17, "method":"Independent painted outer rectangles and PDF language/page size; source copied byte-for-byte."}
shutil.copy2(source, out / geometry["pdf"])
assert digest(out / geometry["pdf"]) == digest(source)
(out / "geometry.json").write_text(json.dumps(geometry, indent=2)+"\n")
print("Verified 17 painted German Q-101 symbols: 16 in the plan, one in its legend.")
