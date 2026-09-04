import React from 'react';
import { Link } from 'react-router';
import parrotIcon from '../assets/polypdf_icon-96.png';
import DirectCheckoutLink from './DirectCheckoutLink';
import { buyPath, canonicalPagePath } from '../lib/attribution';
import { DOWNLOADS } from '../lib/platform';
import { landingPages } from '../lib/landingPages';

export const footerLinkGroups = Object.freeze([
  Object.freeze({
    label: 'Workflows',
    links: Object.freeze([
      Object.freeze({ to: landingPages.revisionPackages.path, label: 'Revision Packages' }),
      Object.freeze({ to: landingPages.pdfTakeoffSoftware.path, label: 'PDF takeoff software' }),
      Object.freeze({ to: landingPages.measurePdfOnMac.path, label: 'Measure a PDF on Mac' }),
      Object.freeze({ to: landingPages.constructionPdfMarkup.path, label: 'Construction PDF markup' }),
      Object.freeze({ to: landingPages.visualSearchPdfCount.path, label: 'PDF symbol counting' }),
      Object.freeze({ to: landingPages.comparePdfDrawings.path, label: 'Compare PDF drawings' })
    ])
  }),
  Object.freeze({
    label: 'Product',
    links: Object.freeze([
      Object.freeze({ to: '/try', label: 'Try PolyPDF in browser' }),
      Object.freeze({
        to: buyPath('website_footer'),
        label: 'Buy PolyPDF Pro',
        checkoutSource: 'website_footer'
      }),
      Object.freeze({ to: '/windows', label: 'PolyPDF for Windows' }),
      Object.freeze({ to: '/versions', label: 'Version history' }),
      Object.freeze({ to: '/blog', label: 'Guides & reference' }),
      Object.freeze({ to: '/build-a-plugin', label: 'Build a plugin' })
    ])
  }),
  Object.freeze({
    label: 'Help & company',
    links: Object.freeze([
      Object.freeze({ to: '/support', label: 'Support' }),
      Object.freeze({ to: '/feature-requests', label: 'Feature requests' }),
      Object.freeze({ to: '/account', label: 'License account' }),
      Object.freeze({ to: '/refund', label: 'Refund policy' }),
      Object.freeze({ to: '/terms', label: 'Terms of use' }),
      Object.freeze({ to: '/privacy', label: 'Privacy policy' })
    ])
  })
]);

const trackDownload = (platform) => {
  if (typeof window === 'undefined') return;
  const properties = { source: 'website_footer', platform: platform.key };
  if (window.plausible) window.plausible('download_click', { props: properties });
  if (window.gtag) window.gtag('event', 'download_click', properties);
};

const SiteFooter = () => (
  <footer className="site-footer" data-site-footer>
    <div className="container site-footer-shell">
      <div className="site-footer-intro">
        <Link className="site-footer-logo" to="/" aria-label="PolyPDF home">
          <img src={parrotIcon} alt="" loading="lazy" width="96" height="96" />
          <span>PolyPDF</span>
        </Link>
        <p>Try PDF measurement and markup in your browser, then continue on Mac or Windows—without a yearly bill.</p>
        <div className="site-footer-downloads" aria-label="PolyPDF downloads">
          {Object.values(DOWNLOADS).map((platform) => (
            <a
              key={platform.key}
              href={platform.url}
              download
              onClick={() => trackDownload(platform)}
            >
              Download for {platform.name}
            </a>
          ))}
        </div>
      </div>

      <nav className="site-footer-nav" aria-label="Footer navigation">
        {footerLinkGroups.map((group) => (
          <section className="site-footer-group" key={group.label} aria-labelledby={`footer-${group.label.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}>
            <h2 id={`footer-${group.label.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}>{group.label}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.to}>
                  {link.checkoutSource ? (
                    <DirectCheckoutLink
                      source={link.checkoutSource}
                      pageVariant="footer"
                    >
                      {link.label}
                    </DirectCheckoutLink>
                  ) : (
                    <Link to={canonicalPagePath(link.to)}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>

    <div className="container site-footer-bottom">
      <p>&copy; 2026 Euclidean Software LLC. All rights reserved.</p>
      <p>PolyPDF offers a focused browser preview and a full desktop workflow for macOS and Windows.</p>
    </div>
  </footer>
);

export default SiteFooter;
