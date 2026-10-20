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
const out=resolve(root,'.tmp/localization/area-de');
const profile=resolve(out,'profile');
const input=resolve(root,'public/localized-media/de/samples/area/bodenplatte-aussparungen-uebung.pdf');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash=hash(readFileSync(input));
const port=9476;
const geometry=JSON.parse(readFileSync(resolve(root,'public/localized-media/de/samples/area/geometry.json')));
const measurements={};
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w');
const shots=[];
for (const phase of ['language','walkthrough']) {
let socket,started=false;
let evaluate,call;
try {
  execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,...(phase==='walkthrough'?['--open',input]:[]),'--',`--remote-debugging-port=${port}`],{cwd:app,env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1'},stdio:['ignore',log,log]});
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
  // Input pointer coordinates are derived from the independently verified PDF geometry.
  const point=async(x,y)=>evaluate(`const r=document.querySelector('.page-shell[data-page="1"] .overlay-layer').getBoundingClientRect();
    const w=${geometry.pagePoints[0]},h=${geometry.pagePoints[1]};
    return {x:r.left+${x}/w*r.width,y:r.top+(h-${y})/h*r.height};`);
  const ringArea=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2);
  const observe=async()=>evaluate('return window.polyPDFAutomation.annotations();');
  const areaValue=a=>(ringArea(a.points)-(a.areaCutouts||[]).reduce((n,ring)=>n+ringArea(ring),0))/a.scale.pointsPerUnitAtCreation**2;
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
  await evaluate(`Array.from(document.querySelectorAll('.scale-path-primary')).find(b=>b.textContent==='Durch Linienzeichnung kalibrieren').click();`);
  for(const p of geometry.calibration.points)await click(await point(...p));
  await wait('document.querySelector("[data-dialog-input]")');
  const dialog=await evaluate(`const input=document.querySelector('[data-dialog-input]');input.value='4';input.dispatchEvent(new Event('input',{bubbles:true}));return input.closest('[role=dialog]')?.innerText;`);
  assert.ok(dialog.includes('zwischen eingerasteten Endpunkten'));
  await evaluate(`document.querySelector('[data-dialog-confirm]').click();`);
  await wait('document.querySelector(".page-scale-status.calibrated")');
  for(const [id,points,expected] of [
    ['width',[geometry.references[0].points[3],geometry.references[0].points[2]],12],
    ['height',[geometry.references[0].points[0],geometry.references[0].points[3]],8]
  ]){
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.title.startsWith('Lineare Bemaßung')).click();`);
    for(const p of points)await click(await point(...p));
    await wait(`window.polyPDFAutomation.annotations().length === ${id==='width'?1:2}`);
    const a=(await observe()).at(-1);
    const value=Math.hypot(a.points[1].x-a.points[0].x,a.points[1].y-a.points[0].y)/a.scale.pointsPerUnitAtCreation;
    assert.ok(Math.abs(value-expected)<0.0001,id+' independently checks calibration');
    measurements[id]={expected,value};
  }
  // Remove the two temporary check dimensions through Undo so their handles cannot
  // intercept pointer gestures at the plate corners. Calibration remains in place.
  for(let i=0;i<2;i++){
    await evaluate(`document.querySelector('button[data-action="undo"]').click();`);
    await sleep(200);
  }
  await wait('window.polyPDFAutomation.annotations().length === 0');
  // Undo reloads the PDF asynchronously; allow the final renderer replacement to settle.
  await sleep(3500);
  await evaluate(`document.querySelector('button[data-tool="areaMeasurement"]').click();`);
  await wait(`document.querySelector('button[data-tool="areaMeasurement"][aria-pressed="true"]')`);
  const outer=geometry.references[0].points;
  for(const p of [...outer,outer[0]])await click(await point(...p));
  await wait('window.polyPDFAutomation.annotations().length === 1');
  await wait(`document.querySelector('[data-style-action="add-area-cutout"]')`);
  let area=(await observe()).find(a=>a.tool==='areaMeasurement');
  assert.ok(Math.abs(areaValue(area)-96)<0.0001);
  measurements.gross={expected:96,value:areaValue(area)};
  const details=await evaluate(`const d=document.querySelector('details.scale-custom');if(d?.open)d.querySelector('summary').click();return true;`);
  await wait(`document.querySelector('.viewer-area-inspector strong')?.textContent === 'Fläche'`);
  assert.equal(await evaluate(`return document.querySelector('.viewer-area-inspector').getAttribute('aria-label');`),'Fläche');
  await capture('bruttoflaeche.png');
  for(let i=1;i<=2;i++){
    await evaluate(`document.querySelector('[data-style-action="add-area-cutout"]').click();`);
    const points=geometry.references[i].points;
    for(const p of [...points,points[0]])await click(await point(...p));
    await wait(`window.polyPDFAutomation.annotations().find(a=>a.tool==='areaMeasurement').areaCutouts?.length===${i}`);
    area=(await observe()).find(a=>a.tool==='areaMeasurement');
    assert.ok(Math.abs(areaValue(area)-(i===1?92:86))<0.0001);
  }
  measurements.net={expected:86,value:areaValue(area)};
  await wait(`Array.from(document.querySelectorAll('.page-shell svg text,.page-shell .measurement-label')).some(n=>n.textContent.includes('86,00 m²'))`);
  await capture('nettoflaeche-zwei-aussparungen.png');
  await evaluate(`const input=document.querySelector('[data-style-input="measurementDepth"]');input.value='0,15 m';input.dispatchEvent(new Event('change',{bubbles:true}));`);
  await wait(`Array.from(document.querySelectorAll('.page-shell svg text,.page-shell .measurement-label')).some(n=>n.textContent.includes('12,90 m³'))`);
  area=(await observe()).find(a=>a.tool==='areaMeasurement');
  assert.ok(Math.abs(area.measurementDepth-.15)<1e-10,'Depth is 0.15 metres');
  measurements.volume={expected:12.9,value:areaValue(area)*area.measurementDepth};
  assert.ok(Math.abs(measurements.volume.value-12.9)<0.0001);
  await wait(`document.querySelector('.viewer-area-inspector strong')?.textContent === 'Fläche'`);
  await capture('volumen-mit-tiefe.png');
  const actual=await evaluate(`return {annotations:window.polyPDFAutomation.annotations(),language:document.documentElement.lang,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},scale:document.querySelector('.page-scale-status')?.textContent,body:document.body.innerText};`);
  writeFileSync(resolve(out,'validation.json'),JSON.stringify({status:'passed',locale:'de-DE',region:'DE',platform:process.platform,build:JSON.parse(readFileSync(resolve(app,'dist/build-source.json'))),sourcePdf:geometry.pdf,sourceSha256:sourceHash,captureScriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),capture:'Actual owned Electron renderer; UI control events and CDP pointer gestures. Automation APIs read annotations only.',calibration:{enteredMetres:4,dialog},measurements,actual,shots,limitations:['Local development build, not a published release','No Windows or native iPad run','Straight rectangular boundary and openings; curved boundaries not exercised','No Save/reopen in this capture','Bundled plugins disabled for this measurement-only capture']},null,2)+'\n');
  console.log('German area, two cutouts and 0.15 m depth passed');
}catch(error){
  if(call&&evaluate){try{writeFileSync(resolve(out,'failure.json'),JSON.stringify(await evaluate('return {body:document.body.innerText,annotations:window.polyPDFAutomation?.annotations()};'),null,2));writeFileSync(resolve(out,'failure.png'),Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));}catch{}}
  console.error(error);throw error;
}finally{
  socket?.close();
  if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(phase==='language'?['--keep-user-data']:[])],{cwd:app,stdio:['ignore',log,log]});
  assert.equal(hash(readFileSync(input)),sourceHash,'Source drawing unchanged');
}
}
closeSync(log);
