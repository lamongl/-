import {spawn} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import {mkdir,readFile,open,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSession,localRequest,startLocalService} from './local-service.mjs';

const root=resolve(process.env.WORKBENCH_LOCAL_DIR||fileURLToPath(new URL('../.workbench/local/',import.meta.url)));
const [command,...args]=process.argv.slice(2);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function healthy(){
 const session=await readSession(root);
 if(!session)return null;
 try{
  await localRequest(session,'/health');
  return session;
 }catch{return null;}
}

async function ensureService(){
 const active=await healthy();
 if(active)return active;
 await mkdir(root,{recursive:true});
 const lockPath=join(root,'start.lock');
 let lock;
 for(let attempt=0;attempt<100;attempt++){
  try{lock=await open(lockPath,'wx',0o600);await lock.writeFile(String(process.pid));break;}
  catch(error){
   if(error.code!=='EEXIST')throw error;
   const ready=await healthy();if(ready)return ready;
   const owner=Number(await readFile(lockPath,'utf8').catch(()=>''));
   if(Number.isInteger(owner)&&owner>0){
    try{process.kill(owner,0);}catch(error){if(error.code==='ESRCH')await unlink(lockPath).catch(()=>{});}
   }
   await sleep(100);
  }
 }
 if(!lock)throw Error('服务仍在启动，请稍后重试。');
 try{
  const active=await healthy();if(active)return active;
  const log=openSync(join(root,'service.log'),'a');
  try{
   await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'serve'],{
     detached:true,windowsHide:true,stdio:['ignore',log,log],env:{...process.env,WORKBENCH_LOCAL_DIR:root}
    });
    child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});
   });
  }finally{closeSync(log);}
  for(let attempt=0;attempt<100;attempt++){
   const ready=await healthy();if(ready)return ready;
   await sleep(100);
  }
  throw Error('本地服务启动失败，请检查 '+join(root,'service.log'));
 }finally{await lock.close();await unlink(lockPath).catch(()=>{});}
}

try{
 if(command==='serve'){
  const service=await startLocalService(root);
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>service.close());
 }else if(command==='start'){
  const session=await ensureService();console.log(JSON.stringify({ok:true,transport:'local-cli',endpoint:session.endpoint}));
 }else if(command==='status'||command==='stop'){
  const session=await healthy();
  console.log(JSON.stringify(session?await localRequest(session,command==='stop'?'/stop':'/health',command==='stop'?{}:undefined):{ok:false,running:false}));
 }else{
  if(!command)throw Error('用法：node bridge/cli.mjs <操作名> [--input 参数.json] [--follow]');
  const follow=args.includes('--follow');
  if(follow&&command!=='wait_for_submission')throw Error('--follow 只用于 wait_for_submission。');
  if(args.filter(arg=>arg==='--follow').length>1)throw Error('--follow 不得重复。');
  const inputArgs=args.filter(arg=>arg!=='--follow');
  let parameters={};
  if(inputArgs.length){
   if(inputArgs.length!==2||inputArgs[0]!=='--input')throw Error('参数必须通过 --input JSON文件 提供。');
   parameters=JSON.parse((await readFile(resolve(inputArgs[1]),'utf8')).replace(/^\uFEFF/,''));
   if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))throw Error('参数必须是JSON对象。');
  }
  const session=await ensureService();
  let result;
  do{
   result=await localRequest(session,'/call',{name:command,arguments:parameters});
   if(follow&&result.waiting_for_user)console.error(JSON.stringify({event:'waiting_for_user',job_id:result.job_id,status:result.status}));
  }while(follow&&result.waiting_for_user);
  console.log(JSON.stringify(result));
 }
}catch(error){console.error(JSON.stringify({error:error.message}));process.exitCode=1;}
