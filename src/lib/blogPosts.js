import aiscGeneratorScreenshot from '../assets/screenshots/plugins-aisc-w24x55-generator-v1-4-dark-web.png';
import aiscResultScreenshot from '../assets/screenshots/plugins-aisc-w24x55-result-v1-4-dark-web.png';
import mutcdStopScreenshot from '../assets/screenshots/mutcd-r1-1-stop-v1-4-dark-web.png';
import pluginSidebarScreenshot from '../assets/screenshots/plugins-sidebar-v1-4-dark-web.png';
import collaborationBetaScreenshot from '../assets/screenshots/collaboration-beta-live-v1-4-3-web.png';
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
//   { kind: 'figure', src, alt, caption }  a captioned product screenshot
//   { kind: 'table',  headers, rows }      an accessible comparison/reference table
//   { kind: 'formula', label, formula }    a worked calculation with an explanation
//   { kind: 'link', href, label, text? }   a resource link with optional supporting copy
//
// `icon` names map to react-icons in BlogPost.js. Add the name there before using a new one.

const post = (entry) => Object.freeze(entry);

const pluginSidebarCaption =
  'The Plugins sidebar in PolyPDF 1.4.0, listing the three generators that come with the app: AISC Steel Sections, PDF Maps, and Professional Seal Maker. The page behind it is a blank sample sheet, and the Polygon tool is selected so its Line, Fill, and Hatch style controls stay visible.';

const productPosts = Object.freeze([
  post({
    slug: 'how-to-use-polypdf-collaboration-beta',
    title: 'How to Use PolyPDF Collaboration (Beta)',
    date: '2026-08-27',
    dateLabel: 'August 27, 2026',
    dateModified: '2026-08-27',
    author: 'The PolyPDF team',
    readingTime: '9 min read',
    tag: 'Beta guide',
    excerpt:
      'PolyPDF Collaboration keeps the PDF on your company share while approved Mac and Windows users exchange live markups, cursors, offline edits, and signed history through a customer-owned host.',
    metaTitle: 'How to Use PolyPDF Collaboration Beta',
    metaDescription:
      'Set up PolyPDF Collaboration Beta on a company file share, approve Mac and Windows users, sync markups, resolve conflicts, and restore signed history.',
    keywords: [
      'PDF collaboration on company server',
      'self-hosted PDF collaboration',
      'shared PDF markup Mac Windows',
      'PolyPDF Collaboration Beta'
    ],
    lede:
      'Collaboration Beta lets approved Mac and Windows users work in the same shared PDF without uploading the drawing to a PolyPDF cloud account. This guide covers the company host, first connection, daily workflow, and beta safeguards.',
    quickAnswer:
      'Install the customer-owned Collaboration Host on your private network, mount the same company PDF share on each computer, and give employees the nonsecret company connection file. The first Owner enrolls with a single-use invitation and approves later devices as Owner, Editor, or Viewer. Approved users open the same PDF to exchange live cursors and markup transactions; short offline interruptions queue encrypted changes for ordered replay.',
    lastVerified: '2026-08-27',
    productVersion: 'PolyPDF 1.4.3 (build 20) Collaboration Beta',
    platforms: 'macOS and Windows clients; Windows Server 2022 host',
    heroImage: {
      src: collaborationBetaScreenshot,
      alt: 'PolyPDF Collaboration Beta settings over a sample drawing, with company connection, mounted share, signed history, and conflict center sections',
      caption:
        'The Collaboration Beta setup in PolyPDF 1.4.3: connect a device to the customer-owned host, mount the company share, review signed history, and resolve offline conflicts.',
      width: 1224,
      height: 768
    },
    sections: [
      {
        icon: 'shield',
        title: 'What customer-owned collaboration means',
        body: [
          {
            kind: 'p',
            text:
              'The PDF stays on the file share your company already controls. Each employee opens that shared file through their normal mounted path — for example, /Volumes/Projects on a Mac or Z:\\Projects on Windows. A small Collaboration Host on your network approves devices, orders markup changes, signs history, and coordinates saves.'
          },
          {
            kind: 'p',
            text:
              'PolyPDF does not host the drawing or require a PolyPDF cloud account. The host stores collaboration records in a protected hidden folder beside the company share. Ordinary users should have normal PDF access but must not be able to modify that hidden collaboration folder directly.'
          },
          {
            kind: 'note',
            text:
              'This is a beta. Start with a pilot folder and backed-up copies of real project PDFs. Keep the Collaboration Host on a private company network or VPN; do not expose its port directly to the public internet.'
          }
        ]
      },
      {
        icon: 'plug',
        title: '1. Have an administrator install the company host',
        body: [
          {
            kind: 'p',
            text:
              'The normal beta path is the Windows Server installer. It creates the host identity and pinned TLS certificate, registers an automatic Windows service, applies local-share permissions, and produces the two files used to enroll employees.'
          },
          {
            kind: 'link',
            href: '/downloads/collaboration/PolyPDF-Collaboration-Host-Setup.exe',
            label: 'Download the Windows Server Collaboration Host (Beta)',
            text: 'Run it as an administrator on Windows Server 2022.'
          },
          { kind: 'sub', text: 'The installer produces two different files' },
          {
            kind: 'ul',
            items: [
              'PolyPDF-company-connection.json is safe to distribute to employees. It identifies the host and pins its certificate and signing key.',
              'PolyPDF-owner-bootstrap.invitation.json is secret and single-use. Give it only to the person who will enroll the first Owner, then delete it after that Owner connects.'
            ]
          },
          {
            kind: 'link',
            href: 'mailto:support@polypdf.com?subject=PolyPDF%20Collaboration%20Beta%20%E2%80%94%20Linux%20host',
            label: 'Ask about the Ubuntu / Docker host',
            text: 'Linux host packaging is available for managed beta pilots.'
          }
        ]
      },
      {
        icon: 'steps',
        title: '2. Connect the first Owner',
        body: [
          {
            kind: 'ol',
            items: [
              'Install PolyPDF 1.4.3 or newer on the Owner’s Mac or Windows computer and mount the company PDF share.',
              'Open a PDF, then click Collaboration off in the title bar.',
              'Turn on Enable collaboration and enter the Owner’s display name.',
              'Open PolyPDF-company-connection.json in a text editor and paste its full JSON into Company connection file.',
              'Enter the local mounted-share path in Mounted company share. Paths can differ by computer as long as they point to the same share.',
              'From the private Owner invitation, paste only the bootstrapToken value into Single-use Owner invitation.',
              'Choose Test host. When the connection succeeds, choose Save and connect.'
            ]
          },
          {
            kind: 'note',
            text:
              'The first Owner invitation is a recovery-sensitive credential. Do not email it to the whole team, store it beside the public connection file, or reuse it for later employees.'
          }
        ]
      },
      {
        icon: 'steps',
        title: '3. Add Editors and Viewers',
        body: [
          {
            kind: 'p',
            text:
              'Every additional user follows the same connection steps but leaves the Owner invitation blank. Their status changes to Approval pending. The Owner opens the Collaboration panel, finds the request under Members, and approves the device as an Owner, Editor, or Viewer.'
          },
          {
            kind: 'ul',
            items: [
              'Owner: approves or revokes devices, restores signed history, and handles externally replaced PDFs.',
              'Editor: adds and changes shared markups and participates in controlled saves.',
              'Viewer: joins the room and sees live activity without publishing markup changes.'
            ]
          },
          {
            kind: 'p',
            text:
              'Approval belongs to that device key, not just a typed name. If a laptop is lost or leaves the company, an Owner can revoke it from Members and the host disconnects it.'
          }
        ]
      },
      {
        icon: 'document',
        title: '4. Open the same PDF and work normally',
        body: [
          {
            kind: 'figure',
            src: collaborationBetaScreenshot,
            alt: 'PolyPDF Owner and Editor clients showing synchronized review markups and remote cursors',
            caption:
              'Both clients opened the same share-relative PDF. Independent markups synchronized, and each client identifies the other person’s authenticated cursor.',
            width: 1710,
            height: 962
          },
          {
            kind: 'p',
            text:
              'When approved users open the same PDF from the configured share, the title-bar status changes from Collaboration ready to Live · 2 (or the current participant count). Remote pointers appear over the page with each person’s name, and accepted markup changes arrive without passing the PDF file back and forth.'
          },
          {
            kind: 'p',
            text:
              'Collaboration covers the review workspace: annotations, layers, spaces, scale regions, measurement settings, custom fields, and Markups-list state. Forms, signatures, attachments, page structure, and underlying PDF content remain outside the live collaboration record.'
          }
        ]
      },
      {
        icon: 'sparkle',
        title: '5. Keep working through a network interruption',
        body: [
          {
            kind: 'p',
            text:
              'If the VPN or host connection drops, the status changes to Offline and shows how many encrypted changes are queued on that computer. Continue marking up the drawing. After the connection returns, PolyPDF authenticates again and submits the queued transactions in order.'
          },
          {
            kind: 'note',
            text:
              'Offline support protects short interruptions; it is not a substitute for backups or a long-lived disconnected branch. Reconnect and confirm the queue reaches zero before closing out a review session.'
          }
        ]
      },
      {
        icon: 'compare',
        title: '6. Resolve a same-markup conflict',
        body: [
          {
            kind: 'p',
            text:
              'Independent markups merge normally. A conflict is raised only when two offline branches changed the same markup version. Click the conflict count in the title bar and open Conflict Center. For each conflict, choose Use server version or Create mine as a copy.'
          },
          {
            kind: 'p',
            text:
              'Create mine as a copy preserves the local work as a separate markup instead of silently overwriting someone else. PolyPDF does not guess which same-object edit was intended.'
          }
        ]
      },
      {
        icon: 'document',
        title: '7. Save the shared PDF',
        body: [
          {
            kind: 'p',
            text:
              'Live markup history and the PDF bytes are separate until someone saves. When an approved user chooses Save, the host grants one exclusive save lease, brings that client to the latest accepted state, and records the sequence embedded in the PDF. A second simultaneous save waits or is refused instead of racing the same file.'
          },
          {
            kind: 'p',
            text:
              'Save As creates a new file and detaches the original collaboration room. Opening that new shared file creates its own collaboration identity and history.'
          }
        ]
      },
      {
        icon: 'shield',
        title: '8. Use signed history and handle outside changes',
        body: [
          {
            kind: 'p',
            text:
              'The Collaboration panel lists accepted transactions with sequence number, author, time, and a host signature. An Owner can restore an earlier sequence. Restore is recorded as a new compensating transaction, so later history is not erased or rewritten.'
          },
          {
            kind: 'p',
            text:
              'If another program replaces the shared PDF outside a controlled PolyPDF save, the room pauses instead of applying history to bytes it no longer recognizes. An Owner must inspect the file and either acknowledge the outside change or relink the room to the correct share-relative PDF.'
          }
        ]
      },
      {
        icon: 'sparkle',
        title: 'What we need from beta teams',
        body: [
          {
            kind: 'p',
            text:
              'Tell us about confusing enrollment steps, VPN and sleep/wake behavior, conflicts that do not explain themselves, and file-server environments that are difficult to configure. Include the operating systems, host platform, and exact status message — never send a confidential drawing unless your organization has approved it.'
          },
          {
            kind: 'link',
            href: 'mailto:support@polypdf.com?subject=PolyPDF%20Collaboration%20Beta%20feedback',
            label: 'Send Collaboration Beta feedback',
            text: 'Email support@polypdf.com.'
          }
        ]
      }
    ],
    faqs: [
      {
        question: 'Does PolyPDF upload collaboration PDFs to the cloud?',
        answer:
          'No. The PDF stays on the customer’s mounted company share. A customer-owned host on the private network authenticates devices, signs transaction history, coordinates saves, and stores collaboration records.'
      },
      {
        question: 'Can Mac and Windows users collaborate on the same PDF?',
        answer:
          'Yes. Each computer may use a different local mount path, but both paths must resolve to the same configured company share and share-relative PDF.'
      },
      {
        question: 'What happens when two people edit the same markup offline?',
        answer:
          'PolyPDF opens Conflict Center and asks the user to keep the server version or preserve the local edit as a separate copied markup. It does not silently choose a winner.'
      }
    ],
    relatedSlugs: [
      'pdf-markup-table-rfi-punch-list',
      'prepare-issued-pdf-set'
    ],
    cta: {
      body:
        'Install the latest PolyPDF update on each client, then pilot Collaboration Beta on a private company network with backed-up project files.',
      primaryHref: 'https://www.polypdf.com/downloads/collaboration/PolyPDF-Collaboration-Host-Setup.exe',
      primaryLabel: 'Download the beta host',
      secondaryHref: 'mailto:support@polypdf.com?subject=PolyPDF%20Collaboration%20Beta',
      secondaryLabel: 'Contact support'
    }
  }),
  post({
    slug: 'introducing-polypdf-plugins',
    title: 'Introducing PolyPDF Plugins',
    date: '2026-08-07',
    dateLabel: 'August 7, 2026',
    dateModified: '2026-08-24',
    author: 'The PolyPDF team',
    readingTime: '9 min read',
    tag: 'Product',
    excerpt:
      'How PolyPDF Pro plugins work: declarative packages, one-list management, sideload consent, host-owned generators, and the three generators that come with the app.',
    metaTitle: 'PolyPDF Plugins: How They Work',
    metaDescription:
      'How PolyPDF Pro plugins handle declarative packages, permissions, sideload consent, and the steel-section, seal, and map generators included with the app.',
    keywords: [
      'PolyPDF plugins',
      'signed PDF plugin packages',
      'AISC steel section PDF',
      'professional seal PDF',
      'PDF map plugin'
    ],
    lede:
      'Plugins add content generators without executing downloaded plugin JavaScript. This article walks through the interface and the three generators included with PolyPDF Pro.',
    quickAnswer:
      'PolyPDF plugins are Pro workflows built from declarative packages rather than executable-code extensions. PolyPDF renders their forms and runs a fixed host-owned generator against bounded data or sanitized artwork. Three generators come with the app and are enabled on first run: AISC Steel Sections draws steel section profiles as vector geometry, Professional Seal Maker composes a seal graphic from a jurisdiction template, and PDF Maps places a map image for an address or place name.',
    lastVerified: '2026-08-24',
    productVersion: 'PolyPDF 1.4.1 (build 18); screenshots from 1.4.0 (build 17)',
    platforms: 'macOS and Windows',
    heroImage: {
      src: pluginSidebarScreenshot,
      alt: 'The PolyPDF Plugins sidebar listing AISC Steel Sections, PDF Maps, and Professional Seal Maker beside a blank sample sheet',
      caption: pluginSidebarCaption,
      width: 1710,
      height: 1073
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
          },
          {
            kind: 'note',
            text:
              'Current access: installing, running, and editing plugin content requires PolyPDF Pro in version 1.4.1. Content already placed on a PDF remains ordinary document content.'
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
              'Plugins are managed in one Plugins window, which shows a single list of the packages PolyPDF carries and any you installed yourself. A detail page shows publisher, installed version, permissions, commands, compatibility, package source and size, release notes when present, and whether the plugin is enabled.'
          },
          {
            kind: 'ul',
            items: [
              'Enable, disable, uninstall, and roll back an available previous version from the same window.',
              'Install from File… opens a consent review for a package the user deliberately selected, including its source, signer, permissions, and downgrade or reinstall context.',
              'A consented sideload can reinstall the same version or install an older one; the review screen tells you which is about to happen before you approve it.',
              'Uninstalling a plugin does not touch content it already generated — that content is part of your document, not part of the plugin.'
            ]
          },
          {
            kind: 'p',
            text:
              'PolyPDF carries three first-party generators and enables them on first run. “Check for updates” appears only when a build has an update source configured; the ordinary shipping configuration has no Discover, Installed, or Updates tabs and no catalog-refresh action.'
          },
          {
            kind: 'note',
            text:
              'There is no marketplace or public submission directory. Install from File… is the explicit path for a user-chosen third-party package, and its consent screen distinguishes that package from software PolyPDF supplied.'
          },
          {
            kind: 'figure',
            src: pluginSidebarScreenshot,
            alt: 'The PolyPDF Plugins sidebar with three first-party generators listed next to a blank sample PDF sheet',
            caption: pluginSidebarCaption,
            width: 1710,
            height: 1073
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
              'Type a supported designation — for example W24X55, L6X6X1/2, HSS8X8X1/2, or PIPE6 — pick customary or metric units and an annotation scale, and PolyPDF draws the section profile onto the sheet.'
          },
          {
            kind: 'p',
            text:
              'The profile is real vector geometry, placed as a Polygon annotation rather than a pasted bitmap: it stays sharp at any zoom and prints at the size you asked for. Hollow shapes such as HSS and Pipe are drawn with their inner loop, so the wall thickness is the actual wall thickness.'
          },
          {
            kind: 'note',
            text:
              'AISC Steel Sections draws section profiles. It performs no capacity, code, or design checks. The bundled data is a curated 57-shape subset across the W, M, S, HP, C, MC, L, WT, HSS, HSS-Round, and Pipe families rather than the complete database, so check any designation against an authoritative reference before it drives a design decision.'
          },
          {
            kind: 'figure',
            src: aiscGeneratorScreenshot,
            alt: 'PolyPDF AISC Steel Sections generator configured for a W24 by 55 profile in customary units with a blue 2 point line',
            caption:
              'The AISC Steel Sections generator is configured for W24×55 in customary units at 1 inch = 1 foot, with a 2 pt blue line. The live preview shows that profile before insertion.',
            width: 1710,
            height: 1073
          },
          {
            kind: 'figure',
            src: aiscResultScreenshot,
            alt: 'A selected blue W24 by 55 steel profile inserted as vector geometry on a sample PolyPDF sheet',
            caption:
              'After Insert, the W24×55 profile lands on the sheet as a blue 2 pt Polygon annotation. It is selected here, so it can be moved, resized, restyled, or deleted like any other markup.',
            width: 1710,
            height: 1073
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
              'A seal from Seal Maker is graphic artwork, not a cryptographic digital signature. PolyPDF does not check license status and does not confirm that a template matches your board\'s current requirements. The licensed professional whose name appears on a seal remains responsible for its appearance, wording, and use.'
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
              'Enter an address, city, or place name, set a zoom level from world view to building level, and insert a map image on the page. Inside PolyPDF the result stays adjustable: double-click it to pan and zoom in a small editor and save the view. In other PDF viewers it is a plain image.'
          },
          {
            kind: 'p',
            text:
              'Place searches are geocoded through Nominatim at openstreetmap.org. The image itself is rendered from OpenFreeMap vector tiles using the OpenMapTiles schema. PolyPDF bakes “OpenFreeMap © OpenMapTiles Data from OpenStreetMap” into the generated image—or a shorter layout form when space requires it—so the credit travels with the PDF.'
          },
          {
            kind: 'note',
            text:
              'PDF Maps needs an internet connection while it resolves a place and renders OpenFreeMap tiles. Once inserted, the result is a self-contained image annotation that stays with the PDF.'
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
              'MUTCD signs are not plugins. They are built into PolyPDF as Toolsets. The Regulatory chest contains 435 sign cards; choosing R1-1 Stop and placing it creates an image annotation that can be moved, resized, or deleted like other page content.'
          },
          {
            kind: 'p',
            text:
              'The example below runs that browsing-and-placement workflow on a sample traffic-control sheet. Sign artwork comes from the FHWA Standard Highway Signs 2024 release.'
          },
          {
            kind: 'figure',
            src: mutcdStopScreenshot,
            alt: 'The PolyPDF MUTCD Regulatory chest open beside a selected R1-1 Stop sign placed on a sample traffic-control sheet',
            caption:
              'MUTCD signs are a built-in Toolset rather than a plugin: the Regulatory chest stays open on the R1-1 Stop card while the placed sign sits selected on the sheet, ready to move or resize.',
            width: 1710,
            height: 1073
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
              'For a package you obtained yourself, choose Install from File… and review its signer, source, permissions, and reinstall or downgrade warning before consenting. The three generators pictured here are already installed.',
              'Run a plugin from Tools ▸ Plugins, then pick its command: Insert AISC Steel Section…, Insert Professional Seal…, or Insert Map….',
              'Fill in the generator dialog. The preview panel redraws as you type, so you see the result before it touches the document.',
              'Choose Insert. The content is placed as ordinary annotations, in a single undo step — one Undo removes the whole insertion.',
              'Use the editing operations supported by that annotation type. A vector profile can be moved, resized, restyled, or deleted; image-based output can be moved, resized, or deleted.'
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
              'The first three generators are deliberately unalike: a data lookup that draws vector geometry, a template that composes an image, and a generator that reaches outside services. Each one tells us something different about what the package format has to support next.'
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
        question: 'Do PolyPDF plugins require Pro?',
        answer:
          'Yes. Installing, running, and editing plugin content requires PolyPDF Pro in version 1.4.1. The three first-party plugin packages still ship with the app, and previously inserted content stays in the document.'
      },
      {
        question: 'Do PolyPDF plugins run downloaded code?',
        answer:
          'No. A plugin supplies signed data, artwork, and a declarative form schema. PolyPDF renders the form and runs one of its own built-in generators; plugin JavaScript is not evaluated.'
      },
      {
        question: 'Does a PolyPDF plugin need an internet connection?',
        answer:
          'AISC Steel Sections and Professional Seal Maker use bundled data and artwork, so they work offline. PDF Maps needs a connection while a place is resolved and OpenFreeMap/OpenMapTiles data is rendered; the inserted result is then stored as a self-contained image annotation.'
      },
      {
        question: 'What happens to inserted content if I uninstall a plugin?',
        answer:
          'Inserted content remains in the document as ordinary annotations. Uninstalling the generator does not remove the steel profile, seal graphic, or map image it already created.'
      },
      {
        question: 'Are the MUTCD sign chests PolyPDF plugins?',
        answer:
          'No. MUTCD signs are built-in Toolsets. Plugins generate new content from signed packages; the sign chests are bundled reference libraries you browse and place.'
      },
      {
        question: 'Which plugins come with PolyPDF?',
        answer:
          'AISC Steel Sections, Professional Seal Maker, and PDF Maps are included with the app and enabled on first run. There is no marketplace, so Install from File… is the path for any package you obtained yourself.'
      }
    ],
    sources: [
      {
        label: 'FHWA — Standard Highway Signs 2024 release status',
        url: 'https://mutcd.fhwa.dot.gov/kno-shs_2024-release-status/index.htm',
        note: 'Official source for the sign artwork in the MUTCD Toolset.'
      },
      {
        label: 'OpenFreeMap',
        url: 'https://openfreemap.org/',
        note: 'The vector-tile service used by the PDF Maps renderer.'
      },
      {
        label: 'OpenMapTiles',
        url: 'https://openmaptiles.org/',
        note: 'The vector-tile schema and attribution named in generated maps.'
      },
      {
        label: 'OpenStreetMap Foundation — Nominatim usage policy',
        url: 'https://operations.osmfoundation.org/policies/nominatim/',
        note: 'Usage policy for the public geocoding service behind place search.'
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
