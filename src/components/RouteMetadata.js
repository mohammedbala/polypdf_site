import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routeMetadata from '../lib/route-metadata.json';

const SITE_ORIGIN = 'https://www.polypdf.com';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/og-image.png?v=20260819`;
const SOCIAL_IMAGE_ALT =
  'PolyPDF — measure and mark up PDF drawings on Mac and Windows, no subscription';

const setMeta = (selector, attribute, value) => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
};

export const normalizeRoutePath = (pathname) => pathname.replace(/\/+$/, '') || '/';

const RouteMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPathname = normalizeRoutePath(pathname);
    const route = routeMetadata[normalizedPathname] || routeMetadata['/'];
    const canonicalPath = routeMetadata[normalizedPathname] ? normalizedPathname : '/';
    const url = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : `${canonicalPath}/`}`;
    const image = route.image
      ? new URL(route.image, `${SITE_ORIGIN}/`).href
      : SOCIAL_IMAGE;
    const imageAlt = route.imageAlt || SOCIAL_IMAGE_ALT;

    document.title = route.title;
    setMeta('meta[name="title"]', 'content', route.title);
    setMeta('meta[name="description"]', 'content', route.description);
    setMeta('meta[name="robots"]', 'content', route.robots);
    setMeta('meta[property="og:type"]', 'content', route.type || 'website');
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:title"]', 'content', route.title);
    setMeta('meta[property="og:description"]', 'content', route.description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:image:width"]', 'content', String(route.imageWidth || 1200));
    setMeta('meta[property="og:image:height"]', 'content', String(route.imageHeight || 630));
    setMeta('meta[property="og:image:alt"]', 'content', imageAlt);
    setMeta('meta[name="twitter:url"]', 'content', url);
    setMeta('meta[name="twitter:title"]', 'content', route.title);
    setMeta('meta[name="twitter:description"]', 'content', route.description);
    setMeta('meta[name="twitter:image"]', 'content', image);
    setMeta('meta[name="twitter:image:alt"]', 'content', imageAlt);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
  }, [pathname]);

  return null;
};

export default RouteMetadata;
