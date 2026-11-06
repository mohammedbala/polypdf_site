# Metric practice plans

Each language has its own fictional building, drawn with the conventions researched for one market. `draftkit.py` is the drawing library and `plan_<language>.py` draws one sheet. The English sheet still comes from `build_metric_plan.py` and `metric_plan_strings.json`.

Run `python plan_de.py <output folder>`. Needs reportlab 4.2.5; `plan_hi.py` and `plan_ar.py` need reportlab 4.3.1 with uharfbuzz for text shaping. Fonts are read from `../fonts`, as static instances made with fontTools from these Google Fonts files, all under the SIL Open Font License: NotoSansJP[wght].ttf, NotoSansSC[wght].ttf, NotoSerifSC[wght].ttf, NotoSansDevanagari[wdth,wght].ttf, NotoSansArabic[wdth,wght].ttf. The other sheets embed the Bitstream Vera fonts bundled with reportlab.

If a sheet changes, measure it again in the public app before publishing it: the record in `public/samples/evaluation/public-mac-1.6.29-101/` is tied to these exact files. Keep line ends at least 5 mm from any point a reader is told to pick, because the app snaps to the nearest line end.
