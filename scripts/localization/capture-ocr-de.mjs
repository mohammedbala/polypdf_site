// Actual German OCR, native export/save, and fresh-process searchable-layer verification.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT to the isolated built app workspace');
const require=createRequire(resolve(app,'package.json')),WebSocket=require('ws'),{PNG}=require('pngjs');

const out=resolve(root,'.tmp/localization/ocr-de'),profile=resolve(out,'profile');
const sampleRoot=resolve(root,'public/localized-media/de/samples/ocr'),source=resolve(sampleRoot,'bestandsplaene-a101-c101.pdf');
const saved=resolve(out,'bestandsplaene-durchsuchbar.pdf'),workbook=resolve(out,'bestandsplaene-ocr.xlsx');
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHash=hash(readFileSync(source));
assert.equal(sourceHash,JSON.parse(readFileSync(resolve(sampleRoot,'source-verification.json'))).sha256);
for(const file of [saved,workbook])assert.ok(!existsSync(file),`Preserve earlier output: ${file}`);
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json'))),{capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);
mkdirSync(out,{recursive:true});const log=openSync(resolve(out,'electron.log'),'w'),shots=[],sleep=ms=>new Promise(done=>setTimeout(done,ms));
let before,completion;const searches={};
try{for(const [index,phase] of ['language','walkthrough','reopen'].entries()){
 let socket,started=false,call,evaluate;
 try{
  const port=9487+index;
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='language'?[]:['--open',phase==='walkthrough'?source:saved]),'--',`--remote-debugging-port=${port}`,'--use-mock-keychain'],{cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_TELEMETRY_ENABLED:'0'}});started=true;
  let target;for(let n=0;n<150&&!target;n++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{}if(!target)await sleep(150);}assert.ok(target);
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject)});
  let seq=0;const pending=new Map();socket.on('message',raw=>{const m=JSON.parse(String(raw)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.done(m.result)});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`))},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}))});
  evaluate=async body=>{const r=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
  const wait=async(expr,attempts=200)=>{for(let n=0;n<attempts;n++){if(await evaluate(`return Boolean(${expr});`))return;await sleep(150)}throw new Error(`Not reached: ${expr}`)};
  const click=sel=>evaluate(`document.querySelector(${JSON.stringify(sel)}).click();`),command=v=>evaluate(`window.polyPDFAutomation.menuCommand(${JSON.stringify(v)});`);
  const annotations=()=>evaluate('return window.polyPDFAutomation.annotations();');
  const capture=async file=>{await sleep(700);const bytes=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'),png=PNG.sync.read(bytes);assert.equal(png.width,1710);assert.equal(png.height,1073);writeFileSync(resolve(out,file),bytes);shots.push({file,sha256:hash(bytes)})};
  const waitFile=async file=>{for(let n=0;n<2000&&!existsSync(file);n++)await sleep(150);assert.ok(existsSync(file),`Native Save must create ${file}`);await sleep(1200);const before=hash(readFileSync(file));await sleep(600);assert.equal(hash(readFileSync(file)),before)};
  await wait('window.polyPDF && window.polyPDFAutomation');await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);
   await click('[data-rail-settings]');await wait('document.querySelector("[data-settings-measurement-units]")');
   await evaluate("const e=document.querySelector('[data-settings-measurement-units]');e.value='metric';e.dispatchEvent(new Event('change',{bubbles:true}));");
   await click('[data-dialog-id=settings] [data-dialog-confirm]');await wait('!document.querySelector("[data-settings-measurement-units]")');continue;
  }

  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await command({type:'pageLayout',mode:'single'});await command({type:'panel',panel:'search'});await command({type:'viewZoom',mode:'fitPage'});await sleep(1200);
  const search=async term=>{
   await wait('document.querySelector(".search-box input")');
   await evaluate(`const e=document.querySelector('.search-box input');e.value=${JSON.stringify(term)};e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.search-box').requestSubmit();`);
   await sleep(1000);await wait('document.querySelector(".search-results.empty") || document.querySelector(".search-row")');
   return await evaluate('return {query:document.querySelector(".search-box input").value,rows:[...document.querySelectorAll(".search-row")].map(r=>r.innerText),text:document.querySelector(".search-results").innerText};');
  };
  if(phase==='walkthrough'){
   before=await search('MEHRZWECKRAUM');assert.equal(before.rows.length,0);assert.equal(before.text,'Keine Treffer.');await capture('ocr-ohne-text.png');
   await command({type:'documentDialog',dialog:'ocr'});await wait('document.querySelector("[data-ocr-progress]")');
   console.log('Running actual native OCR on both German scan pages.');
   await wait('document.querySelector("[data-ocr-progress]").value===100 && document.querySelector("[data-ocr-cancel]").disabled',4000);
   completion=await evaluate('return document.querySelector("[data-dialog-id=ocr]").innerText;');
   assert.ok(!await evaluate('return Boolean(document.querySelector("[data-ocr-failed]"));'));
   await capture('ocr-abgeschlossen.png');await click('[data-ocr-close]');
   await command({type:'exportOffice',format:'excelWorkbook',mode:'editableText'});
   console.log(`Native Save workbook: ${workbook}`);await waitFile(workbook);
   await command({type:'save',mode:'saveAs'});console.log(`Native Save PDF: ${saved}`);await waitFile(saved);
   await wait('document.querySelector(".primary-tab-strip .active .tab-label").textContent.includes("bestandsplaene-durchsuchbar.pdf")');
  }
  searches[phase]=[];
  for(const [term,page] of [['MEHRZWECKRAUM',1],['ENTWÄSSERUNG',2]]){
   const result=await search(term);assert.ok(result.rows.length>0,`No OCR match: ${term}`);
   await click('.search-row');await wait('document.querySelector(".search-hit-rect.selected")');
   const selected=await evaluate('return {row:document.querySelector(".search-row.selected").innerText,rects:[...document.querySelectorAll(".search-hit-rect.selected")].map(e=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top),width:parseFloat(e.style.width),height:parseFloat(e.style.height)}))};');
   assert.ok(selected.row.startsWith(`Seite ${page}`));assert.ok(selected.rects.every(r=>r.width>0&&r.height>0));
   searches[phase].push({...result,...selected});
   if(phase==='reopen')await capture(page===1?'ocr-suche-mehrzweckraum.png':'ocr-suche-entwaesserung.png');
  }
  if(phase==='reopen')assert.deepEqual(searches.reopen,searches.walkthrough);
 }catch(error){if(evaluate&&call){try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,dialogs:[...document.querySelectorAll("[role=dialog]")].map(e=>e.outerHTML)};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'))}catch{}}console.error(error);throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='reopen'?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});assert.equal(hash(readFileSync(source)),sourceHash)}
}}finally{closeSync(log)}
assert.ok(searches.reopen);
writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),before,completion,searches,shots,outputs:[saved,workbook].map(file=>({file:file.slice(out.length+1),sha256:hash(readFileSync(file))})),capture:'Actual owned German Electron instance; real whole-document native OCR; normal Excel/PDF native Save dialogs; fresh-process search on both pages; state observers do not seed recognition or search.',limitations:['Local Mac development build; Windows and native iPad not qualified.','OCR is best effort. Selected matches do not establish full transcription accuracy.','Workbook tables are inferred and need independent review.']},null,2)+'\n');
console.log('German native OCR, workbook/PDF saves and fresh-process search verified.');
