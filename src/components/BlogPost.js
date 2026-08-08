import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaListOl,
  FaMapMarkedAlt,
  FaPuzzlePiece,
  FaRegClock,
  FaRegFileAlt,
  FaRulerCombined,
  FaShieldAlt,
  FaStamp
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';
import parrotIcon from '../assets/polypdf_icon.png';
import DownloadCTA from './DownloadCTA';
import { buyPath } from '../lib/attribution';
import { blogPostBySlug } from '../lib/blogPosts';

// Section icons are named in blogPosts.js so a post stays plain data. Unknown names fall back to
// the generic document icon rather than crashing the page.
const SECTION_ICONS = {
  document: <FaRegFileAlt />,
  shield: <FaShieldAlt />,
  plug: <FaPuzzlePiece />,
  ruler: <FaRulerCombined />,
  seal: <FaStamp />,
  map: <FaMapMarkedAlt />,
  steps: <FaListOl />,
  sparkle: <HiOutlineSparkles />
};

const sectionIcon = (name) => SECTION_ICONS[name] || SECTION_ICONS.document;

const renderBlock = (block, index) => {
  switch (block.kind) {
    case 'sub':
      return <h3 key={index} className="blog-subheading">{block.text}</h3>;
    case 'ul':
      return (
        <ul key={index} className="section-content">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={index} className="blog-steps">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case 'note':
      return <p key={index} className="blog-note">{block.text}</p>;
    default:
      return <p key={index} className="blog-paragraph">{block.text}</p>;
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const entry = blogPostBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // An unknown slug is a wrong URL, not an error state worth a page of its own.
  if (!entry) return <Navigate to="/blog" replace />;

  return (
    <div className="legal-page blog-post">
      <header className="legal-header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img src={parrotIcon} alt="PolyPDF" width="1024" height="1024" />
            <span>PolyPDF</span>
          </Link>
          <Link to="/blog" className="back-link">
            <FaArrowLeft /> All posts
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
          <div className="legal-hero blog-hero">
            <div className="blog-card-meta blog-hero-meta">
              <span className="blog-tag">{entry.tag}</span>
              <time dateTime={entry.date}>{entry.dateLabel}</time>
              {entry.readingTime && (
                <span className="blog-reading-time">
                  <FaRegClock /> {entry.readingTime}
                </span>
              )}
            </div>
            <h1>{entry.title}</h1>
            {entry.lede && <p className="legal-subtitle">{entry.lede}</p>}
            {entry.author && <p className="last-updated">By {entry.author}</p>}
          </div>

          <div className="legal-sections">
            {entry.sections.map((section, index) => (
              <motion.section
                key={section.title}
                className="legal-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index, 6) * 0.06 }}
              >
                <div className="section-header">
                  <div className="section-icon">{sectionIcon(section.icon)}</div>
                  <h2>{section.title}</h2>
                </div>
                {section.body.map(renderBlock)}
              </motion.section>
            ))}

            <section className="legal-section blog-cta">
              <h2>Try it on your own drawings</h2>
              <p className="blog-paragraph">
                PolyPDF is a free download on Mac and Windows. Open your own PDFs, use the markup tools,
                and place up to 3 hand-created measurements per document before you decide whether to buy.
              </p>
              <div className="blog-cta-row">
                <DownloadCTA source="blog_post" />
                <Link to={buyPath('website_blog_post')} className="secondary-btn">
                  See pricing
                </Link>
              </div>
            </section>
          </div>
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
              <Link to="/versions">Version History</Link>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
