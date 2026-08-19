import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogFigure, ResponsiveBlogImage } from './BlogPost';
import { resolveBlogCardImage } from './Blog';

const mountMarkup = (element) => {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(element);
  return host;
};

test('renders a mobile crop with its own intrinsic dimensions and a desktop fallback', () => {
  const host = mountMarkup(
    <ResponsiveBlogImage
      image={{
        src: '/shots/full-app.png',
        alt: 'Markup Table with one RFI row selected',
        width: 1800,
        height: 1125,
        mobileSrc: '/shots/markup-table-detail.png',
        mobileWidth: 760,
        mobileHeight: 950
      }}
      priority
    />
  );

  const source = host.querySelector('source');
  const image = host.querySelector('img');

  expect(source.getAttribute('media')).toBe('(max-width: 760px)');
  expect(source.getAttribute('srcset')).toBe('/shots/markup-table-detail.png');
  expect(source.getAttribute('width')).toBe('760');
  expect(source.getAttribute('height')).toBe('950');
  expect(image.getAttribute('src')).toBe('/shots/full-app.png');
  expect(image.getAttribute('width')).toBe('1800');
  expect(image.getAttribute('height')).toBe('1125');
  expect(image.getAttribute('loading')).toBe('eager');
  expect(image.getAttribute('alt')).toBe('Markup Table with one RFI row selected');
});

test('keeps a large desktop capture pannable when no honest mobile crop exists', () => {
  const host = mountMarkup(
    <BlogFigure
      block={{
        src: '/shots/desktop-window.png',
        alt: 'PolyPDF desktop window showing calibrated measurements',
        width: 1800,
        height: 1125,
        caption: 'The visible controls confirm the calibrated page scale.',
        provenance: 'Captured in PolyPDF 1.3.4.'
      }}
    />
  );

  const viewport = host.querySelector('.blog-image-viewport-scroll-mobile');
  expect(viewport).not.toBeNull();
  expect(viewport.getAttribute('role')).toBe('region');
  expect(viewport.getAttribute('tabindex')).toBe('0');
  expect(host.querySelector('source')).toBeNull();
  expect(host.querySelector('figcaption').textContent).toBe(
    'The visible controls confirm the calibrated page scale. Captured in PolyPDF 1.3.4.'
  );
});

test('uses a purpose-made card crop and focal point without borrowing false dimensions', () => {
  expect(resolveBlogCardImage({
    cardSrc: '/shots/count-panel-card.png',
    cardPosition: '78% 42%',
    heroImage: {
      src: '/shots/count-full-window.png',
      alt: 'Symbol Search candidate review',
      width: 1800,
      height: 1125
    }
  })).toMatchObject({
    src: '/shots/count-panel-card.png',
    alt: 'Symbol Search candidate review',
    cardPosition: '78% 42%'
  });

  const card = resolveBlogCardImage({
    heroImage: {
      src: '/shots/count-full-window.png',
      cardSrc: '/shots/count-panel-card.png',
      cardWidth: 1200,
      cardHeight: 750,
      cardPosition: 'right center',
      alt: 'Symbol Search candidate review',
      width: 1800,
      height: 1125
    }
  });

  expect(card).toMatchObject({
    src: '/shots/count-panel-card.png',
    width: 1200,
    height: 750,
    cardPosition: 'right center'
  });
  expect(resolveBlogCardImage({
    cardSrc: '/shots/crop-with-unknown-ratio.png',
    heroImage: { src: '/shots/hero.png', width: 1800, height: 1125 }
  })).toMatchObject({ width: undefined, height: undefined });

  expect(resolveBlogCardImage({
    cardImage: '/shots/separate-card.png',
    heroImage: { src: '/shots/hero.png', alt: 'Verified PolyPDF feature state' }
  }).alt).toBe('Verified PolyPDF feature state');
});
