import React, { forwardRef, useState } from 'react';
import { buyPath, checkoutAttributionForSource } from '../lib/attribution';
import { checkoutErrorCode, createStripeCheckoutSession } from '../lib/checkout';
import { trackEvent } from '../lib/analytics';
import { primaryPlatform } from '../lib/platform';
import { commercialOffer } from '../lib/commercialOffer';
import siteRelease from '../lib/siteRelease.json';

const SOLD_OUT_CODES = new Set(['founder_offer_sold_out', 'founder_offer_ended']);

const DirectCheckoutLink = forwardRef(({
  source,
  pageVariant = 'direct',
  className,
  children,
  loadingLabel = 'Opening secure checkout…',
  onClick,
  redirect = (url) => window.location.assign(url),
  ...linkProps
}, ref) => {
  const [status, setStatus] = useState('ready');
  const [checkoutError, setCheckoutError] = useState(null);

  const openCheckout = async (event) => {
    event.preventDefault();
    if (status === 'loading') return;
    onClick?.(event);

    const attribution = checkoutAttributionForSource(source);
    const properties = {
      source: attribution.source,
      page_variant: pageVariant,
      platform: primaryPlatform.key,
      offer_id: commercialOffer.id,
      app_version: siteRelease.version,
      provider: 'stripe'
    };

    trackEvent('buy_click', properties);
    trackEvent('checkout_click', properties);
    setStatus('loading');
    setCheckoutError(null);

    try {
      const checkoutUrl = await createStripeCheckoutSession(attribution);
      trackEvent('checkout_session_created', properties);
      trackEvent('checkout_started', properties);
      redirect(checkoutUrl);
    } catch (error) {
      const code = checkoutErrorCode(error);
      const soldOut = SOLD_OUT_CODES.has(code);
      setStatus('ready');
      setCheckoutError(soldOut
        ? {
          title: 'Founder offer complete.',
          message: 'All 100 Founder licenses have been claimed, so checkout is closed.'
        }
        : {
          title: 'Checkout did not open.',
          message: 'Secure checkout could not open. Please try again.'
        });
      trackEvent('checkout_error', {
        ...properties,
        reason: soldOut ? 'sold_out' : 'unavailable'
      });
    }
  };

  return (
    <>
      <a
        {...linkProps}
        ref={ref}
        href={buyPath(source)}
        className={className}
        onClick={openCheckout}
        aria-busy={status === 'loading'}
        aria-disabled={status === 'loading'}
      >
        {status === 'loading' ? loadingLabel : children}
      </a>
      {checkoutError && (
        <div className="checkout-toast" role="alert">
          <strong>{checkoutError.title}</strong>
          <span>{checkoutError.message}</span>
        </div>
      )}
    </>
  );
});

DirectCheckoutLink.displayName = 'DirectCheckoutLink';

export default DirectCheckoutLink;
