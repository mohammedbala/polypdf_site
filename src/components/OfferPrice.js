import React from 'react';
import { ShieldCheck } from '@phosphor-icons/react';
import {
  commercialOffer,
  moneyBackGuaranteeText
} from '../lib/commercialOffer';

export const OfferPrice = ({ className = '', compact = false }) => (
  <div className={`offer-price${compact ? ' offer-price-compact' : ''}${className ? ` ${className}` : ''}`}>
    <span className="offer-price-reference">
      <span>Planned standard price</span>
      <del>{commercialOffer.referencePrice}</del>
    </span>
    <span className="offer-price-current">
      <strong>{commercialOffer.price}</strong>
      <span>Founder price</span>
    </span>
    <span className="offer-price-savings">Save {commercialOffer.savings}</span>
  </div>
);

export const OfferButtonLabel = ({ action = 'Buy once' }) => (
  <span className="offer-button-label" aria-hidden="true">
    <span>{action}</span>
    <span className="offer-button-prices">
      <del>{commercialOffer.referencePrice}</del>
      <strong>{commercialOffer.price}</strong>
    </span>
  </span>
);

export const OfferGuarantee = ({ compact = false, inverse = false }) => (
  <p className={`offer-guarantee${compact ? ' offer-guarantee-compact' : ''}${inverse ? ' offer-guarantee-inverse' : ''}`}>
    <ShieldCheck aria-hidden="true" weight="fill" />
    <span><strong>{moneyBackGuaranteeText}.</strong> Try PolyPDF on your own drawings, risk-free.</span>
  </p>
);
