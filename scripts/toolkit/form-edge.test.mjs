import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
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
});
test('single-choice fields reject multiple selections without changing field semantics',async()=>{
 for(const [name,values] of [['Status',['Open','Closed']],['Decision',['Accept','Revise']]]) await assert.rejects(runTool(tool,[file],{values:{[name]:values}}),/one option/);
});
test('form length errors explain the field limit',async()=>{
 await assert.rejects(runTool(tool,[file],{values:{Notes:'x'.repeat(101)}}),/Notes.*100 characters/);
});
