import screenshot from '../../assets/screenshots/shot-area-cutouts-depth-1.3.4-web.png';

const screenshotCaption =
  'Live-app feature proof from PolyPDF 1.3.4 (build 16) on macOS. A generated test fixture shows a selected curved area with two interior cutouts, crosshatch, and a depth of 5′-3″; it is not a customer drawing.';

const post = {
  slug: 'measure-pdf-area-cutouts-depth',
  title: 'How to Measure PDF Area with Cutouts and Depth',
  date: '2026-08-19',
  dateLabel: 'August 19, 2026',
  dateModified: '2026-08-19',
  author: 'The PolyPDF team',
  readingTime: '9 min read',
  tag: 'Measure & Takeoff',
  excerpt:
    'Trace a net PDF area, subtract multiple interior openings, optionally convert it to volume with depth, and keep hatch styling separate from the math.',
  metaTitle: 'Measure PDF Area, Cutouts, and Volume | PolyPDF',
  metaDescription:
    'Measure net area in a PDF, subtract multiple cutouts, add a real-world depth for volume, and understand what hatch scale changes in PolyPDF.',
  lede:
    'Net-area takeoff is more useful when the annotation records the outer boundary, each excluded opening, and any depth used for volume. PolyPDF 1.3.4 keeps those inputs on one selectable measurement.',
  quickAnswer:
    'To measure net PDF area in PolyPDF, calibrate the current page, choose Area, trace and close the outer boundary, then select the measurement. In the Area Cutouts controls, choose Add Cutout and trace each opening fully inside the boundary. PolyPDF subtracts those cutout polygons from the outer area. If you enter a positive real-world Depth, the result changes from area to volume. Hatch pattern and hatch scale change appearance only, not the measured quantity.',
  lastVerified: '2026-08-18',
  productVersion: 'PolyPDF 1.3.4 (build 16)',
  platforms: 'macOS and Windows',
  heroImage: {
    src: screenshot,
    alt: 'PolyPDF 1.3.4 with a selected curved area, two rectangular cutouts, crosshatch, and a 5 foot 3 inch depth',
    caption: screenshotCaption,
    width: 1800,
    height: 1200
  },
  keywords: [
    'measure PDF area',
    'PDF area cutouts',
    'PDF volume measurement',
    'net area takeoff',
    'PDF hatch scale'
  ],
  sections: [
    {
      icon: 'ruler',
      title: 'Calibrate first, then define what “area” means',
      body: [
        {
          kind: 'p',
          text:
            'Set the scale for the exact page before tracing. Use a scale printed in the title block only when you know the PDF still has that plotted relationship; otherwise calibrate by drawing over a long, known dimension and verify a second span. PolyPDF stores the calibration per page, and an uncalibrated page reports square PDF points rather than pretending it knows real-world square feet or square metres.'
        },
        {
          kind: 'p',
          text:
            'Next decide the boundary convention. Gross floor area, finish area, slab area, roof membrane, paving, and paint coverage can use different faces and exclusions even on the same plan. Put that meaning in the Subject and project notes. Software can calculate the geometry you trace, but it cannot decide which side of a wall belongs in your scope.'
        },
        {
          kind: 'ul',
          items: [
            'Use a long calibration reference and snapped endpoints where the PDF contains vector linework.',
            'Check a second known dimension before tracing a large or commercially significant area.',
            'Create a Scale Region when a detail on the page uses a different scale from the main view.',
            'State whether the boundary is gross, net, centerline, inside face, outside face, or another project convention.'
          ]
        },
        {
          kind: 'figure',
          src: screenshot,
          alt: 'Live PolyPDF feature proof with an outer area boundary, two empty cutouts, and visible measurement controls',
          caption: screenshotCaption,
          width: 1800,
          height: 1200
        }
      ]
    },
    {
      icon: 'steps',
      title: 'Trace and close the outer boundary',
      body: [
        {
          kind: 'ol',
          items: [
            'Choose the Area measurement tool.',
            'Click each meaningful turn around the outer boundary. Zoom in for short offsets and crowded corners.',
            'Close the figure at the starting point after at least three vertices.',
            'Select the completed area and inspect its handles against the intended boundary.',
            'Set the Subject and Status so the Takeoff Worksheet explains what the quantity represents.',
            'If the real boundary is intentionally curved, choose the Curved path option and verify the displayed curve follows it.'
          ]
        },
        {
          kind: 'p',
          text:
            'For a straight path, the area follows the polygon formed by the vertices. When the area path is set to Curved, PolyPDF 1.3.4 uses the displayed smoothed boundary in its area calculation rather than measuring only the straight chords between control points. Use the mode that matches the actual edge, not the one that merely looks cleaner.'
        },
        {
          kind: 'note',
          text:
            'Avoid self-intersecting boundaries and unnecessary points. A clean outline is easier to audit and less likely to hide a misplaced segment.'
        }
      ]
    },
    {
      icon: 'document',
      title: 'Subtract one or more interior cutouts',
      body: [
        {
          kind: 'p',
          text:
            'With the area selected, find Area Cutouts in the style controls and choose Add Cutout. Trace the first opening as a closed polygon. PolyPDF checks each cutout vertex against the stored straight outer control polygon and warns when a vertex falls outside it. That check does not prove that every connecting edge stays inside a concave outline, and a curved visible boundary can differ from the stored control polygon, so inspect the entire cutout at high zoom. Repeat Add Cutout for additional voids. The selected annotation shows the number of stored cutouts, and Remove Last removes the most recently added one.'
        },
        {
          kind: 'formula',
          label: 'Net area',
          formula: 'net area = outer boundary area − Σ(each cutout area)',
          explanation:
            'Each saved cutout is a reusable ring on the area measurement. Moving or resizing the outer annotation keeps the cutout geometry attached to it.'
        },
        {
          kind: 'ul',
          items: [
            'Use cutouts for actual exclusions such as shafts, courtyards, large penetrations, or openings required by your scope.',
            'Keep cutouts wholly inside the outer boundary and inspect them at high zoom before accepting the total.',
            'Do not overlap cutouts. PolyPDF subtracts each stored polygon; overlapping rings can subtract the shared portion more than once.',
            'Do not use a cutout as a visual mask for an uncertain scope item. Record the decision and its basis.'
          ]
        }
      ]
    },
    {
      icon: 'table',
      title: 'Worked net-area example',
      body: [
        {
          kind: 'p',
          text:
            'Consider a calibrated rectangular slab measuring 40 feet by 30 feet. It contains a 5-by-4-foot shaft opening and a 10-by-3-foot stair opening. Trace the 40-by-30 outer boundary, then add each opening as its own cutout.'
        },
        {
          kind: 'table',
          caption: 'Example quantity breakdown',
          headers: ['Geometry', 'Calculation', 'Quantity'],
          rows: [
            ['Outer slab', '40 ft × 30 ft', '1,200 sq ft'],
            ['Shaft cutout', '5 ft × 4 ft', '−20 sq ft'],
            ['Stair cutout', '10 ft × 3 ft', '−30 sq ft'],
            ['Net slab', '1,200 − 20 − 30', '1,150 sq ft']
          ]
        },
        {
          kind: 'formula',
          label: 'Example net area',
          formula: '1,200 sq ft − 20 sq ft − 30 sq ft = 1,150 sq ft',
          explanation:
            'The example is arithmetic for a hypothetical calibrated drawing. Your vertices and project boundary rules determine your result.'
        },
        {
          kind: 'p',
          text:
            'Review the annotated page as well as the total. A correct formula cannot detect that an opening was traced twice, that the wrong stair was excluded, or that the outer boundary followed the wrong face of wall.'
        }
      ]
    },
    {
      icon: 'ruler',
      title: 'Add depth only when volume is the intended quantity',
      body: [
        {
          kind: 'p',
          text:
            'A selected area measurement exposes a Depth field. Enter a positive real-world length in the current measurement format—for example, 4 inches, 0.1 metres, or 5 feet 3 inches. PolyPDF multiplies the net area by that depth and changes the worksheet quantity kind from Area to Volume. Clear the field to return to an area quantity.'
        },
        {
          kind: 'formula',
          label: 'Volume from net area',
          formula: 'volume = (outer area − cutout areas) × depth',
          explanation:
            'For the 1,150 sq ft example, a uniform 4-inch depth is one-third of a foot, producing about 383.333 cu ft.'
        },
        {
          kind: 'p',
          text:
            'Depth is a typed uniform value, not a third dimension detected from the drawing. Do not use one depth where the assembly varies without a documented averaging method. If multiple zones have different thicknesses, create separate area measurements so each volume has an explicit boundary, Subject, and depth.'
        },
        {
          kind: 'note',
          text:
            'PolyPDF requires a real-world page or region scale before accepting depth. That prevents an entered depth from being combined with an uncalibrated area to produce a misleading volume.'
        }
      ]
    },
    {
      icon: 'sparkle',
      title: 'Hatch scale is visual, not mathematical',
      body: [
        {
          kind: 'p',
          text:
            'The Hatch controls set the pattern, colour, opacity, and scale used to draw the annotation. Increasing hatch scale changes the spacing or size of the pattern; it does not change the outer geometry, the cutouts, the net area, or the depth. The live 1.3.4 proof above shows a crosshatch at 125 percent so the two empty cutouts remain visually obvious.'
        },
        {
          kind: 'table',
          caption: 'What changes the result?',
          headers: ['Control or edit', 'Changes quantity?', 'What it changes'],
          rows: [
            ['Move a boundary vertex', 'Yes', 'Outer area geometry'],
            ['Add or remove a cutout', 'Yes', 'Net area geometry'],
            ['Switch Straight / Curved path', 'Yes', 'Measured boundary shape'],
            ['Enter or clear Depth', 'Yes', 'Area versus volume and the resulting value'],
            ['Change hatch scale, colour, or opacity', 'No', 'Annotation appearance only'],
            ['Change displayed precision', 'No', 'Rounding and label presentation only']
          ]
        },
        {
          kind: 'p',
          text:
            'Use a hatch that makes the included region and excluded openings easy to inspect at the zoom and print size reviewers will use. A decorative pattern should never obscure the very boundary it is meant to explain.'
        }
      ]
    },
    {
      icon: 'shield',
      title: 'Accuracy and access limits to keep visible',
      body: [
        {
          kind: 'ul',
          items: [
            'Calibration converts PDF geometry; it cannot repair nonuniform scan distortion, perspective, or a warped original.',
            'A net-area total is only as defensible as its source revision, boundary convention, scale verification, and cutout review.',
            'CSV or PDF export preserves the calculated records, not the reasoning behind an undocumented scope decision.',
            'The Free edition allows up to three hand-created measurements per document. Symbol Search auto-count remains uncapped and is separate from this manual area workflow.'
          ]
        },
        {
          kind: 'note',
          text:
            'The screenshot on this page is a live feature proof made from a generated test fixture. It demonstrates the controls and rendered geometry; it is not evidence of a customer project, field condition, or professional quantity conclusion.'
        }
      ]
    }
  ],
  faqs: [
    {
      question: 'Can I add more than one cutout to a PDF area measurement?',
      answer:
        'Yes. PolyPDF 1.3.4 stores multiple cutout polygons on one area measurement and subtracts each from the outer area.'
    },
    {
      question: 'What does Depth do to an area measurement?',
      answer:
        'A positive real-world Depth multiplies the net area and changes the result to volume. Clear Depth to return to area.'
    },
    {
      question: 'Does changing hatch scale change measured area?',
      answer:
        'No. Hatch pattern, colour, opacity, and scale change only the annotation’s appearance. Boundary vertices, cutouts, path shape, calibration, and depth drive the quantity.'
    },
    {
      question: 'Does PolyPDF guarantee a cutout stays inside the visible outer area?',
      answer:
        'No. PolyPDF checks each traced vertex against the stored straight control polygon, but it does not prove every connecting edge stays inside a concave outline, and that polygon can differ from a curved visible boundary. Keep the complete ring visibly inside and inspect it at high zoom.'
    },
    {
      question: 'Can I use different depths inside one area?',
      answer:
        'One area measurement has one uniform Depth. For zones with different thicknesses, create separate areas so each boundary and depth is explicit.'
    }
  ],
  relatedSlugs: [
    'calibrate-pdf-drawing-scale',
    'pdf-takeoff-worked-example',
    'why-pdf-measurements-are-wrong'
  ],
  sources: [
    {
      label: 'PolyPDF: Measure PDF on Mac',
      url: 'https://www.polypdf.com/measure-pdf-on-mac'
    },
    {
      label: 'PolyPDF: PDF takeoff software',
      url: 'https://www.polypdf.com/pdf-takeoff-software'
    }
  ],
  cta: {
    title: 'Test a net-area workflow on your own PDF',
    text:
      'Download PolyPDF for macOS or Windows, verify one page scale, and use the Free measurement allowance to trace a real boundary and its openings before deciding whether to unlock unlimited measurements.',
    buyLabel: 'See the one-time license',
    downloadSource: 'blog_area_cutouts_depth',
    buySource: 'website_blog_area_cutouts_depth'
  }
};

export default post;
