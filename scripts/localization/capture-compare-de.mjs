// Actual Compare Documents, native Open/Save dialogs, and a fresh-process reopen.
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
const out=resolve(root,'.tmp/localization/compare-de'),profile=resolve(out,'profile');
const sampleRoot=resolve(root,'public/localized-media/de/samples/compare');
const sources=['a','b'].map(revision=>resolve(sampleRoot,`architektur-revision-${revision}.pdf`));
const saved=resolve(out,'vergleich-a-b.pdf'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHashes=sources.map(file=>hash(readFileSync(file)));
const verification=JSON.parse(readFileSync(resolve(sampleRoot,'source-verification.json')));
assert.deepEqual(sourceHashes,verification.documents.map(d=>d.sha256));
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json')));
const {capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256,'Current app source must be built');
assert.ok(!existsSync(saved),'Keep a prior saved result; use a fresh output directory for another capture');
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w'),shots=[];
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
let originalClouds,reopenedClouds,sourceLinks,dialogText,rows,completion;
const linkFacts=items=>items.filter(a=>a.tool==='hyperlink').map(({page,x,y,width,height,contents,hyperlinkTarget})=>({page,x,y,width,height,contents,hyperlinkTarget})).sort((a,b)=>a.x-b.x);
const cloudFacts=clouds=>clouds.filter(a=>a.id.startsWith('comparecloud-')).map(({id,label,author,page,x,y,width,height,points})=>({id,label,author,page,x,y,width,height,points})).sort((a,b)=>a.id.localeCompare(b.id));
try {for(const [index,phase] of ['language','walkthrough','reopen'].entries()){
 let socket,started=false,call,evaluate;
 const port=9477+index;
 try{
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,
   ...(phase==='language'?[]:['--open',phase==='walkthrough'?sources[0]:saved]),'--',`--remote-debugging-port=${port}`,'--use-mock-keychain'],
   {cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_TELEMETRY_ENABLED:'0'}});started=true;
  let target;
  for(let n=0;n<150&&!target;n++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{}if(!target)await sleep(150);}
  assert.ok(target);socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject);});
  let seq=0;const pending=new Map();
  socket.on('message',raw=>{const m=JSON.parse(String(raw)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.done(m.result);});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`));},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  evaluate=async body=>{const r=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const wait=async(expression,attempts=200)=>{for(let n=0;n<attempts;n++){if(await evaluate(`return Boolean(${expression});`))return;await sleep(150);}throw new Error(`Not reached: ${expression}`);};
  const annotations=()=>evaluate('return window.polyPDFAutomation.annotations();');
  const command=async value=>evaluate(`window.polyPDFAutomation.menuCommand(${JSON.stringify(value)});`);
  const capture=async file=>{
   await sleep(700);const bytes=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64');
   const png=PNG.sync.read(bytes);assert.equal(png.width,1710);assert.equal(png.height,1073);
   writeFileSync(resolve(out,file),bytes);shots.push({file,sha256:hash(bytes)});
  };
  await wait('window.polyPDF && window.polyPDFAutomation');
  await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);continue;
  }
  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await command({type:'pageLayout',mode:'single'});await command({type:'viewZoom',mode:'fitPage'});await sleep(1200);
  if(phase==='walkthrough'){
   sourceLinks=linkFacts(await annotations());assert.equal(sourceLinks.length,2);assert.equal((await annotations()).length,2);
   await command({type:'documentDialog',dialog:'compareDocuments'});
   await wait('document.querySelector("[data-dialog-id=compareDocuments]")');
   await evaluate('document.querySelector("[data-pick-pdf=compare-b]").click();');
   console.log(`Native Open: select ${sources[1]}`);
   await wait(`document.querySelector('[data-pdf-source-label="compare-b"]')?.textContent.includes('architektur-revision-b.pdf')`,2000);
   await wait('!document.querySelector("[data-dialog-id=compareDocuments] [data-dialog-confirm]").disabled');
   dialogText=await evaluate('return document.querySelector("[data-dialog-id=compareDocuments]").innerText;');
   assert.ok(dialogText.includes('Dokumente vergleichen')&&dialogText.includes('architektur-revision-b.pdf'));
   await capture('vergleich-dialog.png');
   await evaluate('document.querySelector("[data-dialog-id=compareDocuments] [data-dialog-confirm]").click();');
   await wait('window.polyPDFAutomation.annotations().some(a=>a.id.startsWith("comparecloud-"))',1200);
   await sleep(1200);
   originalClouds=cloudFacts(await annotations());assert.deepEqual(linkFacts(await annotations()),sourceLinks,'Source links remain intact');
   assert.ok(originalClouds.length>0&&originalClouds.every(a=>a.label.startsWith('Vergleichsänderung S. ')&&a.author==='Vergleich'));
   assert.deepEqual([...new Set(originalClouds.map(a=>a.page))].sort(),[1,2]);
   completion=await evaluate('return document.body.innerText;');
   console.log(`Comparison produced ${originalClouds.length} German revision clouds across both sheets`);
  }else{
   await wait(`window.polyPDFAutomation.annotations().filter(a=>a.id.startsWith("comparecloud-")).length===${originalClouds.length}`);
   reopenedClouds=cloudFacts(await annotations());assert.deepEqual(linkFacts(await annotations()),sourceLinks,'Fresh reopen retains source links');assert.deepEqual(reopenedClouds,originalClouds,'Fresh reopen retains labels, authors, IDs and geometry');
  }
  if(!await evaluate('return Boolean(document.querySelector("#markup-rows .markup-row"));'))await command({type:'toggleMarkupTable'});
  await wait(`document.querySelectorAll('#markup-rows .markup-row[data-markup-row-id^=comparecloud-]').length===${originalClouds.length}`);
  rows=await evaluate('return [...document.querySelectorAll("#markup-rows .markup-row")].map(e=>({id:e.dataset.markupRowId,text:e.innerText}));');
  assert.equal(rows.filter(r=>r.id.startsWith('comparecloud-')&&r.text.includes('Vergleichsänderung')).length,originalClouds.length);
  const first=originalClouds.find(a=>a.page===1);
  await evaluate(`document.querySelector('[data-markup-row-id="${first.id}"]').click();`);
  await wait(`document.querySelector('[data-markup-row-id="${first.id}"]').getAttribute('aria-selected')==='true'`);
  await command({type:'viewZoom',mode:'fitPage'});
  await capture(phase==='walkthrough'?'vergleich-a101.png':'vergleich-wieder-geoeffnet.png');
  if(phase==='walkthrough'){
   const second=originalClouds.find(a=>a.page===2);
   await evaluate(`document.querySelector('[data-markup-row-id="${second.id}"]').click();`);
   await wait(`document.querySelector('[data-markup-row-id="${second.id}"]').getAttribute('aria-selected')==='true'`);
   await command({type:'viewZoom',mode:'fitPage'});await capture('vergleich-a201.png');
   await command({type:'save',mode:'saveAs'});console.log(`Native Save: save result as ${saved}`);
   for(let n=0;n<2000&&!existsSync(saved);n++)await sleep(150);
   assert.ok(existsSync(saved),'Native Save must create the expected file');
   await wait(`document.querySelector('.primary-tab-strip [data-document-tab-id].active .tab-label')?.textContent.includes('vergleich-a-b.pdf')`);
   await sleep(1500);const firstHash=hash(readFileSync(saved));await sleep(800);assert.equal(hash(readFileSync(saved)),firstHash,'Saved bytes are stable');
  }
 }catch(error){if(evaluate&&call){try{
   writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,annotations:window.polyPDFAutomation?.annotations(),dialogs:[...document.querySelectorAll("[role=dialog]")].map(e=>e.outerHTML)};'),null,2));
   writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }catch{}}throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='reopen'?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});assert.deepEqual(sources.map(file=>hash(readFileSync(file))),sourceHashes);}
}}finally{closeSync(log);}
assert.ok(reopenedClouds);writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceHashes,savedSha256:hash(readFileSync(saved)),captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),originalClouds,reopenedClouds,sourceLinks,rows,dialogText,completion,shots,capture:'Actual owned Electron app; production menu and UI handlers; native Open and Save completed through computer use; fresh-process reopen; annotation observer is read-only.',limitations:['Local Mac development build; not a published release or Windows/native iPad qualification','Bundled plugins disabled; German comparison author and subjects are creation-time document content']},null,2)+'\n');
console.log('German comparison, native Save and fresh reopen verified.');
