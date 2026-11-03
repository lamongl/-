import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {build,publicFiles} from '../scripts/build.mjs';
await build();
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8',svg:'image/svg+xml',txt:'text/plain; charset=utf-8',bcmap:'application/octet-stream',pfb:'application/octet-stream',ttf:'font/ttf'};
const server=http.createServer(async(req,res)=>{
 let path;
 try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
 if(path.split('/').some(part=>part==='..'||part==='.'||part.includes('\\'))||!publicFiles.includes(path.split('/')[0])){res.writeHead(404);res.end('Not found');return;}
 try{
  const body=await readFile(new URL('../dist/'+path,import.meta.url));
  res.writeHead(200,{'Content-Type':mime[path.split('.').pop()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
const port=Number(process.env.PORT||4173);
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
