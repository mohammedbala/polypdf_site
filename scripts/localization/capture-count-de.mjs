// Real pointer capture, candidate review and Count; no search/annotation injection.
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT to the isolated built app workspace');
const require=createRequire(resolve(app,'package.json')),WebSocket=require('ws'),{PNG}=require('pngjs');
const out=resolve(root,'.tmp/localization/count-de'),profile=resolve(out,'profile'),port=9476;
const source=resolve(root,'public/localized-media/de/samples/count/q101-symbolzaehlung.pdf');
const geometry=JSON.parse(readFileSync(resolve(root,'public/localized-media/de/samples/count/geometry.json')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sourceHash=hash(readFileSync(source));
assert.equal(sourceHash,geometry.sourceSha256);
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json')));
const {capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256,'Current app source must be built');
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w'),shots=[];
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const key='PPM-CONT-TEST-PRO1',keys=generateKeyPairSync('ed25519');let activations=0;
const server=createServer(async(request,response)=>{
 try{
  const chunks=[];for await(const chunk of request)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(body.license_key,key);assert.ok(body.machine_id);assert.ok(['/activate','/validate'].includes(request.url));
  if(request.url==='/activate')activations++;
  const issued_at=new Date().toISOString(),activation_id='act_count_localization';
  const payload=['polypdf-license-v1','1','active',activation_id,body.machine_id,'',issued_at].join('|');
  response.writeHead(200,{'Content-Type':'application/json'});
  response.end(JSON.stringify({valid:true,status:'active',activation_id,activations_used:1,activation_limit:3,issued_at,signature:sign(null,Buffer.from(payload),keys.privateKey).toString('base64')}));
 }catch{response.writeHead(403);response.end('{}');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let evidence;
try { for(const phase of ['language','walkthrough']){
 let socket,started=false,call,evaluate;
 try{
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='walkthrough'?['--open',source]:[]),'--',`--remote-debugging-port=${port}`,'--use-mock-keychain'],{
   cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_BUILD_PROFILE:'commercial',POLYPDF_TELEMETRY_ENABLED:'0',POLYPDF_LICENSE_API_BASE_URL:`http://127.0.0.1:${server.address().port}`,POLYPDF_LICENSE_RESPONSE_PUBLIC_KEY:keys.publicKey.export({type:'spki',format:'der'}).toString('base64')}});started=true;
  let target;
  for(let n=0;n<120&&!target;n++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{}if(!target)await sleep(150);}
  assert.ok(target);socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject);});
  let seq=0;const pending=new Map();
  socket.on('message',raw=>{const m=JSON.parse(String(raw)),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.done(m.result);});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`));},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  evaluate=async body=>{const r=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const wait=async(expression,attempts=150)=>{for(let n=0;n<attempts;n++){if(await evaluate(`return Boolean(${expression});`))return;if(n%100===99)console.log(`Waiting for ${expression}`);await sleep(150);}throw new Error(`Not reached: ${expression}`);};
  const annotations=()=>evaluate('return window.polyPDFAutomation.annotations();');
  const pageRect=()=>evaluate("const r=document.querySelector('.page-shell[data-page=\"1\"] .overlay-layer').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};");
  const point=async(x,y)=>{const r=await pageRect();return {x:r.x+x/geometry.pagePoints[0]*r.width,y:r.y+y/geometry.pagePoints[1]*r.height};};
  const capture=async name=>{
   await sleep(500);const bytes=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64');
   const png=PNG.sync.read(bytes);assert.equal(png.width,1710);assert.equal(png.height,1073);
   const r=await pageRect();let dark=0;
   for(let y=Math.max(0,Math.ceil(r.y+15));y<Math.min(png.height,r.y+r.height-15);y+=4)for(let x=Math.max(0,Math.ceil(r.x+15));x<Math.min(png.width,r.x+r.width-15);x+=4){const i=(y*png.width+x)*4;if(png.data[i]+png.data[i+1]+png.data[i+2]<400)dark++;}
   assert.ok(dark>100,'Drawing painted in captured frame');writeFileSync(resolve(out,name),bytes);shots.push({file:name,sha256:hash(bytes),darkSamples:dark});
  };
  await wait('window.polyPDF && window.polyPDFAutomation');
  await evaluate("for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();");
  if(phase==='language'){
   await evaluate('window.polyPDFAutomation.menuCommand({type:"appDialog",dialog:"upgradePro"});');
   await wait('document.querySelector("[data-license-key]")');
   await evaluate(`const e=document.querySelector('[data-license-key]');e.value=${JSON.stringify(key)};e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-license-activate]').click();`);
   await wait('!document.querySelector("[data-license-key]")||document.querySelector("[data-license-key]").getBoundingClientRect().height===0');
   assert.equal((await evaluate('return await window.polyPDF.getLicenseState();')).tier,'pro');
   assert.equal((await evaluate("return await window.polyPDF.setLanguage('de-DE');")).ok,true);continue;
  }
  await wait('document.documentElement.lang==="de-DE"&&document.querySelector(".page-shell canvas")');
  assert.equal((await evaluate('return await window.polyPDF.getLicenseState();')).tier,'pro');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await sleep(700);
  assert.deepEqual(await annotations(),[]);
  await evaluate('document.querySelector("button[data-tool=visualSearch]").click();');
  await wait('document.querySelector(".visual-search-setup")');
  await evaluate("let e=document.querySelector('.visual-search-setup input[type=text]');e.value='Zuluftauslässe Q-101';e.dispatchEvent(new Event('input',{bubbles:true}));");
  await evaluate("const e=document.querySelector('.visual-search-setup select');e.value='current';e.dispatchEvent(new Event('change',{bubbles:true}));");
  const sample=geometry.symbols.at(-1),start=await point(sample.x-3,sample.y-3),end=await point(sample.x+sample.width+3,sample.y+sample.height+3);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...start});
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',buttons:1,clickCount:1});
  for(let i=1;i<=8;i++){await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x+(end.x-start.x)*i/8,y:start.y+(end.y-start.y)*i/8,button:'left',buttons:1});await sleep(30);}
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',buttons:0,clickCount:1});
  await wait('document.querySelector(".visual-search-summary")',1000);
  console.log('German Symbol Search reached review');
  await wait('document.querySelectorAll(".visual-search-candidate[data-candidate-id]").length===17');
  const candidates=await evaluate("const r=document.querySelector('.page-shell[data-page=\"1\"] .overlay-layer').getBoundingClientRect();return [...document.querySelectorAll('.visual-search-candidate[data-candidate-id]')].map(e=>{const b=e.getBoundingClientRect();return {id:e.dataset.candidateId,x:(b.x+b.width/2-r.x)/r.width,y:(b.y+b.height/2-r.y)/r.height,classes:e.className};});");
  assert.equal(candidates.length,17);
  for(const symbol of geometry.symbols){const x=(symbol.x+symbol.width/2)/geometry.pagePoints[0],y=(symbol.y+symbol.height/2)/geometry.pagePoints[1];assert.equal(candidates.filter(c=>Math.abs(c.x-x)*geometry.pagePoints[0]<3&&Math.abs(c.y-y)*geometry.pagePoints[1]<3).length,1,`Candidate for ${symbol.id}`);}
  assert.deepEqual(await annotations(),[],'Review is transient');
  await capture('symbolsuche-17-treffer.png');
  const legend=candidates.find(c=>c.x>0.7);assert.ok(legend);
  await evaluate(`document.querySelector('.visual-search-candidate[data-candidate-id="${legend.id}"]').click();`);
  await wait('document.querySelector(".visual-search-summary").textContent.includes("16")');
  await capture('symbolsuche-legende-ausgeschlossen.png');
  await evaluate("document.querySelector('.visual-search-actions .visual-search-primary').click();");
  await wait('window.polyPDFAutomation.annotations().filter(a=>a.tool==="count").length===16');
  const countToggle=await evaluate("return document.querySelector('[data-style-menu=showsCountLabel] .menu-content').textContent.trim();");
  assert.equal(countToggle,'Aus');
  await evaluate("document.querySelector('[data-style-menu=showsCountLabel]').click();");
  await wait('document.querySelector(".style-menu-popover")');
  const toggleOptions=await evaluate("return [...document.querySelectorAll('.style-menu-popover .style-popover-option')].map(e=>e.textContent.trim());");
  assert.deepEqual(toggleOptions,['An','Aus']);
  await evaluate("[...document.querySelectorAll('.style-menu-popover .style-popover-option')].find(e=>e.textContent.trim()==='Aus').click();");
  const counts=await annotations();assert.ok(counts.every(a=>a.tool==='count'&&a.nativeSubject==='Zuluftauslässe Q-101'));
  assert.ok(counts.every(a=>a.style?.showsCountLabel===false),'Localized Off keeps canonical false');
  assert.equal(new Set(counts.map(a=>a.countSeriesId)).size,1);assert.ok(counts[0].countSeriesId);
  assert.deepEqual(counts.map(a=>Number(a.label)).sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i+1));
  for(const symbol of geometry.symbols.filter(s=>s.inScope))assert.equal(counts.filter(a=>Math.abs(a.x+a.width/2-symbol.x-symbol.width/2)<3&&Math.abs(a.y+a.height/2-symbol.y-symbol.height/2)<3).length,1,`Committed marker at ${symbol.id}`);
  await evaluate("document.querySelector('[data-panel=measurements]').click();");
  await wait('document.querySelector("[role=tab]")');
  await evaluate("[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='Aufzeichnungen').click();");
  await wait('document.querySelector(".takeoff-worksheet-card")');
  await evaluate("document.querySelector('.takeoff-worksheet-card').scrollIntoView({block:'center'});");
  const worksheet=await evaluate("return document.querySelector('.takeoff-worksheet-card').innerText;");
  assert.ok(worksheet.includes('Zuluftauslässe Q-101')&&worksheet.includes('16'));
  const rows=await evaluate("return [...document.querySelectorAll('.takeoff-worksheet-table button.takeoff-row')].map(e=>({subject:e.querySelector('.takeoff-subject').textContent,quantity:[...e.querySelector('.takeoff-quantity').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(),total:[...e.querySelector('.takeoff-total').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()}));");
  assert.deepEqual(rows,[{subject:'Zuluftauslässe Q-101',quantity:'16',total:'16'}]);
  await capture('zaehlung-16-mengenermittlung.png');
  evidence={status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build,sourceSha256:sourceHash,geometrySha256:hash(readFileSync(resolve(root,'public/localized-media/de/samples/count/geometry.json'))),captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),capture:'Actual owned Electron app, normal signed Pro activation, UI events and native pointer drag; automation annotation observer is read-only.',candidates,excludedLegend:legend.id,counts:counts.map(({id,label,nativeSubject,countSeriesId,x,y,width,height,page})=>({id,label,nativeSubject,countSeriesId,x,y,width,height,page})),worksheet,rows,shots,activations,limitations:['Local Mac development build; not a published release or Windows/native iPad qualification','No Save/reopen or report export in this capture','Bundled plugins disabled; disposable mock keychain used for local activation fixture']};
  evidence.countToggle={label:countToggle,options:toggleOptions,canonical:false};
  console.log('Verified 17 candidates, one excluded legend and one committed 16-marker series');
 }catch(error){if(evaluate&&call){try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,annotations:window.polyPDFAutomation?.annotations(),overlays:[...document.querySelectorAll(".overlay-layer")].map(e=>e.outerHTML.slice(0,12000))};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));}catch{}}throw error;
 }finally{socket?.close();if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='language'?['--keep-user-data']:[])],{cwd:app,stdio:['ignore',log,log]});assert.equal(hash(readFileSync(source)),sourceHash);}
}}finally{server.close();closeSync(log);}
assert.ok(evidence);writeFileSync(resolve(out,'validation.json'),JSON.stringify(evidence,null,2)+'\n');
