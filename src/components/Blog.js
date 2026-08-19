import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaRegClock } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';
import { blogPostPath, blogPosts } from '../lib/blogPosts';

const cardImage = (entry) => {
  const image = entry.cardImage || entry.heroImage || null;
  return typeof image === 'string' ? { src: image } : image;
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
            <img src={parrotIcon} alt="" width="1024" height="1024" />
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
              workflows—grounded in the app and illustrated with real PolyPDF screenshots.
            </p>
          </motion.header>

          <div className="legal-sections blog-grid">
            {blogPosts.map((entry, index) => {
              const image = cardImage(entry);
              const category = entry.category || entry.tag || 'Guide';

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
                      to={blogPostPath(entry.slug)}
                      className="blog-card-image-link"
                      aria-label={`Read ${entry.title}`}
                      tabIndex={-1}
                    >
                      <img
                        className="blog-card-image"
                        src={image.src}
                        alt={image.alt || ''}
                        width={image.width}
                        height={image.height}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
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
                      <Link to={blogPostPath(entry.slug)}>{entry.title}</Link>
                    </h2>
                    <p>{entry.excerpt}</p>
                    <Link to={blogPostPath(entry.slug)} className="blog-read-link">
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
