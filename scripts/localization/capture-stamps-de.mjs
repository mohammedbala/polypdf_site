// German stamp builder, required prompt, native Save As and fresh-process persistence.
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT');
const require=createRequire(resolve(app,'package.json')),WebSocket=require('ws');
const out=resolve(root,'.tmp/localization/stamps-de'),profile=resolve(out,'profile');
const source=resolve(root,'public/localized-media/de/samples/stamps/pruefplan-vorlage.pdf'),saved=resolve(out,'pruefplan-mit-stempel.pdf');
assert.ok(!existsSync(saved),'Preserve the previous saved PDF');
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHash=hash(readFileSync(source));
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json')));
const {capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w'),shots=[],sleep=ms=>new Promise(done=>setTimeout(done,ms));
const key='PPM-STMP-TEST-PRO1',keys=generateKeyPairSync('ed25519');let activations=0;
const server=createServer(async(request,response)=>{
 try{
  const chunks=[];for await(const chunk of request)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(body.license_key,key);assert.ok(body.machine_id);assert.ok(['/activate','/validate'].includes(request.url));
  if(request.url==='/activate')activations++;
  const issued_at=new Date().toISOString(),activation_id='act_stamp_localization';
  const payload=['polypdf-license-v1','1','active',activation_id,body.machine_id,'',issued_at].join('|');
  response.writeHead(200,{'Content-Type':'application/json'});
  response.end(JSON.stringify({valid:true,status:'active',activation_id,activations_used:1,activation_limit:3,issued_at,signature:sign(null,Buffer.from(payload),keys.privateKey).toString('base64')}));
 }catch{response.writeHead(403);response.end('{}');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let blank,fields,missing,placed,reopened,template,templateReopened,layout,reusedPrompt;
const compact=a=>({id:a.id,tool:a.tool,page:a.page,x:a.x,y:a.y,width:a.width,height:a.height,label:a.label,interactiveStamp:a.interactiveStamp});
try{for(const [index,phase] of ['language','walkthrough','reopen'].entries()){
 let socket,started=false,call,evaluate;
 try{
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='language'?[]:['--open',phase==='walkthrough'?source:saved]),'--',`--remote-debugging-port=${9501+index}`,'--use-mock-keychain'],{cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_TELEMETRY_ENABLED:'0',POLYPDF_BUILD_PROFILE:'commercial',POLYPDF_LICENSE_API_BASE_URL:`http://127.0.0.1:${server.address().port}`,POLYPDF_LICENSE_RESPONSE_PUBLIC_KEY:keys.publicKey.export({type:'spki',format:'der'}).toString('base64')}});started=true;
  let target;for(let n=0;n<150&&!target;n++){try{target=(await(await fetch(`http://127.0.0.1:${9501+index}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{/* Starting. */}if(!target)await sleep(150)}assert.ok(target);
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject)});
  let seq=0;const pending=new Map();socket.on('message',raw=>{const m=JSON.parse(String(raw)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(m.error.message));else p.done(m.result)});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`))},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}))});
  evaluate=async body=>{const r=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
  const wait=async(expr,attempts=250)=>{for(let n=0;n<attempts;n++){if(await evaluate(`return Boolean(${expr});`))return;await sleep(150)}throw new Error(`Not reached: ${expr}`)};
  const click=sel=>evaluate(`const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)throw Error('Unavailable: '+${JSON.stringify(sel)});e.click();`);
  const menu=v=>evaluate(`window.polyPDFAutomation.menuCommand(${JSON.stringify(v)});`);
  const input=(sel,value)=>evaluate(`const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)throw Error('Unavailable: '+${JSON.stringify(sel)});if(e.type==='checkbox')e.checked=${JSON.stringify(value)};else e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));`);
  const capture=async file=>{await sleep(700);const bytes=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64');writeFileSync(resolve(out,file),bytes);shots.push({file,sha256:hash(bytes)})};
  const annotations=()=>evaluate('return window.polyPDFAutomation.annotations().filter(a=>a.interactiveStamp);');
  await wait('window.polyPDF&&window.polyPDFAutomation');
  await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   await menu({type:'appDialog',dialog:'upgradePro'});await wait('document.querySelector("[data-license-key]")');
   await input('[data-license-key]',key);await click('[data-license-activate]');
   await wait('!document.querySelector("[data-license-key]")||document.querySelector("[data-license-key]").getBoundingClientRect().height===0');
   assert.equal((await evaluate('return await window.polyPDF.getLicenseState();')).tier,'pro');
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);
   await click('[data-rail-settings]');await wait('document.querySelector("[data-settings-measurement-units]")');
   await input('[data-settings-measurement-units]','metric');await click('[data-dialog-id=settings] [data-dialog-confirm]');await wait('!document.querySelector("[data-settings-measurement-units]")');continue;
  }
  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');
  assert.equal((await evaluate('return await window.polyPDF.getLicenseState();')).tier,'pro');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await menu({type:'pageLayout',mode:'single'});await menu({type:'viewZoom',mode:'fitPage'});
  await wait("document.querySelector('.page-shell')?.dataset.renderComplete==='true'");
  if(phase==='walkthrough'){
   assert.equal((await annotations()).length,0);
   await menu({type:'stampAction',action:'createInteractive'});await wait('document.querySelector("[data-dialog-id=interactiveStampBuilder]")');
   blank=await evaluate('return {width:document.querySelector("[data-canvas-width]").value,height:document.querySelector("[data-canvas-height]").value,fields:document.querySelector("[data-field-select]").disabled,saveToToolset:document.querySelector("[data-stamp-save-tool]").checked};');
   assert.deepEqual(blank,{width:'240',height:'240',fields:true,saveToToolset:true});
   await capture('stempel-leer.png');
   await input('[data-stamp-name]','Planprüfung - Übung');await input('[data-canvas-width]','300');await input('[data-canvas-height]','140');
   await input('[data-canvas-borderColor]','#245b66');await input('[data-canvas-borderWidth]','2');
   const specs=[{label:'Prüfvermerk',value:'GEPRÜFT - ÜBUNG',y:12,height:38,font:22,prompt:false,bold:true},
    {label:'Prüfende Person',value:'',y:58,height:28,font:16,prompt:true,required:true},
    {label:'Prüfdatum',value:'',source:'currentDate',y:98,height:28,font:16,prompt:false}];
   fields=[];
   for(const spec of specs){
    await click('[data-field-add]');
    for(const [key,value] of Object.entries({label:spec.label,default:spec.value,x:12,y:spec.y,width:276,height:spec.height,font:spec.font,color:'#245b66',alignment:'center',prompt:spec.prompt,required:!!spec.required,bold:!!spec.bold}))await input(`[data-field-${key}]`,value);
    if(spec.source)await input('[data-field-source]',spec.source);
    fields.push(await evaluate('return [...document.querySelectorAll("[data-stamp-editor] input,[data-stamp-editor] select")].map(e=>({attribute:[...e.attributes].find(a=>a.name.startsWith("data-field-"))?.name,value:e.value,checked:e.type==="checkbox"?e.checked:undefined,disabled:e.disabled}));'));
   }
   const ids=await evaluate('return [...document.querySelector("[data-field-select]").options].map(o=>o.value);');
   await input('[data-field-select]',ids[1]);await click('[data-preview-fit]');
   layout=await evaluate('return ["[data-field-select]","[data-field-source]"].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=document.createElement("canvas").getContext("2d");c.font=getComputedStyle(e).font;return {selector:s,label:e.selectedOptions[0].textContent,width:r.width,labelWidth:c.measureText(e.selectedOptions[0].textContent).width};});');
   assert.ok(layout.every(e=>e.width>=e.labelWidth+28),'Selected field and source labels fit');
   await capture('stempel-editor.png');
   await click('[data-dialog-id=interactiveStampBuilder] [data-dialog-confirm]');await wait('!document.querySelector("[data-dialog-id=interactiveStampBuilder]")');
   const files=readdirSync(resolve(profile,'Stamps')).filter(f=>f.endsWith('.polypdftools'));assert.equal(files.length,1);
   const bytes=readFileSync(resolve(profile,'Stamps',files[0]));writeFileSync(resolve(out,'planpruefung.polypdftools'),bytes);template={file:files[0],sha256:hash(bytes)};
   const point=await evaluate('const r=document.querySelector(".page-shell").getBoundingClientRect();return {x:r.x+r.width*(820/1683.7795),y:r.y+r.height*(1040/1190.5512)};');
   await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
   await wait('document.querySelector("[data-dialog-id=interactiveStampPlacement]")');
   await click('[data-dialog-id=interactiveStampPlacement] [data-dialog-confirm]');
   missing=await evaluate('return document.querySelector("[data-stamp-error]").textContent;');assert.equal(missing,'Füllen Sie dieses Feld aus: Prüfende Person');
   assert.equal((await annotations()).length,0);
   await input('[data-stamp-value="1"]','Musterprüfung');
   const prompt=await evaluate('return [...document.querySelectorAll("[data-stamp-value]")].map(e=>({index:e.dataset.stampValue,value:e.value,disabled:e.disabled}));');
   assert.equal(prompt[0].disabled,true);assert.equal(prompt[1].disabled,false);assert.equal(prompt[2].disabled,true);
   await capture('stempel-abfrage.png');await click('[data-dialog-id=interactiveStampPlacement] [data-dialog-confirm]');
   await wait('!document.querySelector("[data-dialog-id=interactiveStampPlacement]")&&window.polyPDFAutomation.annotations().filter(a=>a.interactiveStamp).length===1');
   placed=(await annotations()).map(compact);assert.equal(placed[0].interactiveStamp.definition.fields.length,3);
   writeFileSync(resolve(out,'placement.json'),JSON.stringify(placed,null,2)+'\n');
   await capture('stempel-platziert.png');await menu({type:'save',mode:'saveAs'});console.log(`Native Save PDF: ${saved}`);
   for(let n=0;n<2000&&!existsSync(saved);n++)await sleep(150);assert.ok(existsSync(saved));
   await wait('document.querySelector(".primary-tab-strip .active .tab-label").textContent.includes("pruefplan-mit-stempel.pdf")');await sleep(1000);
  }else{
   await wait('window.polyPDFAutomation.annotations().filter(a=>a.interactiveStamp).length===1');
   reopened=(await annotations()).map(compact);assert.equal(reopened.length,placed.length);
   for(let i=0;i<placed.length;i++){
    for(const k of ['x','y','width','height'])assert.ok(Math.abs(reopened[i][k]-placed[i][k])<0.001,`PDF coordinate precision: ${k}`);
    assert.deepEqual({...reopened[i],x:placed[i].x,y:placed[i].y,width:placed[i].width,height:placed[i].height},placed[i]);
   }
   templateReopened=hash(readFileSync(resolve(profile,'Stamps',template.file)));assert.equal(templateReopened,template.sha256);
   await capture('stempel-wieder-geoeffnet.png');
   await click('[data-toolbar-stamp-menu]');await wait('document.querySelector("[data-interactive-place]")');
   await evaluate('const b=[...document.querySelectorAll("[data-interactive-place]")].find(e=>e.textContent==="Planprüfung - Übung");if(!b)throw Error("Saved template not offered");b.click();');
   const point=await evaluate('const r=document.querySelector(".page-shell").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};');
   await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
   await wait('document.querySelector("[data-dialog-id=interactiveStampPlacement]")');
   reusedPrompt=await evaluate('return [...document.querySelectorAll("[data-stamp-value]")].map(e=>({index:e.dataset.stampValue,value:e.value,disabled:e.disabled}));');
   assert.equal(reusedPrompt[0].value,'GEPRÜFT - ÜBUNG');assert.equal(reusedPrompt[1].value,'');assert.equal(reusedPrompt[1].disabled,false);
   await click('[data-dialog-id=interactiveStampPlacement] [data-dialog-cancel]');assert.equal((await annotations()).length,1);
  }
 }catch(error){if(evaluate&&call)try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,dialogs:[...document.querySelectorAll("[role=dialog]")].map(e=>e.outerHTML)};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));}catch{/* Preserve original error. */}throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='reopen'?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});assert.equal(hash(readFileSync(source)),sourceHash);}
}}finally{server.close();closeSync(log);assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);}
writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),blank,fields,missing,placed,reopened,template,templateReopened,layout,reusedPrompt,shots,activations,savedSha256:hash(readFileSync(saved)),scope:'Actual builder and prompt controls, required refusal, pointer placement, native Save As, full process restart and actual reuse prompt from retained template. No model seeding. Pro activation uses the ordinary UI with a signed loopback fixture in the owned profile.',limitations:['Local Mac development build; no Windows/native iPad qualification.','Independent saved-PDF rendering and page verification are separate checks.','Saved coordinates agree within 0.001 PDF point; field identities, definitions and values agree exactly.']},null,2)+'\n');
console.log('German stamp creation, required prompt, native Save and fresh-process reopen verified.');
