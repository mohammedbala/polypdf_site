import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaInfinity } from 'react-icons/fa';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';
import DownloadCTA from './DownloadCTA';
import { buyPath, canonicalPagePath, captureAttribution } from '../lib/attribution';
import { trackEvent } from '../lib/analytics';
import { commercialOffer, founderRightsText } from '../lib/commercialOffer';
import { useCommercialOffer } from '../lib/useCommercialOffer';
import './WorkflowLanding.css';

export const CURRENT_INTERFACE_LABEL = 'PolyPDF for Mac and Windows';

const WorkflowLanding = ({ page }) => {
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
            <Link to="/support/">Support</Link>
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
                <span aria-hidden="true" /> {CURRENT_INTERFACE_LABEL}
              </div>
              <img
                src={page.image}
                alt={page.imageAlt}
                width={page.imageWidth || 2280}
                height={page.imageHeight || 1515}
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

        <section className="workflow-outcomes">
          <div className="container workflow-outcomes-grid">
            <div>
              <p className="workflow-section-index">03 / FIT</p>
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
              <p className="workflow-section-index">04 / FAQ</p>
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
            <p className="workflow-section-index">RELATED GUIDES &amp; WORKFLOWS</p>
            <div className="workflow-related-links">
              {page.related.map(([path, label]) => (
                <Link key={path} to={canonicalPagePath(path)}>{label} <FaArrowRight /></Link>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default WorkflowLanding;
