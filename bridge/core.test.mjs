import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,symlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import * as bridgeModule from './core.mjs';

async function setup(t){
 assert.equal(typeof bridgeModule.createBridge,'function');
 const root=await mkdtemp(join(tmpdir(),'delivery-bridge-'));
 const bridge=await bridgeModule.createBridge({dataDir:root});
 t.after(async()=>{await bridge.close();assert.ok(resolve(root).startsWith(resolve(tmpdir())+'\\')||resolve(root).startsWith(resolve(tmpdir())+'/'));await rm(root,{recursive:true,force:true});});
 const job=await bridge.createJob({title:'销售月报',outputKind:'docx'});
 return {root,bridge,job};
}
function uploadRequest(request='分析变化',files=[new File(['月份,收入\n10月,100\n11月,120'],'销售.csv')]){
 const body=new FormData();body.set('request',request);body.set('outputKind','docx');files.forEach(file=>body.append('files',file));return body;
}
async function upload(job,body=uploadRequest(),options={}){
 return fetch(job.api_url+'/submit',{method:'POST',headers:{'X-Workbench-Token':job.token,...options.headers},body});
}
async function confirm(bridge,job){
 await bridge.askQuestions(job.job_id,[{id:'purpose',title:'这份报告主要用于什么场景？',options:['内部复盘','对外汇报']}]);
 const response=await fetch(job.api_url+'/answers',{method:'POST',headers:{'X-Workbench-Token':job.token,'Content-Type':'application/json'},body:JSON.stringify({answers:{purpose:'内部复盘'}})});
 assert.equal(response.status,200);
}
test('上传原件和文字进入独立任务，等待接口在提交后返回',async t=>{
 const {bridge,job}=await setup(t);
 const waiting=bridge.waitForSubmission(job.job_id,2000);
 assert.equal((await bridge.getJob(job.job_id)).status,'awaiting_input');
 const response=await upload(job);assert.equal(response.status,200);
 const ready=await waiting;assert.equal(ready.status,'submitted');
 const summary=await bridge.getJob(job.job_id);assert.equal(summary.files.length,1);assert.equal(summary.request,'分析变化');
 assert.equal(await readFile(summary.files[0].original_path,'utf8'),'月份,收入\n10月,100\n11月,120');
 const material=await bridge.readMaterial(job.job_id,0,0,10);assert.equal(material.text,'月份,收入\n10月,');assert.equal(material.next_offset,10);
 assert.equal((await upload(job)).status,409);
});
test('跨任务令牌、跨站请求和过量附件均被拒绝',async t=>{
 const {bridge,job}=await setup(t),other=await bridge.createJob({});
 assert.equal((await upload(job,uploadRequest(),{headers:{'X-Workbench-Token':other.token}})).status,403);
 assert.equal((await upload(job,uploadRequest(),{headers:{Origin:'https://evil.example'}})).status,403);
 const files=Array.from({length:6},(_,i)=>new File(['a'],'file'+i+'.txt'));
 assert.equal((await upload(job,uploadRequest('需求',files))).status,400);
 assert.equal((await bridge.getJob(job.job_id)).status,'awaiting_input');
});
test('坏文件和空需求不能造成已提交或部分成功',async t=>{
 const {bridge,job}=await setup(t);
 assert.equal((await upload(job,uploadRequest('需求',[new File(['binary'],'bad.exe')]))).status,400);
 assert.equal((await upload(job,uploadRequest(''))).status,400);
 assert.equal((await bridge.getJob(job.job_id)).files.length,0);
});
test('只有任务output中的真实产物可以交付并下载',async t=>{
 const {bridge,job,root}=await setup(t);await upload(job);
 await confirm(bridge,job);
 const info=await bridge.getJob(job.job_id);
 const artifact=join(info.output_dir,'报告.txt');await writeFile(artifact,'成品：增长20%。');
 const outside=join(root,'outside.txt');await writeFile(outside,'private');
 await assert.rejects(bridge.publishResult(job.job_id,[outside]),/output|目录|范围/);
 await assert.rejects(bridge.publishResult(job.job_id,[join(info.output_dir,'missing.txt')]));
 const result=await bridge.publishResult(job.job_id,[artifact]);assert.equal(result.status,'completed');
 const download=await fetch(job.api_url+'/artifacts/0',{headers:{'X-Workbench-Token':job.token}});
 assert.equal(download.status,200);assert.equal(await download.text(),'成品：增长20%。');
 assert.equal((await fetch(job.api_url+'/artifacts/0')).status,403);
});

test('AI追问在界面回答后返回宿主，保留原始需求',async t=>{
 const {bridge,job}=await setup(t);await upload(job);
 await bridge.askQuestions(job.job_id,[{id:'audience',title:'主要讲给谁听？',options:['客户','内部同事']}]);
 assert.equal((await bridge.getJob(job.job_id)).status,'needs_clarification');
 const response=await fetch(job.api_url+'/answers',{method:'POST',headers:{'X-Workbench-Token':job.token,'Content-Type':'application/json'},body:JSON.stringify({answers:{audience:'客户，重点说明价值和证据边界'}})});
 assert.equal(response.status,200);
 const info=await bridge.getJob(job.job_id);
 assert.equal(info.status,'submitted');assert.equal(info.request,'分析变化');
 assert.equal(info.clarifications[0].answer,'客户，重点说明价值和证据边界');
});

test('替换成其他任务目录的output联接不能发布或下载跨任务文件',async t=>{
 const {bridge,job,root}=await setup(t);await upload(job);
 await confirm(bridge,job);
 const original=await bridge.getJob(job.job_id),other=await bridge.createJob({});
 const otherInfo=await bridge.getJob(other.job_id);const privatePath=join(otherInfo.output_dir,'private.txt');await writeFile(privatePath,'other task');
 assert.ok(resolve(original.output_dir).startsWith(resolve(root)));
 await rm(original.output_dir,{recursive:true,force:true});
 await symlink(otherInfo.output_dir,original.output_dir,'junction');
 await assert.rejects(bridge.publishResult(job.job_id,[join(original.output_dir,'private.txt')]),/目录|output|链接/);
});
