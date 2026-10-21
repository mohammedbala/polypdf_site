# Regional drawing fonts

The Polish profile selects `fontFamily: NotoSans` because the generator's default Vera fonts lack Polish diacritics. Both Noto Sans files are copied unchanged from the PolyPDF app's bundled fonts. `source.json` records their source commit, hashes and the bold font's existing upstream provenance. The accompanying OFL files are copied from the same source.

The generator uses the selected face for painting text, line wrapping and symbol-label masks. Separate registered font names prevent one locale from replacing another locale's fonts in the same process. Existing profiles retain the default Vera faces and reproduce their previous output byte-for-byte.
