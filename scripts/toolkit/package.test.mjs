import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
await test('published ZIP contains matching sources and runs as an MCP server',async()=>{
 const zip=await JSZip.loadAsync(await fs.readFile('public/tools/mcp/polypdf-browser-tools-mcp.zip'));
 const destination=await fs.mkdtemp(path.resolve('.tmp/toolkit-dist-'));
 for(const [name,entry]of Object.entries(zip.files)){assert.ok(name.startsWith('polypdf-browser-tools-mcp/')&&!name.split('/').includes('..'));if(entry.dir)continue;const target=path.join(destination,name);await fs.mkdir(path.dirname(target),{recursive:true});const bytes=await entry.async('nodebuffer');await fs.writeFile(target,bytes);const source=name.replace('polypdf-browser-tools-mcp/','');if(source.startsWith('src/')||source.startsWith('scripts/'))assert.deepEqual(bytes,await fs.readFile(source));}
 const root=path.join(destination,'polypdf-browser-tools-mcp'),client=new Client({name:'distribution-check',version:'1.0.0'}),transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'server.mjs'),'--root',root],stderr:'pipe'});
 await client.connect(transport);try{assert.equal((await client.listTools()).tools.length,36);const r=await client.callTool({name:'polypdf_text_to_pdf',arguments:{request_id:'package-proof',files:[],options:{title:'Package verification',text:'The distributed MCP package produced this PDF.'}}});assert.ok(!r.isError,JSON.stringify(r));assert.equal(r.structuredContent.outputs[0].mimeType,'application/pdf');assert.ok((await fs.stat(r.structuredContent.outputs[0].path)).size>100);}finally{await client.close();}
});
