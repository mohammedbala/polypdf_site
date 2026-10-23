import { calculateFlooring, convertArea, flooringCSV } from './flooringCalculator';
const calc = overrides => calculateFlooring({areas:['100'],waste:'10',coverage:'20',price:'45',...overrides});
test('rounds whole packs and distinguishes net, allowance, surplus and cost',()=>{
 expect(calc()).toMatchObject({total:100,packs:6,purchased:120,cost:270});
 expect(calc().required).toBeCloseTo(110);expect(calc().surplus).toBeCloseTo(10);
});
test('handles multiple fractional rooms, no waste and exact pack boundaries',()=>{
 expect(calc({areas:['19.5','20.5'],waste:'0'})).toMatchObject({total:40,packs:2,purchased:40,surplus:0});
 expect(calc({areas:['0.1','0.2'],waste:'0',coverage:'0.1'}).packs).toBe(3);
});
test('unit conversion preserves the order quantity across repeated switches',()=>{
 let area='100',pack='20';for(let i=0;i<10;i++){area=convertArea(convertArea(area,'sqft','sqm'),'sqm','sqft');pack=convertArea(convertArea(pack,'sqft','sqm'),'sqm','sqft');}
 expect(calc({areas:[area],coverage:pack}).packs).toBe(6);
 expect(calc({areas:[convertArea('100','sqft','sqm')],coverage:convertArea('20','sqft','sqm'),waste:'0'}).packs).toBe(5);
});
test.each([{areas:['']},{areas:['-1']},{areas:['Infinity']},{areas:[]},{waste:'-1'},{waste:'101'},{coverage:'0'},{price:'-2'},{coverage:'',price:'2'},{areas:['1e309']}])('rejects invalid input %j',overrides=>expect(Object.keys(calc(overrides).errors).length).toBeGreaterThan(0));
test('optional coverage and price do not imply zero packs or a free order',()=>expect(calc({coverage:'',price:''})).toMatchObject({packs:null,purchased:null,cost:null}));
test('CSV exports actual result values and unit, not user-provided text',()=>{
 const csv=flooringCSV(calc(),'sqft');expect(csv).toContain('Whole packs,6,packs');expect(csv).toContain('Material cost,270,USD');expect(csv).not.toContain('undefined');
});

test('a positive quantity always requires at least one pack',()=>expect(calc({areas:['1e-18'],coverage:'20'}).packs).toBe(1));
