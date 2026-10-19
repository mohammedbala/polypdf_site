'use strict';
const fs=require('fs'),path=require('path');
const {createCanvas,Path2D}=require('@napi-rs/canvas');
const catalog=require('../../src/toolkit/catalog.json'),icons=require('../../src/toolkit/icons.json');
const root=path.resolve(__dirname,'../..');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
if(Object.keys(icons).length!==36 || new Set(Object.values(icons)).size!==36)throw new Error('Expected 36 distinct custom drawings.');
for(const tool of catalog) {
  const d=icons[tool.id];if(!d)throw new Error('Missing icon: '+tool.id);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#304b3a" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" role="img" aria-labelledby="title"><title id="title">${esc(tool.name)} — PolyPDF</title><path d="${d}"/></svg>\n`;
  const folder=path.join(root,'public/tools/icons');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,tool.id+'.svg'),svg);
  const canvas=createCanvas(1200,630),ctx=canvas.getContext('2d');
  ctx.fillStyle='#f3f6f0';ctx.fillRect(0,0,1200,630);
  ctx.strokeStyle='#dce3db';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(72,116);ctx.lineTo(1128,116);ctx.moveTo(72,518);ctx.lineTo(1128,518);ctx.stroke();
  ctx.fillStyle='#304b3a';ctx.font='600 29px sans-serif';ctx.fillText('PolyPDF',72,78);
  ctx.font='22px sans-serif';ctx.fillText('FREE BROWSER TOOLS',800,78);
  ctx.save();ctx.translate(78,214);ctx.scale(4.5,4.5);ctx.strokeStyle='#304b3a';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(d));ctx.restore();
  ctx.font='600 64px sans-serif';ctx.fillStyle='#202a24';
  const words=tool.name.split(' '),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>790&&line){lines.push(line);line=word;}else line=next;}lines.push(line);
  lines.forEach((line,i)=>ctx.fillText(line,292,lines.length>1?265+i*78:305));
  ctx.font='26px sans-serif';ctx.fillStyle='#5c665f';ctx.fillText('Local processing. No upload. No account.',72,574);
  const images=path.join(root,'public/tools/social');fs.mkdirSync(images,{recursive:true});fs.writeFileSync(path.join(images,tool.id+'.png'),canvas.toBuffer('image/png'));
}
console.log('Prepared 36 original SVG icons and 36 tool-specific social images.');
