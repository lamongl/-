import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.mjs':'app.mjs','/core.mjs':'core.mjs','/speech.mjs':'speech.mjs','/favicon.svg':'favicon.svg'};
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8',svg:'image/svg+xml'};
const server=http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const file=allowed[path];if(!file){res.writeHead(404);res.end('Not found');return;}try{const body=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(body);}catch{res.writeHead(500);res.end('Unable to load preview');}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
