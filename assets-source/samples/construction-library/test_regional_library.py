"""Regression checks for the independent PDF geometry verifier."""
import io
import unittest
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from verify_regional_library import check_reference, geometry, has_segment


def drawing(author):
    stream = io.BytesIO()
    pdf = canvas.Canvas(stream, pagesize=(900, 600))
    author(pdf)
    pdf.save()
    reader = PdfReader(stream)
    return geometry(reader, reader.pages[0])


class RegionalGeometryTests(unittest.TestCase):
    def test_transforms_and_graphics_state_are_resolved_in_page_coordinates(self):
        def author(pdf):
            pdf.saveState()
            pdf.translate(100, 200)
            pdf.rotate(90)
            pdf.line(0, 0, 40, 0)
            pdf.restoreState()
            pdf.line(0, 0, 20, 0)
        paths = drawing(author)
        self.assertTrue(has_segment(paths, (100, 200), (100, 240)))
        self.assertTrue(has_segment(paths, (0, 0), (20, 0)))
        self.assertFalse(has_segment(paths, (100, 200), (140, 200)))

    def test_wrong_physical_scale_fails_even_when_the_path_matches(self):
        length = 5*72000/25.4/50
        paths = drawing(lambda pdf: pdf.line(50, 100, 50+length, 100))
        reference = {"id": "calibration", "kind": "line", "points": [(50, 100), (50+length, 100)],
                     "metres": 5, "scaleRatio": 50}
        check_reference(reference, paths)
        with self.assertRaises(AssertionError):
            check_reference({**reference, "scaleRatio": 100}, paths)

    def test_manifest_coordinates_cannot_substitute_for_missing_pdf_geometry(self):
        paths = drawing(lambda pdf: pdf.line(50, 100, 100, 100))
        with self.assertRaisesRegex(AssertionError, "missing from actual PDF"):
            check_reference({"id": "missing", "kind": "line", "points": [(50, 100), (200, 100)],
                             "metres": 1, "scaleRatio": 50}, paths)

    def test_area_and_volume_are_computed_from_painted_rectangle(self):
        ppm = 72000/25.4/50
        paths = drawing(lambda pdf: pdf.rect(50, 100, 6*ppm, 3*ppm))
        reference = {"id": "slab", "kind": "rectangle", "points": [(50, 100), (50+6*ppm, 100+3*ppm)],
                     "widthMetres": 6, "heightMetres": 3, "areaSquareMetres": 18,
                     "perimeterMetres": 18, "depthMetres": .2, "volumeCubicMetres": 3.6, "scaleRatio": 50}
        check_reference(reference, paths)
        for key in ("areaSquareMetres", "volumeCubicMetres"):
            with self.assertRaises(AssertionError):
                check_reference({**reference, key: 999}, paths)


if __name__ == "__main__":
    unittest.main()
