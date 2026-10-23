import React, { useState } from 'react';
import { calculateFlooring, convertArea, flooringCSV } from '../lib/flooringCalculator';
import { trackEvent } from '../lib/analytics';
const format = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
export default function FlooringCalculator() {
  const [areas, setAreas] = useState(['100']);
  const [unit, setUnit] = useState('sqft');
  const [waste, setWaste] = useState('10');
  const [coverage, setCoverage] = useState('20');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const label = unit === 'sqft' ? 'sq ft' : 'm²';
  const invalidate = () => { setResult(null); setErrors({}); };
  const changeUnit = next => { setAreas(areas.map(v => convertArea(v,unit,next))); setCoverage(convertArea(coverage,unit,next)); setUnit(next); invalidate(); };
  const submit = e => { e.preventDefault(); const next = calculateFlooring({ areas,waste,coverage,price }); setErrors(next.errors); setResult(Object.keys(next.errors).length ? null : next); if(!Object.keys(next.errors).length) trackEvent('calculator_complete',{source:'flooring_calculator',feature:'flooring_waste'}); };
  const exportCSV = () => { const url = URL.createObjectURL(new Blob([flooringCSV(result, unit)], {type:'text/csv;charset=utf-8'})); const a = document.createElement('a'); a.href=url; a.download='flooring-quantities.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); trackEvent('calculator_export',{source:'flooring_calculator',feature:'flooring_waste'}); };
  const field = (id,title,value,setter,help) => <div className="growth-field"><label htmlFor={id}>{title}</label><input id={id} type="number" step="any" value={value} onChange={e=>{setter(e.target.value);invalidate();}} aria-invalid={!!errors[id]} aria-describedby={`${id}-help${errors[id] ? ` ${id}-error` : ''}`}/><small id={`${id}-help`}>{help}</small>{errors[id] && <span className="growth-error" id={`${id}-error`}>{errors[id]}</span>}</div>;
  return <div className="growth-calculator"><form onSubmit={submit} noValidate>
    <div className="growth-field"><label htmlFor="floor-unit">Area unit</label><select id="floor-unit" value={unit} onChange={e=>changeUnit(e.target.value)}><option value="sqft">Square feet</option><option value="sqm">Square meters</option></select><small>Changing units converts your entered areas and pack coverage.</small></div>
    <fieldset><legend>Room areas</legend>{areas.map((value,index)=><div className="growth-room" key={index}><div className="growth-field"><label htmlFor={`area_${index}`}>Room {index+1} ({label})</label><input id={`area_${index}`} type="number" step="any" value={value} aria-invalid={!!errors[`area_${index}`]} aria-describedby={errors[`area_${index}`] ? `area_${index}-error` : undefined} onChange={e=>{setAreas(areas.map((a,i)=>i===index?e.target.value:a));invalidate();}}/>{errors[`area_${index}`]&&<span className="growth-error" id={`area_${index}-error`}>{errors[`area_${index}`]}</span>}</div>{areas.length>1&&<button type="button" aria-label={`Remove room ${index+1}`} onClick={()=>{setAreas(areas.filter((_,i)=>i!==index));invalidate();}}>Remove</button>}</div>)}<button type="button" onClick={()=>{setAreas([...areas,'']);invalidate();}}>Add a room</button></fieldset>
    {field('waste','Waste allowance (%)',waste,setWaste,'10% is an example, not an installation recommendation. Enter 0–100%.')}
    {field('coverage',`Coverage per pack (${label}, optional)`,coverage,setCoverage,'Enter the coverage printed on your selected product.')}
    {field('price','Price per pack (USD, optional)',price,setPrice,'Material only. Taxes, delivery, and labor are excluded.')}
    {errors.general && <p className="growth-error">{errors.general}</p>}
    {Object.keys(errors).length>0 && <p role="alert">Check the highlighted fields before calculating.</p>}
    <button className="primary-btn" type="submit">Calculate quantities</button>
  </form><section className="growth-results" aria-live="polite" aria-atomic="true"><p className="growth-kicker">Purchasing worksheet</p><h2>Your quantities</h2>{result ? <><dl>{[['Measured area',result.total,label],['Waste allowance',result.wasteArea,label],['Area including waste',result.required,label],['Whole packs',result.packs,'packs'],['Purchased area',result.purchased,label],['Surplus beyond allowance',result.surplus,label],['Material cost',result.cost,'USD']].filter(([,v])=>v!==null).map(([name,value,u])=><div key={name}><dt>{name}</dt><dd>{format(value)} <small>{u}</small></dd></div>)}</dl><p>Assumptions: {format(result.wastePercent)}% waste{result.packCoverage !== null && `; ${format(result.packCoverage)} ${label} per pack`}{result.pricePerPack !== null && `; $${format(result.pricePerPack)} per pack`}. Whole packs round up. Surplus is purchased area minus the area including waste.</p><div className="growth-result-actions"><button type="button" onClick={exportCSV}>Download CSV</button><button type="button" onClick={()=>window.print()}>Print results</button></div></> : <p>Enter measured room areas and calculate to see the allowance, whole packs, and material cost. Your entries stay in this browser.</p>}</section></div>;
}
