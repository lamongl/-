import test from 'node:test';
import assert from 'node:assert/strict';
import {callArk,ARK_ENDPOINT} from './ark.mjs';
const key='test-key-not-real-123456789';
test('密钥只进官方鉴权头，不进提示词，调用不带cookie且禁止重定向',async()=>{
 let sent;const response=await callArk({key,model:'doubao-seed-2-1-lite-260915',prompt:'任务与材料',mode:'execute',fetchImpl:async(url,options)=>{sent={url,...options};return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'正文'}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}})};}});
 assert.equal(sent.url,ARK_ENDPOINT);assert.equal(sent.headers.Authorization,'Bearer '+key);assert.equal(sent.credentials,'omit');assert.equal(sent.redirect,'error');assert.ok(!sent.body.includes(key));assert.match(JSON.parse(sent.body).messages[0].content,/没有.*联网/);assert.equal(response.text,'正文');assert.equal(response.usage.total_tokens,15);
});
test('参数错误或超长材料在发出请求前拒绝',async()=>{let calls=0;const base={key,model:'model',prompt:'test',mode:'optimize',fetchImpl:()=>{calls++;}};await assert.rejects(callArk({...base,key:''}),/API Key/);await assert.rejects(callArk({...base,model:'https://evil.test'}),/模型/);await assert.rejects(callArk({...base,prompt:'a'.repeat(60001)}),/60,000/);assert.equal(calls,0);});
test('错误不反射服务端正文或密钥，不自动重试',async()=>{let count=0;await assert.rejects(callArk({key,model:'model',prompt:'x',mode:'execute',fetchImpl:async()=>{count++;return {ok:false,status:401,text:async()=>key};}}),error=>/密钥/.test(error.message)&&!error.message.includes(key));assert.equal(count,1);});
test('截断明确标记，缺失usage不伪造，纯推理无正文不当成功',async()=>{const base={key,model:'model',prompt:'x',mode:'optimize'};const response=await callArk({...base,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'部分内容'}}]})})});assert.equal(response.truncated,true);assert.equal(response.usage,null);await assert.rejects(callArk({...base,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{reasoning_content:'思考'}}]})})}),/正文/);});
