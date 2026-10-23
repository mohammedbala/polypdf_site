#!/usr/bin/env node
// Independent saved-file checks for the synthetic, supported redaction proof.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const pdf = resolve(root, "redaction-output/redaction-supported-working.pdf");
const reportPath = resolve(root, "redaction-output/redaction-verification.json");
const target = "CASE-ORCHID-742";
const baselineSha256 = "588d35c4a28c0041258e588eb3ae3509cfecf4a5d15216bda5c7f8eff027f360";
const source = {
  appRoot: "/private/tmp/polypdf-blog-current-dev-JwqN0q/src/polypdf",
  baseCommit: "a0a709c39e35343d3c71f7d615fedffb007db619",
  workingTreeDiffSha256: "8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250"
};

const bytes = await readFile(pdf);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const qpdfCheck = execFileSync("qpdf", ["--check", pdf], { encoding: "utf8", stderr: "pipe" });
const pdftotext = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
const qdfPath = "/tmp/polypdf-redaction-verification-qdf.pdf";
execFileSync("qpdf", ["--qdf", "--object-streams=disable", "--stream-data=uncompress", pdf, qdfPath]);
const qdfText = await readFile(qdfPath, "latin1");
const python = `
import json, sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
t = ''.join((p.extract_text() or '') for p in r.pages)
images = 0
forms = 0
for page in r.pages:
    xobjects = page.get('/Resources', {}).get('/XObject', {}) or {}
    for ref in xobjects.values():
        subtype = str(ref.get_object().get('/Subtype'))
        images += subtype == '/Image'
        forms += subtype == '/Form'
print(json.dumps({'targetCount': t.count(${JSON.stringify(target)}), 'textLength': len(t), 'imageXObjects': images, 'formXObjects': forms}))
`;
const pypdf = JSON.parse(execFileSync("python3", ["-c", python, pdf], {
  encoding: "utf8",
  env: { ...process.env, PYTHONPATH: "/tmp/polypdf-blog-python" }
}));

const report = {
  generatedAt: new Date().toISOString(),
  source,
  pdf,
  baselineSha256,
  savedSha256: sha256,
  fileChangedAfterRedactionAndSave: sha256 !== baselineSha256,
  target,
  checks: {
    qpdfSyntaxPasses: /No syntax or stream encoding errors found/.test(qpdfCheck),
    pdftotextTargetCount: pdftotext.split(target).length - 1,
    qdfUncompressedTargetCount: qdfText.split(target).length - 1,
    pypdfTargetCount: pypdf.targetCount,
    imageXObjectsRemain: pypdf.imageXObjects,
    formXObjectsRemain: pypdf.formXObjects
  },
  passes:
    sha256 !== baselineSha256 &&
    /No syntax or stream encoding errors found/.test(qpdfCheck) &&
    !pdftotext.includes(target) &&
    !qdfText.includes(target) &&
    pypdf.targetCount === 0 &&
    pypdf.imageXObjects === 1 &&
    pypdf.formXObjects === 0,
  screenshots: {
    before: "captures/redaction-lab-before-dark.png",
    marked: "captures/redaction-marked-text-dark.png",
    confirmation: "captures/redaction-apply-confirmation-dark.png",
    applied: "captures/redaction-applied-result-dark.png",
    reopenedSearch: "captures/redaction-reopened-search-no-matches-dark.png"
  },
  claimBoundary: [
    "The saved-file checks prove removal of the one selected synthetic native-text token on this supported fixture.",
    "The separate top-level image remains and requires independent pixel review.",
    "The current redactor refused the original filtered page and then refused the qpdf-uncompressed page because that page also used a reusable Form XObject.",
    "No claim is made that every PDF content structure can currently be redacted."
  ]
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.passes) process.exit(1);
