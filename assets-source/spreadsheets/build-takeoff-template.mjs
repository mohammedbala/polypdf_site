import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

// Run a copy from a task directory linked to the bundled Artifact Tool runtime.
// Arguments: parsed source CSV JSON, output directory. No network connections.
const [sourcePath, outputDir] = process.argv.slice(2);
assert(sourcePath && outputDir, 'Supply source JSON and output directory');
await fs.mkdir(outputDir, { recursive: true });
const rawRows = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const wb = Workbook.create();
const estimate = wb.worksheets.add('Estimate');
const source = wb.worksheets.add('CSV example');
const ink = '#283126', green = '#344832', amber = '#FFF3CC', muted = '#52634D';
for (const sheet of [estimate, source]) {
  sheet.showGridLines = false;
  sheet.getRange('A1:J42').format.font = {name:'Arial',size:11,color:ink};
  sheet.getRange('A1:J42').format.verticalAlignment = 'center';
  sheet.getRange('A1:J42').format.rowHeight = 23;
}
estimate.tabColor = green;
const widths = [16,21,36,13,16,15,18,18,19,20];
widths.forEach((w,i) => estimate.getRangeByIndexes(0,i,42,1).format.columnWidth = w);
estimate.getRange('A2').values = [['Construction takeoff estimate']];
estimate.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
estimate.getRange('A2:J2').format.borders = {bottom:{style:'thin',color:'#B6C0B2'}};
estimate.getRange('A4:C4').values = [['Project',null,null]];
estimate.getRange('B4:C4').format.fill = amber;
estimate.getRange('E4:F4').values = [['Prepared by',null]];
estimate.getRange('F4').format.fill = amber;
estimate.getRange('H4:I4').values = [['Currency','USD']];
estimate.getRange('A6').values = [['Priced rows subtotal (USD)']];
estimate.getRange('C6').formulas = [['=IF(COUNT(I14:I33)=0,"",SUM(I14:I33))']];
estimate.getRange('C6').setNumberFormat('"$"#,##0.00');
estimate.getRange('C6').format.font = {name:'Arial',size:16,bold:true,color:ink};
estimate.getRange('E6').values = [['Rows needing inputs']];
estimate.getRange('G6').formulas = [['=COUNTIFS(J14:J33,"Needs inputs")']];
estimate.getRange('G6').setNumberFormat('0');
estimate.getRange('A8').values = [['Amber cells are editable. Use one unit and one matching USD rate per line. White columns calculate.']];
estimate.getRange('A9').values = [['Enter only priced scope. Keep scale checks, gross reference areas and repeated CSV summaries out of the estimate.']];
estimate.getRange('A10').values = [['Allowance is optional (blank = 0%). No automatic unit conversion, pack rounding, tax, labor or overhead.']];
estimate.getRange('A11').values = [['Open the CSV example tab for field mapping. This website-authored template does not sync with PolyPDF.']];
estimate.getRange('A8:A11').format.font = {name:'Arial',size:11,color:muted};
estimate.getRange('A13:J13').values = [['Item ID','Sheet / revision','Scope description','Unit','Checked quantity','Allowance %','Priced quantity','USD / unit','Line cost (USD)','Input status']];
estimate.getRange('A13:J13').format = {fill:green,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:34};
estimate.getRange('A14:F33').format.fill = amber;
estimate.getRange('H14:H33').format.fill = amber;
estimate.getRange('G14:G33').format.fill = '#EEF2EB';
estimate.getRange('I14:J33').format.fill = '#EEF2EB';
estimate.getRange('D14:D33').dataValidation = {rule:{type:'list',values:['sq ft','ft','ea','sq m','m','cu yd','cu m']}};
estimate.getRange('E14:E33').setNumberFormat('#,##0.00##');
estimate.getRange('F14:F33').setNumberFormat('0.0%');
estimate.getRange('G14:G33').setNumberFormat('#,##0.00##');
estimate.getRange('H14:H33').setNumberFormat('"$"#,##0.00##');
estimate.getRange('I14:I33').setNumberFormat('"$"#,##0.00');
estimate.getRange('J14').formulas = [['=IF(COUNTA(A14:F14,H14)=0,"",IF(AND(A14<>"",B14<>"",C14<>"",D14<>"",ISNUMBER(E14),E14>=0,OR(F14="",AND(ISNUMBER(F14),F14>=0,F14<=1)),ISNUMBER(H14),H14>=0),"Priced","Needs inputs"))']];
estimate.getRange('J14:J33').fillDown();
estimate.getRange('G14').formulas = [['=IF(AND(ISNUMBER(E14),E14>=0,OR(F14="",AND(ISNUMBER(F14),F14>=0,F14<=1))),E14*(1+IF(F14="",0,F14)),"")']];
estimate.getRange('G14:G33').fillDown();
estimate.getRange('I14').formulas = [['=IF(J14="Priced",ROUND(G14*H14,2),"")']];
estimate.getRange('I14:I33').fillDown();
estimate.getRange('J14:J33').conditionalFormats.add('containsText',{text:'Needs inputs',format:{fill:'#FCE5DF',font:{color:'#9C2415',bold:true}}});
estimate.getRange('G6').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#FCE5DF',font:{color:'#9C2415',bold:true}}});
estimate.getRange('A35').values = [['20 prepared lines. Add a line by copying formulas and extending the subtotal and status ranges.']];
estimate.getRange('A36').values = [['Priced means the required fields are present. You still need to review quantities, scope, units and supplier rates.']];
estimate.getRange('A37').values = [['Example only: 100 sq ft × (1 + 10%) × $2.50/sq ft = $275.00. Enter your own allowance and rate.']];
estimate.getRange('A39').values = [['Guide: https://www.polypdf.com/tools/construction-takeoff-spreadsheet/']];
estimate.getRange('A35:A39').format.font = {name:'Arial',size:11,color:muted};
estimate.freezePanes.freezeRows(13);

const sourceWidths=[14,18,27,18,14,15,23,17,13,14];
sourceWidths.forEach((w,i)=>source.getRangeByIndexes(0,i,40,1).format.columnWidth=w);
source.getRange('A2').values=[['Read the CSV before pricing']];
source.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:ink};
source.getRange('A4').values=[['Source: PolyPDF publisher test, local Mac 1.6.14 build 76, October 17, 2026. Not public-installer qualification.']];
source.getRange('A5').values=[['https://www.polypdf.com/samples/evaluation/local-build-1.6.14-76/verification.html']];
source.getRange('A7').values=[['Original CSV cells below. Blank separator preserved. Formula is source text, not a spreadsheet formula.']];
const padded=rawRows.map((row,idx)=>Array.from({length:10},(_,col)=>{
  const v=row[col]??null;
  if(v!==null && v!=='' && (([1,2].includes(idx)&&[5,7,9].includes(col))||([5,6].includes(idx)&&[2,3].includes(col))))return Number(v);
  return v;
}));
source.getRange(`A9:J${8+padded.length}`).values=padded;
for(const header of ['A9:J9','A13:E13'])source.getRange(header).format={fill:green,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center'};
source.getRange('A18').values=[['How to carry these values forward']];
source.getRange('A18').format.font={name:'Arial',size:14,bold:true,color:ink};
const notes=[
 'Quantity = measurement-record count: 1 area record and 2 length records. It is not the measured amount.',
 'Total + Unit = measured amount: 5,760 sq ft for area; 156 ft for the two lengths combined.',
 'The Group / Value / Count / Total / Unit block repeats the amounts. Do not add it to the first block.',
 'A101 Revision A is a fictional construction exercise. 5,760 sq ft is the gross footprint, including walls.',
 '156 ft = 96 + 60 ft from independent width/depth checks. It is not a perimeter or a material quantity.',
 'No rows feed Estimate automatically. Select billable scope from your own drawing, then copy Total and Unit.',
 'Keep sheet/revision and scope with each row. Exclude calibration and verification measurements.',
 'Rates and allowances are user inputs. This template supplies no contractor prices or cost database.'
];
source.getRange('A20:A27').values=notes.map(n=>[n]);
source.getRange('A20:A27').format.font={name:'Arial',size:11,color:muted};
source.getRange('A29').values=[['https://www.polypdf.com/samples/evaluation/local-build-1.6.14-76/willow-creek-a101-takeoff.csv']];

// Exercise the editable formulas, including missing inputs, valid zero, rounding and final prepared row.
const v=cell=>estimate.getRange(cell).values[0][0];
const checks=[];
function row(r,values,expected,status='Priced'){
 estimate.getRange(`A${r}:F${r}`).values=[values.slice(0,6)];estimate.getRange(`H${r}`).values=[[values[6]]];wb.recalculate();
 assert.equal(v(`I${r}`),expected);assert.equal(v(`J${r}`),status);checks.push({row:r,lineCost:expected,status});
}
row(14,['T01','A101/A','Example area','sq ft',100,.1,2.5],275);
assert.equal(v('C6'),275);
row(24,['T02','A101/A','Zero rate','ft',10,null,0],0);
row(33,['T03','A101/A','Rounding','ea',3,null,1.235],3.71);
assert.equal(v('C6'),278.71);
row(14,['T01','A101/A','Missing rate','sq ft',100,.1,null],'','Needs inputs');assert.equal(v('G6'),1);
row(14,['T01','A101/A','Invalid allowance','sq ft',100,1.1,2.5],'','Needs inputs');
row(14,['T01','A101/A','Zero quantity','sq ft',0,null,2.5],0);
for(const r of [14,24,33]){estimate.getRange(`A${r}:F${r}`).clear({applyTo:'contents'});estimate.getRange(`H${r}`).clear({applyTo:'contents'});}
wb.recalculate();assert.equal(v('C6'),'');assert.equal(v('G6'),0);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:2000});
await fs.writeFile(path.join(outputDir,'validation.json'),JSON.stringify({checks,emptySubtotal:v('C6'),errorScan:errors.ndjson},null,2));
for(const [sheetName,range,file] of [['Estimate','A1:J20','estimate-preview.png'],['CSV example','A1:J29','csv-example-preview.png']]){
 const preview=await wb.render({sheetName,range,scale:1.4,format:'png'});
 await fs.writeFile(path.join(outputDir,file),new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(outputDir,'polypdf-construction-takeoff-template.xlsx'));
console.log(JSON.stringify({output:outputDir,checks:checks.length,blankSubtotal:v('C6'),errorScan:errors.ndjson}));
