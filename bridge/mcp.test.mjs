import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

test('真实stdio MCP完成建任务、取材料、追问、制作状态和成品回传',async t=>{
 const root=await mkdtemp(join(tmpdir(),'delivery-mcp-'));
 const client=new Client({name:'workbench-acceptance',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],env:{...process.env,WORKBENCH_DATA_DIR:root,WORKBENCH_OPEN_WINDOW:'0'},stderr:'pipe'});
 t.after(async()=>{await client.close();assert.ok(resolve(root).startsWith(resolve(tmpdir())));await rm(root,{recursive:true,force:true});});
 await client.connect(transport);
 const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return JSON.parse(result.content[0].text);};
 const tools=await client.listTools();assert.equal(tools.tools.length,7);
 const job=await call('create_job',{title:'演示任务',outputKind:'text'});
 assert.equal(job.window.status,'disabled');
 assert.equal((await call('wait_for_submission',{job_id:job.job_id,timeout_ms:1})).status,'awaiting_input');
 const body=new FormData();body.set('request','分析销售变化');body.set('outputKind','text');body.append('files',new File(['8月100元，9月120元'],'资料.txt'));
 assert.equal((await fetch(job.api_url+'/submit',{method:'POST',headers:{'X-Workbench-Token':job.token},body})).status,200);
 assert.equal((await call('wait_for_submission',{job_id:job.job_id})).status,'submitted');
 assert.equal((await call('read_material',{job_id:job.job_id,file_index:0})).text,'8月100元，9月120元');
 const path=join(job.output_dir,'月报.md');
 await writeFile(path,'9月比8月增加20元，环比20%。');
 for(const [name,arguments_] of [
  ['set_progress',{status:'processing'}],
  ['publish_result',{paths:[path]}]
 ]){
  const result=await client.callTool({name,arguments:{job_id:job.job_id,...arguments_}});
  assert.equal(result.isError,true);
  assert.match(result.content[0].text,/工作台.*追问/);
 }
 await call('ask_questions',{job_id:job.job_id,questions:[{id:'reader',title:'给谁看？',options:['主管','客户']}]});
 const headers={'X-Workbench-Token':job.token,'Content-Type':'application/json'};
 const displayed=await (await fetch(job.api_url,{headers})).json();
 assert.equal(displayed.status,'needs_clarification');
 assert.equal(displayed.questions[0].title,'给谁看？');
 const answer=await fetch(job.api_url+'/answers',{method:'POST',headers,body:JSON.stringify({answers:{reader:'主管'}})});
 assert.equal(answer.status,200);
 const ready=await call('get_job',{job_id:job.job_id});assert.equal(ready.clarifications[0].answer,'主管');
 await call('set_progress',{job_id:job.job_id,status:'processing',message:'正在制作月报'});
 const done=await call('publish_result',{job_id:job.job_id,paths:[path],message:'月报已完成'});assert.equal(done.status,'completed');
 const response=await fetch(job.api_url+'/artifacts/0',{headers:{'X-Workbench-Token':job.token}});assert.equal(await response.text(),'9月比8月增加20元，环比20%。');
});
