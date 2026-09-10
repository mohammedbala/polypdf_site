import React from 'react';
import { ShieldCheck } from '@phosphor-icons/react';
import { commercialOffer, moneyBackGuaranteeText } from '../lib/commercialOffer';

export const OfferPrice = ({ className = '', compact = false }) => (
  <div className={`offer-price${compact ? ' offer-price-compact' : ''}${className ? ` ${className}` : ''}`}>
    <span className="offer-price-current">
      <strong>{commercialOffer.price}</strong>
      <span>USD · one payment</span>
    </span>
  </div>
);
export const OfferButtonLabel = ({ action = 'Buy once' }) => (
  <span className="offer-button-label">
    <span>{action}</span>
    <span className="offer-button-prices"><strong>{commercialOffer.price}</strong></span>
  </span>
);

export const OfferGuarantee = ({ compact = false, inverse = false }) => (
  <p className={`offer-guarantee${compact ? ' offer-guarantee-compact' : ''}${inverse ? ' offer-guarantee-inverse' : ''}`}>
    <ShieldCheck aria-hidden="true" weight="fill" />
    <span><strong>{moneyBackGuaranteeText}.</strong> Try PolyPDF on your own drawings, risk-free.</span>
  </p>
);
