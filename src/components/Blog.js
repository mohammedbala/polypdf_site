import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaRegClock } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon-96.png';
import { blogPostPath, blogPosts } from '../lib/blogPosts';
import { canonicalPagePath } from '../lib/attribution';
import { normalizeBlogImage, ResponsiveBlogImage } from './BlogPost';

export const resolveBlogCardImage = (entry) => {
  const heroImage = normalizeBlogImage(entry.heroImage);
  const explicitCardImage = normalizeBlogImage(entry.cardImage);
  const baseImage = explicitCardImage || heroImage;
  const cardSrc = entry.cardSrc || explicitCardImage?.cardSrc || heroImage?.cardSrc;
  const src = cardSrc || baseImage?.src;

  if (!src) return null;

  // A dedicated card crop can have a different intrinsic ratio from the article image. Only carry
  // the hero dimensions across when the pixels are actually the same; cardWidth/cardHeight can
  // describe a purpose-made crop when the data supplies them.
  const usesDedicatedCrop = Boolean(cardSrc && cardSrc !== baseImage?.src);
  const cardMobileSrc = entry.cardMobileSrc || explicitCardImage?.cardMobileSrc ||
    heroImage?.cardMobileSrc;

  return {
    ...baseImage,
    src,
    alt: entry.cardAlt || explicitCardImage?.cardAlt || heroImage?.cardAlt ||
      baseImage?.alt || heroImage?.alt || '',
    width: entry.cardWidth || explicitCardImage?.cardWidth || heroImage?.cardWidth ||
      (usesDedicatedCrop ? undefined : baseImage?.width),
    height: entry.cardHeight || explicitCardImage?.cardHeight || heroImage?.cardHeight ||
      (usesDedicatedCrop ? undefined : baseImage?.height),
    mobileSrc: cardMobileSrc || (!usesDedicatedCrop ? baseImage?.mobileSrc : undefined),
    mobileWidth: entry.cardMobileWidth || explicitCardImage?.cardMobileWidth ||
      heroImage?.cardMobileWidth || (!usesDedicatedCrop ? baseImage?.mobileWidth : undefined),
    mobileHeight: entry.cardMobileHeight || explicitCardImage?.cardMobileHeight ||
      heroImage?.cardMobileHeight || (!usesDedicatedCrop ? baseImage?.mobileHeight : undefined),
    cardFit: entry.cardFit || explicitCardImage?.cardFit || heroImage?.cardFit,
    cardPosition: entry.cardPosition || explicitCardImage?.cardPosition ||
      heroImage?.cardPosition
  };
};

const Blog = () => {
  const reduceMotion = useReducedMotion();
  const headingRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="legal-page blog-index">
      <header className="legal-header">
        <nav className="nav container" aria-label="Blog navigation">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="" width="96" height="96" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/" className="back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Home
          </Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="container">
          <motion.header
            className="legal-hero blog-index-hero"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.45 }}
          >
            <p className="blog-eyebrow">PolyPDF guides &amp; reference</p>
            <h1 ref={headingRef} tabIndex="-1">Practical answers for working with PDF drawings</h1>
            <p className="legal-subtitle">
              Step-by-step measurement, takeoff, markup, comparison, forms, and document-safety
              workflows—each one illustrated with screenshots from the app.
            </p>
          </motion.header>

          <div className="legal-sections blog-grid">
            {blogPosts.map((entry, index) => {
              const image = resolveBlogCardImage(entry);
              const category = entry.category || entry.tag || 'Guide';
              const cardImageStyle = {
                ...(image?.cardFit ? { objectFit: image.cardFit } : {}),
                ...(image?.cardPosition ? { objectPosition: image.cardPosition } : {})
              };

              return (
                <motion.article
                  key={entry.slug}
                  className={`legal-section blog-card${image ? ' blog-card-with-image' : ''}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={reduceMotion ? undefined : { delay: Math.min(index, 6) * 0.045 }}
                >
                  {image && (
                    <Link
                      to={canonicalPagePath(blogPostPath(entry.slug))}
                      className="blog-card-image-link"
                      aria-label={`Read ${entry.title}`}
                      tabIndex={-1}
                    >
                      <ResponsiveBlogImage
                        image={image}
                        className="blog-card-image"
                        pictureClassName="blog-card-picture"
                        priority={index === 0}
                        style={Object.keys(cardImageStyle).length > 0 ? cardImageStyle : undefined}
                      />
                    </Link>
                  )}

                  <div className="blog-card-copy">
                    <div className="blog-card-meta">
                      <span className="blog-tag">{category}</span>
                      <time dateTime={entry.date}>{entry.dateLabel || entry.date}</time>
                      {entry.readingTime && (
                        <span className="blog-reading-time">
                          <FaRegClock aria-hidden="true" /> {entry.readingTime}
                        </span>
                      )}
                    </div>
                    <h2 className="blog-card-title">
                      <Link to={canonicalPagePath(blogPostPath(entry.slug))}>{entry.title}</Link>
                    </h2>
                    <p>{entry.excerpt}</p>
                    <Link to={canonicalPagePath(blogPostPath(entry.slug))} className="blog-read-link">
                      Read guide <FaArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
