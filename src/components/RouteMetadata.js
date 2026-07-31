import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routeMetadata from '../lib/route-metadata.json';

const SITE_ORIGIN = 'https://www.polypdf.com';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/logo512.png`;

const setMeta = (selector, attribute, value) => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
};

const RouteMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = routeMetadata[pathname] || routeMetadata['/'];
    const canonicalPath = routeMetadata[pathname] ? pathname : '/';
    const url = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;

    document.title = route.title;
    setMeta('meta[name="title"]', 'content', route.title);
    setMeta('meta[name="description"]', 'content', route.description);
    setMeta('meta[name="robots"]', 'content', route.robots);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:title"]', 'content', route.title);
    setMeta('meta[property="og:description"]', 'content', route.description);
    setMeta('meta[property="og:image"]', 'content', SOCIAL_IMAGE);
    setMeta('meta[name="twitter:url"]', 'content', url);
    setMeta('meta[name="twitter:title"]', 'content', route.title);
    setMeta('meta[name="twitter:description"]', 'content', route.description);
    setMeta('meta[name="twitter:image"]', 'content', SOCIAL_IMAGE);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
  }, [pathname]);

  return null;
};

export default RouteMetadata;
