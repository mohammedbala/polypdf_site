import { useEffect, useState } from 'react';
import { commercialOffer } from './commercialOffer';
const FALLBACK = Object.freeze({ loaded: false, available: true, closedReason: null });
export const useCommercialOffer = () => {
  const [offer, setOffer] = useState(FALLBACK);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/commercial-offer', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        if (cancelled || !payload) return;
        const current = payload.id === commercialOffer.id && payload.kind === 'standard'
          && payload.price === 74.95 && payload.currency === 'USD';
        setOffer({ loaded: true, available: current && payload.available === true,
          closedReason: current ? 'unavailable' : 'refresh' });
      }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return offer;
};
export const closedOfferMessage = () => 'Checkout is temporarily unavailable. Please refresh or contact support@polypdf.com.';
