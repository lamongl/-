import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {windowLaunchPlan,openWorkbenchWindow} from './window.mjs';
const url='http://127.0.0.1:50103/jobs/af0a4b64-531a-450a-b78e-721c2de01213/#'+'a'.repeat(64);
test('Windows直接以独立应用窗口打开任务，URL作为单独参数传递',()=>{
 const plan=windowLaunchPlan(url,{platform:'win32',env:{'ProgramFiles(x86)':'C:/Program Files (x86)'},exists:path=>path.endsWith('msedge.exe')});
 assert.equal(plan.mode,'app');assert.ok(plan.args.includes('--app='+url));
 assert.ok(plan.args.includes('--window-size=1120,860'));assert.ok(plan.command.endsWith('msedge.exe'));
});
test('只能打开本地工作台任务，拒绝外站、脚本和错误链接',()=>{
 for(const bad of ['https://evil.example/','file:///C:/private','javascript:alert(1)','http://127.0.0.1:50103/','http://localhost:50103/jobs/id/'])assert.throws(()=>windowLaunchPlan(bad),/工作台/);
});
test('启动失败返回可降级结果，不把spawn成功当作可见窗口验证',async()=>{
 let captured;
 const result=await openWorkbenchWindow(url,{platform:'win32',env:{'ProgramFiles(x86)':'C:/Apps'},exists:()=>true,spawnProcess:(command,args,options)=>{
  captured={command,args,options};const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;
 }});
 assert.equal(result.status,'requested');assert.equal(result.mode,'app');assert.equal(captured.options.shell,false);assert.equal(captured.options.stdio,'ignore');
 const failed=await openWorkbenchWindow(url,{platform:'win32',env:{'ProgramFiles(x86)':'C:/Apps'},exists:()=>true,spawnProcess:()=>{const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('error',Error('denied')));return child;}});
 assert.equal(failed.status,'unavailable');
 const absent=await openWorkbenchWindow(url,{platform:'win32',env:{},exists:()=>false});assert.equal(absent.status,'unavailable');
});
