# Metric practice plan

One fictional building, A1 landscape at 1:100, drawn in metres, with a floor plan, a floor finish plan and a room schedule. Only the labels change between languages; the drawn lines are the same in every file.

Needs reportlab 4.2.5. Run `python build_metric_plan.py <output folder> [language ...]` and copy the PDFs to `public/samples/metric/`.

The Bitstream Vera fonts bundled with reportlab are embedded in each PDF. Japanese needs a font with Japanese glyphs and has not been built yet.

If a sheet changes, measure it again in the public app before publishing it: the record in `public/samples/evaluation/public-mac-1.6.29-101/` is tied to these exact files.
