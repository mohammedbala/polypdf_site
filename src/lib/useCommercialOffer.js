import { useEffect, useState } from 'react';
import { founderLimitTextFor } from './commercialOffer';

// GET /api/commercial-offer and POST /api/checkout/session use the same fulfilled-license count.
// Static HTML intentionally contains no timestamp or remaining count, so prerendered and hydrated
// pages cannot disagree about volatile scarcity.

const OFFER_ENDPOINT = '/api/commercial-offer';

const FALLBACK = Object.freeze({
  loaded: false,
  founderLimitText: founderLimitTextFor(),
  founderAvailable: true,
  closedReason: null
});

// `reason` comes from the API as not_started | sold_out.
const CLOSED_COPY = {
  sold_out: 'Founder offer complete. All 100 licenses have been claimed, so checkout is closed.',
  not_started: 'Checkout opens shortly. Download the app free in the meantime — nothing about the free tier depends on this.'
};

export const useCommercialOffer = () => {
  const [offer, setOffer] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetch(OFFER_ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.founder) return;
        setOffer({
          loaded: true,
          founderLimitText: founderLimitTextFor(),
          founderAvailable: payload.founder.available !== false,
          closedReason: payload.founder.available === false ? payload.founder.reason || 'sold_out' : null
        });
      })
      .catch(() => {
        // Offline, blocked, or the API is down: the page keeps the built-in text and the buy button
        // keeps working. Checkout reports its own errors (Buy.js) if the server disagrees.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return offer;
};

export const closedOfferMessage = (reason) => CLOSED_COPY[reason] || CLOSED_COPY.sold_out;
