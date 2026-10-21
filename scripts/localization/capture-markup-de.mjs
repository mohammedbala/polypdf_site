// Real German review-register controls, native saves/exports, and fresh-process reopen.
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
const controlsOnly=process.argv.includes('--controls-only');
const out=resolve(root,'.tmp/localization/markup-de'),profile=resolve(out,'profile');
const sampleRoot=resolve(root,'public/localized-media/de/samples/markup'),source=resolve(sampleRoot,'x101-koordinationspruefung.pdf');
const saved=resolve(out,'x101-pruefregister.pdf'),csv=resolve(out,'pruefregister.csv'),summary=resolve(out,'pruefregister-zusammenfassung.pdf');
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHash=hash(readFileSync(source)),sourceProof=JSON.parse(readFileSync(resolve(sampleRoot,'source-verification.json')));
assert.equal(sourceHash,sourceProof.sha256);for(const file of [saved,csv,summary])assert.ok(!existsSync(file),`Retain previous output before another capture: ${file}`);
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json'))),{capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256,'Current app source must be built');
mkdirSync(out,{recursive:true});const log=openSync(resolve(out,'electron.log'),'w'),shots=[],sleep=ms=>new Promise(done=>setTimeout(done,ms));
const facts=items=>items.map(({id,tool,nativeSubject,contents,status,author,page,x,y,width,height})=>({id,tool,nativeSubject,contents,status,author,page,x,y,width,height})).sort((a,b)=>a.nativeSubject.localeCompare(b.nativeSubject));
let initialNotes,reviewedNotes,reopenedNotes,rows,filteredRows,exportOptions,filterText,columnHeaders,paperDimensions;
const shownColumns=['Betreff','Status','Seite','Kommentare','Autor'];
const closedComment='Übung: Durchführungsdetail ergänzt. Ausführung als abgeschlossen gemeldet; unabhängige Prüfung steht aus.';
try{for(const [index,phase] of (controlsOnly?['language','walkthrough']:['language','walkthrough','reopen']).entries()){
 let socket,started=false,call,evaluate;
 try{
  const port=9477+index;
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
  const rowSelector=id=>`[data-markup-row-id="${id}"]`;
  const tableRows=()=>evaluate('return [...document.querySelectorAll("#markup-rows .markup-row")].map(r=>({id:r.dataset.markupRowId,subject:r.querySelector(".kind").textContent,status:r.querySelector("[data-markup-status]").selectedOptions[0].textContent,comment:r.querySelector(".col-comments").textContent}));');
  await wait('window.polyPDF && window.polyPDFAutomation');await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);
   await click('[data-rail-settings]');await wait('document.querySelector("[data-settings-measurement-units]")');
   await evaluate("const e=document.querySelector('[data-settings-measurement-units]');e.value='metric';e.dispatchEvent(new Event('change',{bubbles:true}));");
   await click('[data-dialog-id=settings] [data-dialog-confirm]');await wait('!document.querySelector("[data-settings-measurement-units]")');continue;
  }
  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');await wait('window.polyPDFAutomation.annotations().length===3');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});await command({type:'pageLayout',mode:'single'});
  if(!await evaluate('return Boolean(document.querySelector("#markup-rows .markup-row"));'))await command({type:'toggleMarkupTable'});
  await wait('document.querySelectorAll("#markup-rows .markup-row").length===3');
  if(phase==='walkthrough'){
   await click('[data-markup-columns]');await wait('document.querySelector("[data-dialog-id=markupColumns]")');
   await evaluate(`for(const row of document.querySelectorAll('[data-column-manager] .summary-option-row')){const box=row.querySelector('input[type=checkbox]'),label=row.querySelector('span')?.textContent,want=${JSON.stringify(shownColumns)}.includes(label);if(box&&!box.disabled&&box.checked!==want)box.click();}`);
   await click('[data-dialog-id=markupColumns] [data-dialog-confirm]');await wait('!document.querySelector("[data-dialog-id=markupColumns]")');
  }
  columnHeaders=await evaluate('return [...document.querySelectorAll("#markup-column-header .markup-col-label")].map(e=>e.textContent);');assert.deepEqual(columnHeaders,shownColumns);
  // Enlarge the real Status and Page columns through their drag handles, without CSS overrides.
  for(const [column,delta] of [['subject',-65],['page',40]]){
   const edge=await evaluate(`const e=document.querySelector('[data-markup-resize-col=${column}]'),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};`);
   await call('Input.dispatchMouseEvent',{type:'mousePressed',x:edge.x,y:edge.y,button:'left',buttons:1,clickCount:1});
   await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:edge.x+delta,y:edge.y,button:'left',buttons:1});
   await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:edge.x+delta,y:edge.y,button:'left',buttons:0,clickCount:1});
  }
  await wait('document.querySelector("#markup-column-header .col-status").getBoundingClientRect().width>=170');
  await wait('document.querySelector("#markup-column-header .col-page").getBoundingClientRect().width>=90');
  paperDimensions=await evaluate('return document.querySelector("[data-footer-overflow-readout]").textContent;');assert.equal(paperDimensions,'841 x 594 mm');
  if(phase==='walkthrough'){
   initialNotes=facts(await annotations());assert.deepEqual(initialNotes.map(n=>n.nativeSubject),sourceProof.notes.map(n=>n.subject));
   const setStatus=async(id,label)=>{const selector=rowSelector(id)+' [data-markup-status]';await evaluate(`const e=document.querySelector(${JSON.stringify(selector)}),option=[...e.options].find(o=>o.textContent===${JSON.stringify(label)});if(!option)throw Error('Missing German status');e.value=option.value;e.dispatchEvent(new Event('change',{bubbles:true}));`);await wait(`document.querySelector(${JSON.stringify(selector)}).selectedOptions[0].textContent===${JSON.stringify(label)}`)};
   for(const note of initialNotes)await setStatus(note.id,'Offen');
   await setStatus(initialNotes[1].id,'In Bearbeitung');
   const cell=rowSelector(initialNotes[2].id)+' .markup-comment-cell';await evaluate(`document.querySelector(${JSON.stringify(cell)}).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));`);await wait('document.querySelector(".markup-comment-input")');
   await evaluate(`const e=document.querySelector('.markup-comment-input');e.value=${JSON.stringify(closedComment)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));`);
   await wait(`window.polyPDFAutomation.annotations().some(a=>a.contents===${JSON.stringify(closedComment)})`);await setStatus(initialNotes[2].id,'Abgeschlossen');
   reviewedNotes=facts(await annotations());rows=await tableRows();assert.deepEqual(rows.map(r=>r.status),['Offen','In Bearbeitung','Abgeschlossen']);
   await click(rowSelector(initialNotes[0].id));await wait(`document.querySelector(${JSON.stringify(rowSelector(initialNotes[0].id))}).getAttribute('aria-selected')==='true'`);await command({type:'viewZoom',mode:'fitPage'});await capture('pruefregister-drei-status.png');
   await click('[data-markup-filter-col="status"]');await wait('!document.querySelector(".markup-filter-dropdown").classList.contains("hidden")');
   await evaluate(`const labels=[...document.querySelectorAll('.markup-filter-dropdown-option')],label=labels.find(e=>e.querySelector('.markup-filter-dropdown-value')?.textContent==='Abgeschlossen');if(!label)throw Error('Missing completed filter');label.querySelector('input').click();`);
   await wait('document.querySelectorAll("#markup-rows .markup-row").length===2');filteredRows=await tableRows();assert.deepEqual(filteredRows.map(r=>r.status),['Offen','In Bearbeitung']);filterText=await evaluate('return document.querySelector(".markup-filter-dropdown").innerText;');await capture('pruefregister-filter.png');
   await click('.markup-filter-dropdown [data-filter-clear]');await wait('document.querySelectorAll("#markup-rows .markup-row").length===3');await click('.markup-filter-dropdown [data-filter-done]');
   if(controlsOnly)continue;
   await command({type:'save',mode:'saveAs'});console.log(`Native Save PDF: ${saved}`);await waitFile(saved);await wait('document.querySelector(".primary-tab-strip .active .tab-label").textContent.includes("x101-pruefregister.pdf")');
   for(const [format,file] of [['csv',csv],['summaryPdf',summary]]){
    await click('#markup-export-button');await click(`#markup-export-menu [data-export-format="${format}"]`);await wait('document.querySelector("[data-dialog-id=summaryExport]")');
    await evaluate(`for(const row of document.querySelectorAll('[data-report-columns] .summary-option-row')){const label=row.querySelector('label'),box=label.querySelector('input'),want=['Betreff','Status','Seite','Kommentare','Autor'].includes(label.textContent.trim());if(box.checked!==want)box.click();}for(const row of document.querySelectorAll('[data-report-groups] .summary-option-row')){const label=row.querySelector('label'),box=label.querySelector('input'),want=label.textContent.trim()==='Status';if(box.checked!==want)box.click();}const open=document.querySelector('[data-report-open]');if(open?.checked)open.click();`);
    exportOptions=await evaluate('return document.querySelector("[data-dialog-id=summaryExport]").innerText;');if(format==='summaryPdf')await capture('pruefregister-exportoptionen.png');
    await click('[data-dialog-id=summaryExport] [data-dialog-confirm]');console.log(`Native Save ${format}: ${file}`);await waitFile(file);
   }
   assert.deepEqual(facts(await annotations()),reviewedNotes,'Exports do not edit the review notes');
  }else{
   reopenedNotes=facts(await annotations());assert.deepEqual(reopenedNotes,reviewedNotes);assert.deepEqual(await tableRows(),rows);await click(rowSelector(reopenedNotes[0].id));await command({type:'viewZoom',mode:'fitPage'});await capture('pruefregister-wieder-geoeffnet.png');
  }
 }catch(error){if(evaluate&&call){try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,annotations:window.polyPDFAutomation?.annotations(),dialogs:[...document.querySelectorAll("[role=dialog]")].map(e=>e.outerHTML)};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'))}catch{}}throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='reopen'||controlsOnly&&phase==='walkthrough'?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});assert.equal(hash(readFileSync(source)),sourceHash)}
}}finally{closeSync(log)}
if(!controlsOnly)assert.ok(reopenedNotes);
writeFileSync(resolve(out,controlsOnly?'controls-validation.json':'validation.json'),JSON.stringify({status:controlsOnly?'partial':'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),initialNotes,reviewedNotes,reopenedNotes,rows,filteredRows,filterText,columnHeaders,paperDimensions,exportOptions,shots,outputs:controlsOnly?[]:[saved,csv,summary].map(file=>({file:file.slice(out.length+1),sha256:hash(readFileSync(file))})),capture:controlsOnly?'Actual owned Electron app; German metric profile; production column/status/comment/filter handlers; no native save, export or reopen.':'Actual owned Electron app; prepared regional source notes; production table status/comment/filter/export handlers; native Save dialogs; fresh-process reopen; annotation observer is read-only.',limitations:[...(controlsOnly?['Controls-only evidence: native Save, exports and fresh-process reopen remain unverified.']:[]),'Local Mac development build; not a published release or Windows/native iPad qualification','The source has three prepared editable notes. This run does not demonstrate drawing new annotations.','Completion is fictional demonstration data, not a real project approval.']},null,2)+'\n');
console.log(controlsOnly?'German controls verified; native Save, exports and reopen remain pending.':'German review register, filtering, native Save/exports and fresh reopen verified.');
