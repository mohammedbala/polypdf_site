import React from 'react';

export const TEAM_TIERS = [{ minimum: 1, unitAmount: 2498 }, { minimum: 25, unitAmount: 2248 }, { minimum: 100, unitAmount: 1998 }];
export const formatTeamMoney = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function estimateTeamPurchase(quantity, existingSeats = 0, tiers = TEAM_TIERS) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) return null;
  const resultingSeats = existingSeats + quantity;
  const tier = [...tiers].reverse().find(item => resultingSeats >= item.minimum);
  return tier ? { quantity, unitAmount: tier.unitAmount, total: quantity * tier.unitAmount, resultingSeats } : null;
}
export default function TeamsSeatPicker({ quantity, onChange, existingSeats = 0, tiers = TEAM_TIERS, children }) {
  const estimate = estimateTeamPurchase(quantity, existingSeats, tiers);
  const maximum = Math.max(250, Math.ceil((Number(quantity) || 1) / 250) * 250);
  return <section className="teams-seat-picker" aria-labelledby="seat-picker-title">
    <div className="teams-seat-heading"><div><p className="teams-kicker">One payment. All 1.x updates.</p><h2 id="seat-picker-title">{existingSeats ? 'Add users to your team' : 'How many people need PolyPDF?'}</h2></div><label className="teams-seat-number">Number of users<input type="number" inputMode="numeric" min="1" max="10000" step="1" value={quantity} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} aria-describedby="seat-picker-help" /></label></div>
    <input className="teams-seat-slider" type="range" min="1" max={maximum} step="1" value={estimate ? quantity : 1} onChange={event => onChange(Number(event.target.value))} aria-label="Adjust number of users" aria-valuetext={`${quantity || 1} users`} />
    <div className="teams-slider-labels" aria-hidden="true"><span>1 user</span><span>{maximum} users</span></div>
    <div className="teams-tier-shortcuts" aria-label="Choose a common team size">{[1, 25, 100].map(count => <button type="button" key={count} aria-pressed={quantity === count} onClick={() => onChange(count)}>{count} {count === 1 ? 'user' : 'users'}</button>)}</div>
    <div className="teams-price-summary" aria-live="polite">{estimate ? <><div><strong>{formatTeamMoney(estimate.total)}</strong><span>one-time total, before tax</span></div><p>{estimate.quantity} {estimate.quantity === 1 ? 'user' : 'users'} × {formatTeamMoney(estimate.unitAmount)} each{existingSeats > 0 && <small>{estimate.resultingSeats} total paid seats after purchase</small>}</p></> : <p>Enter a whole number from 1 to 10,000 users.</p>}</div>
    <p id="seat-picker-help" className="teams-seat-help">One person, one active computer per seat. Use the slider or enter an exact number.{existingSeats > 0 && ' Your existing seats keep their original purchase price.'}</p>
    {children}
    <p className="teams-tier-note">1–24 users: $24.98 each · 25–99: $22.48 · 100+: $19.98</p>
  </section>;
}
