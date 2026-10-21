// Real German form controls, native Save As, then a fresh-process reopen. No model seeding.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT');
const require=createRequire(resolve(app,'package.json')),WebSocket=require('ws');
const out=resolve(root,'.tmp/localization/forms-de'),profile=resolve(out,'profile');
const source=resolve(root,'public/localized-media/de/samples/forms-guide/planpruefung-vorlage.pdf'),saved=resolve(out,'planpruefung-ausgefuellt.pdf');
assert.ok(!existsSync(saved),'Preserve previous saved form');
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHash=hash(readFileSync(source));
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json'))),{capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);
const values={project:'Bürgerhaus / Nordflügel',visit_date:'21.10.2026',reviewer:'Musterprüfung',drawing_revision:'A101 / Revision B',trade:'Elektro',review_status:'FollowUp',drawing_checked:true,photos_referenced:false,action_assigned:true,observation:'Nur zur Übung. Türöffnung anhand von A101, Revision B prüfen.\nZuständig: Musterprüfung. Nächster Schritt: Planreferenz bestätigen.',pruefbereich:'Südflügel'};
mkdirSync(out,{recursive:true});const log=openSync(resolve(out,'electron.log'),'w'),shots=[],sleep=ms=>new Promise(done=>setTimeout(done,ms));
let before,filled,reopened,palette,duplicateError,fieldSettings;
try{for(const [index,phase] of ['language','walkthrough','reopen'].entries()){
 let socket,started=false,call,evaluate;
 try{
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='language'?[]:['--open',phase==='walkthrough'?source:saved]),'--',`--remote-debugging-port=${9493+index}`,'--use-mock-keychain'],{cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_TELEMETRY_ENABLED:'0'}});started=true;
  let target;for(let n=0;n<150&&!target;n++){try{target=(await(await fetch(`http://127.0.0.1:${9493+index}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{}if(!target)await sleep(150)}assert.ok(target);
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject)});
  let seq=0;const pending=new Map();socket.on('message',raw=>{const m=JSON.parse(String(raw)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.done(m.result)});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`))},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}))});
  evaluate=async body=>{const r=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
  const wait=async(expr,attempts=200)=>{for(let n=0;n<attempts;n++){if(await evaluate(`return Boolean(${expr});`))return;await sleep(150)}throw new Error(`Not reached: ${expr}`)};
  const click=sel=>evaluate(`document.querySelector(${JSON.stringify(sel)}).click();`),command=v=>evaluate(`window.polyPDFAutomation.menuCommand(${JSON.stringify(v)});`);
  const input=async(sel,value)=>evaluate(`const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)throw Error('Unavailable: '+${JSON.stringify(sel)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));`);
  const snapshot=()=>evaluate(`return [...document.querySelectorAll('.pdf-form-field input[data-form-field-name],.pdf-form-field textarea[data-form-field-name],.pdf-form-field select[data-form-field-name]')].map(e=>({name:e.dataset.formFieldName,type:e.type,value:e.value,checked:['checkbox','radio'].includes(e.type)?e.checked:undefined,options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:o.label,selected:o.selected})):undefined})).sort((a,b)=>a.name.localeCompare(b.name)||a.value.localeCompare(b.value));`);
  const capture=async file=>{await sleep(700);const bytes=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64');writeFileSync(resolve(out,file),bytes);shots.push({file,sha256:hash(bytes)})};
  await wait('window.polyPDF&&window.polyPDFAutomation');await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);
   await click('[data-rail-settings]');await wait('document.querySelector("[data-settings-measurement-units]")');
   await input('[data-settings-measurement-units]','metric');await click('[data-dialog-id=settings] [data-dialog-confirm]');await wait('!document.querySelector("[data-settings-measurement-units]")');continue;
  }
  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await command({type:'panel',panel:'forms'});
  const edge=await evaluate('const r=document.getElementById("sidebar-resizer").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...edge,button:'left',buttons:1,clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:500,y:edge.y,button:'left',buttons:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:500,y:edge.y,button:'left',buttons:0,clickCount:1});
  await wait('Number(document.getElementById("sidebar-resizer").getAttribute("aria-valuenow"))>=450');
  await command({type:'pageLayout',mode:'single'});await command({type:'viewZoom',mode:'fitPage'});
  await wait('document.querySelectorAll(".pdf-form-field").length>=12');await sleep(1000);
  if(phase==='walkthrough'){
   before=await snapshot();assert.equal(before.length,12);
   palette=await evaluate('return [...document.querySelectorAll("[data-form-palette-type]")].map(e=>({type:e.dataset.formPaletteType,label:e.textContent.trim()}));');
   assert.equal(palette.length,6);await capture('formular-vorlage.png');
   await evaluate("const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Feld hinzufügen');if(!b||b.disabled)throw Error('Add Field unavailable');b.click();");
   await wait('document.querySelector("[data-dialog-id=formFieldAuthoring]")');
   await input('[data-form-author-name]','project');
   duplicateError=await evaluate('return document.getElementById("form-author-name-validation").textContent;');
   assert.equal(duplicateError,'Ein Formularfeld mit diesem Namen existiert bereits.');
   assert.ok(await evaluate('return document.querySelector("[data-dialog-id=formFieldAuthoring] [data-dialog-confirm]").disabled;'));
   await input('select[data-form-author-type]','listBox');
   for(const [key,value] of Object.entries({name:'pruefbereich',tooltip:'Prüfbereich auswählen',page:'1',x:'310',y:'378',width:'245',height:'52','tab-order':'13',options:'Nordflügel\nSüdflügel\nAußenanlage',default:'Südflügel'}))await input(`[data-form-author-${key}]`,value);
   fieldSettings=await evaluate('return [...document.querySelectorAll("[data-dialog-id=formFieldAuthoring] input,[data-dialog-id=formFieldAuthoring] textarea,[data-dialog-id=formFieldAuthoring] select")].map(e=>({name:[...e.attributes].find(a=>a.name.startsWith("data-form-author-"))?.name,type:e.type,value:e.value,checked:e.checked,disabled:e.disabled}));');
   await capture('formular-listenfeld.png');await click('[data-dialog-id=formFieldAuthoring] [data-dialog-confirm]');
   await wait('!document.querySelector("[data-dialog-id=formFieldAuthoring]")&&document.querySelectorAll(".pdf-form-field").length===13');
   for(const [name,value] of Object.entries(values)){
    await evaluate(`const controls=[...document.querySelectorAll('.pdf-form-field input[data-form-field-name],.pdf-form-field textarea[data-form-field-name],.pdf-form-field select[data-form-field-name]')].filter(e=>e.dataset.formFieldName===${JSON.stringify(name)});const e=controls.find(e=>e.type==='radio'?e.value===${JSON.stringify(value)}:true);if(!e||e.disabled||e.readOnly)throw Error('Form control unavailable: '+${JSON.stringify(name)});if(['checkbox','radio'].includes(e.type))e.checked=${JSON.stringify(value)}===true||e.type==='radio';else e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));`);
    await sleep(80);
   }
   await evaluate('document.activeElement?.blur();');await sleep(300);filled=await snapshot();assert.equal(filled.length,13);
   await capture('formular-ausgefuellt.png');await command({type:'save',mode:'saveAs'});console.log(`Native Save PDF: ${saved}`);
   for(let n=0;n<2000&&!existsSync(saved);n++)await sleep(150);assert.ok(existsSync(saved));await sleep(1500);
   await wait('document.querySelector(".primary-tab-strip .active .tab-label").textContent.includes("planpruefung-ausgefuellt.pdf")');
  }else{
   reopened=await snapshot();assert.deepEqual(reopened,filled);await capture('formular-wieder-geoeffnet.png');
  }
 }catch(error){if(evaluate&&call)try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,dialogs:[...document.querySelectorAll("[role=dialog]")].map(e=>e.outerHTML)};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'))}catch{}throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='reopen'?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});assert.equal(hash(readFileSync(source)),sourceHash)}
}}finally{closeSync(log)}
writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),before,palette,duplicateError,fieldSettings,values,filled,reopened,shots,savedSha256:hash(readFileSync(saved)),scope:'Actual German form controls and authoring dialog, duplicate-name refusal, all eleven values through DOM events, native Save As and full process restart. No model seeding.',limitations:['Local Mac development build; no Windows/native iPad or third-party interactive filling qualification.','Field types are exercised through renderer controls; hardware keyboard tab-order testing remains separate.']},null,2)+'\n');
console.log('German form authoring, fill, native Save and fresh-process reopen verified.');
