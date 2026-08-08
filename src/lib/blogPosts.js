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
//
// `icon` names map to react-icons in BlogPost.js. Add the name there before using a new one.

const post = (entry) => Object.freeze(entry);

export const blogPosts = Object.freeze([
  post({
    slug: 'introducing-polypdf-plugins',
    title: 'Introducing PolyPDF Plugins',
    date: '2026-08-07',
    dateLabel: 'August 7, 2026',
    author: 'The PolyPDF team',
    readingTime: '7 min read',
    tag: 'Product',
    excerpt:
      'Plugins extend PolyPDF with signed content packages that carry data and artwork instead of executable code. The first three insert AISC steel section profiles, professional seal graphics, and OpenStreetMap maps — as ordinary, editable annotations.',
    metaTitle: 'Introducing PolyPDF Plugins | PolyPDF Blog',
    metaDescription:
      'PolyPDF plugins are signed content packages with no executable code. Read how the permission model, Plugin Manager, and the three launch plugins — AISC steel sections, professional seals, and OpenStreetMap maps — work.',
    lede:
      'Plugins add new content generators to PolyPDF without turning the app into a place where downloaded code runs. Here is what ships, how the security model works, and the steps to use any plugin.',
    sections: [
      {
        icon: 'document',
        title: 'Where this starts',
        body: [
          {
            kind: 'p',
            text:
              'PolyPDF is a desktop app for people who work from PDF drawings rather than CAD files — solo engineers, architects, estimators, and the small teams around them. It runs natively on Mac and Windows, it opens and marks up documents without an account or an internet connection, and it is bought once instead of rented.'
          },
          {
            kind: 'p',
            text:
              'That shape sets the constraints for anything we add. A feature that needs a server, a sign-in, or a subscription tier does not belong in it. Plugins were designed inside those constraints: they are content, not services.'
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
              'A plugin is a signed package of data: tables, artwork, and a declarative description of the form the user fills in. Plugins do not ship executable code, and PolyPDF does not evaluate plugin JavaScript. A plugin names one of the app\'s own generators and supplies the data it works from.'
          },
          {
            kind: 'p',
            text:
              'That single decision removes most of what makes a plugin system risky. There is no sandbox to escape because there is no plugin process to begin with, and a malicious package cannot do more than describe a form and a data table.'
          },
          { kind: 'sub', text: 'What is verified before a package is installed' },
          {
            kind: 'ul',
            items: [
              'An Ed25519 signature over a SHA-256 digest covering every file in the package, plus a separate SHA-256 check on each file.',
              'A signed catalog that pins the checksum of each package, verified before the package is unpacked.',
              'A strict layout allowlist — a package may contain only a manifest, a form schema, a signature, and data, asset, and icon folders. Anything else is refused.',
              'Path-safety and symlink checks that reject traversal, absolute paths, and duplicate entries.',
              'Size caps on the archive, on each member, and on the number of members.'
            ]
          },
          { kind: 'sub', text: 'The permission model' },
          {
            kind: 'p',
            text:
              'A plugin declares which of three permissions it needs: read the current document context, create annotations, and create image assets in the workspace. The Plugin Manager lists them in plain language on the detail page before you install anything, and a generator that tries to produce something outside its declared permissions is rejected.'
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
        title: 'The Plugin Manager',
        body: [
          {
            kind: 'p',
            text:
              'Plugins are managed in their own window, with three tabs: Discover, Installed, and Updates. A detail page shows the publisher, version, requested permissions, the commands the plugin adds, the package size, whether it came bundled with the app or was downloaded, release notes, and the minimum PolyPDF version it needs.'
          },
          {
            kind: 'ul',
            items: [
              'Install, enable, disable, update, and uninstall from the same window.',
              'An update keeps the previous version on disk, so rolling back is one click on the detail page.',
              'Installing an older version over a newer one is refused.',
              'Uninstalling a plugin does not touch content it already generated — that content is part of your document, not part of the plugin.'
            ]
          },
          {
            kind: 'p',
            text:
              'The three launch plugins ship inside the app and are installed and enabled the first time you run it, so the platform works with no network connection. Checking for a newer catalog is a manual "Refresh Catalog" button rather than a background poll.'
          },
          {
            kind: 'note',
            text:
              'Discover currently lists the three first-party plugins below. There is no third-party submission process yet.'
          }
        ]
      },
      {
        icon: 'ruler',
        title: 'AISC Steel Sections',
        body: [
          {
            kind: 'p',
            text:
              'Type a designation — W12X26, L6X6X1/2, HSS8X8X1/2, PIPE6 — pick customary or metric units and an annotation scale, and PolyPDF draws the section profile onto the sheet.'
          },
          {
            kind: 'p',
            text:
              'The profile is real vector geometry, placed as a Polygon annotation rather than a pasted bitmap: it stays sharp at any zoom and prints at the size you asked for. Hollow shapes such as HSS and Pipe are drawn with their inner loop, so the wall thickness is the actual wall thickness.'
          },
          {
            kind: 'note',
            text:
              'The shipped data is a curated subset of the public tables in the AISC Shapes Database v16.0, covering the W, M, S, HP, C, MC, L, WT, HSS, HSS-Round, and Pipe families. It is a working subset, not the complete database. Verify any designation against your own reference before it drives a design decision.'
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
              'These templates are a drafting aid. The licensed professional whose name appears on a seal is responsible for confirming that its appearance, wording, and use satisfy their own licensing board — including any rules on electronic seals and on who may apply one.'
          }
        ]
      },
      {
        icon: 'map',
        title: 'PDF Maps',
        body: [
          {
            kind: 'p',
            text:
              'Enter an address, a city, or a place name, set a zoom level from world view to building level, and insert a map of it on the page. Inside PolyPDF the map stays adjustable: double-click it to pan and zoom in a small editor and save the view you want. In every other PDF viewer it is a plain image.'
          },
          {
            kind: 'p',
            text:
              'Map imagery comes from OpenStreetMap. Every generated map is drawn with the credit "© OpenStreetMap contributors" inside the image itself, so the attribution travels with the file wherever the PDF goes.'
          },
          {
            kind: 'note',
            text:
              'This is the one plugin that needs an internet connection: fetching the map requires reaching OpenStreetMap. Once the map is on the page it is a self-contained image and needs nothing further.'
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
              'Open the Discover tab and read the detail page — publisher, version, requested permissions, and the commands the plugin adds.',
              'Install it. The three launch plugins are already installed and enabled, so you can go straight to the next step.',
              'Run it from Tools ▸ Plugins, then pick the command: Insert AISC Steel Section…, Insert Professional Seal…, or Insert Map….',
              'Fill in the generator dialog. The preview panel redraws as you type, so you see the result before it touches the document.',
              'Choose Insert. The content is placed as ordinary annotations, in a single undo step — one Undo removes the whole insertion.',
              'Edit it like anything else you drew: move it, resize it, restyle it, or delete it. Nothing is locked because a plugin made it.'
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
              'The launch set is deliberately small. Three plugins are enough to prove the platform against real work: a data lookup that draws vector geometry, a template that composes an image, and a generator that reaches an outside service. Each one stressed a different part of the design.'
          },
          {
            kind: 'p',
            text:
              'If a plugin would make your week easier, tell us what it should generate and what it should ask for. Write to support@polypdf.com.'
          }
        ]
      }
    ]
  })
]);

export const blogPostBySlug = (slug) => blogPosts.find((entry) => entry.slug === slug) || null;

export const blogPostPath = (slug) => `/blog/${slug}`;
