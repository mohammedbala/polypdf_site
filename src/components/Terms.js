import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaFileContract,
  FaGavel,
  FaHandshake,
  FaLock
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon-96.png';
import { commercialOffer } from '../lib/commercialOffer';

const sections = [
  {
    icon: <FaFileContract />,
    title: 'Scope',
    content: [
      'PolyPDF is operated by Euclidean Software LLC.',
      'These terms apply to the PolyPDF website, the direct desktop downloads (macOS and Windows), and related support, licensing, and update services.',
      'By downloading, installing, purchasing, or using PolyPDF, you agree to these terms.',
      'If you do not agree, do not use the service or install the app.'
    ]
  },
  {
    icon: <FaHandshake />,
    title: 'Free and paid access',
    content: [
      'The desktop app for macOS and Windows may be offered as a free download with limited measurement usage and view-only access to some project workflows before Pro is required.',
      'PolyPDF Pro is intended to be sold as a one-time purchase rather than a recurring subscription.',
      `The current direct offer includes free markup, review, calibration, 3 hand-created measurements per document, and Revision Package viewing and navigation. The optional ${commercialOffer.price} Pro license removes that cap and unlocks PDF content editing, toolsets, overlay, Symbol Search, plugin workflows, and Revision Package creation, changes, and publishing. Direct website purchases include a 14-day money-back guarantee.`
    ]
  },
  {
    icon: <FaLock />,
    title: 'Direct purchases and license use',
    content: [
      'The current direct purchase flow is processed through Stripe and unlocked with a PolyPDF license key.',
      'A new Pro purchase grants a personal, non-transferable license to use PolyPDF 1.x perpetually on up to 3 computers (macOS or Windows), including every public PolyPDF 1.x update.',
      'Future major versions may be offered as optional paid upgrades. A purchased PolyPDF 1.x license continues to work.',
      'Purchases made before the July 30, 2026 policy cutoff are grandfathered for perpetual Pro use and all future public PolyPDF app updates.',
      'You may not resell, sublicense, share, or distribute your license key.',
      'PolyPDF may suspend or revoke a license for fraud, chargebacks, abuse, or material violation of these terms.'
    ]
  }
];

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page terms">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="96" height="96" />
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
            <h1>Terms of Use</h1>
            <p className="legal-subtitle">Terms for the PolyPDF website and direct desktop downloads</p>
            <p className="last-updated">Commercial terms version: September 9, 2026 · Website terms reviewed September 9, 2026</p>
          </div>

          <div className="legal-intro">
            <p>
              These Terms of Use are between you and Euclidean Software LLC, and govern your use
              of PolyPDF, including the PolyPDF website, the direct-download desktop applications for macOS and Windows,
              and related purchasing, licensing, support, and update services.
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
            <h2>Refunds</h2>
            <ul className="section-content">
              <li>Direct website purchases processed by Stripe include a 14-day money-back guarantee under PolyPDF's refund policy.</li>
              <li>Submit the request within 14 calendar days of the transaction date to receive a refund of the amount paid for the license to the original payment method where possible.</li>
              <li>The guarantee does not cover fraud, duplicate refund claims, chargeback abuse, or other manipulative behavior. Statutory rights that cannot be waived continue to apply.</li>
              <li>Refunded direct licenses may be suspended or revoked after the refund is completed.</li>
              <li>See the <Link to="/refund/">Refund Policy</Link> for request steps and purchase-channel details.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <div className="section-icon"><FaGavel /></div>
              <h2>Updates, support, and discontinuation</h2>
            </div>
            <ul className="section-content">
              <li>The desktop app may include in-app update delivery (Sparkle on macOS, electron-updater on Windows).</li>
              <li>Founder licenses include every public PolyPDF 1.x update. Grandfathered legacy purchases include all future public PolyPDF app updates.</li>
              <li>The Founder offer has ended. Existing Founder licenses retain their perpetual 1.x use and included 1.x updates.</li>
              <li>Future features, future OS compatibility, and continued operation of online services are not guaranteed.</li>
              <li>If PolyPDF stops operating, already-downloaded software may keep working to the extent technically possible, but ongoing online services, new downloads, and reactivation are not guaranteed.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Acceptable use</h2>
            <ul className="section-content">
              <li>You must not use PolyPDF for illegal, fraudulent, or abusive activity.</li>
              <li>You remain responsible for the documents and data you process with the app.</li>
              <li>You are responsible for confirming sheet identity, revision status, carried review work, references, detected changes, quantities, costs, and published outputs before relying on a Revision Package as a project record.</li>
              <li>You must respect the intellectual property rights of others when using the app.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Disclaimers and limitation of liability</h2>
            <ul className="section-content">
              <li>PolyPDF is provided on an “as is” and “as available” basis.</li>
              <li>OCR, sheet recognition, visual comparison, quantity or cost impact, reference review, preflight, and other automated results are assistive and require qualified human review.</li>
              <li>Collaboration is a beta workflow that depends on a customer-managed host and file share; availability, network continuity, and organizational access controls remain the customer’s responsibility.</li>
              <li>To the maximum extent allowed by law, PolyPDF disclaims implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.</li>
              <li>To the maximum extent allowed by law, PolyPDF is not liable for indirect, incidental, special, consequential, or punitive damages.</li>
              <li>Subject to the non-excludable rights below and only to the extent permitted by applicable law, PolyPDF’s total liability under these terms is limited to the amount you paid for the applicable purchase.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Consumer rights and professional responsibility</h2>
            <p>Nothing in these terms excludes or limits rights, warranties, remedies or liabilities that applicable law does not allow to be excluded or limited. This includes liability for fraud or fraudulent misrepresentation, death or personal injury caused by negligence where applicable, and mandatory consumer protections for digital content. Any limitation above applies only where lawful.</p>
            <p>PolyPDF assists document work; it does not provide architectural, engineering, surveying, legal or other professional advice. Verify scale, measurements, quantities, revisions, signatures, redaction and exported results before relying on them. You retain ownership of your documents and responsibility for authorised use and backups.</p>
          </section>
          <section className="legal-section">
            <h2>Website purchases, privacy and changes</h2>
            <p>Before continuing to payment, review the offer, these terms and the <Link to="/refund/">Refund Policy</Link>. The final amount and applicable taxes appear in Stripe checkout before payment. Your payment confirmation and license email record the purchase. Website cookie choices are separate from acceptance of purchase terms.</p>
            <p>Our <Link to="/privacy/">Privacy Policy</Link> explains data handling. The <Link to="/cookies/">Cookie Policy</Link> explains optional tracking, and our <Link to="/accessibility/">Accessibility page</Link> provides help if you cannot use the site.</p>
            <p>Website terms may change prospectively, with notice where required. A later update does not reduce the perpetual license grant, included updates, refund rights or other rights already acquired with your purchase. If a provision is unenforceable, the remaining provisions apply to the extent permitted by law.</p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>Questions for Euclidean Software LLC about these terms can be sent to:</p>
            <div className="contact-info">
              <a href="mailto:support@polypdf.com" className="contact-link">support@polypdf.com</a>
            </div>
          </section>
        </div>
      </motion.main>

    </div>
  );
};

export default Terms;
