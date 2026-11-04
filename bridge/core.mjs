import http from 'node:http';
import {mkdir,writeFile,readFile,stat,lstat,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,extname} from 'node:path';
import {randomUUID,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {readAttachments} from '../web/attachments.mjs';
import {validateFile} from '../web/core.mjs';

const hash=text=>createHash('sha256').update(text).digest();
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const kinds=new Set(['auto','pptx','docx','xlsx','pdf','text','code']);
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const MAX_BODY=105*1024*1024;
function inside(root,path){const rel=relative(root,path);return rel!==''&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../');}
async function bodyBytes(req){
 if(Number(req.headers['content-length']||0)>MAX_BODY)throw fail('上传合计过大。',413);
 const chunks=[];let length=0;
 for await(const chunk of req){length+=chunk.length;if(length>MAX_BODY)throw fail('上传合计过大。',413);chunks.push(chunk);}
 return Buffer.concat(chunks);
}
export async function createBridge({dataDir,port=0}){
 const initialRoot=resolve(dataDir);await mkdir(initialRoot,{recursive:true});const root=await realpath(initialRoot);
 const jobs=new Map(),signals=new Map();
 let baseUrl;
 const persist=async job=>{jobs.set(job.id,job);await writeFile(join(root,job.id,'job.json'),JSON.stringify(job,null,2));signals.get(job.id)?.forEach(resolve=>resolve());};
 async function load(id){
  if(!UUID.test(id))throw fail('任务不存在。',404);
  if(jobs.has(id))return jobs.get(id);
  try{const job=JSON.parse(await readFile(join(root,id,'job.json'),'utf8'));jobs.set(id,job);return job;}
  catch{throw fail('任务不存在。',404);}
 }
 const summary=job=>({job_id:job.id,title:job.title,status:job.status,request:job.request,output_kind:job.outputKind,files:job.files,questions:job.questions,clarifications:job.clarifications,artifacts:job.artifacts,output_dir:join(root,job.id,'output'),message:job.message||''});
 const publicSummary=job=>({job_id:job.id,title:job.title,status:job.status,request:job.request,output_kind:job.outputKind,files:job.files.map(({name,size,characters,role})=>({name,size,characters,role})),questions:job.questions,clarifications:job.clarifications,artifacts:job.artifacts.map(({name,size})=>({name,size})),message:job.message||''});
 async function createJob({title='新的任务',outputKind='auto',request=''}={}){
  if(!kinds.has(outputKind))throw fail('不支持的交付格式。');
  const id=randomUUID(),token=randomBytes(32).toString('hex');
  const job={id,title:String(title).slice(0,100),request:String(request).slice(0,12000),outputKind,status:'awaiting_input',tokenHash:hash(token).toString('hex'),files:[],questions:[],clarifications:[],artifacts:[],createdAt:new Date().toISOString()};
  await mkdir(join(root,id,'originals'),{recursive:true});await mkdir(join(root,id,'texts'),{recursive:true});await mkdir(join(root,id,'output'),{recursive:true});await persist(job);
  return {job_id:id,token,ui_url:`${baseUrl}/jobs/${id}/#${token}`,api_url:`${baseUrl}/api/jobs/${id}`,output_dir:join(root,id,'output')};
 }
 async function waitForSubmission(id,timeoutMs=25000){
  const job=await load(id);if(!['awaiting_input','needs_clarification','uploading'].includes(job.status))return summary(job);
  await new Promise(resolve=>{
   const callbacks=signals.get(id)||new Set();signals.set(id,callbacks);
   const finish=()=>{clearTimeout(timer);callbacks.delete(finish);resolve();};
   const timer=setTimeout(finish,Math.min(Math.max(timeoutMs,1),25000));callbacks.add(finish);
  });return summary(await load(id));
 }
 async function readMaterial(id,index,offset=0,length=20000){
  const job=await load(id),file=job.files[index];if(!file)throw fail('附件不存在。',404);
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(length)||length<1||length>50000)throw fail('读取范围无效。');
  const text=await readFile(file.text_path,'utf8'),end=Math.min(text.length,offset+length);
  return {name:file.name,text:text.slice(offset,end),total_characters:text.length,next_offset:end<text.length?end:null,original_path:file.original_path};
 }
 async function askQuestions(id,questions){
  const job=await load(id);if(!['submitted','processing'].includes(job.status))throw fail('此任务当前不能追问。',409);
  if(!Array.isArray(questions)||!questions.length||questions.length>3)throw fail('每次最多提出三个关键问题。');
  const ids=new Set();
  for(const q of questions){if(!/^[a-z][a-z0-9_-]{0,39}$/.test(q.id)||ids.has(q.id)||typeof q.title!=='string'||!q.title.trim()||q.title.length>300||!Array.isArray(q.options)||q.options.length>5||q.options.some(o=>typeof o!=='string'||o.length>150))throw fail('问题格式无效。');ids.add(q.id);}
  job.questions=questions;job.status='needs_clarification';await persist(job);return summary(job);
 }
 async function setProgress(id,status,message=''){
  const job=await load(id);if(!['processing','failed'].includes(status)||!['submitted','processing'].includes(job.status))throw fail('任务状态不允许此操作。',409);
  if(status==='processing'&&!job.clarifications?.length)throw fail('请先调用ask_questions，在工作台展示追问并等待用户提交回答，再开始制作。',409);
  job.status=status;job.message=String(message).slice(0,1000);await persist(job);return summary(job);
 }
 async function outputRoot(job){
  const expected=join(root,job.id,'output'),actual=await realpath(expected);
  if(actual!==expected||(await lstat(expected)).isSymbolicLink())throw fail('任务output目录不能是符号链接或目录联接。',403);
  return expected;
 }
 async function outputFile(output,path){
  const expected=resolve(path),actual=await realpath(path);
  if(!inside(output,expected)||actual!==expected||(await lstat(expected)).isSymbolicLink())throw fail('成品必须位于任务output目录中，且不能使用符号链接。',403);
  return actual;
 }
 async function publishResult(id,paths,message=''){
  const job=await load(id);if(!['submitted','processing'].includes(job.status))throw fail('任务尚未准备好交付。',409);
  if(!job.clarifications?.length)throw fail('请先在工作台完成追问并收到用户回答，再交付成品。',409);
  if(!Array.isArray(paths)||!paths.length||paths.length>10)throw fail('需要1至10个真实成品文件。');
  const output=await outputRoot(job),artifacts=[];
  for(const path of paths){
   const resolved=await outputFile(output,path);
   const info=await stat(resolved);if(!info.isFile()||!info.size||info.size>100*1024*1024)throw fail('成品为空、无效或超过100MB。');
   artifacts.push({name:resolved.split(/[\\/]/).pop(),path:resolved,size:info.size});
  }
  job.artifacts=artifacts;job.status='completed';job.message=String(message).slice(0,1000);await persist(job);return summary(job);
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   if(req.headers.host!==new URL(baseUrl).host)throw fail('不接受此访问地址。',403);
   if(req.headers.origin&&req.headers.origin!==baseUrl)throw fail('不接受跨站请求。',403);
   const path=new URL(req.url,baseUrl).pathname;
   if(req.method==='GET'&&(/^\/jobs\/[0-9a-f-]+\/$/.test(path)||['/ui.mjs','/ui.css'].includes(path))){
    const name=path.startsWith('/jobs/')?'index.html':path.slice(1);
    res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.mjs')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'});res.end(await readFile(new URL('./ui/'+name,import.meta.url)));return;
   }
   const match=path.match(/^\/api\/jobs\/([0-9a-f-]+)(?:\/(submit|answers|artifacts\/(\d+)))?$/);
   if(!match)throw fail('页面不存在。',404);
   const job=await load(match[1]),token=req.headers['x-workbench-token'];
   if(typeof token!=='string'||!timingSafeEqual(hash(token),Buffer.from(job.tokenHash,'hex')))throw fail('此任务的访问凭证无效。请从AI提供的链接重新打开。',403);
   if(req.method==='GET'&&!match[2]){json(200,publicSummary(job));return;}
   if(req.method==='GET'&&match[3]!==undefined){
    const artifact=job.artifacts[Number(match[3])];if(!artifact)throw fail('成品不存在。',404);
    const output=await outputRoot(job),path=await outputFile(output,artifact.path);
    const data=await readFile(path);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(artifact.name)}`});res.end(data);return;
   }
   if(req.method==='POST'&&match[2]==='submit'){
    if(job.status!=='awaiting_input')throw fail('资料已经提交，不能重复提交。',409);
    job.status='uploading';
    try{
     const bytes=await bodyBytes(req),form=await new Response(bytes,{headers:{'Content-Type':req.headers['content-type']||''}}).formData();
     const request=String(form.get('request')||'').trim(),kind=String(form.get('outputKind')||'auto'),files=form.getAll('files');
     if(!request||request.length>12000)throw fail('请填写不超过12000字符的任务需求。');
     if(!kinds.has(kind)||files.length>5)throw fail('最多5份资料，请确认交付格式。');
     for(const file of files){if(typeof file.arrayBuffer!=='function')throw fail('附件无效。');const issue=validateFile(file);if(issue)throw fail(file.name+'：'+issue);}
     const parsed=await readAttachments(files);if(parsed.errors.length)throw fail(parsed.errors.join(' '));
     const records=[];
     for(let i=0;i<files.length;i++){
      const original_path=join(root,job.id,'originals',`file-${i+1}${extname(files[i].name).toLowerCase()}`),text_path=join(root,job.id,'texts',`file-${i+1}.txt`);
      await writeFile(original_path,Buffer.from(await files[i].arrayBuffer()));await writeFile(text_path,parsed.accepted[i].text);
      records.push({name:files[i].name,size:files[i].size,characters:parsed.accepted[i].text.length,original_path,text_path});
     }
     job.request=request;job.outputKind=kind;job.files=records;job.status='submitted';await persist(job);json(200,publicSummary(job));return;
    }catch(error){job.status='awaiting_input';await persist(job);throw error;}
   }
   if(req.method==='POST'&&match[2]==='answers'){
    if(job.status!=='needs_clarification')throw fail('当前没有需要回答的问题。',409);
    job.status='uploading';
    try{
     const bytes=await bodyBytes(req);let answers,files=[];
     if((req.headers['content-type']||'').startsWith('multipart/form-data')){
      const form=await new Response(bytes,{headers:{'Content-Type':req.headers['content-type']}}).formData();
      answers=JSON.parse(String(form.get('answers')||'null'));files=form.getAll('files');
     }else ({answers}=JSON.parse(bytes.toString()));
     if(!answers||job.questions.some(q=>typeof answers[q.id]!=='string'||!answers[q.id].trim()||answers[q.id].length>2000))throw fail('请回答每个问题，每条最多2000字符。');
     if(job.files.length+files.length>5)throw fail('任务材料与参考文件合计最多5份。');
     for(const file of files){if(typeof file.arrayBuffer!=='function')throw fail('附件无效。');const issue=validateFile(file);if(issue)throw fail(file.name+'：'+issue);}
     const parsed=await readAttachments(files,job.files.length);if(parsed.errors.length)throw fail(parsed.errors.join(' '));
     const records=[];
     for(let i=0;i<files.length;i++){
      const key='reference-'+randomUUID(),original_path=join(root,job.id,'originals',key+extname(files[i].name).toLowerCase()),text_path=join(root,job.id,'texts',key+'.txt');
      await writeFile(original_path,Buffer.from(await files[i].arrayBuffer()));await writeFile(text_path,parsed.accepted[i].text);
      records.push({name:files[i].name,size:files[i].size,characters:parsed.accepted[i].text.length,role:'reference',original_path,text_path});
     }
     job.files.push(...records);
     for(const q of job.questions)job.clarifications.push({id:q.id,title:q.title,answer:answers[q.id].trim()});
     job.questions=[];job.status='submitted';await persist(job);json(200,publicSummary(job));return;
    }catch(error){job.status='needs_clarification';await persist(job);throw error;}
   }
   throw fail('不支持的请求。',405);
  }catch(error){if(!res.headersSent)json(error.status||400,{error:error.message||'处理失败，请重试。'});else res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});baseUrl='http://127.0.0.1:'+server.address().port;
 return {baseUrl,createJob,getJob:async id=>summary(await load(id)),waitForSubmission,readMaterial,askQuestions,setProgress,publishResult,close:()=>new Promise(resolve=>{for(const callbacks of signals.values())callbacks.forEach(done=>done());server.close(resolve);server.closeAllConnections();})};
}
