import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title, description, keywords, image, url, type = 'website' }) => {
  const siteUrl = 'https://www.polypdf.com';
  const defaultTitle = 'PolyPDF for Mac - PDF Markup, Measurement, and Takeoff';
  const defaultDescription = 'Native Mac PDF markup and measurement for architects, engineers, contractors, and estimators. A Bluebeam Revu for Mac alternative with a one-time direct license.';
  const defaultImage = `${siteUrl}/og-image.png`;
  const defaultKeywords = 'PDF markup Mac, PDF measurement Mac, Bluebeam Revu for Mac alternative, construction PDF takeoff, AEC PDF markup, architecture software, engineering tools, blueprint measurement app';

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
