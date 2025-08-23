import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title, description, keywords, image, url, type = 'website' }) => {
  const siteUrl = 'https://polypdf.app';
  const defaultTitle = 'PolyPDF - PDF Markup & Measure Tools for AEC Professionals';
  const defaultDescription = 'Professional PDF markup and measurement app for architects, engineers, and construction professionals. Smart line detection and precision tools.';
  const defaultImage = `${siteUrl}/og-image.png`;
  const defaultKeywords = 'PDF markup, PDF measurement, construction app, architecture software, engineering tools, blueprint app, CAD PDF, technical drawing app, iPad PDF editor';

  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url || siteUrl,
    keywords: keywords || defaultKeywords,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <link rel="canonical" href={seo.url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content="PolyPDF" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <meta name="twitter:url" content={seo.url} />
    </Helmet>
  );
};

export default SEO;