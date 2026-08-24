export const isSecureStripeCheckoutUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
  } catch {
    return false;
  }
};

export const checkoutErrorCode = (error) => (
  error instanceof Error && error.message ? error.message : 'checkout_unavailable'
);

export const createStripeCheckoutSession = async (attribution, fetchImpl = window.fetch.bind(window)) => {
  const response = await fetchImpl('/api/checkout/session', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ attribution })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !isSecureStripeCheckoutUrl(payload.url)) {
    throw new Error(payload.error || 'checkout_unavailable');
  }
  return payload.url;
};
