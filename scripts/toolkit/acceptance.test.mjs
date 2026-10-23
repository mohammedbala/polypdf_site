import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {createCanvas, loadImage} from '@napi-rs/canvas';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {catalog} from './manifest.mjs';
import {nodeAdapter} from './node-adapter.mjs';
const root = await fs.mkdtemp(path.resolve('.tmp/toolkit-acceptance-'));
const hash = b => createHash('sha256').update(b).digest('hex');
const sources = {};
async function save(name, bytes) { sources[name] = new Uint8Array(bytes); await fs.writeFile(path.join(root,name),bytes); }
for (const [name,labels] of [['source.pdf',['A1','A2','A3']],['second.pdf',['B1','B2']]]) {
  const d = await PDFDocument.create();
  for (const label of labels) d.addPage([360,480]).drawText(label,{x:40,y:400,size:20});
  await save(name,await d.save());
}
const d = await PDFDocument.create(), p = d.addPage([360,480]), form = d.getForm();
const field = form.createTextField('Reviewer'); field.setText('Morgan'); field.addToPage(p,{x:30,y:350,width:250,height:30});
await save('form.pdf',await d.save());
const canvas = createCanvas(120,80); canvas.getContext('2d').fillRect(10,10,100,60);
for (const ext of ['jpg','png','webp']) await save(`image.${ext}`,await canvas.encode(ext === 'jpg' ? 'jpeg' : ext));
const scenarios = {
  'merge-pdf': {files:['source.pdf','second.pdf'], order:['A1','A2','A3','B1','B2']},
  'split-pdf': {options:{chunkSize:2}, groups:[['A1','A2'],['A3']]},
  'extract-pdf-pages': {options:{pages:'3,1'},order:['A3','A1']},
  'delete-pdf-pages': {options:{pages:'2'},order:['A1','A3']},
  'organize-pdf': {options:{order:'2,3,1'},order:['A2','A3','A1']},
  'rotate-pdf': {options:{pages:'2',angle:'180'},rotations:[0,180,0]},
  'duplicate-pdf-pages': {options:{pages:'2',copies:2},order:['A1','A2','A2','A2','A3']},
  'reverse-pdf-pages': {order:['A3','A2','A1']},
  'insert-blank-pdf-pages': {options:{after:0,count:2},order:['','','A1','A2','A3']},
  'interleave-pdf': {files:['source.pdf','second.pdf'],options:{reverseSecond:true},order:['A1','B2','A2','B1','A3']},
  'jpg-to-pdf': {files:['image.jpg'],count:1},
  'png-to-pdf': {files:['image.png'],count:1},
  'webp-to-pdf': {files:['image.webp'],count:1},
  'pdf-to-jpg': {options:{pages:'2,1',dpi:'72'},names:['page-002.jpg','page-001.jpg'],image:true},
  'pdf-to-png': {options:{pages:'2,1',dpi:'72'},names:['page-002.png','page-001.png'],image:true},
  'pdf-to-webp': {options:{pages:'2,1',dpi:'72'},names:['page-002.webp','page-001.webp'],image:true},
  'pdf-to-text': {options:{pages:'3,1'},text:/Page 3[\s\S]*A3[\s\S]*Page 1[\s\S]*A1/},
  'text-to-pdf': {files:[],options:{title:'Site notes',text:'Room one\nRoom two'},count:1,contains:['Site notes','Room one','Room two']},
  'compress-pdf': {order:['A1','A2','A3']},
  'flatten-pdf': {files:['form.pdf'],count:1,contains:['Morgan'],fields:0},
  'fill-pdf-form': {files:['form.pdf'],options:{values:{Reviewer:'River'}},count:1,fields:1},
  'extract-pdf-form-data': {files:['form.pdf'],json:r=>assert.equal(r.fields[0].value,'Morgan')},
  'remove-pdf-annotations': {order:['A1','A2','A3']},
  'watermark-pdf': {options:{pages:'2',text:'DRAFT'},pageText:[['A1'],['A2','DRAFT'],['A3']]},
  'number-pdf-pages': {options:{pages:'2-3',start:7,prefix:'PAGE-'},pageText:[['A1'],['A2','PAGE-7'],['A3','PAGE-8']]},
  'bates-number-pdf': {options:{pages:'2-3',start:42,prefix:'ISS-',digits:6},pageText:[['A1'],['A2','ISS-000042'],['A3','ISS-000043']]},
  'crop-pdf': {options:{pages:'2',left:10,right:20,top:30,bottom:40},crop:[{x:0,y:0,width:360,height:480},{x:10,y:40,width:330,height:410},{x:0,y:0,width:360,height:480}]},
  'resize-pdf': {options:{paper:'Letter'},size:[612,792]},
  'add-pdf-margins': {options:{margin:36},size:[432,552]},
  'pdf-booklet': {count:2,pageText:[['A1'],['A2','A3']]},
  'n-up-pdf': {options:{perSheet:'4'},count:1,pageText:[['A1','A2','A3']]},
  'add-text-to-pdf': {options:{pages:'2',text:'CHECK'},pageText:[['A1'],['A2','CHECK'],['A3']]},
  'add-image-to-pdf': {files:['source.pdf','image.png'],count:3},
  'edit-pdf-metadata': {options:{title:'Issued set',author:'QA',subject:'Review',keywords:'site,issued'},metadata:true},
  'inspect-pdf': {json:r=>{assert.equal(r.pageCount,3);assert.equal(r.pages[0].width,360);}},
  'compare-pdf-text': {files:['source.pdf','second.pdf'],json:r=>{assert.equal(r.pagesBefore,3);assert.equal(r.pagesAfter,2);assert.match(r.changes[0].removed.join(' '),/A1/);assert.match(r.changes[0].added.join(' '),/B1/);assert.equal(r.changes[2].changed,true);}}
};
const client = new Client({name:'all-tools-acceptance',version:'1.0.0'});
const transport = new StdioClientTransport({command:process.execPath,args:['scripts/toolkit/server.mjs','--root',root],stderr:'pipe'});
await client.connect(transport);
try {
  for (const tool of catalog) await test(`MCP acceptance: ${tool.id}`,async()=>{
    const s = scenarios[tool.id]; assert.ok(s,'Every tool needs a scenario');
    const args = {request_id:`acceptance-${tool.id}`,files:(s.files || ['source.pdf']).map(name=>({path:name,sha256:hash(sources[name])})),options:s.options || {}};
    const result = await client.callTool({name:`polypdf_${tool.id.replaceAll('-','_')}`,arguments:args});
    assert.ok(!result.isError,JSON.stringify(result));
    const receipt = result.structuredContent;
    assert.equal(receipt.outputs.length,s.names?.length || s.groups?.length || 1);
    const adapter = await nodeAdapter();
    try {
      for (const [index,output] of receipt.outputs.entries()) {
        const bytes = new Uint8Array(await fs.readFile(output.path));
        assert.equal(hash(bytes),output.sha256);
        const resource = await client.readResource({uri:output.uri});
        assert.equal(hash(Buffer.from(resource.contents[0].blob,'base64')),output.sha256);
        if (s.names) assert.equal(path.basename(output.path),s.names[index]);
        if (output.mimeType === 'application/pdf') {
          const pdf = await PDFDocument.load(bytes);
          const expectedOrder = s.groups?.[index] || s.order;
          assert.equal(pdf.getPageCount(),expectedOrder?.length || s.count || 3);
          const texts = (await adapter.text(bytes,pdf.getPageIndices())).map(p=>p.text.trim());
          if (expectedOrder) assert.deepEqual(texts,expectedOrder);
          if (s.contains) for (const text of s.contains) assert.ok(texts.join('\n').includes(text));
          if (s.pageText) texts.forEach((text,i)=>{for(const expected of s.pageText[i])assert.ok(text.includes(expected));if(s.pageText[i].length===1)assert.equal(text,s.pageText[i][0]);});
          if (s.rotations) assert.deepEqual(pdf.getPages().map(p=>p.getRotation().angle),s.rotations);
          if (s.crop) assert.deepEqual(pdf.getPages().map(p=>p.getCropBox()),s.crop);
          if (s.size) for(const p of pdf.getPages()) assert.deepEqual([p.getWidth(),p.getHeight()],s.size);
          if (s.fields !== undefined) assert.equal(pdf.getForm().getFields().length,s.fields);
          if (tool.id === 'fill-pdf-form') assert.equal(pdf.getForm().getTextField('Reviewer').getText(),'River');
          if (s.metadata) {assert.equal(pdf.getTitle(),'Issued set');assert.equal(pdf.getAuthor(),'QA');assert.equal(pdf.getSubject(),'Review');assert.match(pdf.getKeywords(),/site/);}
          assert.ok((await adapter.render(bytes,0,{format:'png',dpi:72})).bytes.length>100);
        } else if (s.image) {
          const image = await loadImage(Buffer.from(bytes)); assert.equal(image.width,360); assert.equal(image.height,480);
        } else if (s.json) s.json(JSON.parse(new TextDecoder().decode(bytes)));
        else if (s.text) assert.match(new TextDecoder().decode(bytes),s.text);
      }
    } finally {await adapter.dispose();}
    const retry = await client.callTool({name:`polypdf_${tool.id.replaceAll('-','_')}`,arguments:args});
    assert.equal(retry.structuredContent.replayed,true);
    assert.deepEqual(retry.structuredContent.outputs,receipt.outputs);
    for (const file of args.files) assert.equal(hash(await fs.readFile(path.join(root,file.path))),file.sha256);
  });
} finally {await client.close();}
