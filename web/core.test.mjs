import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, nextQuestion, composePreview, validateFile, parseSourceLinks, draftStats, scenarioExample } from './core.mjs';
test('完整 PPT 需求不重复询问受众或风格',()=>assert.equal(nextQuestion('给零基础新员工做10页AI办公PPT，通俗，附演讲备注','slides',{}),null));
test('缺少主题时先问主题，再问受众，信息足够后停止',()=>{assert.equal(nextQuestion('做个PPT','slides',{}).key,'topic');assert.equal(nextQuestion('做个PPT','slides',{topic:'AI办公'}).key,'audience');assert.equal(nextQuestion('做个PPT','slides',{topic:'AI办公',audience:'新员工'}),null);});
test('最终文本完整保留用户材料与修改要求',()=>{const p=composePreview({request:'制作销售月报',category:'report',answers:{goal:'分析变化'},files:[{name:'sales.csv',text:'月份,销售额元\n8月,100\n9月,120'}],revision:'保持简洁'});assert.ok(p.includes('8月,100\n9月,120'));assert.ok(p.includes('保持简洁'));assert.ok(p.includes('分析变化'));});
test('支持办公格式和20MB文件，拒绝超限及未支持格式',()=>{
 for(const ext of ['txt','md','csv','docx','xlsx','xls','pptx','pdf'])assert.equal(validateFile({name:'a.'+ext,size:20*1024*1024}),null);
 assert.ok(validateFile({name:'a.txt',size:20*1024*1024+1}));
 assert.match(validateFile({name:'a.doc',size:20}),/docx/);
 assert.match(validateFile({name:'a.ppt',size:20}),/pptx/);
 assert.ok(validateFile({name:'a.exe',size:20}));
});
test('补充回答已有受众时不重复追问',()=>assert.equal(nextQuestion('做个PPT','slides',{topic:'给新员工介绍AI办公'}),null));
test('资料链接拒绝脚本协议、保留合法地址并去重',()=>{assert.deepEqual(parseSourceLinks('https://example.com/a\nhttps://example.com/a\nhttp://example.org'),['https://example.com/a','http://example.org/']);assert.throws(()=>parseSourceLinks('javascript:alert(1)'),/HTTP/);assert.throws(()=>parseSourceLinks('https://user:secret@example.com'),/账号/);});
test('偏好与链接进入完整文本并要求失败如实报告',()=>{const p=composePreview({request:'写通知',category:'document',format:'Markdown',style:'简洁正式',links:['https://example.com/a'],files:[{name:'资料.txt',text:'核心日期10月30日'}]});assert.ok(p.includes('Markdown'));assert.ok(p.includes('简洁正式'));assert.ok(p.includes('https://example.com/a'));assert.ok(p.includes('访问失败'));assert.ok(p.includes('核心日期10月30日'));});
test('完整草稿长度提示不按字数冒充真实token',()=>{assert.deepEqual(draftStats('abc',[]),{characters:3,materials:0,large:false});assert.equal(draftStats('a'.repeat(40001),[{},{}]).large,true);});
test('四个场景示例不同且对应各自任务',()=>{const examples=Object.keys(categories).map(scenarioExample);assert.equal(new Set(examples).size,4);for(const [i,term] of ['月报','通知','PPT','检索'].entries())assert.ok(examples[i].includes(term));});
