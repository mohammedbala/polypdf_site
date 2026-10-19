import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PDFDocument, decodePDFRawStream} from 'pdf-lib';
import {catalog} from './manifest.mjs';
import {runTool, inspectPdf} from '../../src/toolkit/engine.mjs';
const d=await PDFDocument.create(),page=d.addPage([500,700]),f=d.getForm();
const notes=f.createTextField('Notes'); notes.enableMultiline(); notes.setMaxLength(100); notes.addToPage(page,{x:30,y:500,width:400,height:100});
const choice=f.createOptionList('Trades'); choice.addOptions(['Electrical','Flooring','Plumbing']);choice.enableMultiselect();choice.addToPage(page,{x:30,y:350,width:400,height:100});
const single=f.createDropdown('Status');single.addOptions(['Open','Closed']);single.addToPage(page,{x:30,y:280,width:400,height:30});
const radio=f.createRadioGroup('Decision');radio.addOptionToPage('Accept',page,{x:30,y:220,width:20,height:20});radio.addOptionToPage('Revise',page,{x:80,y:220,width:20,height:20});
const file={name:'form-edge.pdf',bytes:await d.save()};
await fs.mkdir('.tmp/toolkit-tests',{recursive:true});await fs.writeFile('.tmp/toolkit-tests/form-edge.pdf',file.bytes);
const tool=catalog.find(t=>t.id==='fill-pdf-form');
test('form inspection exposes multiline, length and multiselect requirements',async()=>{
 const fields=(await inspectPdf(file.bytes)).fields;
 assert.equal(fields.find(x=>x.name==='Notes').multiline,true);
 assert.equal(fields.find(x=>x.name==='Notes').maxLength,100);
 assert.equal(fields.find(x=>x.name==='Trades').multiple,true);
 assert.equal(fields.find(x=>x.name==='Status').multiple,false);
});
test('form filling retains multiline text and multiple list selections on reopen',async()=>{
 const r=await runTool(tool,[file],{values:{Notes:'Check door\nCheck window',Trades:['Electrical','Flooring']}});
 const out=await PDFDocument.load(r.outputs[0].bytes);
 assert.equal(out.getForm().getTextField('Notes').getText(),'Check door\nCheck window');
 assert.deepEqual(out.getForm().getOptionList('Trades').getSelected(),['Electrical','Flooring']);
 const widget=out.getForm().getTextField('Notes').acroField.getWidgets()[0];
 const appearance=out.context.lookup(widget.getAppearances().normal);
 const stream=new TextDecoder().decode(decodePDFRawStream(appearance).decode());
 const baselines=[...stream.matchAll(/1 0 0 1 [-\d.]+ ([-\d.]+) Tm/g)].map(m=>Number(m[1]));
 assert.equal(baselines.length,2,'Both complete text lines must be visible');
 assert.ok(baselines.every(y=>y>=0),'No text line may be placed below the field clip');
 assert.match(r.warnings.join(' '),/resized/);
});
test('single-choice fields reject multiple selections without changing field semantics',async()=>{
 for(const [name,values] of [['Status',['Open','Closed']],['Decision',['Accept','Revise']]]) await assert.rejects(runTool(tool,[file],{values:{[name]:values}}),/one option/);
});
test('form length errors explain the field limit',async()=>{
 await assert.rejects(runTool(tool,[file],{values:{Notes:'x'.repeat(101)}}),/Notes.*100 characters/);
});
test('multiline fields fit an unbroken identifier without clipping its width',async()=>{
 const r=await runTool(tool,[file],{values:{Notes:'W'.repeat(80)}});
 const out=await PDFDocument.load(r.outputs[0].bytes),field=out.getForm().getTextField('Notes');
 const widget=field.acroField.getWidgets()[0],da=widget.getDefaultAppearance();
 const size=Number(da.match(/([\d.]+) Tf/)[1]);
 const font=await out.embedFont('Helvetica');
 assert.ok(font.widthOfTextAtSize('W'.repeat(80),size)<=widget.getRectangle().width-4);
});
test('an auto-size field repeated in different rectangles fits each widget independently',async()=>{
 const source=await PDFDocument.create(),p=source.addPage([500,700]),field=source.getForm().createTextField('Repeated');field.enableMultiline();
 field.addToPage(p,{x:30,y:500,width:400,height:100});field.addToPage(p,{x:30,y:400,width:150,height:30});
 await source.save();field.setFontSize(0);
 const bytes=await source.save({updateFieldAppearances:false});
 const r=await runTool(tool,[{name:'repeated.pdf',bytes}],{values:{Repeated:'Check door\nCheck window'}});
 const out=await PDFDocument.load(r.outputs[0].bytes),widgets=out.getForm().getTextField('Repeated').acroField.getWidgets();
 const sizes=widgets.map(w=>Number(w.getDefaultAppearance().match(/([\d.]+) Tf/)[1]));
 assert.ok(sizes[0]>sizes[1]);
 for(const widget of widgets){const stream=new TextDecoder().decode(decodePDFRawStream(out.context.lookup(widget.getAppearances().normal)).decode());const baselines=[...stream.matchAll(/1 0 0 1 [-\d.]+ ([-\d.]+) Tm/g)].map(m=>Number(m[1]));assert.equal(baselines.length,2);assert.ok(baselines.every(y=>y>=0));}
});
