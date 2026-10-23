import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import encode,{init} from '@jsquash/webp/encode.js';
import {simd} from 'wasm-feature-detect';
import {encodeCanvas} from '../../src/toolkit/canvas-encode.mjs';
const canvas=createCanvas(120,80);canvas.getContext('2d').fillRect(10,10,100,60);
test('Safari-style PNG fallback is encoded as actual WebP with the same dimensions',async()=>{
 const name=await simd()?'webp_enc_simd.wasm':'webp_enc.wasm';
 await init(await WebAssembly.compile(await fs.readFile(new URL(`../../node_modules/@jsquash/webp/codec/enc/${name}`,import.meta.url))));
 let calls=0;
 const safariCanvas={width:120,height:80,getContext:()=>canvas.getContext('2d'),toBlob:cb=>cb(new Blob([canvas.toBuffer('image/png')],{type:'image/png'}))};
 const bytes=await encodeCanvas(safariCanvas,'webp',0.75,async()=>{calls++;return encode;});
 assert.equal(calls,1);assert.equal(new TextDecoder().decode(bytes.subarray(0,4)),'RIFF');assert.equal(new TextDecoder().decode(bytes.subarray(8,12)),'WEBP');
 const reopened=await loadImage(Buffer.from(bytes));assert.equal(reopened.width,120);assert.equal(reopened.height,80);
});
test('native image encoding does not load the WebP fallback',async()=>{
 const nativeCanvas={toBlob:cb=>cb(new Blob([canvas.toBuffer('image/png')],{type:'image/png'}))};
 const bytes=await encodeCanvas(nativeCanvas,'png',1,async()=>{throw new Error('Must stay lazy');});
 assert.equal((await loadImage(Buffer.from(bytes))).width,120);
});
test('an unavailable local codec produces a useful error rather than a mislabeled PNG',async()=>{
 const safariCanvas={toBlob:cb=>cb(new Blob(['png'],{type:'image/png'}))};
 await assert.rejects(encodeCanvas(safariCanvas,'webp',0.8,async()=>{throw new Error('Failed to load');}),/local WebP encoder/);
});
