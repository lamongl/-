import test from 'node:test';
import assert from 'node:assert/strict';
import { nextQuestion, composePreview, validateFile } from './core.mjs';
test('完整 PPT 需求不重复询问受众或风格',()=>assert.equal(nextQuestion('给零基础新员工做10页AI办公PPT，通俗，附演讲备注','slides',{}),null));
test('缺少主题时先问主题，再问受众，信息足够后停止',()=>{assert.equal(nextQuestion('做个PPT','slides',{}).key,'topic');assert.equal(nextQuestion('做个PPT','slides',{topic:'AI办公'}).key,'audience');assert.equal(nextQuestion('做个PPT','slides',{topic:'AI办公',audience:'新员工'}),null);});
test('最终文本完整保留用户材料与修改要求',()=>{const p=composePreview({request:'制作销售月报',category:'report',answers:{goal:'分析变化'},files:[{name:'sales.csv',text:'月份,销售额元\n8月,100\n9月,120'}],revision:'保持简洁'});assert.ok(p.includes('8月,100\n9月,120'));assert.ok(p.includes('保持简洁'));assert.ok(p.includes('分析变化'));});
test('二进制文件与超限文本不能伪装解析成功',()=>{assert.ok(validateFile({name:'a.pdf',size:20}));assert.ok(validateFile({name:'a.txt',size:200001}));assert.equal(validateFile({name:'a.csv',size:200}),null);});
