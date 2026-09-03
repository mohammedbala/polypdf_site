import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaEnvelope,
  FaLightbulb,
  FaLock,
  FaRegClock
} from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';

export const FEATURE_REQUEST_EMAIL_URL =
  'mailto:support@polypdf.com?subject=PolyPDF%20feature%20request&body=Platform%20(macOS%20or%20Windows)%3A%0A%0AWorkflow%20I%27m%20trying%20to%20improve%3A%0A%0AWhat%20would%20make%20it%20easier%3A%0A%0ACurrent%20workaround%3A%0A';

const shippedRequests = [
  'Measurement depth for linear and area takeoffs',
  'Area cutouts for openings and exclusions',
  'Add or remove vertices on areas and paths',
  'Editable hatch patterns and scale',
  'Multiple callout shapes',
  'Movable callout connection points'
];

const steps = [
  {
    number: '01',
    title: 'Describe the job',
    body: 'Tell us what you are trying to accomplish on the drawing and what slows you down today.'
  },
  {
    number: '02',
    title: 'We review the fit',
    body: 'We check the request against PolyPDF’s local-first workflow and look for the simplest useful solution.'
  },
  {
    number: '03',
    title: 'Hear back directly',
    body: 'PolyPDF Support replies by email if we need an example, clarification, or have a useful update.'
  }
];

const FeatureRequests = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="feature-requests-page">
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

      <main className="feature-request-main">
        <section className="feature-request-hero container">
          <motion.div
            className="feature-request-intro"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="feature-request-kicker"><FaLightbulb /> Feature requests</div>
            <h1>Help shape the next PolyPDF update.</h1>
            <p>
              Send the drawing workflow you want to improve directly to PolyPDF Support and see
              how recent customer requests made it into a release.
            </p>
            <div className="feature-request-actions">
              <a className="primary-btn large" href={FEATURE_REQUEST_EMAIL_URL}>
                <FaEnvelope /> Email a request
              </a>
              <a className="secondary-btn large" href="#request-guide">
                What to include <FaArrowRight />
              </a>
            </div>
            <p className="feature-request-account-note">
              No account, public post, or forum sign-in required.
            </p>
          </motion.div>

          <motion.aside
            className="request-ledger"
            aria-label="Feature request status examples"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="request-ledger-heading">
              <span>Request snapshot</span>
              <span className="request-ledger-live">Product notes</span>
            </div>
            <div className="request-ledger-row">
              <span className="request-ledger-marker open" aria-hidden="true"><FaRegClock /></span>
              <span>
                <small>Under review</small>
                <strong>Cloud in the Line Type menu</strong>
              </span>
            </div>
            <div className="request-ledger-row shipped">
              <span className="request-ledger-marker" aria-hidden="true"><FaCheck /></span>
              <span>
                <small>Shipped in 1.3.4</small>
                <strong>Area cutouts and vertex editing</strong>
              </span>
            </div>
            <div className="request-ledger-row shipped">
              <span className="request-ledger-marker" aria-hidden="true"><FaCheck /></span>
              <span>
                <small>Shipped in 1.3.4</small>
                <strong>Callout shapes and connection points</strong>
              </span>
            </div>
          </motion.aside>
        </section>

        <section id="request-guide" className="feature-request-process container" aria-labelledby="request-process-title">
          <div className="feature-request-section-heading">
            <span>How it works</span>
            <h2 id="request-process-title">A request should start with the work.</h2>
          </div>
          <div className="feature-request-steps">
            {steps.map((step) => (
              <article className="feature-request-step" key={step.number}>
                <span className="feature-request-step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-request-evidence container" aria-labelledby="recently-shipped-title">
          <div className="feature-request-shipped-copy">
            <span className="feature-request-label">Shipped request examples</span>
            <h2 id="recently-shipped-title">These customer requests became product features.</h2>
            <p>
              These came in as customer requests and shipped in 1.3.4. They are on both Mac and
              Windows today, and the cloud line type is still on the list.
            </p>
            <Link to="/versions/" className="feature-request-text-link">
              Browse the complete version history <FaArrowRight />
            </Link>
          </div>
          <ul className="feature-request-shipped-list">
            {shippedRequests.map((request) => (
              <li key={request}><FaCheck aria-hidden="true" /> <span>{request}</span></li>
            ))}
          </ul>
        </section>

        <section className="feature-request-privacy container" aria-labelledby="request-privacy-title">
          <div className="feature-request-privacy-icon" aria-hidden="true"><FaLock /></div>
          <div>
            <span className="feature-request-label">Keep private work private</span>
            <h2 id="request-privacy-title">What belongs in the email?</h2>
            <p>
              Describe the workflow first. Do not include license keys or confidential drawings in
              the initial request; PolyPDF Support will ask if a sanitized example would help.
            </p>
          </div>
          <a className="secondary-btn" href="mailto:support@polypdf.com">
            <FaEnvelope /> Email support
          </a>
        </section>
      </main>

    </div>
  );
};

export default FeatureRequests;
