// German redaction/sanitation: actual controls, pointer drag, native saves and fresh-process reopening.
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,openSync,closeSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),app=process.env.POLYPDF_APP_ROOT;
assert.ok(app,'Set POLYPDF_APP_ROOT');

const out=resolve(root,'.tmp/localization/redaction-de'),profile=resolve(out,'profile');
const samples=resolve(root,'public/localized-media/de/samples/redaction');
const source=resolve(samples,'pruefplan-schwaerzen.pdf'),saved=resolve(out,'pruefplan-geschwaerzt.pdf');
const sanitizeSource=resolve(samples,'pruefplan-bereinigen.pdf'),sanitized=resolve(out,'pruefplan-bereinigt.pdf');
const manifest=JSON.parse(readFileSync(resolve(samples,'source-manifest.json')));
assert.ok(!existsSync(saved),'Preserve the previous saved PDF');
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHash=hash(readFileSync(source));
const build=JSON.parse(readFileSync(resolve(app,'dist/build-source.json')));
const {capturePerformanceSource}=await import(pathToFileURL(resolve(app,'scripts/lib/performance-build-identity.mjs')));
assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);
mkdirSync(out,{recursive:true});
const log=openSync(resolve(out,'electron.log'),'w'),sleep=ms=>new Promise(done=>setTimeout(done,ms));
const key='PPM-RDCT-TEST-PRO1',keys=generateKeyPairSync('ed25519');let activations=0;
const server=createServer(async(request,response)=>{
 try{
  const chunks=[];for await(const chunk of request)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(body.license_key,key);assert.ok(body.machine_id);assert.ok(['/activate','/validate'].includes(request.url));
  if(request.url==='/activate')activations++;
  const issued_at=new Date().toISOString(),activation_id='act_redaction_localization';
  const payload=['polypdf-license-v1','1','active',activation_id,body.machine_id,'',issued_at].join('|');
  response.writeHead(200,{'Content-Type':'application/json'});
  response.end(JSON.stringify({valid:true,status:'active',activation_id,activations_used:1,activation_limit:3,issued_at,signature:sign(null,Buffer.from(payload),keys.privateKey).toString('base64')}));
 }catch{response.writeHead(403);response.end('{}');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));


// The runner owns process lifetime and the loopback fixture only. Every control,
// pointer gesture, native chooser and screenshot is handled through Computer Use.
const phases=[['redaction',source,saved],['reopen',saved],['sanitize',sanitizeSource,sanitized],['sanitized-reopen',sanitized]];
const records=[];let interrupted=false;
process.on('SIGINT',()=>{interrupted=true;});process.on('SIGTERM',()=>{interrupted=true;});
try{for(const [index,[phase,file,output]] of phases.entries()){
  if(interrupted)break;
  let started=false;
  const advance=resolve(out,`advance-${index}`);assert.ok(!existsSync(advance),'Preserve previous journey');
  try{
    execFileSync(process.execPath,['scripts/automation-instance.mjs','spawn','--user-data',profile,'--open',file,'--','--use-mock-keychain'],{cwd:app,stdio:['ignore',log,log],env:{...process.env,POLYPDF_PLUGINS_DISABLED:'1',POLYPDF_TELEMETRY_ENABLED:'0',POLYPDF_BUILD_PROFILE:'commercial',POLYPDF_LICENSE_API_BASE_URL:`http://127.0.0.1:${server.address().port}`,POLYPDF_LICENSE_RESPONSE_PUBLIC_KEY:keys.publicKey.export({type:'spki',format:'der'}).toString('base64')}});started=true;
    writeFileSync(resolve(out,'phase.json'),JSON.stringify({index,phase,file,output,advance},null,2));
    console.log(JSON.stringify({phase,file,output,advance,activationKey:index===0?key:undefined}));
    while(!interrupted&&!existsSync(advance))await sleep(250);
    if(interrupted)break;
    if(output)assert.ok(existsSync(output),'Native Save must produce the expected output');
    records.push({phase,inputSha256:hash(readFileSync(file)),...(output?{outputSha256:hash(readFileSync(output))}:{})});
  }finally{
    if(started)execFileSync(process.execPath,['scripts/automation-instance.mjs','teardown','--user-data',profile,...(index===phases.length-1?[]:['--keep-user-data'])],{cwd:app,stdio:['ignore',log,log]});
    assert.equal(hash(readFileSync(source)),sourceHash);
  }
}}finally{server.close();closeSync(log);assert.equal((await capturePerformanceSource(app)).sourceSha256,build.sourceSha256);}
const complete=!interrupted&&records.length===phases.length;
writeFileSync(resolve(out,'lifecycle.json'),JSON.stringify({complete,locale:'de-DE',region:'DE',platform:process.platform,build,sourceHash,sanitizeSourceHash:hash(readFileSync(sanitizeSource)),runnerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),records,activations,scope:'Owned process/loopback-fixture lifecycle only. Native controls, screenshots and output verification are documented separately.'},null,2)+'\n');
console.log(complete?'Native workflow process lifecycle complete.':'Owned workflow stopped.');
