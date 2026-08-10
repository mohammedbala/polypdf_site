import { useEffect, useState } from 'react';
import { commercialOffer, founderLimitTextFor } from './commercialOffer';

// The founder deadline is a promise, and the server is the only thing that can keep it.
//
// GET /api/commercial-offer is the same source `POST /api/checkout/session` gates on: past
// `founder.endsAt`, or past the fulfilled-licence cap, checkout returns 409 `founder_offer_ended`
// and the buyer sees an error instead of a payment form. Keeping the date in a site constant meant
// the two could drift — and on 2026-08-10 they had, by twelve days (docs/conversion-audit.md P0-1).
//
// So the pages ask. The static constant survives only as the pre-JavaScript fallback, which is what
// prerendered HTML and crawlers get; the moment the fetch lands, every deadline sentence on the page
// is whatever the server will actually honour.

const OFFER_ENDPOINT = '/api/commercial-offer';

// "2026-08-30T03:59:59.000Z" -> "August 29, 2026 at 11:59 p.m. ET".
// Eastern is deliberate: the offer was written in ET and the server config is ET-derived. Showing
// each visitor their own midnight would move the deadline around the world.
export const formatFounderDeadline = (iso) => {
  const parsed = new Date(iso);
  if (!iso || Number.isNaN(parsed.getTime())) return null;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).formatToParts(parsed);

    const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
    const dayPeriod = value('dayPeriod').toLowerCase() === 'am' ? 'a.m.' : 'p.m.';

    return `${value('month')} ${value('day')}, ${value('year')} at ${value('hour')}:${value('minute')} ${dayPeriod} ET`;
  } catch {
    // A runtime without the America/New_York zone would otherwise print a wrong local time.
    return null;
  }
};

const FALLBACK = Object.freeze({
  loaded: false,
  founderDeadline: commercialOffer.founderEndsAt,
  founderLimitText: founderLimitTextFor(commercialOffer.founderEndsAt),
  founderAvailable: true,
  closedReason: null
});

// `reason` comes from the API as not_started | ended | sold_out.
const CLOSED_COPY = {
  ended: 'Founder pricing has closed. Checkout is paused while the next offer is prepared — email support@polypdf.com and we will tell you what replaces it.',
  sold_out: 'All founder licenses have been claimed. Checkout is paused while the next offer is prepared — email support@polypdf.com and we will tell you what replaces it.',
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
        const deadline = formatFounderDeadline(payload.founder.endsAt);
        setOffer({
          loaded: true,
          founderDeadline: deadline || commercialOffer.founderEndsAt,
          founderLimitText: founderLimitTextFor(deadline || commercialOffer.founderEndsAt),
          founderAvailable: payload.founder.available !== false,
          closedReason: payload.founder.available === false ? payload.founder.reason || 'ended' : null
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

export const closedOfferMessage = (reason) => CLOSED_COPY[reason] || CLOSED_COPY.ended;
