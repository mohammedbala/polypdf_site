const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'node_modules/pdfjs-dist'),target=path.join(root,'public/pdf-runtime/5.4.624');
fs.mkdirSync(target,{recursive:true});
for(const name of ['standard_fonts','cmaps','wasm'])fs.cpSync(path.join(source,name),path.join(target,name),{recursive:true});
fs.copyFileSync(path.join(source,'legacy/build/pdf.worker.min.mjs'),path.join(target,'pdf.worker.min.js'));
fs.copyFileSync(path.join(source,'LICENSE'),path.join(target,'LICENSE'));
console.log('Prepared local PDF rendering assets.');

fs.rmSync(path.join(target,'pdf.worker.min.mjs'),{force:true});
