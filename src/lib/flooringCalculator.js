export const SQFT_PER_SQM = 10.763910416709722;
const number = (value) => typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
export function calculateFlooring({ areas, waste, coverage = '', price = '' }) {
  const errors = {};
  const rooms = areas.map(number);
  rooms.forEach((value, index) => { if (!Number.isFinite(value) || value <= 0) errors[`area_${index}`] = 'Enter an area greater than zero.'; });
  const wasteNumber = number(waste);
  if (!Number.isFinite(wasteNumber) || wasteNumber < 0 || wasteNumber > 100) errors.waste = 'Enter a waste allowance from 0 to 100%.';
  const pack = coverage === '' ? null : number(coverage);
  const packPrice = price === '' ? null : number(price);
  if (pack !== null && (!Number.isFinite(pack) || pack <= 0)) errors.coverage = 'Enter coverage greater than zero, or leave it empty.';
  if (packPrice !== null && (!Number.isFinite(packPrice) || packPrice < 0)) errors.price = 'Enter a non-negative price, or leave it empty.';
  if (packPrice !== null && pack === null) errors.coverage = 'Enter pack coverage to calculate the price.';
  if (!rooms.length) errors.area_0 = 'Add at least one room.';
  if (Object.keys(errors).length) return { errors };
  const total = rooms.reduce((sum, value) => sum + value, 0);
  const required = total * (1 + wasteNumber / 100);
  const ratio = pack === null ? null : required / pack;
  // Tolerate arithmetic noise at an exact boundary after a unit conversion.
  const packs = ratio === null ? null : Math.max(1, Math.ceil(ratio - Number.EPSILON * Math.max(1, ratio) * 4));
  const purchased = packs === null ? null : packs * pack;
  const cost = packs === null || packPrice === null ? null : packs * packPrice;
  if (![total, required, packs, purchased, cost].filter(v => v !== null).every(Number.isFinite) || (packs !== null && !Number.isSafeInteger(packs))) return { errors: { general: 'These values are too large. Enter smaller quantities.' } };
  return { errors: {}, rooms, wastePercent: wasteNumber, packCoverage: pack, pricePerPack: packPrice, total, required, wasteArea: required - total, packs, purchased, surplus: purchased === null ? null : Math.max(0, purchased - required), cost };
}
export function convertArea(value, from, to) {
  if (value === '' || from === to || !Number.isFinite(number(value))) return value;
  return String(number(value) * (from === 'sqft' ? 1 / SQFT_PER_SQM : SQFT_PER_SQM));
}
export function flooringCSV(result, unit) {
  const rows = [['Quantity', 'Value', 'Unit'], ...result.rooms.map((value, index) => [`Room ${index + 1}`, value, unit]), ['Waste allowance', result.wastePercent, 'percent'], ['Measured area', result.total, unit], ['Waste area', result.wasteArea, unit], ['Required area', result.required, unit]];
  if (result.packs !== null) rows.push(['Coverage per pack', result.packCoverage, unit], ['Whole packs', result.packs, 'packs'], ['Purchased area', result.purchased, unit], ['Surplus beyond allowance', result.surplus, unit]);
  if (result.cost !== null) rows.push(['Price per pack', result.pricePerPack, 'USD'], ['Material cost', result.cost, 'USD']);
  return rows.map(row => row.map(value => typeof value === 'number' && !Number.isInteger(value) ? Number(value.toPrecision(12)) : value).join(',')).join('\r\n') + '\r\n';
}
