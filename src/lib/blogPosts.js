import aiscGeneratorScreenshot from '../assets/screenshots/plugins-aisc-w24x55-generator-currentdev-dark-web.png';
import aiscResultScreenshot from '../assets/screenshots/plugins-aisc-w24x55-result-currentdev-dark-web.png';
import mutcdStopScreenshot from '../assets/screenshots/mutcd-r1-1-stop-currentdev-dark-web.png';
import pluginSidebarScreenshot from '../assets/screenshots/plugins-sidebar-currentdev-dark-web.png';
import { guidePosts } from '../content/guides';

// Blog posts are plain data so a new entry is one object, not a new React component.
//
// A post body is a list of sections. Each section renders as one card in the same
// `.legal-section` shell the Support, Terms, and Version History pages already use, so a post
// inherits the site's type scale, card treatment, and scroll animation with no page-specific CSS.
//
// Block kinds a section body understands:
//   { kind: 'p',     text }               a paragraph
//   { kind: 'ul',    items: [] }          a bulleted list (accent bullets)
//   { kind: 'ol',    items: [] }          a numbered list, used for the how-to template
//   { kind: 'sub',   text }               a sub-heading inside a section
//   { kind: 'note',  text }               a set-apart caveat or clarification
//   { kind: 'figure', src, alt, caption }  a captioned product-evidence image
//   { kind: 'table',  headers, rows }      an accessible comparison/reference table
//   { kind: 'formula', label, formula }    a worked calculation with an explanation
//
// `icon` names map to react-icons in BlogPost.js. Add the name there before using a new one.

const post = (entry) => Object.freeze(entry);

const pluginCaptureProvenance =
  'Real current-development PolyPDF 1.3.4 (build 16) UI from the isolated a0a709c source snapshot with tracked product-diff SHA-256 8d9daab35f0284ae867d294ed4e1638fffcf6fca1c5da51685f8c1226b764250. Captured on August 19, 2026 in dark mode at the native-maximized 1710 × 1073 CSS viewport; this is an uncropped 50 percent derivative of the 3420 × 2146 Retina capture. The owned fictional fixtures contain no customer data.';

const pluginSidebarCaption =
  'Current-development PolyPDF 1.3.4 (build 16) in dark mode. The Plugins sidebar lists three first-party validation packages beside an owned blank reference sheet. This is development evidence, not a promise that any listed package is available in the public download: AISC data redistribution rights remain unresolved, seal templates still require human compliance review, and PDF Maps is blocked pending a production-compliant geocoder and request pattern. Polygon is active only to keep its complete Line, Fill, and Hatch style controls visible; no plugin output has been inserted in this frame.';

const productPosts = Object.freeze([
  post({
    slug: 'introducing-polypdf-plugins',
    title: 'Introducing PolyPDF Plugins',
    date: '2026-08-07',
    dateLabel: 'August 7, 2026',
    dateModified: '2026-08-19',
    author: 'The PolyPDF team',
    readingTime: '9 min read',
    tag: 'Product',
    excerpt:
      'A truthful current-development preview of PolyPDF plugins: declarative packages, one-list management, sideload consent, host-owned generators, and the availability limits on the three first-party validation packages.',
    metaTitle: 'PolyPDF Plugins: Current Development Preview',
    metaDescription:
      'How PolyPDF plugins handle declarative packages, permissions, sideload consent, and why AISC, seals, and PDF Maps remain development-only.',
    keywords: [
      'PolyPDF plugins',
      'signed PDF plugin packages',
      'AISC steel section PDF',
      'professional seal PDF',
      'PDF map plugin development'
    ],
    lede:
      'Plugins add content generators without executing downloaded plugin JavaScript. This article documents the exact current-development interface and its first-party validation packages; it does not claim that every pictured package is approved for the public download.',
    quickAnswer:
      'PolyPDF plugins are declarative packages rather than executable-code extensions. PolyPDF renders their forms and runs a fixed host-owned generator against bounded data or sanitized artwork. The current development build carries AISC, seal, and map packages for validation, but none of those three images is a blanket shipping claim: AISC redistribution rights are unresolved, seal templates still need human compliance review, and PDF Maps is blocked from public release until its place-search workflow uses a provider and request pattern approved for production autocomplete.',
    lastVerified: '2026-08-19',
    productVersion: 'PolyPDF current-development snapshot (1.3.4 build 16)',
    platforms: 'macOS and Windows',
    heroImage: {
      src: pluginSidebarScreenshot,
      alt: 'PolyPDF dark-mode Plugins sidebar listing AISC Steel Sections, PDF Maps, and Professional Seal Maker beside an owned blank reference sheet',
      caption: pluginSidebarCaption,
      width: 1710,
      height: 1073,
      provenance: pluginCaptureProvenance
    },
    sections: [
      {
        icon: 'document',
        title: 'Where this starts',
        body: [
          {
            kind: 'p',
            text:
              'PolyPDF is a desktop app for people who work from PDF drawings rather than CAD files — solo engineers, architects, estimators, and the small teams around them. Its core document, markup, measurement, and export work happens locally on Mac and Windows. Maps, license activation, updates, purchases, and support can require a connection.'
          },
          {
            kind: 'p',
            text:
              'That local-first shape sets the constraints for anything we add. Plugins were designed inside it: packages carry signed data and artwork, not downloaded executable code or a subscription service.'
          }
        ]
      },
      {
        icon: 'shield',
        title: 'What a PolyPDF plugin is — and is not',
        body: [
          {
            kind: 'p',
            text:
              'A plugin package can carry data tables, sanitized SVG or PNG artwork, and a declarative description of the form the user fills in. It does not carry executable plugin JavaScript. The package names one of PolyPDF\'s fixed, host-owned generators and supplies bounded input for that generator.'
          },
          {
            kind: 'p',
            text:
              'That design narrows the attack surface; it does not make an arbitrary file harmless. A package can still contain structured values, labels, options, and graphics. PolyPDF therefore validates the archive and manifest, sanitizes supported artwork, enforces declared permissions, and validates the annotations and image assets produced by its own generator before anything is inserted.'
          },
          { kind: 'sub', text: 'What is verified before a package is installed' },
          {
            kind: 'ul',
            items: [
              'Bundled and catalog-delivered packages use an Ed25519 signature over a SHA-256 digest covering every file, plus a separate SHA-256 check on each file.',
              'A catalog install is accepted only when the signed catalog pins the package checksum. A file the user selects directly can instead be self-signed; the consent screen identifies that source and pins the author key after approval.',
              'A strict layout allowlist — a package may contain only a manifest, a form schema, a signature, and data, asset, and icon folders. Anything else is refused.',
              'Path-safety and symlink checks that reject traversal, absolute paths, and duplicate entries.',
              'Size caps on the archive, on each member, and on the number of members.'
            ]
          },
          { kind: 'sub', text: 'The permission model' },
          {
            kind: 'p',
            text:
              'A plugin declares which of three permissions it needs: read the current document context, create annotations, and create image assets in the workspace. The detail or sideload-review view lists them in plain language. A generator result outside those permissions is rejected.'
          },
          {
            kind: 'note',
            text:
              'The generator dialog is drawn by PolyPDF from the plugin\'s form schema. The plugin describes the fields; the app renders them. Nothing in a package controls the interface directly.'
          }
        ]
      },
      {
        icon: 'plug',
        title: 'The Plugin Manager and Plugins sidebar',
        body: [
          {
            kind: 'p',
            text:
              'Plugins are managed in one Plugins window. The current build shows one list of the packages it carries or the user installed. A detail page shows publisher, installed version, permissions, commands, compatibility, package source and size, release notes when present, and whether the plugin is enabled.'
          },
          {
            kind: 'ul',
            items: [
              'Enable, disable, uninstall, and roll back an available previous version from the same window.',
              'Install from File… opens a consent review for a package the user deliberately selected, including its source, signer, permissions, and downgrade or reinstall context.',
              'A consented sideload can reinstall the same version or an older version, so a universal “downgrades are refused” claim would be wrong.',
              'Uninstalling a plugin does not touch content it already generated — that content is part of your document, not part of the plugin.'
            ]
          },
          {
            kind: 'p',
            text:
              'The current development build carries three first-party validation packages and enables them on first run. “Check for updates” appears only when a build has an update source configured; the ordinary shipping configuration has no Discover, Installed, or Updates tabs and no catalog-refresh action.'
          },
          {
            kind: 'note',
            text:
              'There is no marketplace or public submission directory. Install from File… is the explicit path for a user-chosen third-party package, and its consent screen distinguishes that package from software PolyPDF supplied.'
          },
          {
            kind: 'figure',
            src: pluginSidebarScreenshot,
            alt: 'The PolyPDF Plugins sidebar with three first-party generators listed next to an owned blank PDF sheet',
            caption: pluginSidebarCaption,
            width: 1710,
            height: 1073,
            provenance: pluginCaptureProvenance
          }
        ]
      },
      {
        icon: 'ruler',
        title: 'AISC Steel Sections — development evidence, not a shipping promise',
        body: [
          {
            kind: 'p',
            text:
              'In the current development validation package, type a supported designation — for example W24X55, L6X6X1/2, HSS8X8X1/2, or PIPE6 — pick customary or metric units and an annotation scale, and PolyPDF draws the section profile onto the sheet.'
          },
          {
            kind: 'p',
            text:
              'The profile is real vector geometry, placed as a Polygon annotation rather than a pasted bitmap: it stays sharp at any zoom and prints at the size you asked for. Hollow shapes such as HSS and Pipe are drawn with their inner loop, so the wall thickness is the actual wall thickness.'
          },
          {
            kind: 'note',
            text:
              'Commercial availability is blocked until redistribution rights for the AISC v16 source data are confirmed in writing or the dataset is replaced with an unencumbered source. The development package contains a curated 57-shape subset across W, M, S, HP, C, MC, L, WT, HSS, HSS-Round, and Pipe families—not the complete database. The screenshots prove the current generator behavior only. Verify any designation against an authoritative reference before it drives a design decision.'
          },
          {
            kind: 'figure',
            src: aiscGeneratorScreenshot,
            alt: 'PolyPDF AISC Steel Sections generator configured for a W24 by 55 profile in customary units with a blue 2 point line',
            caption:
              'The AISC Steel Sections generator is configured for W24×55 in customary units at 1 inch = 1 foot, with a 2 pt blue line. The live preview shows that selected profile before insertion.',
            width: 1710,
            height: 1073,
            provenance: pluginCaptureProvenance
          },
          {
            kind: 'figure',
            src: aiscResultScreenshot,
            alt: 'A selected blue W24 by 55 steel profile inserted as vector geometry on an owned PolyPDF reference sheet',
            caption:
              'After Insert, the selected W24×55 profile appears on the owned sheet as a blue 2 pt Polygon annotation. The current capture shows the genuine generated result selected for ordinary editing.',
            width: 1710,
            height: 1073,
            provenance: pluginCaptureProvenance
          }
        ]
      },
      {
        icon: 'seal',
        title: 'Professional Seal Maker',
        body: [
          {
            kind: 'p',
            text:
              'Choose Professional Engineer or Architect, choose a jurisdiction — the 50 states and the District of Columbia — fill in the fields that jurisdiction\'s template asks for, and watch the seal build in the live preview before you insert it.'
          },
          {
            kind: 'p',
            text:
              'The output is a graphic generated from a template. It is not a cryptographic signature, and inserting one does not sign the document. PolyPDF\'s digital signature tools are separate, and if you need a signature a verifier can check, that is the path to use.'
          },
          {
            kind: 'note',
            text:
              'These templates are a development-stage drafting aid, not board approval. Automated checks cover required slots, vector artwork, well-formedness, and rendering, but human jurisdiction-by-jurisdiction compliance review remains pending before release. The licensed professional whose name appears on a seal remains responsible for confirming its appearance, wording, and use with their own licensing board.'
          }
        ]
      },
      {
        icon: 'map',
        title: 'PDF Maps — development evidence, blocked for public release',
        body: [
          {
            kind: 'p',
            text:
              'The current development generator can accept an address, city, or place name, set a zoom level from world view to building level, and insert a map image on the page. Inside PolyPDF that development result stays adjustable: double-click it to pan and zoom in a small editor and save the view. In other PDF viewers it is a plain image.'
          },
          {
            kind: 'p',
            text:
              'Place searches are geocoded through Nominatim at openstreetmap.org. The image itself is rendered from OpenFreeMap vector tiles using the OpenMapTiles schema. PolyPDF bakes “OpenFreeMap © OpenMapTiles Data from OpenStreetMap” into the generated image—or a shorter layout form when space requires it—so the credit travels with the PDF.'
          },
          {
            kind: 'note',
            text:
              'This package is not cleared for public release. Its current place-search control sends debounced autocomplete requests to the public openstreetmap.org Nominatim service, whose usage policy forbids client-side autocomplete and limits aggregate application traffic. PDF Maps must move to a compliant hosted or self-hosted geocoder and pass the release gate before availability is claimed. The development renderer also needs an internet connection while resolving a place and rendering OpenFreeMap tiles; an inserted result is then a self-contained image annotation.'
          }
        ]
      },
      {
        icon: 'document',
        title: 'A related built-in reference tool: MUTCD signs',
        body: [
          {
            kind: 'p',
            text:
              'MUTCD signs are not plugins. They are built into PolyPDF as Toolsets. In the current development build, the Regulatory chest contains 435 sign cards; choosing R1-1 Stop and placing it creates an image annotation that can be moved, resized, or deleted like other page content.'
          },
          {
            kind: 'p',
            text:
              'The demonstration below uses an owned, fictional traffic-control reference sheet with an explicit R1-1 placement target. It proves the browsing and placement workflow, not a field-ready traffic-control plan.'
          },
          {
            kind: 'figure',
            src: mutcdStopScreenshot,
            alt: 'PolyPDF dark-mode MUTCD Regulatory chest open beside a selected R1-1 Stop sign in an owned labeled demonstration target',
            caption:
              'This is a built-in Toolset, not a plugin. The MUTCD Regulatory chest remains open with the R1-1 Stop source card visible, while the real placed R1-1 image annotation is selected inside the owned, explicitly labeled demonstration target. Sign artwork comes from FHWA Standard Highway Signs 2024; the fixture is fictional and is not for field use.',
            width: 1710,
            height: 1073,
            provenance: pluginCaptureProvenance
          }
        ]
      },
      {
        icon: 'steps',
        title: 'How to use a plugin',
        body: [
          {
            kind: 'p',
            text:
              'Every plugin follows the same path. Learn it once and it applies to the next one too.'
          },
          {
            kind: 'ol',
            items: [
              'Open the Plugin Manager. On macOS: PolyPDF ▸ Plugins…. On Windows: Tools ▸ Plugins ▸ Plugins….',
              'Choose a row in the single list and read its detail page — publisher, installed version, requested permissions, source, compatibility, and commands.',
              'For a package you obtained yourself, choose Install from File… and review its signer, source, permissions, and reinstall or downgrade warning before consenting. The three validation packages pictured here are already present in this current development build.',
              'In this development snapshot, run it from Tools ▸ Plugins, then pick the package command. Insert AISC Steel Section…, Insert Professional Seal…, and Insert Map… are validation workflows, not evidence that those packages are cleared for the public build.',
              'Fill in the generator dialog. The preview panel redraws as you type, so you see the result before it touches the document.',
              'Choose Insert. The content is placed as ordinary annotations, in a single undo step — one Undo removes the whole insertion.',
              'Use the editing operations supported by that annotation type. The current vector profile can be moved, resized, restyled, or deleted; image-based outputs can be moved, resized, or deleted.'
            ]
          },
          {
            kind: 'p',
            text:
              'What lands on the page is a standard PDF annotation — a Polygon for a steel section, a Stamp for a seal or a map — written with a baked appearance stream. The content belongs to the document, not to the plugin, which is why uninstalling the plugin leaves it untouched.'
          }
        ]
      },
      {
        icon: 'sparkle',
        title: 'What we are watching next',
        body: [
          {
            kind: 'p',
            text:
              'The current development validation set is deliberately small: a data lookup that draws vector geometry, a template that composes an image, and a generator that reaches outside services. Before those examples become a public availability promise, AISC redistribution rights must be resolved, seal templates need human compliance review, PDF Maps needs a production-compliant place-search provider and request pattern, and each included package must pass the release gate.'
          },
          {
            kind: 'p',
            text:
              'If a plugin would make your week easier, tell us what it should generate and what it should ask for. Write to support@polypdf.com.'
          }
        ]
      }
    ],
    faqs: [
      {
        question: 'Do PolyPDF plugins run downloaded code?',
        answer:
          'No. A plugin supplies signed data, artwork, and a declarative form schema. PolyPDF renders the form and runs one of its own built-in generators; plugin JavaScript is not evaluated.'
      },
      {
        question: 'Does a PolyPDF plugin need an internet connection?',
        answer:
          'The current AISC and seal validation packages use bundled data and artwork. The development PDF Maps package needs a connection while a place is resolved and OpenFreeMap/OpenMapTiles data is rendered; an inserted result is then stored as a self-contained image annotation. Maps is blocked from public release until its autocomplete path uses a production-compliant geocoder.'
      },
      {
        question: 'What happens to inserted content if I uninstall a plugin?',
        answer:
          'Inserted content remains in the document as ordinary annotations. Uninstalling the generator does not remove the steel profile, seal graphic, or map image it already created.'
      },
      {
        question: 'Are the MUTCD sign chests PolyPDF plugins?',
        answer:
          'No. MUTCD signs are built-in Toolsets. They are shown here to make the product boundary explicit: plugins generate new content through signed packages, while the sign chests are bundled reference libraries.'
      },
      {
        question: 'Are all three pictured plugin packages available in the public download?',
        answer:
          'No availability should be inferred from the development screenshot. AISC commercial distribution is blocked pending confirmed data rights or a replacement dataset, seal templates still require human compliance review, and PDF Maps is blocked until its place-search workflow complies with its production provider. Check the current public build for packages that have actually cleared release.'
      }
    ],
    sources: [
      {
        label: 'FHWA — Standard Highway Signs 2024 release status',
        url: 'https://mutcd.fhwa.dot.gov/kno-shs_2024-release-status/index.htm',
        note: 'Official source for the sign artwork represented in the MUTCD Toolset capture.'
      },
      {
        label: 'OpenFreeMap',
        url: 'https://openfreemap.org/',
        note: 'The vector-tile service used by the current PDF Maps renderer.'
      },
      {
        label: 'OpenMapTiles',
        url: 'https://openmaptiles.org/',
        note: 'The vector-tile schema and attribution named in generated maps.'
      },
      {
        label: 'OpenStreetMap Foundation — Nominatim usage policy',
        url: 'https://operations.osmfoundation.org/policies/nominatim/',
        note: 'The public-service policy forbids client-side autocomplete and caps aggregate application traffic; the current development implementation does not meet that production-use boundary, so PDF Maps is blocked from public release.'
      }
    ]
  })
]);

export const blogPosts = Object.freeze([
  ...guidePosts.map(post),
  ...productPosts
]);

export const blogPostBySlug = (slug) => blogPosts.find((entry) => entry.slug === slug) || null;

export const blogPostPath = (slug) => `/blog/${slug}`;
