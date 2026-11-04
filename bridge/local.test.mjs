import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const exec=promisify(execFile);
test('无MCP宿主跨命令保留同一任务，追问后交付，重启后链接有效',async t=>{
 const root=await mkdtemp(join(tmpdir(),'workbench-local-test-'));
 const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
 const env={...process.env,WORKBENCH_LOCAL_DIR:root,WORKBENCH_OPEN_WINDOW:'0'};
 async function command(name,args){
  const argv=[cli,name];
  if(args){
   const file=join(root,'args-'+Math.random().toString(16).slice(2)+'.json');
   await writeFile(file,JSON.stringify(args));argv.push('--input',file);
  }
  const {stdout}=await exec(process.execPath,argv,{env,timeout:20000});
  return JSON.parse(stdout);
 }
 t.after(async()=>{
  await command('stop').catch(()=>{});
  assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep));
  await rm(root,{recursive:true,force:true});
 });
 const starts=await Promise.all([command('start'),command('start')]);
 assert.equal(starts[0].endpoint,starts[1].endpoint);
 const job=await command('create_job',{request:'做一个摘要'});
 const session=JSON.parse(await readFile(join(root,'session.json'),'utf8'));
 assert.equal((await fetch(new URL('/health',session.endpoint))).status,403);
 assert.equal((await fetch(new URL('/health',session.endpoint),{headers:{'X-Workbench-Control':session.token,Origin:session.endpoint}})).status,400);
 const body=new FormData();body.set('request','做一个摘要');body.set('outputKind','text');body.append('files',new File(['论文论证材料。'],'paper.txt'));
 const headers={'X-Workbench-Token':job.token};
 assert.equal((await fetch(job.api_url+'/submit',{method:'POST',headers,body})).status,200);
 assert.equal((await command('get_job',{job_id:job.job_id})).files.length,1);
 assert.equal((await command('read_material',{job_id:job.job_id,file_index:0})).text,'论文论证材料。');
 await assert.rejects(command('set_progress',{job_id:job.job_id,status:'processing'}),/工作台/);
 await command('ask_questions',{job_id:job.job_id,questions:[{id:'purpose',title:'摘要用于哪里？',options:['答辩','快速阅读']}]});
 const visible=await (await fetch(job.api_url,{headers})).json();assert.equal(visible.questions[0].title,'摘要用于哪里？');
 await fetch(job.api_url+'/answers',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({answers:{purpose:'答辩'}})});
 assert.equal((await command('wait_for_submission',{job_id:job.job_id,timeout_ms:1})).clarifications[0].answer,'答辩');
 await command('set_progress',{job_id:job.job_id,status:'processing'});
 const file=join(job.output_dir,'摘要.md');await writeFile(file,'# 摘要\n材料核心观点。');
 await command('publish_result',{job_id:job.job_id,paths:[file]});
 assert.equal(await (await fetch(job.api_url+'/artifacts/0',{headers})).text(),'# 摘要\n材料核心观点。');
 await command('stop');
 for(let attempt=0;attempt<20;attempt++){
  if(!(await command('status')).ok)break;
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 await command('start');
 assert.equal((await command('get_job',{job_id:job.job_id})).status,'completed');
 const restarted=JSON.parse(await readFile(join(root,'session.json'),'utf8'));
 assert.equal(restarted.endpoint,session.endpoint);assert.equal(restarted.uiPort,session.uiPort);
 assert.equal(await (await fetch(job.api_url+'/artifacts/0',{headers})).text(),'# 摘要\n材料核心观点。');
});
