import test from 'node:test';
import assert from 'node:assert/strict';
import {createDictation,appendDictation} from './speech.mjs';
class FakeRecognition{
 static last;
 constructor(){FakeRecognition.last=this;}
 start(){this.started=true;this.onstart?.();}
 stop(){this.onend?.();}
 abort(){this.onend?.();}
}
test('未授权不启用可能在线的识别',()=>{const errors=[];const d=createDictation({Recognition:FakeRecognition,onStatus:t=>errors.push(t)});assert.equal(d.start(),false);assert.equal(FakeRecognition.last.started,undefined);assert.match(errors[0],/在线/);});
test('最终结果仅插入一次，临时结果不写入，取消后忽略回调',()=>{const texts=[];const d=createDictation({Recognition:FakeRecognition,onText:t=>texts.push(t)});d.start({allowRemote:true});const r=FakeRecognition.last;const e={resultIndex:0,results:[Object.assign([{transcript:'临时'}],{isFinal:false})]};r.onresult(e);assert.deepEqual(texts,[]);e.results[0]=Object.assign([{transcript:'做一份月报'}],{isFinal:true});r.onresult(e);r.onresult(e);assert.deepEqual(texts,['做一份月报']);d.cancel();r.onresult({resultIndex:1,results:[e.results[0],e.results[0]]});assert.equal(texts.length,1);});
test('支持本机识别时强制本机，不静默降级',()=>{class Local extends FakeRecognition{processLocally=false;}const d=createDictation({Recognition:Local});d.start();assert.equal(FakeRecognition.last.processLocally,true);});
test('权限错误可见且恢复操作状态',()=>{const states=[],messages=[];const d=createDictation({Recognition:FakeRecognition,onState:s=>states.push(s),onStatus:t=>messages.push(t)});d.start({allowRemote:true});FakeRecognition.last.onerror({error:'not-allowed'});assert.equal(states.at(-1),false);assert.match(messages.at(-1),/麦克风/);});
test('语音追加保留手写内容，超长文本不截断后悄悄丢失',()=>{assert.deepEqual(appendDictation('原需求','新增要求',100),{value:'原需求\n新增要求',overflow:''});assert.deepEqual(appendDictation('已有','完整口述',4),{value:'已有',overflow:'完整口述'});});
