// Actual UI gestures in an owned development app. No workspace or measurement injection.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT to the isolated built app workspace');
const require=createRequire(resolve(app,'package.json'));
const WebSocket=require('ws');
const out=resolve(root,'.tmp/localization/calibration-de');
const profile=resolve(out,'profile');
const input=resolve(root,'public/localized-media/de/samples/takeoff/bodenbelag-uebung.pdf');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash=hash(readFileSync(input));
const port=9475;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w');
const shots=[];
for (const phase of ['language','walkthrough']) {
let socket,started=false;
let evaluate,call;
try {
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='walkthrough'?['--open',input]:[]),'--',`--remote-debugging-port=${port}`],{cwd:app,stdio:['ignore',log,log]});
  started=true;
  let target;
  for(let n=0;n<100&&!target;n++){
    try {target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'&&t.url.endsWith('/renderer/index.html'));}catch{}
    if(!target)await sleep(150);
  }
  assert.ok(target,'Owned app renderer starts');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done,reject)=>{socket.once('open',done);socket.once('error',reject);});
  let seq=0;const pending=new Map();
  socket.on('message',raw=>{const msg=JSON.parse(String(raw)),p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(new Error(msg.error.message)):p.done(msg.result);});
  call=(method,params={})=>new Promise((done,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Timeout: ${method}`));},30000);pending.set(id,{done,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  evaluate=async body=>{const result=await call('Runtime.evaluate',{expression:`(async()=>{${body}})()`,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const wait=async expression=>{for(let n=0;n<100;n++){if(await evaluate(`return Boolean(${expression});`))return;await sleep(120);}throw new Error(`Not reached: ${expression}`);};
  const capture=async name=>{await sleep(300);const png=Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64');writeFileSync(resolve(out,name),png);shots.push({file:name,sha256:hash(png)});};
  const click=async point=>{
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await sleep(200);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',buttons:1,clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',buttons:0,clickCount:1});
    await sleep(250);
  };
  // Coordinates are the drawing generator's vector dimension intersections, in authored space.
  // Convert only the input pointer position; the app performs snapping and calibration itself.
  const point=async(x,y)=>evaluate(`const r=document.querySelector('.page-shell[data-page="1"] .overlay-layer').getBoundingClientRect();
    const w=594*72/25.4,h=420*72/25.4,f=(72/25.4*1000/50)/30;
    return {x:r.left+((w-792*f)/2+${x}*f)/w*r.width,y:r.top+(h-((h-612*f)/2+${y}*f))/h*r.height};`);
  await wait('window.polyPDF && document.getElementById("empty-sample-button")');
  await evaluate(`for(const b of document.querySelectorAll('button'))if(['Get Started','Not Now','Loslegen','Jetzt nicht'].includes(b.textContent.trim()))b.click();return await window.polyPDF.setLanguage('de-DE');`);
  await wait('document.documentElement.lang === "de-DE"');
  if(phase==='language')continue; // Persist the user's language before opening a new document.
  await wait('document.querySelector(".page-shell canvas")');
  await call('Emulation.setDeviceMetricsOverride',{width:1710,height:1073,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.querySelector('[data-panel="measurements"]').click();`);
  await wait('document.querySelector(".scale-units-choice")');
  await evaluate(`document.querySelectorAll('.scale-units-choice')[1].click();`);
  await evaluate(`const s=Array.from(document.querySelectorAll('select')).find(s=>Array.from(s.options).some(o=>o.value==='meters'));if(s){s.value='meters';s.dispatchEvent(new Event('change',{bubbles:true}));}`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.title.startsWith('Einrasten aus')).click();`);
  await wait('document.body.classList.contains("view-snap-content")');
  await sleep(700);
  assert.equal(await evaluate('return window.polyPDFAutomation.annotations().length;'),0);
  await capture('massstab-nicht-gesetzt.png');
  await evaluate(`Array.from(document.querySelectorAll('.scale-path-primary')).find(b=>b.textContent==='Durch Linienzeichnung kalibrieren').click();`);
  await click(await point(90,431));
  await click(await point(270,431));
  await wait('document.querySelector("[data-dialog-input]")');
  const dialog=await evaluate(`const input=document.querySelector('[data-dialog-input]');input.value='6';input.dispatchEvent(new Event('input',{bubbles:true}));return input.closest('[role=dialog]')?.innerText || document.body.innerText;`);
  const capturedPoints=Number(dialog.match(/Erfasste ([\d,]+) PDF-Punkte/)?.[1].replace(',','.'));
  assert.ok(Math.abs(capturedPoints-6*72/25.4*1000/50)<0.002,'Snapped six-metre reference within 0.002 PDF pt of source geometry');
  assert.ok(dialog.includes('zwischen eingerasteten Endpunkten'));
  assert.ok(dialog.includes('Abbrechen') && !dialog.includes('Cancel'));
  await capture('bekannte-strecke.png');
  await evaluate(`document.querySelector('[data-dialog-confirm]').click();`);
  await wait('document.querySelector(".page-scale-status.calibrated")');
  const scaleText=await evaluate('return document.querySelector(".page-scale-status").textContent;');
  assert.match(scaleText,/56,69/);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.title.startsWith('Lineare Bemaßung')).click();`);
  await click(await point(62,290));
  await click(await point(62,398));
  await wait('window.polyPDFAutomation.annotations().length === 1');
  await wait(`Array.from(document.querySelectorAll('.page-shell svg text,.page-shell .measurement-label')).some(n=>n.textContent.trim()==='3,60 m')`);
  await evaluate(`const details=document.querySelector('details.scale-custom');if(details?.open)details.querySelector('summary').click();`);
  await capture('unabhaengige-hoehenpruefung.png');
  const actual=await evaluate(`return {annotations:window.polyPDFAutomation.annotations(),language:document.documentElement.lang,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},scale:document.querySelector('.page-scale-status')?.textContent,body:document.body.innerText};`);
  writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build:JSON.parse(readFileSync(resolve(app,'dist/build-source.json'))),sourcePdf:'bodenbelag-uebung.pdf',sourceSha256:sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),capture:'Actual owned Electron renderer; UI control events and CDP pointer gestures. Automation APIs read annotations only.',calibration:{enteredMetres:6,expectedPoints:6*72/25.4*1000/50,dialog,scaleText},independentCheck:{expectedMetres:3.6,display:'3,60 m'},actual,shots,limitations:['Local development build, not a published release','No Windows or native iPad run','This capture checks one independent length; the suggested second length, net area and Save sequence are separate exercises']},null,2)+'\n');
  console.log('German calibration and independent 3.60 m check passed');
}catch(error){
  if(call&&evaluate){try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));}catch{}}
  console.error(error);throw error;
}finally{
  socket?.close();
  if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='language'?['--keep-user-data']:[])],{cwd:app,stdio:['ignore',log,log]});
  assert.equal(hash(readFileSync(input)),sourceHash,'Source drawing unchanged');
}
}
closeSync(log);
