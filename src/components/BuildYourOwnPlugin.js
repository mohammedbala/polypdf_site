import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
  FaCompass,
  FaFileCode,
  FaKey,
  FaPuzzlePiece,
  FaShieldAlt,
  FaTerminal
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

// Reuses the .legal-page shell (like Support and the blog) so the page inherits the site's card
// treatment, type scale and scroll animation. The two code blocks carry inline styles rather than
// new classes: this page should drop into the site without an App.css edit.
const codeBlockStyle = {
  margin: '1rem 0 0',
  padding: '1rem 1.15rem',
  borderRadius: '10px',
  background: 'var(--gray-900)',
  color: '#f4f2ec',
  fontSize: '0.86rem',
  lineHeight: 1.7,
  overflowX: 'auto',
  whiteSpace: 'pre'
};

const treeStyle = {
  ...codeBlockStyle,
  background: 'var(--accent-soft)',
  color: 'var(--gray-900)'
};

const sections = [
  {
    icon: <FaPuzzlePiece />,
    title: 'A plugin is data, not a program',
    content: [
      'A PolyPDF plugin is a signed folder of artwork and JSON. There is no JavaScript entry point and nothing in the package is ever executed.',
      'Your package supplies a symbol catalogue, the SVG artwork for it, and a form described in JSON. PolyPDF renders the form, runs its own generator, and adds the result to the drawing as ordinary markups in a single undoable step.',
      'The trade is deliberate: you give up arbitrary behaviour, and in exchange your plugin cannot leak a customer’s drawings, cannot break their app, and needs no review process before anyone can safely install it.'
    ]
  },
  {
    icon: <FaCompass />,
    title: 'What people build with it',
    content: [
      'North arrows matched to a sheet’s true north, revision triangles, room and equipment tags, detail markers, welding symbols, ADA and fire-safety symbols, utility callouts — an office’s own standard symbol set, stamped at the right printed size every time.',
      'Symbols are placed at a size in inches, keep their drawn proportions, rotate, and can carry a caption — underneath for a north arrow, inside the shape for a revision number or a room number.',
      'Once placed they are normal markups: selectable, movable, styleable, exportable, and still there if the plugin is later switched off or removed.'
    ]
  },
  {
    icon: <FaShieldAlt />,
    title: 'What a plugin can never do',
    content: [
      'Run code. No JavaScript, no WASM, no native library.',
      'Reach the network. No requests, of any kind, ever — artwork carrying an external reference is refused at install time precisely so a symbol cannot phone home when a sheet is opened.',
      'Read your documents. A plugin is told the page size, rotation and where you clicked. Not the text, not the markups, not the file name, not the PDF bytes.',
      'Touch your files, see your licence details, change an existing markup, or save anything.',
      'This is architectural, not a policy we promise to enforce: there is no API for any of it.'
    ]
  }
];

const BuildYourOwnPlugin = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page build-a-plugin">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
        </nav>
      </header>

      <motion.main
        className="legal-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <div className="legal-hero">
            <h1>Build your own plugin</h1>
            <p className="legal-subtitle">
              Add your office’s symbols to PolyPDF. No code, no marketplace, no approval queue.
            </p>
            <p className="last-updated">Requires PolyPDF 1.3.1 or newer</p>
          </div>

          <div className="legal-intro">
            <p>
              If your team stamps the same north arrow, revision triangle or room tag onto every
              sheet, you can package that set yourself and hand it to your colleagues as a single
              file. It takes a text editor, a drawing tool, and Node.
            </p>
          </div>

          <div className="legal-sections">
            {sections.map((section, index) => (
              <motion.section
                key={section.title}
                className="legal-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="section-header">
                  <div className="section-icon">{section.icon}</div>
                  <h2>{section.title}</h2>
                </div>
                <ul className="section-content">
                  {section.content.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaBoxOpen /></div>
              <h2>What you write</h2>
            </div>
            <p>
              A plugin is a folder. The manifest describes what it is and what it adds to the Tools
              menu; the catalogue lists your symbols and their printed sizes; the assets are plain
              SVG files.
            </p>
            <pre style={treeStyle}>{`my-plugin/
  manifest.json          identity, permissions, commands, the form
  data/symbols.json      each symbol: id, label, artwork, size in inches
  assets/*.svg           the artwork
  icons/icon.png         optional, 256 x 256`}</pre>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaTerminal /></div>
              <h2>How you build it</h2>
            </div>
            <p>
              One file, no dependencies, Node 18 or newer. It validates the whole package before it
              writes anything — layout, manifest, permission names, your catalogue, and whether
              your artwork is acceptable — and names the file and the fix for anything wrong.
            </p>
            <pre style={codeBlockStyle}>{`curl -O https://www.polypdf.com/plugins/polypdf-plugin-pack.mjs

node polypdf-plugin-pack.mjs keygen --out ~/.polypdf-keys
node polypdf-plugin-pack.mjs pack my-plugin --key ~/.polypdf-keys/polypdf-plugin-key.pem`}</pre>
            <p style={{ marginTop: '1rem' }}>
              Then install it in PolyPDF: <strong>Plugins… ▸ Install from File</strong>.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaKey /></div>
              <h2>About that signature</h2>
            </div>
            <p>
              You sign with a key you generate, and PolyPDF is careful about what that means —
              both to you and to the people you send the file to.
            </p>
            <ul className="section-content">
              <li>
                It proves the package has not been altered since you built it, and it pins your
                plugin to your key: an update signed by anyone else is refused.
              </li>
              <li>
                It does not mean PolyPDF reviewed or approved your plugin. Plugins included with the
                app carry PolyPDF’s own signature; yours is a separate, clearly-labelled tier.
              </li>
              <li>
                Anyone installing your plugin sees a consent screen first: what it can do in plain
                language, your key’s fingerprint, and the package checksum. Its row in the Plugin
                Manager says <em>Installed from a file</em> for as long as it is installed.
              </li>
              <li>
                Back up your private key. Because installs are pinned to it, a lost key means your
                users must uninstall before they can take your next release.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaFileCode /></div>
              <h2>The full guide</h2>
            </div>
            <p>
              The complete reference — every manifest field, the package format, the artwork
              rules, versioning, distribution and a troubleshooting section — ships with PolyPDF
              at <code>docs/plugins/PLUGIN-AUTHORING.md</code>, alongside a worked example plugin you
              can build and install in about a minute.
            </p>
            <p style={{ marginTop: '1rem' }}>
              There is no marketplace. A plugin file is the distribution: put it on your intranet,
              in a release, or in an email. Publish its checksum and your key fingerprint next to
              the download and anyone can verify they got your file and not somebody else’s.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaCheckCircle /></div>
              <h2>Questions</h2>
            </div>
            <p>
              If the runtime cannot express the drawing task you have in mind, say so rather than
              working around it — new runtimes ship with the app, and knowing what people
              actually need is how the next one gets chosen.
            </p>
            <div className="contact-info">
              <Link to="/support" className="contact-link">
                <FaPuzzlePiece /> Contact support
              </Link>
            </div>
          </section>
        </div>
      </motion.main>

      <footer className="legal-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2026 PolyPDF. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/support">Support</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BuildYourOwnPlugin;
