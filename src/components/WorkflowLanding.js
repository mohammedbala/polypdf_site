import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaInfinity, FaPlayCircle, FaVolumeUp } from 'react-icons/fa';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';
import DownloadCTA from './DownloadCTA';
import { buyPath, captureAttribution } from '../lib/attribution';
import { trackEvent } from '../lib/analytics';
import { commercialOffer, founderRightsText } from '../lib/commercialOffer';
import { useCommercialOffer } from '../lib/useCommercialOffer';
import { captionTrackUrl } from '../lib/workflowCaptions';
import './WorkflowLanding.css';

// Exported so scripts/prerender.js can describe the same videos as VideoObject structured data.
export const mediaCopy = {
  'visual-search': {
    title: 'Watch Visual Search become a reviewed count series.',
    description: 'See the capture, candidate review, and committed count workflow in the current PolyPDF interface.'
  },
  'takeoff-export': {
    title: 'Watch a calibrated measurement move into the takeoff worksheet.',
    description: 'See scale calibration, quantity placement, worksheet organization, and export in the current PolyPDF interface.'
  },
  'revision-comparison': {
    title: 'Watch drawing comparison turn into a marked review.',
    description: 'See revision differences inspected and carried into a cloud-and-callout review workflow.'
  }
};

const WorkflowLanding = ({ page }) => {
  const [mediaMode, setMediaMode] = useState('short');
  const media = mediaCopy[page.mediaSlug];
  const offer = useCommercialOffer();

  useEffect(() => {
    captureAttribution();
    window.scrollTo(0, 0);
  }, [page.path]);

  const trackCta = (action) => {
    trackEvent(`landing_${action}`, {
      source: page.source,
      route: page.path
    });
  };

  const videoSource = `/videos/${page.mediaSlug}-${mediaMode}.mp4`;
  const captionsSource = captionTrackUrl(page.mediaSlug, mediaMode);

  return (
    <div className="workflow-landing">
      <a className="workflow-skip-link" href="#workflow-main">Skip to content</a>

      <header className="workflow-header">
        <nav className="workflow-nav container" aria-label="Main navigation">
          <Link className="workflow-logo" to="/" aria-label="PolyPDF home">
            <img src={parrotIcon} alt="" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>
          <div className="workflow-nav-links">
            <a href="#how-it-works">Workflow</a>
            <a href="#watch">Watch</a>
            <Link to="/support">Support</Link>
          </div>
          <Link
            className="workflow-nav-buy"
            to={buyPath(`${page.source}_nav`)}
            onClick={() => trackCta('buy_click')}
          >
            Buy once · {commercialOffer.price}
          </Link>
        </nav>
      </header>

      <main id="workflow-main">
        <section className="workflow-hero">
          <div className="container workflow-hero-grid">
            <div className="workflow-hero-copy">
              <p className="workflow-eyebrow">{page.eyebrow}</p>
              <h1>{page.title}</h1>
              <p className="workflow-lede">{page.lede}</p>
              <p className="workflow-qualifier">{page.qualifier}</p>
              <div className="workflow-cta-row">
                <DownloadCTA
                  source={`${page.source}_hero`}
                  size="large"
                  onDownload={() => trackCta('download_click')}
                />
                <Link
                  className="secondary-btn workflow-buy-cta"
                  to={buyPath(`${page.source}_hero`)}
                  onClick={() => trackCta('buy_click')}
                >
                  <FaInfinity /> Unlock unlimited · {commercialOffer.price}
                </Link>
              </div>
            </div>

            <figure className="workflow-hero-visual">
              <div className="workflow-capture-label">
                <span aria-hidden="true" /> Current shipping interface · PolyPDF 1.1.3
              </div>
              <img
                src={page.image}
                alt={page.imageAlt}
                width="2280"
                height="1515"
                loading="eager"
                fetchPriority="high"
              />
              <figcaption>{page.audience}</figcaption>
            </figure>
          </div>

          <div className="container workflow-proof-strip" aria-label="Product facts">
            {page.proofPoints.map(([label, value]) => (
              <div key={label} className="workflow-proof-point">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="workflow-context">
          <div className="container workflow-context-grid">
            <p className="workflow-section-index">01 / WHY</p>
            <div>
              <h2>{page.problemTitle}</h2>
              <p>{page.problemCopy}</p>
            </div>
          </div>
        </section>

        <section className="workflow-steps" id="how-it-works">
          <div className="container">
            <div className="workflow-section-heading">
              <p className="workflow-section-index">02 / WORKFLOW</p>
              <h2>From source PDF to a result you can review.</h2>
            </div>
            <ol className="workflow-step-list">
              {page.workflow.map(([title, description], index) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <span className="workflow-step-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <section className="workflow-media" id="watch">
          <div className="container workflow-media-grid">
            <div className="workflow-media-copy">
              <p className="workflow-section-index">03 / WATCH</p>
              <h2>{media.title}</h2>
              <p>{media.description}</p>
              <div className="workflow-media-toggle" aria-label="Video version">
                <button
                  type="button"
                  className={mediaMode === 'short' ? 'active' : ''}
                  aria-pressed={mediaMode === 'short'}
                  onClick={() => setMediaMode('short')}
                >
                  <FaPlayCircle /> 15-second overview
                </button>
                <button
                  type="button"
                  className={mediaMode === 'narrated' ? 'active' : ''}
                  aria-pressed={mediaMode === 'narrated'}
                  onClick={() => setMediaMode('narrated')}
                >
                  <FaVolumeUp /> Narrated walkthrough
                </button>
              </div>
              <p className="workflow-media-note">Both versions use current PolyPDF product captures. Captions are available in the player.</p>
            </div>
            <div className="workflow-video-frame">
              <video
                key={videoSource}
                controls
                playsInline
                preload="metadata"
                poster={page.image}
                onPlay={() => trackEvent('workflow_video_play', {
                  source: page.source,
                  workflow: page.mediaSlug,
                  version: mediaMode
                })}
              >
                <source src={videoSource} type="video/mp4" />
                <track default kind="captions" srcLang="en" label="English" src={captionsSource} />
                Your browser does not support embedded video. Download PolyPDF free to try this workflow directly.
              </video>
            </div>
          </div>
        </section>

        <section className="workflow-outcomes">
          <div className="container workflow-outcomes-grid">
            <div>
              <p className="workflow-section-index">04 / FIT</p>
              <h2>{page.outcomeTitle}</h2>
            </div>
            <ul>
              {page.outcomes.map((outcome) => (
                <li key={outcome}><FaCheck aria-hidden="true" /> <span>{outcome}</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="workflow-offer" id="pricing">
          <div className="container workflow-offer-grid">
            <div className="workflow-offer-price">
              <span>PolyPDF Pro Founder’s License</span>
              <strong>{commercialOffer.price}</strong>
              <small>one time · no subscription</small>
            </div>
            <div className="workflow-offer-copy">
              <h2>Try the full workflow free. Pay only to remove the hand-created measurement cap.</h2>
              <p>{founderRightsText}</p>
              <p className="workflow-offer-limit">{offer.founderLimitText}</p>
            </div>
            <div className="workflow-offer-actions">
              <Link
                className="primary-btn large"
                to={buyPath(`${page.source}_offer`)}
                onClick={() => trackCta('buy_click')}
              >
                Buy the Founder’s License <FaArrowRight />
              </Link>
              <a
                href="#workflow-main"
                className="workflow-text-link"
                onClick={(event) => {
                  event.preventDefault();
                  document.querySelector('.dl-cta a')?.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <HiOutlineCloudDownload /> Download free first
              </a>
            </div>
          </div>
        </section>

        <section className="workflow-faq">
          <div className="container workflow-faq-grid">
            <div>
              <p className="workflow-section-index">05 / FAQ</p>
              <h2>Questions before you test it.</h2>
            </div>
            <div className="workflow-faq-list">
              {page.faq.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="workflow-related" aria-label="Related PolyPDF workflows">
          <div className="container">
            <p className="workflow-section-index">RELATED WORKFLOWS</p>
            <div className="workflow-related-links">
              {page.related.map(([path, label]) => (
                <Link key={path} to={path}>{label} <FaArrowRight /></Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="workflow-footer">
        <div className="container workflow-footer-grid">
          <div>
            <Link className="workflow-logo" to="/">
              <img src={parrotIcon} alt="" width="1024" height="1024" />
              <span>PolyPDF</span>
            </Link>
            <p>Desktop PDF measurement and markup for Mac and Windows.</p>
          </div>
          <div className="workflow-footer-links">
            <Link to="/blog">Blog</Link>
            <Link to="/support">Support</Link>
            <Link to="/refund">Refunds</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <p>© 2026 PolyPDF. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default WorkflowLanding;
