import React, { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaColumns,
  FaExclamationTriangle,
  FaFileExport,
  FaFileSignature,
  FaListOl,
  FaMapMarkedAlt,
  FaPuzzlePiece,
  FaRegClock,
  FaRegFileAlt,
  FaRulerCombined,
  FaSearch,
  FaShieldAlt,
  FaStamp,
  FaTable
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon-96.png';
import DownloadCTA from './DownloadCTA';
import { buyPath, canonicalPagePath } from '../lib/attribution';
import { blogPostBySlug, blogPostPath } from '../lib/blogPosts';

// Section icons are named in post data. Unknown names fall back to the generic document icon so
// adding editorial content can never make an article route fail to render.
const SECTION_ICONS = {
  check: <FaCheckCircle />,
  compare: <FaColumns />,
  document: <FaRegFileAlt />,
  export: <FaFileExport />,
  map: <FaMapMarkedAlt />,
  plug: <FaPuzzlePiece />,
  ruler: <FaRulerCombined />,
  search: <FaSearch />,
  seal: <FaStamp />,
  shield: <FaShieldAlt />,
  signature: <FaFileSignature />,
  sparkle: <HiOutlineSparkles />,
  steps: <FaListOl />,
  table: <FaTable />,
  warning: <FaExclamationTriangle />
};

const sectionIcon = (name) => SECTION_ICONS[name] || SECTION_ICONS.document;

export const normalizeBlogImage = (image) => {
  if (!image) return null;
  return typeof image === 'string' ? { src: image } : image;
};

/**
 * One image contract for article screenshots and blog cards.
 *
 * `mobileSrc` should be a tighter crop of the same product state, not a different
 * illustration. When it is absent, callers can opt into a horizontally scrollable viewport so a
 * full desktop window is not compressed until its controls become unreadable on a phone.
 */
export const ResponsiveBlogImage = ({
  image: imageValue,
  className,
  pictureClassName,
  priority = false,
  scrollOnMobile = false,
  style
}) => {
  const image = normalizeBlogImage(imageValue);
  if (!image?.src) return null;

  const hasMobileSource = Boolean(image.mobileSrc);
  const picture = (
    <picture
      className={[
        'blog-responsive-picture',
        hasMobileSource ? 'blog-responsive-picture-has-mobile' : '',
        pictureClassName || ''
      ].filter(Boolean).join(' ')}
    >
      {hasMobileSource && (
        <source
          media={image.mobileMedia || '(max-width: 760px)'}
          srcSet={image.mobileSrc}
          width={image.mobileWidth}
          height={image.mobileHeight}
        />
      )}
      <img
        className={className}
        src={image.src}
        alt={image.alt || ''}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={style}
      />
    </picture>
  );

  if (!scrollOnMobile || hasMobileSource) return picture;

  const panWidth = image.mobilePanWidth || Math.min(image.width || 760, 760);
  return (
    <div
      className="blog-image-viewport blog-image-viewport-scroll-mobile"
      role="region"
      aria-label={image.mobileScrollLabel || `Scrollable image: ${image.alt || 'article image'}`}
      tabIndex="0"
      style={{ '--blog-image-pan-width': `${panWidth}px` }}
    >
      {picture}
    </div>
  );
};

const displayValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value.text || value.label || '';
  return value;
};

const dateLabel = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(new Date(`${value}T12:00:00Z`));
};

export const BlogFigure = ({ block, priority = false }) => {
  const image = normalizeBlogImage(block.image || block.figure || block);
  if (!image?.src) return null;

  const caption = block.caption || image.caption;
  const provenance = block.provenance || image.provenance;
  const scrollOnMobile = image.mobilePan ?? (!image.mobileSrc && (image.width || 0) >= 1200);

  return (
    <figure
      className={`blog-figure${priority ? ' blog-hero-figure' : ''}`}
      style={image.width ? { '--blog-figure-source-width': `${image.width}px` } : undefined}
    >
      <ResponsiveBlogImage
        image={image}
        priority={priority}
        scrollOnMobile={scrollOnMobile}
      />
      {(caption || provenance) && (
        <figcaption>
          {caption && <span>{caption}{provenance ? ' ' : null}</span>}
          {provenance && <small>{provenance}</small>}
        </figcaption>
      )}
    </figure>
  );
};

const renderFigure = (block, key, priority = false) => (
  <BlogFigure key={key} block={block} priority={priority} />
);

const renderTable = (block, key) => {
  const headers = block.headers || [];
  const rows = block.rows || [];
  const caption = block.caption || 'Reference table';

  return (
    <div
      key={key}
      className="blog-table-scroll"
      role="region"
      aria-label={caption}
      tabIndex="0"
    >
      <table className="blog-table">
        {block.caption && <caption>{block.caption}</caption>}
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`${displayValue(header)}-${index}`} scope="col">
                  {displayValue(header)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row)
              ? row
              : headers.map((header) => row[displayValue(header)]);

            return (
              <tr key={rowIndex}>
                {cells.map((cell, cellIndex) => {
                  const Cell = cellIndex === 0 && block.rowHeaders !== false ? 'th' : 'td';
                  return (
                    <Cell
                      key={cellIndex}
                      {...(Cell === 'th' ? { scope: 'row' } : {})}
                    >
                      {displayValue(cell)}
                    </Cell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderBlock = (block, index) => {
  const key = `${block.kind || 'p'}-${index}`;

  switch (block.kind) {
    case 'sub':
      return <h3 key={key} className="blog-subheading">{block.text}</h3>;
    case 'ul':
      return (
        <ul key={key} className="section-content">
          {(block.items || []).map((item, itemIndex) => (
            <li key={itemIndex}>{displayValue(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} className="blog-steps">
          {(block.items || []).map((item, itemIndex) => (
            <li key={itemIndex}>{displayValue(item)}</li>
          ))}
        </ol>
      );
    case 'note':
      return <p key={key} className="blog-note">{block.text}</p>;
    case 'link':
      return (
        <p key={key} className="blog-resource">
          {block.text && <span>{block.text}</span>}
          <a href={block.href} className="blog-resource-link">{block.label}</a>
        </p>
      );
    case 'figure':
      return renderFigure(block, key);
    case 'table':
      return renderTable(block, key);
    case 'formula': {
      const formula = block.formula || block.expression || block.text;
      return (
        <div key={key} className="blog-formula" role="note" aria-label={block.label || 'Formula'}>
          {block.label && <span className="blog-formula-label">{block.label}</span>}
          <p><code>{formula}</code></p>
          {block.explanation && <small>{block.explanation}</small>}
        </div>
      );
    }
    default:
      return <p key={key} className="blog-paragraph">{block.text}</p>;
  }
};

const QuickAnswer = ({ value }) => {
  if (!value) return null;
  const answer = typeof value === 'string' ? value : value.text || value.answer;
  const title = typeof value === 'object' && value.title ? value.title : 'Quick answer';
  const paragraphs = Array.isArray(answer) ? answer : [answer];

  return (
    <div className="blog-quick-answer" aria-labelledby="quick-answer-heading">
      <h2 id="quick-answer-heading">{title}</h2>
      {paragraphs.filter(Boolean).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
};

const sourceDetails = (source) => {
  if (typeof source === 'string') {
    return /^https?:\/\//.test(source)
      ? { label: source, url: source }
      : { label: source };
  }

  return {
    label: source.label || source.title || source.name || source.url,
    note: source.note || source.description,
    url: source.url || source.href
  };
};

const CtaLink = ({ className, href, children }) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href || '')) {
    return <a className={className} href={href}>{children}</a>;
  }

  return <Link className={className} to={canonicalPagePath(href)}>{children}</Link>;
};

const BlogPost = () => {
  const { slug } = useParams();
  const entry = blogPostBySlug(slug);
  const reduceMotion = useReducedMotion();
  const headingRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [slug]);

  // An unknown slug is a wrong URL, not an error state worth a page of its own.
  if (!entry) return <Navigate to="/blog/" replace />;

  const relatedPosts = (entry.relatedSlugs || [])
    .map((related) => blogPostBySlug(typeof related === 'string' ? related : related.slug))
    .filter((related) => related && related.slug !== entry.slug);
  const cta = entry.cta || {};
  const ctaBody = cta.body || cta.text ||
    'PolyPDF is a free download on Mac and Windows. Open your own PDFs, use the markup tools, and place up to 3 hand-created measurements per document before you decide whether to buy.';
  const downloadSource = cta.downloadSource || cta.source || `blog_${entry.slug}`;
  const buySource = cta.buySource || cta.attribution || `website_blog_${entry.slug}`;
  const platforms = Array.isArray(entry.platforms) ? entry.platforms.join(' · ') : entry.platforms;
  const heroImage = normalizeBlogImage(entry.heroImage);
  const lastVerifiedMachineDate = /^\d{4}-\d{2}-\d{2}$/.test(entry.lastVerified || '')
    ? entry.lastVerified
    : entry.dateModified || entry.date;
  const usesPlatformDownload = !cta.primaryHref || ['#download', '/#download'].includes(cta.primaryHref);

  return (
    <div className="legal-page blog-post">
      <header className="legal-header">
        <nav className="nav container" aria-label="Article navigation">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="" width="96" height="96" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/blog/" className="back-link">
            <FaArrowLeft aria-hidden="true" /> All guides
          </Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="container">
          <motion.article
            className="blog-article"
            aria-labelledby="blog-article-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.45 }}
          >
            <header className="legal-hero blog-hero">
              <div className="blog-card-meta blog-hero-meta">
                <span className="blog-tag">{entry.category || entry.tag || 'Guide'}</span>
                <time dateTime={entry.date}>{entry.dateLabel || entry.date}</time>
                {entry.readingTime && (
                  <span className="blog-reading-time">
                    <FaRegClock aria-hidden="true" /> {entry.readingTime}
                  </span>
                )}
              </div>
              <h1 id="blog-article-title" ref={headingRef} tabIndex="-1">{entry.title}</h1>
              <QuickAnswer value={entry.quickAnswer} />
              {heroImage && renderFigure(heroImage, 'hero-image', true)}
              {entry.lede && <p className="legal-subtitle blog-lede">{entry.lede}</p>}
              {entry.author && <p className="blog-byline">By {entry.author}</p>}

              {(entry.lastVerified || entry.productVersion || platforms) && (
                <dl className="blog-verification" aria-label="Guide verification details">
                  {entry.lastVerified && (
                    <div>
                      <dt>Last verified</dt>
                      <dd><time dateTime={lastVerifiedMachineDate}>{dateLabel(entry.lastVerified)}</time></dd>
                    </div>
                  )}
                  {entry.productVersion && (
                    <div>
                      <dt>Tested with</dt>
                      <dd>{String(entry.productVersion).startsWith('PolyPDF') ? entry.productVersion : `PolyPDF ${entry.productVersion}`}</dd>
                    </div>
                  )}
                  {platforms && (
                    <div>
                      <dt>Platforms</dt>
                      <dd>{platforms}</dd>
                    </div>
                  )}
                </dl>
              )}
            </header>

            <div className="legal-sections">
              {(entry.sections || []).map((section, index) => (
                <motion.section
                  key={`${section.title}-${index}`}
                  className="legal-section"
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={reduceMotion ? undefined : { delay: Math.min(index, 6) * 0.045 }}
                >
                  <div className="section-header">
                    <div className="section-icon" aria-hidden="true">{sectionIcon(section.icon)}</div>
                    <h2>{section.title}</h2>
                  </div>
                  {(section.body || section.blocks || []).map((block, blockIndex) => {
                    const blockImage = block.kind === 'figure'
                      ? normalizeBlogImage(block.image || block.figure || block)
                      : null;
                    // The hero already gives this screenshot a full-width treatment. Several guides
                    // intentionally reference the same image in their first section; rendering it
                    // twice adds no information and makes the article feel mechanically assembled.
                    if (blockImage?.src && blockImage.src === heroImage?.src) return null;
                    return renderBlock(block, blockIndex);
                  })}
                </motion.section>
              ))}

              {entry.faqs?.length > 0 && (
                <section className="legal-section blog-faq" aria-labelledby="blog-faq-title">
                  <div className="section-header">
                    <div className="section-icon" aria-hidden="true">{sectionIcon('document')}</div>
                    <h2 id="blog-faq-title">Frequently asked questions</h2>
                  </div>
                  <div className="blog-faq-list">
                    {entry.faqs.map((faq, index) => {
                      const answers = Array.isArray(faq.answer) ? faq.answer : [faq.answer];
                      return (
                        <section key={`${faq.question}-${index}`} className="blog-faq-item">
                          <h3>{faq.question}</h3>
                          {answers.filter(Boolean).map((answer, answerIndex) => (
                            <p key={answerIndex}>{answer}</p>
                          ))}
                        </section>
                      );
                    })}
                  </div>
                </section>
              )}

              {entry.sources?.length > 0 && (
                <section className="legal-section blog-sources" aria-labelledby="blog-sources-title">
                  <div className="section-header">
                    <div className="section-icon" aria-hidden="true">{sectionIcon('document')}</div>
                    <h2 id="blog-sources-title">Sources and further reading</h2>
                  </div>
                  <ol>
                    {entry.sources.map((source, index) => {
                      const details = sourceDetails(source);
                      return (
                        <li key={`${details.label}-${index}`}>
                          {details.url ? <a href={details.url}>{details.label}</a> : details.label}
                          {details.note && <span> — {details.note}</span>}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {relatedPosts.length > 0 && (
                <section className="legal-section blog-related" aria-labelledby="blog-related-title">
                  <div className="section-header">
                    <div className="section-icon" aria-hidden="true">{sectionIcon('steps')}</div>
                    <h2 id="blog-related-title">Continue with a related guide</h2>
                  </div>
                  <div className="blog-related-list">
                    {relatedPosts.map((related) => (
                      <Link key={related.slug} to={canonicalPagePath(blogPostPath(related.slug))} className="blog-related-link">
                        <span>{related.category || related.tag || 'Guide'}</span>
                        <strong>{related.title}</strong>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="legal-section blog-cta">
                {cta.eyebrow && <p className="blog-cta-eyebrow">{cta.eyebrow}</p>}
                <h2>{cta.title || 'Try this workflow on your own drawings'}</h2>
                <p className="blog-paragraph">{ctaBody}</p>
                <div className="blog-cta-row">
                  {usesPlatformDownload ? (
                    <DownloadCTA source={downloadSource} />
                  ) : (
                    <CtaLink className="primary-btn" href={cta.primaryHref}>
                      {cta.primaryLabel || 'Try PolyPDF free'}
                    </CtaLink>
                  )}
                  <CtaLink
                    className="secondary-btn"
                    href={cta.secondaryHref || buyPath(buySource)}
                  >
                    {cta.secondaryLabel || cta.buyLabel || cta.pricingLabel || 'See pricing'}
                  </CtaLink>
                </div>
              </section>
            </div>
          </motion.article>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
