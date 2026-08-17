import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaRegClock } from 'react-icons/fa';
import parrotIcon from '../assets/polypdf_icon.png';
import { blogPostPath, blogPosts } from '../lib/blogPosts';

const Blog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page blog-index">
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
            <h1>Blog</h1>
            <p className="legal-subtitle">Release notes with the reasoning attached — what shipped, how it works, and how to use it</p>
          </div>

          <div className="legal-sections">
            {blogPosts.map((entry, index) => (
              <motion.article
                key={entry.slug}
                className="legal-section blog-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index, 6) * 0.06 }}
              >
                <div className="blog-card-meta">
                  <span className="blog-tag">{entry.tag}</span>
                  <time dateTime={entry.date}>{entry.dateLabel}</time>
                  {entry.readingTime && (
                    <span className="blog-reading-time">
                      <FaRegClock /> {entry.readingTime}
                    </span>
                  )}
                </div>
                <h2 className="blog-card-title">
                  <Link to={blogPostPath(entry.slug)}>{entry.title}</Link>
                </h2>
                <p>{entry.excerpt}</p>
                <Link to={blogPostPath(entry.slug)} className="blog-read-link">
                  Read the post <FaArrowRight />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.main>

    </div>
  );
};

export default Blog;
