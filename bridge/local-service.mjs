import http from 'node:http';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {createBridge} from './core.mjs';
import {callWorkbenchTool} from './actions.mjs';

export async function readSession(root){
 let session;
 try{session=JSON.parse(await readFile(join(root,'session.json'),'utf8'));}
 catch(error){if(error.code==='ENOENT')return null;throw error;}
 const endpoint=new URL(session.endpoint);
 if(endpoint.protocol!=='http:'||endpoint.hostname!=='127.0.0.1'||!endpoint.port||endpoint.pathname!=='/'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!Number.isInteger(session.uiPort)||session.uiPort<1||session.uiPort>65535||!/^[a-f0-9]{64}$/.test(session.token))throw Error('本地会话记录无效。');
 return session;
}

export async function localRequest(session,path,body){
 const response=await fetch(new URL(path,session.endpoint),{
  method:body===undefined?'GET':'POST',
  headers:{'X-Workbench-Control':session.token,'Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body),
  signal:AbortSignal.timeout(35000)
 });
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'工作台操作失败。');
 return data;
}

export async function startLocalService(root){
 await mkdir(root,{recursive:true});
 const previous=await readSession(root);
 const token=previous?.token||randomBytes(32).toString('hex');
 const digest=value=>createHash('sha256').update(value).digest();
 const bridge=await createBridge({dataDir:join(root,'jobs'),port:previous?.uiPort||0});
 let endpoint;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data));};
  try{
   if(req.headers.host!==new URL(endpoint).host||req.headers.origin)throw Error('拒绝此请求来源。');
   const supplied=req.headers['x-workbench-control'];
   if(typeof supplied!=='string'||!timingSafeEqual(digest(supplied),digest(token))){send(403,{error:'工作台控制凭证无效。'});return;}
   if(req.method==='GET'&&req.url==='/health'){send(200,{ok:true,version:1});return;}
   if(req.method!=='POST'||!['/call','/stop'].includes(req.url)){send(404,{error:'操作不存在。'});return;}
   if(req.url==='/stop'){send(200,{stopped:true});setImmediate(()=>close());return;}
   let text='';
   for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>1024*1024)throw Error('操作参数过大。');}
   const {name,arguments:args}=JSON.parse(text);
   const result=await callWorkbenchTool(bridge,name,args);
   send(200,result);
  }catch(error){send(error.status||400,{error:error.message});}
 });
 try{
  await new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(previous?Number(new URL(previous.endpoint).port):0,'127.0.0.1',resolve);
  });
  endpoint='http://127.0.0.1:'+server.address().port+'/';
  const session={endpoint,token,uiPort:Number(new URL(bridge.baseUrl).port),pid:process.pid};
  const temporary=join(root,'session-'+process.pid+'.tmp');
  await writeFile(temporary,JSON.stringify(session),{mode:0o600});
  await rename(temporary,join(root,'session.json'));
 }catch(error){await bridge.close();server.close();throw error;}
 let closing;
 function close(){
  if(!closing)closing=Promise.all([
   bridge.close(),
   new Promise(resolve=>{server.close(resolve);server.closeAllConnections();})
  ]);
  return closing;
 }
 return {bridge,close};
}
