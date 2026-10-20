"""Negative checks for references that still have valid file hashes."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, FloatObject, NameObject

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("takeoff_verification", ROOT / "scripts/verify-regional-takeoff.py")
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class RegionalTakeoffTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.folder = Path(self.temporary.name) / "samples"
        shutil.copytree(verifier.DEFAULT, self.folder)

    def tearDown(self):
        self.temporary.cleanup()

    def update_hash(self, filename):
        path = self.folder / "manifest.json"
        manifest = json.loads(path.read_text())
        manifest["files"][filename] = verifier.digest(self.folder / filename)
        path.write_text(json.dumps(manifest))

    def mutate_pdf(self, filename, change):
        target = self.folder / filename
        reader = PdfReader(target)
        writer = PdfWriter()
        writer.clone_document_from_reader(reader)
        stream = ContentStream(writer.pages[0].get_contents(), writer)
        change(stream.operations)
        writer.pages[0][NameObject("/Contents")] = writer._add_object(stream)
        writer.write(target)
        self.update_hash(filename)

    def test_source_passes(self):
        self.assertEqual(verifier.verify(self.folder)["referenceCsvRows"], 15)

    def test_scaled_drawing_is_rejected_even_when_manifest_hash_matches(self):
        def change(operations):
            for operands, op in operations:
                if op == b"cm" and float(operands[0]) > 1.8:
                    operands[0] = FloatObject(float(operands[0]) * 1.01)
                    return
            self.fail("Drawing scale operator not found")
        self.mutate_pdf("bodenbelag-uebung.pdf", change)
        with self.assertRaisesRegex(AssertionError, "painted area boundary"):
            verifier.verify(self.folder)

    def test_missing_circle_is_rejected_despite_retained_type_label(self):
        def change(operations):
            for index, (operands, op) in enumerate(operations):
                if op == b"m" and list(map(float, operands)) == [113, 445]:
                    for end in range(index + 1, len(operations)):
                        if operations[end][1] == b"S":
                            operations[end] = ([], b"n")
                            return
            self.fail("First Type A circle not found")
        self.mutate_pdf("elektro-uebung.pdf", change)
        with self.assertRaisesRegex(AssertionError, "Type A symbol count"):
            verifier.verify(self.folder)

    def test_shifted_route_is_rejected_despite_unchanged_printed_total(self):
        def change(operations):
            for operands, op in operations:
                if op == b"l" and list(map(float, operands)) == [370, 408]:
                    operands[1] = FloatObject(410)
                    return
            self.fail("Route endpoint not found")
        self.mutate_pdf("elektro-uebung.pdf", change)
        with self.assertRaisesRegex(AssertionError, "painted two-segment route"):
            verifier.verify(self.folder)

    def test_rounding_down_pack_quantity_is_rejected(self):
        target = self.folder / "bodenbelag-referenz.csv"
        target.write_text(target.read_text().replace("Ganze Pakete;21;", "Ganze Pakete;20;"))
        self.update_hash(target.name)
        with self.assertRaisesRegex(AssertionError, "Incorrect reference CSV quantity: Ganze Pakete"):
            verifier.verify(self.folder)


if __name__ == "__main__":
    unittest.main()
