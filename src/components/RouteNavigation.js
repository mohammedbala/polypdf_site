import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

// React Router updates URLs without performing the browser's native fragment scroll.
// Handle every route here, including resources whose sections have no component hook.
export default function RouteNavigation() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const changedPage = previousPath.current !== pathname;
    previousPath.current = pathname;
    let active = true;
    let frame;
    const showPageStart = () => {
      const heading = document.querySelector('#site-content h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    if (hash.length > 1) {
      // Wait until font metrics and the newly committed route have settled.
      Promise.resolve(document.fonts?.ready).then(() => {
        if (!active) return;
        frame = window.requestAnimationFrame(() => {
          if (!active) return;
          let id = hash.slice(1);
          try { id = decodeURIComponent(id); } catch { /* Preserve malformed fragments verbatim. */ }
          const target = document.getElementById(id);
          if (!target) { if (changedPage) showPageStart(); return; }
          // A link to a section inside a disclosure must reveal its destination.
          for (let parent = target; parent; parent = parent.parentElement) {
            if (parent.tagName === 'DETAILS') parent.open = true;
          }
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
      });
    } else if (changedPage) {
      showPageStart();
    }
    return () => {
      active = false;
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [pathname, hash, key]);

  return null;
}
